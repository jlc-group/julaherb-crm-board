// GET /api/scans/verification?from=&to=  — scan outcome breakdown (verification-stats)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getVerificationStats(from, to))
  } catch (e: any) { return fail(e.message) }
}
