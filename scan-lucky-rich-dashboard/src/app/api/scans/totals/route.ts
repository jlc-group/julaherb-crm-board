// GET /api/scans/totals?from=&to=  — aggregated KPI for KPI strip
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getScansTotals(from, to))
  } catch (e: any) { return fail(e.message) }
}
