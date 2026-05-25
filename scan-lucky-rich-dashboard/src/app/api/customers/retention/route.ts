// GET /api/customers/retention?date=  — first-time vs returning split
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail, DEFAULT_RANGE } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const date = new URL(req.url).searchParams.get('date') ?? DEFAULT_RANGE.to
    return ok(await ds.getRetention(date))
  } catch (e: any) { return fail(e.message) }
}
