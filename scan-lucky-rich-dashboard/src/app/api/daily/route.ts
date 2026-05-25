// GET /api/daily?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns daily rows array — each = 1 day overview
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../_utils'

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getDailyRows(from, to))
  } catch (e: any) { return fail(e.message) }
}
