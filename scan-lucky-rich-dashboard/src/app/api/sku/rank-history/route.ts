// GET /api/sku/rank-history?from=&to=&top=10  — daily rank per SKU
import { NextRequest } from 'next/server'
import { getSkuRankHistory } from '@/lib/api/api-source'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const { from, to } = getRange(url, DEFAULT_RANGE)
    const top = Number(url.searchParams.get('top') ?? '10')
    return ok(await getSkuRankHistory(from, to, top))
  } catch (e: any) { return fail(e.message) }
}
