// GET /api/draw/pool?round=N — พูลผู้มีสิทธิ์ของรอบ สำหรับค้นหาตอนบันทึกผู้ได้รางวัล
// ดึงจาก print-slips (เดียวกับ Print List · ตัดพนักงานแล้ว) ของ window รอบนั้น แล้ว dedup เป็นลูกค้า
// เรียกครั้งเดียวตอนเลือกรอบ (client cache) · มี s-maxage กันยิงซ้ำ → สุภาพต่อ prod
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { getRound } from '@/config/draw-rounds'
import { ok, fail } from '../../_utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 180

const LIMIT = 50000 // backend cap — รอบใหญ่กว่านี้จะได้แค่บางส่วน (capped=true)

function last9(p: string): string {
  const d = (p || '').replace(/\D/g, '')
  return d.length >= 9 ? d.slice(-9) : d
}

export async function GET(req: NextRequest) {
  const roundNo = parseInt(new URL(req.url).searchParams.get('round') || '0', 10)
  const round = getRound(roundNo)
  if (!round) return fail('round ไม่ถูกต้อง', 400)

  let total = 0
  let slips: { name: string; phone: string; scanCode: string; productName: string; productSku: string }[] = []
  let lastErr = ''
  for (let a = 0; a < 2; a++) {
    try {
      const d = await ds.getPrintSlips(round.windowFrom, round.windowTo, LIMIT)
      slips = (d.slips ?? []).map((s) => ({ name: s.name, phone: s.phone, scanCode: s.scanCode, productName: s.productName, productSku: s.productSku }))
      total = d.total ?? slips.length
      lastErr = ''
      break
    } catch (e: any) {
      lastErr = e?.message ?? String(e)
    }
  }
  if (lastErr) return fail('ดึงพูลไม่สำเร็จ (ช่วงกว้างอาจ timeout) — ใช้ "กรอกเอง" ได้: ' + lastErr, 502)

  // dedup เป็นลูกค้า (key = เบอร์ 9 หลักท้าย, fallback ชื่อ) · เก็บรหัสสแกน (cap 40) + นับสิทธิ์ + map รหัส→สินค้า
  const map = new Map<string, { name: string; phone: string; codes: string[]; rights: number; products: Record<string, { name: string; sku: string }> }>()
  for (const s of slips) {
    const k = last9(s.phone) || 'n:' + (s.name || '')
    let c = map.get(k)
    if (!c) {
      c = { name: s.name || '', phone: s.phone || '', codes: [], rights: 0, products: {} }
      map.set(k, c)
    }
    c.rights += 1 // ทุก slip = 1 สิทธิ์ในการลุ้น
    if (s.scanCode && c.codes.length < 40 && !c.codes.includes(s.scanCode)) {
      c.codes.push(s.scanCode)
      c.products[s.scanCode] = { name: s.productName || '', sku: s.productSku || '' }
    }
  }

  return ok({
    round: roundNo,
    customers: Array.from(map.values()),
    loadedSlips: slips.length,
    totalSlips: total,
    capped: total > slips.length, // พูลจริงใหญ่กว่าที่โหลด → ค้นอาจไม่เจอบางคน (มีปุ่มกรอกเองสำรอง)
  })
}
