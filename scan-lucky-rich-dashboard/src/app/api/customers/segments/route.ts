// GET /api/customers/segments — CRM segments (Loyal Scanners, Champions, ...)
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export async function GET(_req: NextRequest) {
  try {
    return ok(await ds.getSegments())
  } catch (e: any) { return fail(e.message) }
}
