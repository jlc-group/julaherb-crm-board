// บันทึกผู้ได้รางวัลจับฉลาก — เก็บเป็นไฟล์ JSON ใน dashboard server (ไม่แตะ saversureV2)
// GET = อ่านทั้งหมด · POST = upsert 1 ช่อง (กันเบอร์ซ้ำในรอบเดียวกัน) · DELETE = ลบช่อง
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { ds } from '@/lib/api/adapter'
import { fail } from '../../_utils'
import { getRound } from '@/config/draw-rounds'
import type { DrawWinner } from '@/config/draw-rounds'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180 // ?enrich=1 อาจต้องทำดัชนี print-slips ครั้งแรก

// DATA_DIR override ได้ด้วย env — production ชี้ออกนอก app folder (กัน robocopy /PURGE ลบ PII)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'draw-winners.json')

type WinnerRecord = DrawWinner

function last9(phone: string): string {
  const d = (phone || '').replace(/\D/g, '')
  return d.length >= 9 ? d.slice(-9) : d
}

function readWinners(): WinnerRecord[] {
  try {
    const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
    return Array.isArray(arr) ? arr : []
  } catch {
    return [] // ไฟล์ยังไม่มี = ยังไม่บันทึกใคร
  }
}

function writeWinners(arr: WinnerRecord[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), 'utf-8')
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(req: NextRequest) {
  const enrich = new URL(req.url).searchParams.get('enrich') === '1'
  const winners = readWinners()
  if (enrich) {
    // เติมข้อมูลย้อนหลังให้คนที่ยังว่าง (ครั้งแรกอาจ ~1-2 นาที):
    //   สิทธิ์/สินค้า/รหัส ← ดัชนี print-slips รายรอบ · ที่อยู่/จังหวัด ← /customers/{id}/detail
    let changed = false
    for (const w of winners) {
      if (!w.phone) continue
      const r = getRound(w.round)
      if (r && (typeof w.rightsCount !== 'number' || !w.productName || !w.scanCode)) {
        try {
          const res = await ds.resolveWinner({ phone: w.phone, from: r.windowFrom, to: r.windowTo })
          if (res) {
            if (typeof w.rightsCount !== 'number' && typeof res.rights === 'number') {
              w.rightsCount = res.rights
              changed = true
            }
            if (!w.productName && res.productName) {
              w.productName = res.productName
              w.productSku = res.productSku
              changed = true
            }
            if (!w.scanCode && res.scanCode) {
              w.scanCode = res.scanCode
              changed = true
            }
          }
        } catch {
          /* ข้าม */
        }
      }
      if (!w.address || !w.province) {
        try {
          const info = await ds.getCustomerAddressInfo(w.phone)
          if (!w.address && info.address) {
            w.address = info.address
            changed = true
          }
          if (!w.province && info.province) {
            w.province = info.province
            changed = true
          }
        } catch {
          /* ข้าม */
        }
      }
    }
    if (changed) writeWinners(winners)
  }
  return json({ winners })
}

export async function POST(req: NextRequest) {
  let body: Partial<WinnerRecord>
  try {
    body = await req.json()
  } catch {
    return fail('invalid json', 400)
  }
  const { round, slotId, name, phone } = body
  if (!round || !slotId || !name || !phone) {
    return fail('ต้องมี round, slotId, name, phone', 400)
  }

  const winners = readWinners()
  const key = last9(String(phone))

  // 🚫 กันเบอร์ซ้ำในรอบเดียวกัน (คนละช่อง) — 1 คนได้รางวัลเดียวต่อรอบ
  const dup = winners.find((w) => w.round === round && w.slotId !== slotId && last9(w.phone) === key)
  if (dup) {
    return json({ error: `เบอร์นี้ได้รางวัลในรอบนี้แล้ว (${dup.prizeLabel})`, conflict: dup }, 409)
  }

  const rec: WinnerRecord = {
    round: Number(round),
    slotId: String(slotId),
    tier: String(body.tier ?? ''),
    prizeLabel: String(body.prizeLabel ?? ''),
    name: String(name).trim(),
    phone: String(phone).trim(),
    scanCode: body.scanCode ? String(body.scanCode).trim() : undefined,
    productSku: body.productSku ? String(body.productSku).trim() : undefined,
    productName: body.productName ? String(body.productName).trim() : undefined,
    address: body.address ? String(body.address).trim() : undefined,
    province: body.province ? String(body.province).trim() : undefined,
    rightsCount: typeof body.rightsCount === 'number' ? body.rightsCount : undefined,
    userId: body.userId ? String(body.userId) : undefined,
    assignedAt: body.assignedAt ?? new Date().toISOString(),
  }

  const idx = winners.findIndex((w) => w.slotId === rec.slotId)
  if (idx >= 0) winners[idx] = rec
  else winners.push(rec)
  writeWinners(winners)
  return json({ saved: rec })
}

export async function DELETE(req: NextRequest) {
  const slotId = new URL(req.url).searchParams.get('slotId')
  if (!slotId) return fail('ต้องมี slotId', 400)
  const winners = readWinners()
  const next = winners.filter((w) => w.slotId !== slotId)
  writeWinners(next)
  return json({ removed: winners.length - next.length })
}
