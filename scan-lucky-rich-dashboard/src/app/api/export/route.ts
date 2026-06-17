// GET /api/export?from=&to=&format=json|csv|xlsx
// ดึงข้อมูลทุกชุดจาก adapter แล้วส่งกลับเป็นไฟล์ตาม format ที่เลือก
import { NextRequest, NextResponse } from 'next/server'
import { ds } from '@/lib/api/adapter'
import { DEFAULT_RANGE, getRange } from '../_utils'

type Format = 'json' | 'csv' | 'xlsx'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const { from, to } = getRange(url, DEFAULT_RANGE)
  const format = (url.searchParams.get('format') ?? 'json') as Format

  try {
    // ดึงข้อมูลทุกชุดพร้อมกัน
    const [daily, totals, members, provinces, heavyUsers, engagement, skuPerDay, skuList, uptime] =
      await Promise.allSettled([
        ds.getDailyRows(from, to),
        ds.getScansTotals(from, to),
        ds.getMembersDaily(from, to),
        ds.getProvinces(to, 20),
        ds.getHeavyUsers(to, 50),
        ds.getEngagement(from, to),
        ds.getSkuPerDay(from, to),
        ds.getSkuList(),
        ds.getUptime(from, to),
      ])

    // คืน value ถ้าสำเร็จ ไม่งั้นคืน fallback (export ต้องไม่ล้มแม้บาง endpoint พัง)
    const unwrap = (r: PromiseSettledResult<any>, fallback: any): any =>
      r.status === 'fulfilled' ? r.value : fallback

    const payload = {
      meta: {
        exported_at: new Date().toISOString(),
        from,
        to,
        source: process.env.DATA_SOURCE ?? 'mock',
      },
      daily_rows:    unwrap(daily, []),
      scan_totals:   unwrap(totals, {}),
      members_daily: unwrap(members, { rows: [] }),
      provinces:     unwrap(provinces, { date: to, provinces: [] }),
      heavy_users:   unwrap(heavyUsers, { date: to, users: [] }),
      engagement:    unwrap(engagement, { from, to, buckets: [] }),
      sku_per_day:   unwrap(skuPerDay, { from, to, rows: [] }),
      sku_list:      unwrap(skuList, { skus: [] }),
      uptime:        unwrap(uptime, { from, to, outages: [] }),
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="dashboard-export-${from}-to-${to}.json"`,
        },
      })
    }

    if (format === 'csv') {
      const sections: string[] = []

      // serialize 1 cell: object→JSON, escape embedded quotes
      const cell = (v: any): string => {
        if (v == null) return '""'
        const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
        return `"${s.replace(/"/g, '""')}"`
      }
      // helper: header row + data rows for a table section
      const table = (rows: any[]) => {
        if (rows.length === 0) return
        sections.push(Object.keys(rows[0]).join(','))
        rows.forEach(r => sections.push(Object.values(r).map(cell).join(',')))
      }

      // --- meta ---
      sections.push('# META')
      sections.push(`exported_at,${payload.meta.exported_at}`)
      sections.push(`from,${from}`)
      sections.push(`to,${to}`)
      sections.push(`source,${payload.meta.source}`)
      sections.push('')

      // --- daily_rows ---
      sections.push('# DAILY ROWS')
      table(payload.daily_rows as any[])
      sections.push('')

      // --- provinces ---
      sections.push('# TOP PROVINCES')
      table((payload.provinces as any).provinces ?? [])
      sections.push('')

      // --- heavy users ---
      sections.push('# HEAVY USERS')
      table((payload.heavy_users as any).users ?? [])
      sections.push('')

      // --- sku per day ---
      sections.push('# SKU PER DAY')
      table((payload.sku_per_day as any).rows ?? [])

      return new NextResponse(sections.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dashboard-export-${from}-to-${to}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      const XLSX = await import('xlsx')

      const wb = XLSX.utils.book_new()

      // Sheet: Daily
      const dailyData = payload.daily_rows as any[]
      if (dailyData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(dailyData)
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Rows')
      }

      // Sheet: Provinces
      const provData = (payload.provinces as any).provinces ?? []
      if (provData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(provData)
        XLSX.utils.book_append_sheet(wb, ws, 'Top Provinces')
      }

      // Sheet: Heavy Users
      const huData = (payload.heavy_users as any).users ?? []
      if (huData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(huData)
        XLSX.utils.book_append_sheet(wb, ws, 'Heavy Users')
      }

      // Sheet: SKU Per Day
      const skuData = (payload.sku_per_day as any).rows ?? []
      if (skuData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(skuData)
        XLSX.utils.book_append_sheet(wb, ws, 'SKU Per Day')
      }

      // Sheet: SKU List
      const skuListData = (payload.sku_list as any).skus ?? []
      if (skuListData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(skuListData)
        XLSX.utils.book_append_sheet(wb, ws, 'SKU Master')
      }

      // Sheet: Engagement Buckets
      const engBuckets = (payload.engagement as any).buckets ?? []
      if (engBuckets.length > 0) {
        const ws = XLSX.utils.json_to_sheet(engBuckets)
        XLSX.utils.book_append_sheet(wb, ws, 'Engagement')
      }

      // Sheet: Members Daily
      const membersRows = (payload.members_daily as any).rows ?? []
      if (membersRows.length > 0) {
        const ws = XLSX.utils.json_to_sheet(membersRows)
        XLSX.utils.book_append_sheet(wb, ws, 'Members Daily')
      }

      // Sheet: Summary (scan totals + meta)
      const summaryData = [
        { key: 'from', value: from },
        { key: 'to', value: to },
        { key: 'exported_at', value: payload.meta.exported_at },
        { key: 'source', value: payload.meta.source },
        ...Object.entries(payload.scan_totals as any).map(([k, v]) => ({ key: k, value: String(v) })),
      ]
      const wsSummary = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="dashboard-export-${from}-to-${to}.xlsx"`,
        },
      })
    }

    return NextResponse.json({ error: 'format ไม่รองรับ — ใช้ json, csv, หรือ xlsx' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
