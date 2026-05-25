// Shared route utilities
import { NextResponse } from 'next/server'

export function getRange(url: URL, defaults: { from: string; to: string }) {
  const from = url.searchParams.get('from') ?? defaults.from
  const to = url.searchParams.get('to') ?? defaults.to
  return { from, to }
}

export function ok<T>(data: T) {
  return NextResponse.json(data, {
    status: 200,
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  })
}

export function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

// Default range = full campaign so far (16 พ.ค. → today)
// ⚠ Update `to` when new days arrive — or compute dynamically from DAILY_ENTRIES
export const DEFAULT_RANGE = { from: '2026-05-16', to: '2026-05-24' }
