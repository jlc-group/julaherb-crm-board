// ═══════════════════════════════════════════════════════════════
// Middleware: เปิดหน้าเว็บทั้งหมด · ล็อกเฉพาะ API ที่มี PII จริง
// ═══════════════════════════════════════════════════════════════
// หลักการ (ปรับ 2026-06-12 ตามผู้ใช้ — เปิด domain ต้องเจอ dashboard เลย):
// - หน้าเว็บทุกหน้า + API ตัวเลขรวม (aggregate) → เปิด public
// - API ที่คืนข้อมูลส่วนตัวลูกค้า (ชื่อ-เบอร์เต็ม / ไฟล์บัตร ปชช. / ค้นหาลูกค้า)
//   → ต้องมี ADMIN_KEY (header `x-admin-key` หรือ cookie จากการเปิด ?key= ครั้งแรก)
// - ไม่ตั้ง ADMIN_KEY = เปิดหมด (dev ในเครื่องเหมือนเดิม)
import { NextRequest, NextResponse } from 'next/server'

// API ที่แตะ PII — ล็อกเสมอเมื่อตั้ง ADMIN_KEY
const PROTECTED_PREFIXES = [
  '/api/print-slips',      // ชื่อเต็ม + เบอร์เต็ม ทุกคน (รวม -pdf)
  '/api/claim/file',       // ไฟล์บัตรประชาชน/เอกสาร
  '/api/draw/claims',      // เอกสารรับรางวัล (PII)
  '/api/draw/winners',     // ผู้ชนะแบบ raw (ชื่อ+เบอร์ไม่ mask) — หน้า /winners ใช้ /api/winners/public ที่ mask แล้ว
  '/api/draw/resolve-code',// รหัสสแกน → ชื่อ+เบอร์เต็ม (PII)
  '/api/customers/search', // ค้นหาลูกค้า (ชื่อ/เบอร์)
]

export function middleware(req: NextRequest) {
  const key = process.env.ADMIN_KEY
  if (!key) return NextResponse.next() // local dev — เปิดหมด

  const { pathname, searchParams, hostname } = req.nextUrl

  // ?key= ใช้ได้จากทุกหน้า → set cookie 30 วัน (สำหรับแอดมินปลดล็อก API PII)
  const qk = searchParams.get('key')
  if (qk === key) {
    const clean = req.nextUrl.clone()
    clean.searchParams.delete('key')
    const res = NextResponse.redirect(clean)
    res.cookies.set('adminKey', key, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.nextUrl.protocol === 'https:',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  }

  // หน้าแอดมิน /jlc-console — ต้องมีคีย์ ไม่งั้นเด้งไปหน้าลูกค้า (ซ่อน UI แอดมินจากคนนอก/ลูกค้า)
  if (pathname === '/jlc-console' || pathname.startsWith('/jlc-console/')) {
    const ok = req.headers.get('x-admin-key') === key || req.cookies.get('adminKey')?.value === key
    return ok ? NextResponse.next() : NextResponse.redirect(new URL('/winners', req.url))
  }

  // refresh token: เฉพาะ localhost (scheduled task ในเครื่อง)
  if (pathname === '/api/auth/refresh') {
    if (hostname === 'localhost' || hostname === '127.0.0.1') return NextResponse.next()
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ล็อกเฉพาะ API PII — ที่เหลือผ่านหมด
  if (!PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '-'))) {
    return NextResponse.next()
  }
  if (req.headers.get('x-admin-key') === key) return NextResponse.next()
  if (req.cookies.get('adminKey')?.value === key) return NextResponse.next()
  return NextResponse.json({ error: 'unauthorized — ข้อมูลส่วนนี้ต้องใช้สิทธิ์แอดมิน' }, { status: 401 })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
