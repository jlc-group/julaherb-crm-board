// GET /api/customers/rfm  — RFM segment distribution snapshot (ไม่มี date range)
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export async function GET() {
  try {
    return ok(await ds.getRfmDistribution())
  } catch (e: any) { return fail(e.message) }
}
