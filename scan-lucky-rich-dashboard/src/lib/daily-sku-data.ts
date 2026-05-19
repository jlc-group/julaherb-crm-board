// Daily per-SKU breakdown — 16/17/18 พ.ค. 2026
// Source: scan_history aggregation export

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

// ── Day 1: 16 พ.ค. (เสาร์) — 7,160 rights ──
export const DAY_16: DailyStat = {
  date: '2026-05-16', weekday: 'เสาร์',
  totalRights: 7160, uniqueUsers: 2624, skuActive: 75, skuTotal: 93, rightsPerUser: 2.73,
  top: [
    { rank:  1, sku: 'L3-8G',     name: 'ดีดีครีมแตงโม',           rights: 2452, users: 1023, rightsPerUser: 2.40, pctOfDay: 34.2 },
    { rank:  2, sku: 'L4-8G',     name: 'เซรั่มลำไย',                rights:  659, users:  359, rightsPerUser: 1.84, pctOfDay:  9.2 },
    { rank:  3, sku: 'L6-8G',     name: 'เซรั่มแครอท',               rights:  499, users:  281, rightsPerUser: 1.78, pctOfDay:  7.0 },
    { rank:  4, sku: 'L10-7G',    name: 'กันแดดแตงโม 3D ออร่า',     rights:  471, users:  285, rightsPerUser: 1.65, pctOfDay:  6.6 },
    { rank:  5, sku: 'L13-10G',   name: 'ครีมกุหลาบน้ำเงิน',         rights:  328, users:  194, rightsPerUser: 1.69, pctOfDay:  4.6 },
    { rank:  6, sku: 'L7-6G',     name: 'โดสส้มแดงกลูต้าซีไฮยา',     rights:  302, users:  166, rightsPerUser: 1.82, pctOfDay:  4.2 },
    { rank:  7, sku: 'C4-8G',     name: 'เซรั่มขิงดำซิงก์',           rights:  255, users:  132, rightsPerUser: 1.93, pctOfDay:  3.6 },
    { rank:  8, sku: 'L3-40G',    name: 'ดีดีครีมแตงโม',             rights:  223, users:  190, rightsPerUser: 1.17, pctOfDay:  3.1 },
    { rank:  9, sku: 'L19-8G',    name: 'มอยส์เจลฉ่ำบัว',            rights:  205, users:  142, rightsPerUser: 1.44, pctOfDay:  2.9 },
    { rank: 10, sku: 'L8B-6G',    name: 'อีอีคูชั่นแตงโม 02 Natural', rights:  134, users:   90, rightsPerUser: 1.49, pctOfDay:  1.9 },
    { rank: 11, sku: 'D3-70G',    name: 'ยาสีฟันเจเด้นท์ ลดกลิ่นปาก', rights:  132, users:   77, rightsPerUser: 1.71, pctOfDay:  1.8 },
    { rank: 12, sku: 'L20-7G',    name: 'กันแดดทานตะวัน',            rights:   94, users:   68, rightsPerUser: 1.38, pctOfDay:  1.3 },
    { rank: 13, sku: 'JHA1-40G',  name: 'บีบีโลชั่นแตงโม',           rights:   87, users:   65, rightsPerUser: 1.34, pctOfDay:  1.2 },
    { rank: 14, sku: 'JH906-70G', name: 'สบู่ลำไย',                  rights:   80, users:   56, rightsPerUser: 1.43, pctOfDay:  1.1 },
    { rank: 15, sku: 'L8A-6G',    name: 'อีอีคูชั่นแตงโม 01 Light',   rights:   79, users:   54, rightsPerUser: 1.46, pctOfDay:  1.1 },
  ],
}

