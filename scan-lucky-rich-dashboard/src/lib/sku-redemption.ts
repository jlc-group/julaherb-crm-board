// Joins 97-SKU master (Excel) with real redemption data (TOP_SKUS / per-day) into a single table
import { PRODUCTS_MASTER, type ProductMaster } from '@/config/products-real'
import { TOP_SKUS, REAL_CAMPAIGN } from '@/lib/real-data'
import { PER_SKU_DAILY, DAY_TOTALS, DAILY_TOP10, type DayKey } from '@/lib/per-sku-daily'
import LIVE from '@/lib/live-data.json'

// Build cumulative SKU map from live-data (5-day totals — auto-updates with live)
const CUM_BY_SKU = new Map<string, { rights: number; users: number }>()
for (const s of (LIVE.snapshot.cumulativeSkus || []) as any[]) {
  const m = s.sku.match(/\(([^)]+)\)\s*$/)
  const code = m ? m[1].trim() : s.sku
  CUM_BY_SKU.set(code, { rights: s.rights, users: s.users })
}

export type SkuStatus = 'hero' | 'active' | 'dead'
export type DayFilter = 'all' | DayKey | DayKey[]

// Map a date range (from-to) to day key. If single day matches loaded campaign data, return that day. Else 'all'
export function rangeToDay(from: string, to: string): DayFilter {
  if (from !== to) return 'all'
  const d = from.split('-')[2]
  if (d === '16' || d === '17' || d === '18' || d === '19' || d === '20' || d === '21' || d === '22' || d === '23' || d === '24') return d as DayKey
  return 'all'
}

export interface SkuRow extends ProductMaster {
  rightsRedeemed: number   // 0 if no data
  users: number
  rightsPerUser: number    // observed avg
  sharePct: number         // % ของ total ของช่วงที่เลือก
  status: SkuStatus
}

const TOP_BY_SKU = new Map(TOP_SKUS.map(s => [s.sku, s]))
const TOP_SET    = new Set(TOP_SKUS.map(s => s.sku))

export function buildSkuTable(day: DayFilter = 'all'): SkuRow[] {
  // All-time mode → use cumulative values across all days (full 93 SKUs)
  if (day === 'all') {
    return PRODUCTS_MASTER.map((p): SkuRow => {
      const cum = CUM_BY_SKU.get(p.sku)
      const rights = cum?.rights ?? 0
      const users  = cum?.users  ?? 0
      const sharePct = (rights / REAL_CAMPAIGN.totalRights) * 100
      const status: SkuStatus =
        TOP_SET.has(p.sku) ? 'hero' :
        rights > 0         ? 'active' :
                             'dead'
      return {
        ...p,
        rightsRedeemed: rights,
        users,
        rightsPerUser: users > 0 ? rights / users : 0,
        sharePct,
        status,
      }
    })
  }

  // Multiple-days mode (array of DayKey)
  if (Array.isArray(day)) {
    const dayKeys = day
    let total = 0
    const sumByKey: Record<string, { r: number; u: number }> = {}
    for (const p of PRODUCTS_MASTER) {
      let r = 0, u = 0
      for (const dk of dayKeys) {
        const v = PER_SKU_DAILY[p.sku]?.[dk]
        if (v) { r += v.r; u += v.u }
      }
      sumByKey[p.sku] = { r, u }
      total += r
    }
    return PRODUCTS_MASTER.map((p): SkuRow => {
      const { r: rights, u: users } = sumByKey[p.sku]
      const sharePct = total > 0 ? (rights / total) * 100 : 0
      const status: SkuStatus =
        TOP_SET.has(p.sku) ? 'hero' :
        rights > 0         ? 'active' :
                             'dead'
      return {
        ...p,
        rightsRedeemed: rights,
        users,
        rightsPerUser: users > 0 ? rights / users : 0,
        sharePct,
        status,
      }
    })
  }

  // Day-specific mode → use per-day values
  const dayTotal = DAY_TOTALS[day]
  const top10Set = new Set(DAILY_TOP10[day])
  return PRODUCTS_MASTER.map((p): SkuRow => {
    const dayData = PER_SKU_DAILY[p.sku]?.[day]
    const rights = dayData?.r ?? 0
    const users  = dayData?.u ?? 0
    const sharePct = dayTotal > 0 ? (rights / dayTotal) * 100 : 0
    const status: SkuStatus =
      top10Set.has(p.sku) ? 'hero' :
      rights > 0          ? 'active' :
                            'dead'
    return {
      ...p,
      rightsRedeemed: rights,
      users,
      rightsPerUser: users > 0 ? rights / users : 0,
      sharePct,
      status,
    }
  })
}

