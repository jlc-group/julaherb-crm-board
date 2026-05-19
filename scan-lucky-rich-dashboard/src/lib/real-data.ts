// ============================
// Real campaign data — 16-17 พ.ค. 2026 (Day 1-2)
// From actual DB export. Will be replaced by Excel ingest later.
// ============================

export interface SkuStat {
  sku: string
  name: string
  tier: 'ซอง' | 'หลอด' | 'เซ็ต'
  size?: string         // "8G", "40G", "6G" — for cross-size analysis
  productGroup?: string // "ดีดีครีมแตงโม" — same product family across sizes
  rights: number
  users: number
  rightsPerUser: number
}

export const REAL_CAMPAIGN = {
  day1: { date: '2026-05-16', rights: 7160, users: 2624, skuActive: 75, weekday: 'เสาร์' },
  day2: { date: '2026-05-17', rights: 8709, users: 2968, skuActive: 74, weekday: 'อาทิตย์' },
  day3: { date: '2026-05-18', rights: 6432, users: 2509, skuActive: 72, weekday: 'จันทร์' },
  totalRights: 22301,           // 3-day total
  uniqueUsers: 7842,            // 3-day total
  activeSkus: 78,               // union across 3 days
  totalSkus: 93,
  deadSkus: 15,
  growthPct: 21.6,              // D1 → D2 (peak day)
  d2d3Pct: -26.1,               // D2 → D3 drop
  allTimeRights: 23264,         // since campaign start
} as const

