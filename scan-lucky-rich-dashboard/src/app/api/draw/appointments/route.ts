// นัดหมายเข้ารับรางวัลหน้างาน — เก็บเป็นไฟล์ JSON ใน dashboard server (ไม่แตะ saversureV2)
// GET = อ่านทั้งหมด · POST = upsert การจอง/อัปเดตสถานะ (key = เบอร์ 9 หลักท้าย)
// ฝั่งลูกค้าหน้า /claim จะ POST มาบันทึกการจอง · แอดมินใช้ POST อัปเดตสถานะ (booked/done/no_show)
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fail } from '../../_utils'
import type { DrawAppointment, AppointmentStatus } from '@/config/draw-rounds'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'draw-appointments.json')

const VALID: AppointmentStatus[] = ['booked', 'done', 'no_show']

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

export async function GET() {
  return json({ appointments: read() })
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
  const rec: DrawAppointment = {
    phoneLast9: key,
    phone: String(phone),
    name: String(body.name ?? ''),
    date: String(body.date),
    slotId: body.slotId === 'afternoon' ? 'afternoon' : 'morning',
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
