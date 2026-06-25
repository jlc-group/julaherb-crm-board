// GET /api/draw/resolve-code?code=  — รหัสสแกน → ลูกค้า (ชื่อ+เบอร์เต็ม+สินค้า) สำหรับ WinnerPicker
// consume saversureV2 /scan-history?legacy_serial=&scan_type=success · read-only
// ⚠️ มีเบอร์เต็ม (PII) → middleware gate ด้วย ADMIN_KEY (prefix /api/draw/resolve-code)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { getRound } from '@/config/draw-rounds'
import { ok, fail } from '../../_utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 180 // ครั้งแรกต้องทำดัชนีจาก print-slips (แบ่งช่วงวัน) อาจ ~1-2 นาที

// รีโซลฟ์ผู้ได้รางวัลด้วย ?round=&code= หรือ ?round=&phone= (ช่วงวันของรอบนั้น)
export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const code = (u.searchParams.get('code') ?? '').trim()
  const phone = (u.searchParams.get('phone') ?? '').trim()
  const round = getRound(parseInt(u.searchParams.get('round') || '0', 10))
  if (!round) return fail('round ไม่ถูกต้อง', 400)
  if (code.length < 4 && phone.replace(/\D/g, '').length < 9) return ok({ found: false })
  try {
    const r = await ds.resolveWinner({ code: code || undefined, phone: phone || undefined, from: round.windowFrom, to: round.windowTo })
    if (!r) return ok({ found: false })
    return ok({ found: true, ...r })
  } catch (e: any) {
    return fail('ดึงข้อมูลไม่สำเร็จ: ' + (e?.message ?? String(e)), 502)
  }
}
