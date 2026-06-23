// GET /api/customers/address?phone=  — ที่อยู่จัดส่งค่าเริ่มต้นของลูกค้า (auto-fill หน้า Operations)
// consume saversureV2: /customers/search (หา id) → /customers/{id}/detail (addresses) · read-only
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const phone = new URL(req.url).searchParams.get('phone') ?? ''
  if (phone.replace(/\D/g, '').length < 4) return ok({ address: '' })
  try {
    return ok({ address: await ds.getCustomerAddress(phone) })
  } catch (e: any) {
    return fail('ดึงที่อยู่ไม่สำเร็จ: ' + (e?.message ?? String(e)), 502)
  }
}
