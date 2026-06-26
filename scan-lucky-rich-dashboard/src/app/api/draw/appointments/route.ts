// นัดหมายเข้ารับรางวัลหน้างาน — เก็บเป็นไฟล์ JSON ใน dashboard server (ไม่แตะ saversureV2)
// GET ?phone=  = ดูนัดของเบอร์นั้น (ลูกค้าเช็คเองได้ทุกเครื่อง · ไม่ leak คนอื่น)
// GET (ไม่มี phone) = ดูทั้งหมด (แอดมินเท่านั้น — มี PII)
// POST = upsert การจอง (เช็คโควตา + วันที่ถูกต้อง) / อัปเดตสถานะ (booked/done/no_show)
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fail } from '../../_utils'
import type { DrawAppointment, AppointmentStatus } from '@/config/draw-rounds'
import { getRound } from '@/config/draw-rounds'
import { findWinnerPrizes } from '@/lib/claims-store'
import { ALL_PICKUP_DATES, slotById } from '@/config/pickup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'draw-appointments.json')

const VALID: AppointmentStatus[] = ['booked', 'done', 'no_show']
const PICKUP_DATES = new Set(ALL_PICKUP_DATES)

function last9(phone: string): string {
  const d = (phone || '').replace(/\D/g, '')
  return d.length >= 9 ? d.slice(-9) : d
}