// Tier buckets by rightsPerScan (since campaign uses "1 สิทธิ์ / 2 สิทธิ์ / 3+ สิทธิ์" categories)
export type TierFilter = 'all' | '1' | '2' | '3plus' | 'dead'

export function applyTierFilter(rows: SkuRow[], tier: TierFilter): SkuRow[] {
  switch (tier) {
    case 'all':    return rows
    case '1':      return rows.filter(r => r.rightsPerScan === 1)
    case '2':      return rows.filter(r => r.rightsPerScan === 2)
    case '3plus':  return rows.filter(r => r.rightsPerScan >= 3)
    case 'dead':   return rows.filter(r => r.status === 'dead')
  }
}

export type SortKey = 'seq' | 'sku' | 'price' | 'pointsPerScan' | 'rightsPerScan' | 'rightsRedeemed' | 'users' | 'rightsPerUser' | 'sharePct'
export type SortDir = 'asc' | 'desc'

export function sortRows(rows: SkuRow[], key: SortKey, dir: SortDir): SkuRow[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[key] as number | string
    const bv = b[key] as number | string
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign
    return String(av).localeCompare(String(bv)) * sign
  })
}

// Tier bucket = rights/scan bucket (1 / 2 / 3+) matches Master filter chips
export type TierBucketKey = '1' | '2' | '3plus'

export interface TierBucket {
  key: TierBucketKey
  label: string
  skuCount: number
  rightsClaimed: number   // total rightsRedeemed in bucket
  rightsCapacity: number  // sum of rightsPerScan × ... (for funnel reference)
  sharePct: number        // % of campaign total rights claimed
}

export function getTierBuckets(rows: SkuRow[]): TierBucket[] {
  const totalRights = rows.reduce((s, r) => s + r.rightsRedeemed, 0) || 1
  const buckets: { key: TierBucketKey; label: string; match: (r: SkuRow) => boolean }[] = [
    { key: '1',     label: '1 สิทธิ์',  match: r => r.rightsPerScan === 1 },
    { key: '2',     label: '2 สิทธิ์',  match: r => r.rightsPerScan === 2 },
    { key: '3plus', label: '3+ สิทธิ์', match: r => r.rightsPerScan >= 3 },
  ]
  return buckets.map(b => {
    const subset = rows.filter(b.match)
    const rightsClaimed = subset.reduce((s, r) => s + r.rightsRedeemed, 0)
    return {
      key: b.key,
      label: b.label,
      skuCount: subset.length,
      rightsClaimed,
      rightsCapacity: subset.reduce((s, r) => s + r.rightsPerScan, 0),
      sharePct: (rightsClaimed / totalRights) * 100,
    }
  })
}

export function toCsv(rows: SkuRow[]): string {
  const headers = ['ลำดับ', 'SKU', 'หมวดราคา', 'ชื่อเต็ม', 'ชื่อเล่น', 'ราคา', 'แต้ม', 'สิทธิ์/scan', 'สิทธิ์ที่แลกแล้ว', 'Users', 'สิทธิ์/คน', '% Share', 'Status']
  const lines = [headers.join(',')]
  for (const r of rows) {
    const cells = [
      r.seq, r.sku, r.priceCategory, r.fullName, r.displayName,
      r.price, r.pointsPerScan, r.rightsPerScan,
      r.rightsRedeemed, r.users, r.rightsPerUser.toFixed(2), r.sharePct.toFixed(2), r.status,
    ].map(v => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    })
    lines.push(cells.join(','))
  }
  return lines.join('\n')
}
