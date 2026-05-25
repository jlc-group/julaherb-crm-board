// Daily per-SKU breakdown — auto-derived from live-data.json
import LIVE from '@/lib/live-data.json'

export interface DailySkuRow {
  rank: number
  sku: string
  name: string
  rights: number
  users: number
  rightsPerUser: number
  pctOfDay: number
}

export interface DailyStat {
  date: string
  weekday: string
  totalRights: number
  uniqueUsers: number
  skuActive: number
  skuTotal: number
  rightsPerUser: number
  top: DailySkuRow[]
}

// DAILY_STATS — auto-derived from live-data.json
export const DAILY_STATS: DailyStat[] = LIVE.snapshot.days.map((d: any, idx: number) => {
  // Get top 15 from per_sku_daily for this day
  const dk = d.date.split('-')[2]
  const all: { sku: string; rights: number; users: number }[] = []
  for (const [sku, days] of Object.entries(LIVE.per_sku_daily as any)) {
    const v = (days as any)[dk]
    if (v?.r > 0) all.push({ sku, rights: v.r, users: v.u })
  }
  all.sort((a, b) => b.rights - a.rights)
  const top15 = all.slice(0, 15).map((s, i) => ({
    rank: i + 1,
    sku: s.sku,
    name: '',  // populated below from live names
    rights: s.rights,
    users: s.users,
    rightsPerUser: s.users > 0 ? +(s.rights / s.users).toFixed(2) : 0,
    pctOfDay: d.rights > 0 ? +((s.rights / d.rights) * 100).toFixed(1) : 0,
  }))
  // Lookup display name from cumulativeSkus (which has "name (SKU)" format)
  const nameMap = new Map<string, string>()
  for (const c of (LIVE.snapshot.cumulativeSkus as any[])) {
    const m = c.sku.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
    if (m) nameMap.set(m[2].trim(), m[1].trim())
  }
  top15.forEach(t => { t.name = nameMap.get(t.sku) || t.sku })

  return {
    date: d.date,
    weekday: d.weekday,
    totalRights: d.rights,
    uniqueUsers: d.users,
    skuActive: d.skuActive,
    skuTotal: 93,
    rightsPerUser: d.users > 0 ? +(d.rights / d.users).toFixed(2) : 0,
    top: top15,
  }
})

// Legacy exports for back-compat (will use first 3 days)
export const DAY_16 = DAILY_STATS[0]
export const DAY_17 = DAILY_STATS[1]
export const DAY_18 = DAILY_STATS[2]

// ── Dead SKU: ไม่มีคนสแกนเลย 3 วันติด ──
export const DEAD_SKUS_3DAY: { sku: string; name: string }[] = [
  { sku: 'L5-90G',    name: 'น้ำตบแตงโมคอลลาเจน (90G)' },
  { sku: 'L5A-90G',   name: 'น้ำตบแตงโมคอลลาเจน A (90G)' },
  { sku: 'JHT2-2G',   name: 'ลิปทินท์แตงโม Sugar Baby' },
  { sku: 'JHP2-200G', name: 'สครับเกลือแตงโม' },
  { sku: 'JHA2-40G',  name: 'สครับแตงโม' },
  { sku: 'JHQ1-30G',  name: 'อีอีคูชั่นแตงโม 01 Light (JHQ1)' },
  { sku: 'JHQ2-30G',  name: 'อีอีคูชั่นแตงโม 02 Natural (JHQ2)' },
  { sku: 'JH701-40G', name: 'เจลดาวเรือง (40G)' },
  { sku: 'JH701-8G',  name: 'เจลดาวเรือง (8G)' },
  { sku: 'JHK1-40G',  name: 'เจลดาวเรือง (JHK1 40G)' },
  { sku: 'JH702-40G', name: 'เจลมะรุม (40G)' },
  { sku: 'JH702-8G',  name: 'เจลมะรุม (8G)' },
  { sku: 'JHK2-40G',  name: 'เจลมะรุม (JHK2 40G)' },
  { sku: 'JHP1-80G',  name: 'เจลแตงโม' },
  { sku: 'JH707-40G', name: 'เซรั่มขิงดำ (40G)' },
  { sku: 'JH705-40G', name: 'เซรั่มมะม่วง (40G)' },
]

