// GET /api/customers/engagement?from=&to=  — scan-per-user distribution
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getEngagement(from, to))
  } catch (e: any) { return fail(e.message) }
}
