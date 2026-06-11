// POST /api/auth/refresh — ให้ dashboard login saversureV2 เอา JWT ใหม่ (token เก่า 8h หมดอายุ)
// dashboard เป็นคนเรียก /auth/login (ช่องทางปกติ read-only consumer) แล้วเขียน token ใหม่ลง .env.local
// creds อ่านจาก .env.local (gitignore) — dev convenience · ต้อง restart dev server หลัง refresh
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ENV_PATH = path.join(process.cwd(), '.env.local')

function parseEnv(txt: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

export async function POST() {
  let raw = ''
  try {
    raw = fs.readFileSync(ENV_PATH, 'utf-8')
  } catch (e: any) {
    return NextResponse.json({ error: 'อ่าน .env.local ไม่ได้: ' + e.message }, { status: 500 })
  }
  const env = parseEnv(raw)
  const base = (env.SAVERSURE_API_BASE_URL || 'http://localhost:30400/api/v1').replace(/\/$/, '')
  const email = env.SAVERSURE_LOGIN_EMAIL
  const password = env.SAVERSURE_LOGIN_PASSWORD
  const tenant = env.SAVERSURE_TENANT_ID || '00000000-0000-0000-0000-000000000001'
  if (!email || !password) {
    return NextResponse.json({ error: 'ต้องตั้ง SAVERSURE_LOGIN_EMAIL / SAVERSURE_LOGIN_PASSWORD ใน .env.local ก่อน' }, { status: 400 })
  }

  // ลอง login หลายรูปแบบ body (เผื่อ API คาด field ต่างกัน)
  let resp: Response | null = null
  let body: any = null
  try {
    resp = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tenant_id: tenant }),
    })
    body = await resp.json().catch(() => ({}))
  } catch (e: any) {
    return NextResponse.json({ error: 'เชื่อม saversureV2 ไม่ได้: ' + e.message }, { status: 502 })
  }
  if (!resp.ok) {
    return NextResponse.json({ error: 'login ไม่สำเร็จ', loginStatus: resp.status, detail: body }, { status: 502 })
  }

  const token =
    body?.token ?? body?.access_token ?? body?.accessToken ?? body?.data?.token ?? body?.data?.access_token ?? body?.data?.accessToken
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'ไม่พบ token ใน response', responseKeys: Object.keys(body || {}) }, { status: 502 })
  }

  // เขียน token ใหม่ลง .env.local
  let next = raw
  if (/^SAVERSURE_API_TOKEN=.*$/m.test(next)) next = next.replace(/^SAVERSURE_API_TOKEN=.*$/m, 'SAVERSURE_API_TOKEN=' + token)
  else next += `\nSAVERSURE_API_TOKEN=${token}\n`
  fs.writeFileSync(ENV_PATH, next, 'utf-8')

  let exp = 0
  try {
    exp = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8')).exp
  } catch {}

  return NextResponse.json({
    ok: true,
    tokenLen: token.length,
    expEpoch: exp,
    expISO: exp ? new Date(exp * 1000).toISOString() : null,
    note: 'เขียน token ใหม่ลง .env.local แล้ว — restart dev server เพื่อโหลด',
  })
}