// ── Day 2: 17 พ.ค. (อาทิตย์) — peak 8,709 ──
export const DAY_17: DailyStat = {
  date: '2026-05-17', weekday: 'อาทิตย์',
  totalRights: 8709, uniqueUsers: 2968, skuActive: 74, skuTotal: 93, rightsPerUser: 2.93,
  top: [
    { rank:  1, sku: 'L3-8G',     name: 'ดีดีครีมแตงโม',           rights: 2822, users: 1178, rightsPerUser: 2.40, pctOfDay: 32.4 },
    { rank:  2, sku: 'L4-8G',     name: 'เซรั่มลำไย',                rights:  813, users:  400, rightsPerUser: 2.03, pctOfDay:  9.3 },
    { rank:  3, sku: 'L6-8G',     name: 'เซรั่มแครอท',               rights:  631, users:  313, rightsPerUser: 2.02, pctOfDay:  7.2 },
    { rank:  4, sku: 'L10-7G',    name: 'กันแดดแตงโม 3D ออร่า',     rights:  539, users:  323, rightsPerUser: 1.67, pctOfDay:  6.2 },
    { rank:  5, sku: 'L7-6G',     name: 'โดสส้มแดงกลูต้าซีไฮยา',     rights:  443, users:  208, rightsPerUser: 2.13, pctOfDay:  5.1 },
    { rank:  6, sku: 'L13-10G',   name: 'ครีมกุหลาบน้ำเงิน',         rights:  411, users:  252, rightsPerUser: 1.63, pctOfDay:  4.7 },
    { rank:  7, sku: 'C4-8G',     name: 'เซรั่มขิงดำซิงก์',           rights:  300, users:  142, rightsPerUser: 2.11, pctOfDay:  3.4 },
    { rank:  8, sku: 'L3-40G',    name: 'ดีดีครีมแตงโม',             rights:  265, users:  209, rightsPerUser: 1.27, pctOfDay:  3.0 },
    { rank:  9, sku: 'L19-8G',    name: 'มอยส์เจลฉ่ำบัว',            rights:  217, users:  151, rightsPerUser: 1.44, pctOfDay:  2.5 },
    { rank: 10, sku: 'L8B-6G',    name: 'อีอีคูชั่นแตงโม 02 Natural', rights:  159, users:   84, rightsPerUser: 1.89, pctOfDay:  1.8 },
    { rank: 11, sku: 'JHA1-40G',  name: 'บีบีโลชั่นแตงโม',           rights:  142, users:   87, rightsPerUser: 1.63, pctOfDay:  1.6 },
    { rank: 12, sku: 'L8A-6G',    name: 'อีอีคูชั่นแตงโม 01 Light',   rights:  120, users:   75, rightsPerUser: 1.60, pctOfDay:  1.4 },
    { rank: 13, sku: 'D3-70G',    name: 'ยาสีฟันเจเด้นท์ ลดกลิ่นปาก', rights:  116, users:   79, rightsPerUser: 1.47, pctOfDay:  1.3 },
    { rank: 14, sku: 'JH906-70G', name: 'สบู่ลำไย',                  rights:  100, users:   70, rightsPerUser: 1.43, pctOfDay:  1.1 },
    { rank: 15, sku: 'L4-40G',    name: 'เซรั่มลำไย',                rights:   99, users:   65, rightsPerUser: 1.52, pctOfDay:  1.1 },
  ],
}

// ── Day 3: 18 พ.ค. (จันทร์) — 6,432 ──
export const DAY_18: DailyStat = {
  date: '2026-05-18', weekday: 'จันทร์',
  totalRights: 6432, uniqueUsers: 2509, skuActive: 72, skuTotal: 93, rightsPerUser: 2.56,
  top: [
    { rank:  1, sku: 'L3-8G',     name: 'ดีดีครีมแตงโม',           rights: 2157, users:  986, rightsPerUser: 2.19, pctOfDay: 33.5 },
    { rank:  2, sku: 'L4-8G',     name: 'เซรั่มลำไย',                rights:  692, users:  375, rightsPerUser: 1.85, pctOfDay: 10.8 },
    { rank:  3, sku: 'L10-7G',    name: 'กันแดดแตงโม 3D ออร่า',     rights:  513, users:  286, rightsPerUser: 1.79, pctOfDay:  8.0 },
    { rank:  4, sku: 'L6-8G',     name: 'เซรั่มแครอท',               rights:  470, users:  279, rightsPerUser: 1.68, pctOfDay:  7.3 },
    { rank:  5, sku: 'L7-6G',     name: 'โดสส้มแดงกลูต้าซีไฮยา',     rights:  335, users:  175, rightsPerUser: 1.91, pctOfDay:  5.2 },
    { rank:  6, sku: 'L13-10G',   name: 'ครีมกุหลาบน้ำเงิน',         rights:  291, users:  181, rightsPerUser: 1.61, pctOfDay:  4.5 },
    { rank:  7, sku: 'L3-40G',    name: 'ดีดีครีมแตงโม',             rights:  202, users:  167, rightsPerUser: 1.21, pctOfDay:  3.1 },
    { rank:  8, sku: 'C4-8G',     name: 'เซรั่มขิงดำซิงก์',           rights:  196, users:  128, rightsPerUser: 1.53, pctOfDay:  3.0 },
    { rank:  9, sku: 'L19-8G',    name: 'มอยส์เจลฉ่ำบัว',            rights:  164, users:  114, rightsPerUser: 1.44, pctOfDay:  2.5 },
    { rank: 10, sku: 'L8B-6G',    name: 'อีอีคูชั่นแตงโม 02 Natural', rights:  109, users:   79, rightsPerUser: 1.38, pctOfDay:  1.7 },
    { rank: 11, sku: 'D3-70G',    name: 'ยาสีฟันเจเด้นท์ ลดกลิ่นปาก', rights:   91, users:   67, rightsPerUser: 1.36, pctOfDay:  1.4 },
    { rank: 12, sku: 'L8A-6G',    name: 'อีอีคูชั่นแตงโม 01 Light',   rights:   78, users:   57, rightsPerUser: 1.37, pctOfDay:  1.2 },
    { rank: 13, sku: 'JH906-70G', name: 'สบู่ลำไย',                  rights:   76, users:   68, rightsPerUser: 1.12, pctOfDay:  1.2 },
    { rank: 14, sku: 'L20-7G',    name: 'กันแดดทานตะวัน',            rights:   74, users:   65, rightsPerUser: 1.14, pctOfDay:  1.2 },
    { rank: 15, sku: 'JHA1-40G',  name: 'บีบีโลชั่นแตงโม',           rights:   74, users:   64, rightsPerUser: 1.16, pctOfDay:  1.2 },
  ],
}

