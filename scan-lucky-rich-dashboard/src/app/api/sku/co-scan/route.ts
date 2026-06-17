// GET /api/sku/co-scan?limit=10  — SKU pairs scanned by same users
import { NextRequest } from 'next/server'
import { getCoScanPairs } from '@/lib/api/api-source'
import { ok, fail } from '../../../_utils'

export async function GET(req: NextRequest) {
  try {
    const limit = Number(new URL(req.url).searchParams.get('limit') ?? '10')
    return ok(await getCoScanPairs(limit))
  } catch (e: any) { return fail(e.message) }
}