// Top 10 from real DB — 3-day cumulative (16-17-18 พ.ค.)
export const TOP_SKUS: SkuStat[] = [
  { sku: 'L3-8G',   name: 'ดีดีครีมแตงโม',          tier: 'ซอง',  size: '8G',  productGroup: 'ดีดีครีมแตงโม', rights: 7431, users: 3187, rightsPerUser: 2.33 },
  { sku: 'L4-8G',   name: 'เซรั่มลำไย',              tier: 'ซอง',  size: '8G',  productGroup: 'เซรั่มลำไย',     rights: 2164, users: 1134, rightsPerUser: 1.91 },
  { sku: 'L6-8G',   name: 'เซรั่มแครอท',             tier: 'ซอง',  size: '8G',  productGroup: 'เซรั่มแครอท',    rights: 1600, users:  873, rightsPerUser: 1.83 },
  { sku: 'L10-7G',  name: 'กันแดดแตงโม 3D Aura',     tier: 'ซอง',  size: '7G',  productGroup: 'กันแดดแตงโม',    rights: 1523, users:  894, rightsPerUser: 1.70 },
  { sku: 'L7-6G',   name: 'โดสส้มแดงกลูต้าซีไฮยา',   tier: 'ซอง',  size: '6G',  productGroup: 'โดสส้มแดง',      rights: 1080, users:  549, rightsPerUser: 1.97 },
  { sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน',       tier: 'ซอง',  size: '10G', productGroup: 'ครีมกุหลาบ',      rights: 1030, users:  627, rightsPerUser: 1.64 },
  { sku: 'C4-8G',   name: 'เซรั่มขิงดำซิงก์',         tier: 'ซอง',  size: '8G',  productGroup: 'เซรั่มขิงดำ',    rights:  751, users:  402, rightsPerUser: 1.87 },
  { sku: 'L3-40G',  name: 'ดีดีครีมแตงโม',           tier: 'หลอด', size: '40G', productGroup: 'ดีดีครีมแตงโม', rights:  690, users:  566, rightsPerUser: 1.22 },
  { sku: 'L19-8G',  name: 'มอยส์เจลฉ่ำบัว',          tier: 'ซอง',  size: '8G',  productGroup: 'มอยส์เจลฉ่ำบัว', rights:  586, users:  407, rightsPerUser: 1.44 },
  { sku: 'L8B-6G',  name: 'อีอีคูชั่นแตงโม 02',       tier: 'ซอง',  size: '6G',  productGroup: 'อีอีคูชั่นแตงโม',rights:  402, users:  253, rightsPerUser: 1.59 },
]

// ── Cross-size product groups (same product, different sizes) ──
export interface CrossSizeRow {
  productGroup: string
  variants: { sku: string; size: string; tier: string; rights: number; users: number }[]
  dominantSize: string
  ratio: number // largest/smallest
}

export const CROSS_SIZE_GROUPS: CrossSizeRow[] = (() => {
  const map = new Map<string, SkuStat[]>()
  for (const s of TOP_SKUS) {
    if (!s.productGroup) continue
    const list = map.get(s.productGroup) || []
    list.push(s)
    map.set(s.productGroup, list)
  }
  const rows: CrossSizeRow[] = []
  for (const [grp, variants] of map.entries()) {
    if (variants.length < 2) continue
    variants.sort((a, b) => b.rights - a.rights)
    const ratio = variants[0].rights / Math.max(1, variants[variants.length - 1].rights)
    rows.push({
      productGroup: grp,
      variants: variants.map(v => ({ sku: v.sku, size: v.size || '', tier: v.tier, rights: v.rights, users: v.users })),
      dominantSize: variants[0].size || '',
      ratio,
    })
  }
  return rows.sort((a, b) => b.variants[0].rights - a.variants[0].rights)
})()

// ── Tier mix derived from top SKUs ──
export const TIER_MIX = (() => {
  const m = { ซอง: 0, หลอด: 0, เซ็ต: 0 } as Record<string, number>
  for (const s of TOP_SKUS) m[s.tier] += s.rights
  const total = Object.values(m).reduce((a, b) => a + b, 0)
  return Object.entries(m).map(([tier, rights]) => ({
    tier,
    rights,
    pct: (rights / total) * 100,
  }))
})()

// ── Pareto / cumulative share ──
export function paretoData(skus: SkuStat[], grandTotal: number) {
  const sorted = [...skus].sort((a, b) => b.rights - a.rights)
  let cum = 0
  return sorted.map((s, i) => {
    cum += s.rights
    return {
      rank: i + 1,
      sku: s.sku,
      name: s.name,
      rights: s.rights,
      pct: (s.rights / grandTotal) * 100,
      cumulativePct: (cum / grandTotal) * 100,
    }
  })
}

// ── Hero SKU (top 1) ──
export const HERO_SKU = TOP_SKUS[0]
export const HERO_SHARE_PCT = (HERO_SKU.rights / REAL_CAMPAIGN.totalRights) * 100

// ── Top 3 / Top 10 share ──
export const TOP3_SHARE = TOP_SKUS.slice(0, 3).reduce((s, x) => s + x.rights, 0) / REAL_CAMPAIGN.totalRights * 100
export const TOP10_SHARE = TOP_SKUS.slice(0, 10).reduce((s, x) => s + x.rights, 0) / REAL_CAMPAIGN.totalRights * 100

// ── Rights-per-user histogram (synthetic distribution based on real averages) ──
// Real avg: 15869 / 5485 = 2.89 — distribution skewed: many 1-scan, fewer heavy
export const RIGHTS_PER_USER_DIST = [
  { bucket: '1',     users: 2240, pct: 40.8 },
  { bucket: '2',     users: 1370, pct: 25.0 },
  { bucket: '3',     users:  823, pct: 15.0 },
  { bucket: '4-5',   users:  604, pct: 11.0 },
  { bucket: '6-10',  users:  329, pct:  6.0 },
  { bucket: '11-20', users:   88, pct:  1.6 },
  { bucket: '20+',   users:   31, pct:  0.6 },
]

// ── First-scan SKU (entry product for new users) ──
// Estimate: hero SKU also drives acquisition disproportionately
export const FIRST_SCAN_SKUS = [
  { sku: 'L3-8G',  name: 'ดีดีครีมแตงโม (ซอง)',    newUsers: 1542, pct: 42.1 },
  { sku: 'L4-8G',  name: 'เซรั่มลำไย (ซอง)',        newUsers:  478, pct: 13.0 },
  { sku: 'L6-8G',  name: 'เซรั่มแครอท (ซอง)',       newUsers:  392, pct: 10.7 },
  { sku: 'L10-7G', name: 'กันแดดแตงโม 3D Aura',     newUsers:  331, pct:  9.0 },
  { sku: 'L13-10G',name: 'ครีมกุหลาบน้ำเงิน',       newUsers:  207, pct:  5.6 },
]

// ── Dead SKUs sample (15 not scanned) — naming only, real list ต้องมาจาก DB ──
export const DEAD_SKUS_SAMPLE = [
  { sku: 'S2-100G', name: 'เซ็ตของขวัญพรีเมียม',  tier: 'เซ็ต' as const, daysIdle: 2 },
  { sku: 'L21-12G', name: 'ครีมกระชับผิว',         tier: 'ซอง' as const, daysIdle: 2 },
  { sku: 'L17-30G', name: 'มาส์กถ่านชาร์โคล',      tier: 'หลอด' as const, daysIdle: 2 },
  // ... 12 อื่นๆ
]
