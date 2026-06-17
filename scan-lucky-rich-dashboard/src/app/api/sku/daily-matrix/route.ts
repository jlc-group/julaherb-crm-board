// GET /api/sku/daily-matrix?from=&to=  — per-SKU per-day matrix (sku-daily-matrix)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getSkuDailyMatrix(from, to))
  } catch (e: any) { return fail(e.message) }
}
