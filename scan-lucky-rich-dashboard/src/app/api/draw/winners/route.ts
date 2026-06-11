// บันทึกผู้ได้รางวัลจับฉลาก — เก็บเป็นไฟล์ JSON ใน dashboard server (ไม่แตะ saversureV2)
// GET = อ่านทั้งหมด · POST = upsert 1 ช่อง (กันเบอร์ซ้ำในรอบเดียวกัน) · DELETE = ลบช่อง
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fail } from '../../_utils'
import type { DrawWinner } from '@/config/draw-rounds'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function GET() {
  return json({ winners: readWinners() })
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
