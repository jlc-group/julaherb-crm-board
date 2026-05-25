// GET /api/sku/list  — 97 SKU master with perScan multiplier
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export async function GET(_req: NextRequest) {
  try { return ok(await ds.getSkuList()) }
  catch (e: any) { return fail(e.message) }
}
