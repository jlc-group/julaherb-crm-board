// GET /api/daily/2026-05-22
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { ok, fail } from '../../_utils'

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  try {
    const row = await ds.getDailyByDate(params.date)
    if (!row) return fail(`No data for ${params.date}`, 404)
    return ok(row)
  } catch (e: any) { return fail(e.message) }
}
