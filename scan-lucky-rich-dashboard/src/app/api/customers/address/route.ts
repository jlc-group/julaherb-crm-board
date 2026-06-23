// GET /api/customers/address?phone=  — ที่อยู่จัดส่งค่าเริ่มต้นของลูกค้า (auto-fill หน้า Operations)
// consume saversureV2: /customers/search (หา id) → /customers/{id}/detail (addresses) · read-only
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { getCustomerAddressDiag } from '@/lib/api/api-source'
import { ok, fail } from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const phone = url.searchParams.get('phone') ?? ''
  if (phone.replace(/\D/g, '').length < 4) return ok({ address: '' })
  // ?debug=1 → วิเคราะห์ว่าติดขั้นไหน (เฉพาะตอนต่อ API จริง)
  if (url.searchParams.get('debug') === '1') {
    try {
      return ok(await getCustomerAddressDiag(phone))
    } catch (e: any) {
      return ok({ error: e?.message ?? String(e) })
    }
  }
  try {
    return ok({ address: await ds.getCustomerAddress(phone) })
  } catch (e: any) {
    return fail('ดึงที่อยู่ไม่สำเร็จ: ' + (e?.message ?? String(e)), 502)
  }
}
