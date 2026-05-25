// GET /api/customers/provinces?date=&limit=  — Top provinces (with fraud flag)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail, DEFAULT_RANGE } from '../../_utils'

export async function GET(req: NextRequest) {
  try {
    const u = new URL(req.url)
    const date = u.searchParams.get('date') ?? DEFAULT_RANGE.to
    const limit = parseInt(u.searchParams.get('limit') ?? '10', 10)
    return ok(await ds.getProvinces(date, limit))
  } catch (e: any) { return fail(e.message) }
}
