// POST /api/claim/submit
// Online document upload is intentionally disabled.
// Winners must bring original documents to the prize handover point.
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      error: 'ระบบไม่รับไฟล์เอกสารออนไลน์ กรุณานำเอกสารตัวจริงและสำเนาที่เซ็นรับรองมาแสดงในวันรับรางวัล',
    },
    {
      status: 410,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