export const DAILY_STATS: DailyStat[] = [DAY_16, DAY_17, DAY_18]

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

// ── Rank Movement: SKUs ที่อยู่ใน Top 10 ทั้ง 3 วัน ──
export interface RankMovement {
  sku: string
  name: string
  rank16: number
  rank17: number
  rank18: number
  trend: 'up' | 'down' | 'flat' | 'mixed'
}

export const RANK_MOVEMENT: RankMovement[] = [
  { sku: 'L3-8G',   name: 'ดีดีครีมแตงโม',           rank16:  1, rank17:  1, rank18:  1, trend: 'flat' },
  { sku: 'L4-8G',   name: 'เซรั่มลำไย',                rank16:  2, rank17:  2, rank18:  2, trend: 'flat' },
  { sku: 'L6-8G',   name: 'เซรั่มแครอท',               rank16:  3, rank17:  3, rank18:  4, trend: 'down' },
  { sku: 'L10-7G',  name: 'กันแดดแตงโม 3D ออร่า',     rank16:  4, rank17:  4, rank18:  3, trend: 'up' },
  { sku: 'L7-6G',   name: 'โดสส้มแดงกลูต้าซีไฮยา',     rank16:  6, rank17:  5, rank18:  5, trend: 'up' },
  { sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน',         rank16:  5, rank17:  6, rank18:  6, trend: 'down' },
  { sku: 'C4-8G',   name: 'เซรั่มขิงดำซิงก์',           rank16:  7, rank17:  7, rank18:  8, trend: 'down' },
  { sku: 'L3-40G',  name: 'ดีดีครีมแตงโม (40G)',       rank16:  8, rank17:  8, rank18:  7, trend: 'up' },
  { sku: 'L19-8G',  name: 'มอยส์เจลฉ่ำบัว',            rank16:  9, rank17:  9, rank18:  9, trend: 'flat' },
  { sku: 'L8B-6G',  name: 'อีอีคูชั่นแตงโม 02',         rank16: 10, rank17: 10, rank18: 10, trend: 'flat' },
]

// ── High velocity (สิทธิ์/คน สูงผิดปกติ) ──
export const HIGH_VELOCITY: { sku: string; name: string; rightsPerUser: number; users: number; day: string }[] = [
  { sku: 'JH705-8G', name: 'เซรั่มมะม่วง',         rightsPerUser: 5.00, users: 1,  day: '18 พ.ค.' },
  { sku: 'JHK4-8G',  name: 'มอยส์เจอร์อโวคาโด',     rightsPerUser: 3.63, users: 19, day: '17 พ.ค.' },
  { sku: 'JHK5-15G', name: 'น้ำตบแตงโมคอลลาเจน',    rightsPerUser: 3.29, users: 7,  day: '17 พ.ค.' },
  { sku: 'JHM2-4G',  name: 'มาก์สลำไยทองคำ',        rightsPerUser: 3.00, users: 14, day: '18 พ.ค.' },
  { sku: 'JH707-8G', name: 'เซรั่มขิงดำ',           rightsPerUser: 2.70, users: 10, day: '16 พ.ค.' },
]
