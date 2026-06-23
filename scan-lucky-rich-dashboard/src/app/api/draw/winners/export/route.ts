// GET /api/draw/winners/export?round=N&format=xlsx|csv
// ดาวน์โหลด "รายชื่อผู้โชคดี" ของรอบที่เลือก ตาม pattern ไฟล์ต้นฉบับ (10 คอลัมน์):
//   ลำดับผู้โชคดี · รางวัล · วันที่จับรางวัล · วันที่ประกาศผล · ชื่อ · นามสกุล · เบอร์โทรศัพท์ · รหัส · สินค้า · จังหวัด
// เติมข้อมูลผู้ชนะที่บันทึกไว้ (data/draw-winners.json) · ช่องที่ยังไม่จับเว้นว่าง (ติดลำดับ/รางวัล/วันที่ไว้รอเติม)
// ⚠️ มี PII (ชื่อ+เบอร์เต็ม) — middleware gate ด้วย ADMIN_KEY ผ่าน prefix /api/draw/winners
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getRound, roundSlots, type DrawWinner, type PrizeSlot } from '@/config/draw-rounds'
import { winnerAnnounceISOBySlot } from '@/config/draw-rounds'
import { extractProvince } from '@/lib/thai-provinces'
import { fail } from '../../../_utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const FILE = path.join(DATA_DIR, 'draw-winners.json')

const TH_MO_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
// ชื่อย่อเดือน (ค.ศ. → ตัวย่อแบบเดียวกับชื่อชีตในไฟล์ต้นฉบับ)
const MONTH_ABBR: Record<string, string> = {
  '07': 'กค', '08': 'สค', '09': 'กย', '10': 'ตค', '11': 'พย', '12': 'ธค',
}
// เรียงตามวัน: รางวัลประจำวัน (10K) ก่อน → รายเดือน (100K) → ใหญ่สุด (1M) — ให้ "ลำดับ" ตรงไฟล์ต้นฉบับ
const DAY_ORDER: Array<'10K' | '100K' | '1M'> = ['10K', '100K', '1M']

function readWinners(): DrawWinner[] {
  try {
    const arr = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// 'YYYY-MM-DD' → 'D ม.ค. 2569' (พ.ศ.) · คืน '' ถ้า iso ว่าง
function thaiBE(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${d} ${TH_MO_SHORT[m]} ${y + 543}`
}

// แยก "ชื่อ นามสกุล" → [ชื่อ, นามสกุล] (ตัดตามช่องว่างแรก · ชื่อกลางรวมไว้กับนามสกุล)
function splitName(full?: string): [string, string] {
  const s = (full ?? '').trim().replace(/\s+/g, ' ')
  if (!s) return ['', '']
  const i = s.indexOf(' ')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
}

const HEADER = [
  'ลำดับผู้โชคดี', 'รางวัล', 'วันที่จับรางวัล', 'วันที่ประกาศผล',
  'ชื่อ', 'นามสกุล', 'เบอร์โทรศัพท์', 'รหัส', 'สินค้า', 'จังหวัด',
]

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const roundNo = parseInt(url.searchParams.get('round') || '0', 10)
  const format = (url.searchParams.get('format') || 'xlsx').toLowerCase()
  const round = getRound(roundNo)
  if (!round) return fail('round ไม่ถูกต้อง (1-7)', 400)

  const winners = readWinners()
  const bySlot = new Map(winners.filter((w) => w.round === round.round).map((w) => [w.slotId, w]))

  // ช่องรางวัลของรอบ เรียงตามวัน (10K รายวัน → 100K → 1M) แล้วให้ลำดับ 1..N
  const slots: PrizeSlot[] = DAY_ORDER.flatMap((t) =>
    roundSlots(round)
      .filter((s) => s.tier === t)
      .sort((a, b) => a.indexInTier - b.indexInTier),
  )

  const rows: (string | number)[][] = slots.map((slot, i) => {
    const w = bySlot.get(slot.slotId)
    const [first, last] = splitName(w?.name)
    return [
      i + 1, // ลำดับผู้โชคดี (รันในรอบ)
      slot.value, // รางวัล (มูลค่าทอง: 10000 / 100000 / 1000000)
      thaiBE(round.drawDate), // วันที่จับรางวัล
      thaiBE(winnerAnnounceISOBySlot(round.round, slot.slotId)), // วันที่ประกาศผล
      first, // ชื่อ
      last, // นามสกุล
      w?.phone ?? '', // เบอร์โทรศัพท์
      w?.scanCode ?? '', // รหัส
      w?.productName ?? w?.productSku ?? '', // สินค้า
      extractProvince(w?.address), // จังหวัด (แยกจากที่อยู่อัตโนมัติ)
    ]
  })

  const monthAbbr = MONTH_ABBR[round.prizeMonthISO.split('-')[1]] ?? round.prizeMonthName
  const baseName = `รายชื่อผู้โชคดี_รอบ${round.round}_${monthAbbr}_${round.prizeMonthISO}`

  // ── CSV (BOM กัน Excel อ่านไทยเพี้ยน) ──────────────────────────────
  if (format === 'csv') {
    const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = '﻿' + [HEADER, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': dispo(`${baseName}.csv`),
      },
    })
  }

  // ── XLSX (ชีตเดียว = เดือนของรอบนี้ · header ตรง pattern) ───────────
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([HEADER, ...rows])
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 14 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `รายชื่อผู้โชคดี ${monthAbbr}`)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Cache-Control': 'no-store',
      'Content-Disposition': dispo(`${baseName}.xlsx`),
    },
  })
}

// Content-Disposition รองรับชื่อไฟล์ไทย (RFC 5987) + fallback ASCII
function dispo(thaiName: string): string {
  const ascii = thaiName.replace(/[^\x20-\x7E]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(thaiName)}`
}
