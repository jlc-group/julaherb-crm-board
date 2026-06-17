// GET /api/scans/day-hour?from=&to=  — heatmap วัน × ชั่วโมง (scans-by-day-hour)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange, ok, fail } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
    return ok(await ds.getScansByDayHour(from, to))
  } catch (e: any) { return fail(e.message) }
}
