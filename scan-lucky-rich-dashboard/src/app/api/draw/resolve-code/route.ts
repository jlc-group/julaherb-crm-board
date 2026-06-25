// GET /api/draw/resolve-code?code=  — รหัสสแกน → ลูกค้า (ชื่อ+เบอร์เต็ม+สินค้า) สำหรับ WinnerPicker
// consume saversureV2 /scan-history?legacy_serial=&scan_type=success · read-only
// ⚠️ มีเบอร์เต็ม (PII) → middleware gate ด้วย ADMIN_KEY (prefix /api/draw/resolve-code)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export const dynamic = 'force-dynamic'
export const maxDuration = 180 // ครั้งแรกต้องทำดัชนีจาก print-slips (แบ่งช่วงวัน) อาจ ~1-2 นาที

export async function GET(req: NextRequest) {
  const code = (new URL(req.url).searchParams.get('code') ?? '').trim()
  if (code.length < 4) return ok({ found: false })
  try {
    const r = await ds.getScanByCode(code)
    if (!r) return ok({ found: false })
    return ok({ found: true, ...r })
  } catch (e: any) {
    return fail('ดึงข้อมูลจากรหัสสแกนไม่สำเร็จ: ' + (e?.message ?? String(e)), 502)
  }
}
