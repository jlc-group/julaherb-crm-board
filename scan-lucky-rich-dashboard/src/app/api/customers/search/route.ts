// GET /api/customers/search?q=  — ค้นหาลูกค้าสำหรับบันทึกผู้ได้รางวัล (หน้า Operation)
// consume saversureV2 /customers/search (read-only · เบา · ไม่แตะ scan_history)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  if (q.trim().length < 2) return ok({ q, results: [] }) // กันยิงถี่/คำสั้นไป
  try {
    return ok(await ds.searchCustomers(q))
  } catch (e: any) {
    return fail('ค้นหาลูกค้าไม่สำเร็จ: ' + (e?.message ?? String(e)), 502)
  }
}
