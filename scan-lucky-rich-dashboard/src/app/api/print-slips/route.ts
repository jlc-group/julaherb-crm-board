// GET /api/print-slips?from=YYYY-MM-DD&to=YYYY-MM-DD
// สลิปจับฉลาก: 1 สิทธิ์ = 1 ใบ (ขยายตาม rights_per_scan)
//
// 🔴 กฎ realtime safety: dashboard ห้าม page scan_history ดิบ → ใช้ ds.getPrintSlips
//    (api-source เรียก backend rollup endpoint). ถ้า backend ยังไม่พร้อม (throw)
//    → fallback เป็น mock preview (สังเคราะห์ ไม่แตะ saversureV2) เพื่อดู layout ได้
import { NextRequest } from 'next/server'
import { ds } from '@/lib/api/adapter'
import * as mock from '@/lib/api/mock-source'
import { ok, getRange, DEFAULT_RANGE } from '../_utils'

export async function GET(req: NextRequest) {
  const { from, to } = getRange(new URL(req.url), DEFAULT_RANGE)
  try {
    return ok(await ds.getPrintSlips(from, to))
  } catch (e: any) {
    // backend endpoint ยังไม่พร้อม → preview ด้วย mock (rule-safe: ไม่ยิง saversureV2)
    const preview = await mock.getPrintSlips(from, to)
    return ok({
      ...preview,
      meta: { ...(preview.meta ?? {}), source: 'mock-fallback', note: e?.message ?? String(e) },
    })
  }
}