function read(): DrawAppointment[] {
  try {
    const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(arr: DrawAppointment[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), 'utf-8')
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

// แอดมินดูรายการทั้งหมดได้ไหม — ไม่ตั้ง ADMIN_KEY = เปิด (local dev) · ตั้งแล้วต้องมี header/cookie
function adminOk(req: NextRequest): boolean {
  const key = process.env.ADMIN_KEY
  if (!key) return true
  return req.headers.get('x-admin-key') === key || req.cookies.get('adminKey')?.value === key
}

// นับที่จองแล้วของ (date, slot) — ไม่นับ no_show และไม่นับเบอร์ตัวเอง (กันนับซ้ำตอนแก้/จองใหม่)
function bookedCount(list: DrawAppointment[], date: string, slotId: string, exceptKey: string): number {
  return list.filter((a) => a.date === date && a.slotId === slotId && a.status !== 'no_show' && a.phoneLast9 !== exceptKey).length
}

export async function GET(req: NextRequest) {
  const list = read()
  const sp = req.nextUrl.searchParams
  // นับคิวที่จองแล้วต่อ (วัน, ช่วง) — เลขล้วน ไม่มี PII → ลูกค้าดู "ที่ว่าง" ได้
  if (sp.get('counts') === '1') {
    const counts: Record<string, { morning: number; afternoon: number }> = {}
    for (const a of list) {
      if (a.status === 'no_show') continue
      if (!counts[a.date]) counts[a.date] = { morning: 0, afternoon: 0 }
      if (a.slotId === 'afternoon') counts[a.date].afternoon++
      else counts[a.date].morning++
    }
    return json({ counts })
  }
  const phone = sp.get('phone')
  if (phone) {
    // ลูกค้าเช็คนัดของตัวเอง (เครื่องไหนก็ได้) — คืนเฉพาะเบอร์นั้น
    const key = last9(phone)
    return json({ appointments: key ? list.filter((a) => a.phoneLast9 === key) : [] })
  }
  // ดูทั้งหมด = มี PII (ชื่อ+เบอร์ทุกคน) → แอดมินเท่านั้น
  if (!adminOk(req)) return fail('unauthorized — รายการนัดทั้งหมดต้องใช้สิทธิ์แอดมิน', 401)
  return json({ appointments: list })
}

export async function POST(req: NextRequest) {
  let body: Partial<DrawAppointment>
  try {
    body = await req.json()
  } catch {
    return fail('invalid json', 400)
  }

  const phone = body.phone ?? ''
  const key = last9(String(body.phoneLast9 || phone))
  if (!key) return fail('ต้องมี phone หรือ phoneLast9', 400)

  const list = read()
  const idx = list.findIndex((a) => a.phoneLast9 === key)

  // อัปเดตสถานะอย่างเดียว (แอดมินกดเปลี่ยนหน้างาน)
  if (body.status && !body.date) {
    if (!VALID.includes(body.status)) return fail('status ไม่ถูกต้อง', 400)
    if (idx < 0) return fail('ไม่พบการจองของเบอร์นี้', 404)
    list[idx] = { ...list[idx], status: body.status, updatedAt: new Date().toISOString() }
    write(list)
    return json({ saved: list[idx] })
  }

  // upsert การจอง (จากหน้า /claim หรือ seed)
  if (!body.date || !body.slotId) return fail('ต้องมี date + slotId', 400)
  const date = String(body.date)
  const slotId = body.slotId === 'afternoon' ? 'afternoon' : 'morning'

  // ── เช็ควันที่ต้องเป็น "วันรับรางวัล" จริง (กันจองวันหยุด/วันจับ/นอกช่วง) ──
  if (!PICKUP_DATES.has(date)) return fail('วันที่นี้ไม่เปิดรับรางวัล — กรุณาเลือกวันจากปฏิทิน', 400)

  // ── ผูกสิทธิ์ตามรอบ: ผู้โชคดีรอบไหน จองได้แค่ "เดือนรับรางวัล" ของรอบนั้น ──
  // re-derive จากเบอร์จริง (กันเลี่ยงฝั่ง client) · ไม่พบผู้โชคดี = ปล่อยผ่าน (เช่น admin/seed)
  const myPrizes = findWinnerPrizes(phone).prizes
  if (myPrizes.length) {
    const allowedMonths = new Set(myPrizes.map((p) => getRound(p.round)?.prizeMonthISO).filter(Boolean) as string[])
    if (allowedMonths.size && !allowedMonths.has(date.slice(0, 7))) {
      return fail('วันที่นี้ไม่อยู่ในเดือนที่คุณมีสิทธิ์รับรางวัล — กรุณาเลือกวันในเดือนของรอบที่ได้รับรางวัล', 400)
    }
  }

  // ── เช็คโควตาช่วงเวลา (เช้า 3 / บ่าย 5) — กันจองเกิน คนล้นหน้างาน ──
  const cap = slotById(slotId)?.capacity ?? 0
  const used = bookedCount(list, date, slotId, key)
  if (used >= cap) {
    const slotName = slotId === 'morning' ? 'ช่วงเช้า' : 'ช่วงบ่าย'
    return fail(`${slotName}ของวันนี้เต็มแล้ว (${cap} คน) — กรุณาเลือกช่วงเวลาหรือวันอื่น`, 409)
  }

  const rec: DrawAppointment = {
    phoneLast9: key,
    phone: String(phone),
    name: String(body.name ?? ''),
    date,
    slotId,
    pickupMode: body.pickupMode === 'proxy' ? 'proxy' : body.pickupMode === 'self' ? 'self' : idx >= 0 ? list[idx].pickupMode : undefined,
    prizes: Array.isArray(body.prizes) ? body.prizes : [],
    rounds: Array.isArray(body.rounds) ? body.rounds : [],
    status: body.status && VALID.includes(body.status) ? body.status : idx >= 0 ? list[idx].status : 'booked',
    bookedAt: idx >= 0 ? list[idx].bookedAt ?? body.bookedAt : body.bookedAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  if (idx >= 0) list[idx] = rec
  else list.push(rec)
  write(list)
  return json({ saved: rec })
}

export async function DELETE(req: NextRequest) {
  const phone = new URL(req.url).searchParams.get('phone') || ''
  const key = last9(phone)
  if (!key) return fail('ต้องมี phone', 400)
  const list = read()
  const next = list.filter((a) => a.phoneLast9 !== key)
  write(next)
  return json({ removed: list.length - next.length })
}