// ── Rank Movement: SKUs ที่อยู่ใน Top 10 ทั้ง 5 วัน ──
export interface RankMovement {
  sku: string
  name: string
  rank16: number
  rank17: number
  rank18: number
  rank19: number
  rank20: number
  trend: 'up' | 'down' | 'flat' | 'mixed'
}

// Day 20 ranks (from screenshot):
// 1.L3-8G 2.L4-8G 3.L6-8G 4.L10-7G 5.L7-6G 6.L13-10G 7.L3-40G 8.C4-8G 9.L19-8G 10.L8B-6G
export const RANK_MOVEMENT: RankMovement[] = [
  { sku: 'L3-8G',   name: 'ดีดีครีมแตงโม',           rank16:  1, rank17:  1, rank18:  1, rank19:  1, rank20:  1, trend: 'flat' },
  { sku: 'L4-8G',   name: 'เซรั่มลำไย',                rank16:  2, rank17:  2, rank18:  2, rank19:  2, rank20:  2, trend: 'flat' },
  { sku: 'L6-8G',   name: 'เซรั่มแครอท',               rank16:  3, rank17:  3, rank18:  4, rank19:  3, rank20:  3, trend: 'mixed' },
  { sku: 'L10-7G',  name: 'กันแดดแตงโม 3D ออร่า',     rank16:  4, rank17:  4, rank18:  3, rank19:  4, rank20:  4, trend: 'mixed' },
  { sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน',         rank16:  5, rank17:  6, rank18:  6, rank19:  5, rank20:  6, trend: 'mixed' },
  { sku: 'L7-6G',   name: 'โดสส้มแดงกลูต้าซีไฮยา',     rank16:  6, rank17:  5, rank18:  5, rank19:  6, rank20:  5, trend: 'mixed' },
  { sku: 'C4-8G',   name: 'เซรั่มขิงดำซิงก์',           rank16:  7, rank17:  7, rank18:  8, rank19:  7, rank20:  8, trend: 'mixed' },
  { sku: 'L3-40G',  name: 'ดีดีครีมแตงโม (40G)',       rank16:  8, rank17:  8, rank18:  7, rank19:  8, rank20:  7, trend: 'mixed' },
  { sku: 'L19-8G',  name: 'มอยส์เจลฉ่ำบัว',            rank16:  9, rank17:  9, rank18:  9, rank19:  9, rank20:  9, trend: 'flat' },
  { sku: 'L8B-6G',  name: 'อีอีคูชั่นแตงโม 02',         rank16: 10, rank17: 10, rank18: 10, rank19: 10, rank20: 10, trend: 'flat' },
]

// ── High velocity (สิทธิ์/คน สูงผิดปกติ) ──
export const HIGH_VELOCITY: { sku: string; name: string; rightsPerUser: number; users: number; day: string }[] = [
  { sku: 'JH705-8G', name: 'เซรั่มมะม่วง',         rightsPerUser: 5.00, users: 1,  day: '18 พ.ค.' },
  { sku: 'JHK4-8G',  name: 'มอยส์เจอร์อโวคาโด',     rightsPerUser: 3.63, users: 19, day: '17 พ.ค.' },
  { sku: 'JHK5-15G', name: 'น้ำตบแตงโมคอลลาเจน',    rightsPerUser: 3.29, users: 7,  day: '17 พ.ค.' },
  { sku: 'JHM2-4G',  name: 'มาก์สลำไยทองคำ',        rightsPerUser: 3.00, users: 14, day: '18 พ.ค.' },
  { sku: 'JH707-8G', name: 'เซรั่มขิงดำ',           rightsPerUser: 2.70, users: 10, day: '16 พ.ค.' },
]
