// ═══════════════════════════════════════════════════════════════
// Middleware gate ทั้งแอปสำหรับ public deploy (Cloudflare Tunnel)
// ═══════════════════════════════════════════════════════════════
// - ถ้าไม่ตั้ง ADMIN_KEY → เปิดหมด (local dev สะดวก — semantics เดิมของ adminKeyOk)
// - ตั้ง ADMIN_KEY แล้ว:
//   · public surface (ลูกค้า): /winners /claim + API ที่หน้าพวกนี้ใช้ → ผ่านเสมอ
//   · ที่เหลือทั้งหมด (หน้า admin / + ทุก API ที่มี PII เช่น print-slips) → ต้องมี key
//     ทาง 1: header `x-admin-key` (client fetch เดิมใช้อยู่)
//     ทาง 2: เปิด browser ครั้งแรกด้วย ?key=<ADMIN_KEY> → set cookie แล้วใช้ต่อได้เลย
//   · /api/auth/refresh อนุญาตเฉพาะเรียกจาก localhost (scheduled task ในเครื่อง)
import { NextRequest, NextResponse } from 'next/server'

// public ที่ลูกค้าต้องเข้าได้โดยไม่มี key
const PUBLIC_PREFIXES = [
  '/winners',
  '/claim',
  '/api/winners/public',
  '/api/claim/verify',
  '/api/claim/submit', // ตอบ 410 Gone อยู่แล้ว
  '/_next',
  '/favicon',
  '/fonts',
  '/images',
]

export function middleware(req: NextRequest) {
  const key = process.env.ADMIN_KEY
  if (!key) return NextResponse.next() // local dev — ไม่ตั้ง = เปิดหมด

  const { pathname, searchParams, hostname } = req.nextUrl

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // refresh token: ให้เฉพาะ localhost (scheduled task ในเครื่อง) — ไม่เปิดผ่าน tunnel
  if (pathname === '/api/auth/refresh') {
    if (hostname === 'localhost' || hostname === '127.0.0.1') return NextResponse.next()
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ทางผ่าน 3 แบบ: header (client fetch) / cookie (ตั้งจาก ?key=) / query ?key=
  if (req.headers.get('x-admin-key') === key) return NextResponse.next()
  if (req.cookies.get('adminKey')?.value === key) return NextResponse.next()

  const qk = searchParams.get('key')
  if (qk === key) {
    // ผ่านด้วย ?key= ครั้งแรก → set cookie + ตัด key ออกจาก URL
    const clean = req.nextUrl.clone()
    clean.searchParams.delete('key')
    const res = NextResponse.redirect(clean)
    res.cookies.set('adminKey', key, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30, // 30 วัน
      path: '/',
    })
    return res
  }

  // API → 401 JSON · หน้าเว็บที่ไม่มี key → เด้งไปหน้าประกาศผล (UX: คนทั่วไปเปิด domain แล้วเจอของที่ใช้ได้เลย)
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const toWinners = req.nextUrl.clone()
  toWinners.pathname = '/winners'
  toWinners.search = ''
  return NextResponse.redirect(toWinners)
}

export const config = {
  // ครอบทุก path ยกเว้น static assets ที่ Next เสิร์ฟเอง
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
