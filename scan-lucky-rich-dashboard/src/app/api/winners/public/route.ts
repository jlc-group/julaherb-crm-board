// GET /api/winners/public — รายชื่อผู้โชคดีที่ "ถึงกำหนดประกาศแล้ว" (วันประกาศ ≤ วันนี้ เวลาไทย) สำหรับหน้าสาธารณะ
//   - mask เบอร์ (xxx-xxx-1234) + ไม่ส่งรหัสสแกน/เบอร์เต็ม → ปลอดภัย PII
//   - ของวันอนาคต "ไม่ถูกส่งออก" เลย (กัน leak ผลล่วงหน้า)
//   - ?all=1 (ผ่าน admin gate · local เปิด) = แสดงทุกคนรวมที่ยังไม่ถึงกำหนด สำหรับแอดมิน preview
//
// อ่านจาก data/draw-winners.json (local) เท่านั้น — ไม่แตะ saversure
import { NextRequest, NextResponse } from 'next/server'
import { readWinners, adminKeyOk } from '@/lib/claims-store'
import { winnerAnnounceISOBySlot, prizeAnnounceBySlot, slotParts } from '@/config/draw-rounds'
import { maskPhone3 } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// วันที่ "วันนี้" ตามเวลาไทย (Asia/Bangkok) เป็น 'YYYY-MM-DD'
function thaiTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
}

export async function GET(req: NextRequest) {
  const todayISO = thaiTodayISO()
  const wantAll = req.nextUrl.searchParams.get('all') === '1'
  const preview = wantAll && adminKeyOk(req) // ?all=1 ต้องผ่าน admin gate (ถ้าไม่ตั้ง ADMIN_KEY = local เปิด)

  const mapped = readWinners().map((w) => {
    const { tier } = slotParts(w.slotId)
    return {
      announceISO: winnerAnnounceISOBySlot(w.round, w.slotId),
      announceLabel: prizeAnnounceBySlot(w.round, w.slotId), // 'ผู้โชคดีประจำวันที่ 1 ก.ค. 2569' ฯลฯ
      round: w.round,
      tier,
      prizeLabel: w.prizeLabel,
      name: w.name,
      phoneMasked: maskPhone3(w.phone),
    }
  })

  // ⏰ gate ตามเวลาจริง: รายชื่อโผล่เมื่อถึง 11:00 น. (เวลาไทย) ของวันประกาศ — ไม่ใช่แค่ข้ามวันเที่ยงคืน
  const nowMs = Date.now()
  const isAnnounced = (iso: string) => nowMs >= new Date(`${iso}T11:00:00+07:00`).getTime()
  const winners = (preview ? mapped : mapped.filter((w) => w.announceISO && isAnnounced(w.announceISO)))
    .sort((a, b) => (a.announceISO < b.announceISO ? 1 : a.announceISO > b.announceISO ? -1 : 0)) // ใหม่ → เก่า

  return NextResponse.json({ todayISO, preview, winners }, { headers: { 'Cache-Control': 'no-store' } })
}
