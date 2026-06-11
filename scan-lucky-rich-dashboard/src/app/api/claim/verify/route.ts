// POST /api/claim/verify — ลูกค้ายืนยันตัวว่าเป็นผู้โชคดี (เบอร์) → คืนรางวัลที่ได้ (เฉพาะของตัวเอง)
import { NextRequest, NextResponse } from 'next/server'
import { findWinnerPrizes, readClaims, last9 } from '@/lib/claims-store'
import { getRound, prizeAnnounceBySlot } from '@/config/draw-rounds'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  let body: { phone?: string; scanCode?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid json' }, 400)
  }
  const phone = (body.phone || '').trim()
  if (last9(phone).length < 9) return json({ error: 'กรุณากรอกเบอร์โทรให้ครบ 10 หลัก' }, 400)

  const { name, prizes } = findWinnerPrizes(phone)
  if (prizes.length === 0) return json({ isWinner: false })

  const claim = readClaims().find((c) => c.phoneLast9 === last9(phone))
  const prizeList = prizes.map((p) => ({
    round: p.round,
    prizeLabel: p.prizeLabel,
    announce: prizeAnnounceBySlot(p.round, p.slotId),
    drawDate: getRound(p.round)?.drawDateLabel ?? '',
  }))
  return json({
    isWinner: true,
    name,
    prizes: prizeList,
    claimStatus: claim?.status ?? null,
    hasProxy: claim?.hasProxy ?? false,
  })
}
