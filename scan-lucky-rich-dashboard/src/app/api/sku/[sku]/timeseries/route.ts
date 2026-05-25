// GET /api/sku/L3-8G/timeseries?from=&to=  — single SKU daily trend
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../../_utils'

export async function GET(req: NextRequest, { params }: { params: { sku: string } }) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getSkuTimeseries(params.sku, from, to))
  } catch (e: any) { return fail(e.message) }
}
