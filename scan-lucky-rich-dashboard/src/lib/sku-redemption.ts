// Joins 97-SKU master (Excel) with real redemption data (TOP_SKUS) into a single table
import { PRODUCTS_MASTER, type ProductMaster } from '@/config/products-real'
import { TOP_SKUS, REAL_CAMPAIGN } from '@/lib/real-data'

export type SkuStatus = 'hero' | 'active' | 'dead'

export interface SkuRow extends ProductMaster {
  rightsRedeemed: number   // 0 if not in TOP_SKUS
  users: number
  rightsPerUser: number    // observed avg
  sharePct: number         // % ของ campaign total
  status: SkuStatus
}

const TOP_BY_SKU = new Map(TOP_SKUS.map(s => [s.sku, s]))
const TOP_SET    = new Set(TOP_SKUS.map(s => s.sku))

export function buildSkuTable(): SkuRow[] {
  return PRODUCTS_MASTER.map((p): SkuRow => {
    const top = TOP_BY_SKU.get(p.sku)
    const rights = top?.rights ?? 0
    const users  = top?.users  ?? 0
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

export type SortKey = 'seq' | 'sku' | 'price' | 'pointsPerScan' | 'rightsPerScan' | 'rightsRedeemed' | 'sharePct'
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
  const headers = ['ลำดับ', 'SKU', 'หมวดราคา', 'ชื่อเต็ม', 'ชื่อเล่น', 'ราคา', 'แต้ม', 'สิทธิ์/scan', 'สิทธิ์ที่แลกแล้ว', 'Users', '% Share', 'Status']
  const lines = [headers.join(',')]
  for (const r of rows) {
    const cells = [
      r.seq, r.sku, r.priceCategory, r.fullName, r.displayName,
      r.price, r.pointsPerScan, r.rightsPerScan,
      r.rightsRedeemed, r.users, r.sharePct.toFixed(2), r.status,
    ].map(v => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    })
    lines.push(cells.join(','))
  }
  return lines.join('\n')
}
