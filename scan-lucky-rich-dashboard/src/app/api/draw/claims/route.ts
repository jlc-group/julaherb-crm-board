// GET/POST /api/draw/claims — ฝั่งแอดมิน: ดู claim ทั้งหมด + อัปเดตสถานะ/โน้ต/มอบของ
// gate ด้วย ADMIN_KEY (ถ้าตั้ง env) — ถ้าไม่ตั้ง = เปิด (local)
import { NextRequest, NextResponse } from 'next/server'
import { readClaims, writeClaims, adminKeyOk, purgeClaimFiles } from '@/lib/claims-store'
import type { ClaimStatus } from '@/config/draw-rounds'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(req: NextRequest) {
  if (!adminKeyOk(req)) return json({ error: 'unauthorized' }, 401)
  return json({ claims: readClaims() })
}

export async function POST(req: NextRequest) {
  if (!adminKeyOk(req)) return json({ error: 'unauthorized' }, 401)
  let body: { phoneLast9?: string; status?: ClaimStatus; reviewNote?: string; purgeFiles?: boolean }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid json' }, 400)
  }
  const key = body.phoneLast9
  if (!key) return json({ error: 'ต้องมี phoneLast9' }, 400)

  const claims = readClaims()
  const c = claims.find((x) => x.phoneLast9 === key)
  if (!c) return json({ error: 'ไม่พบ claim' }, 404)

  if (body.status) c.status = body.status
  if (body.reviewNote !== undefined) c.reviewNote = body.reviewNote
  c.reviewedAt = new Date().toISOString()
  // มอบของแล้ว + เลือกลบไฟล์ (retention PII)
  if (body.status === 'handed_over' && body.purgeFiles) {
    purgeClaimFiles(key)
    c.files = {}
  }
  writeClaims(claims)
  return json({ ok: true, claim: c })
}
