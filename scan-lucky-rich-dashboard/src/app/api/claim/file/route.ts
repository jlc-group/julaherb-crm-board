// GET /api/claim/file?phone={last9}&type={idCard|poa|proxyIdCard} — ส่งไฟล์เอกสารให้แอดมินดู
// gate ด้วย ADMIN_KEY (ถ้าตั้ง) — แอดมิน fetch พร้อม header x-admin-key แล้วทำ blob เอง
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { readClaims, claimPersonDir, adminKeyOk } from '@/lib/claims-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!adminKeyOk(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const key = url.searchParams.get('phone') || ''
  const type = url.searchParams.get('type') || ''
  if (!['idCard', 'poa', 'proxyIdCard'].includes(type)) {
    return NextResponse.json({ error: 'type ไม่ถูกต้อง' }, { status: 400 })
  }

  const claim = readClaims().find((c) => c.phoneLast9 === key)
  if (!claim) return NextResponse.json({ error: 'ไม่พบ claim' }, { status: 404 })
  const fname = (claim.files as Record<string, string | undefined>)[type]
  if (!fname) return NextResponse.json({ error: 'ไม่มีไฟล์นี้' }, { status: 404 })

  let buf: Buffer
  try {
    buf = fs.readFileSync(path.join(claimPersonDir(key), fname))
  } catch {
    return NextResponse.json({ error: 'ไฟล์หาย' }, { status: 404 })
  }
  const ext = fname.split('.').pop()
  const ct = ext === 'pdf' ? 'application/pdf' : ext === 'png' ? 'image/png' : 'image/jpeg'
  return new NextResponse(new Uint8Array(buf), {
    headers: { 'Content-Type': ct, 'Cache-Control': 'no-store' },
  })
}
