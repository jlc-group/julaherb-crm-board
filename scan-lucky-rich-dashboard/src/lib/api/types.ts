// ════════════════════════════════════════════════════════════════
// 📡 API Response Types — single source of truth for dashboard ↔ API
// Backend dev: ใช้ type นี้เป็น contract — แค่คืน object ตาม shape นี้
// ════════════════════════════════════════════════════════════════

// ─── Common ────────────────────────────────────────────────────────
export type DateString = string  // 'YYYY-MM-DD'

export interface ApiError {
  error: string
  code?: string
}

// ─── Daily / Range ──────────────────────────────────────────────────
export interface DailyRow {
  date: DateString
  weekday: string                // 'จันทร์', 'อังคาร', ...

  // สถิติสแกน
  success: number                // สแกนสำเร็จ (ครั้ง)
  dupSelf: number                // ซ้ำตัวเอง
  dupOther: number               // ซ้ำคนอื่น + ไม่พบ (รวม)
  notFound?: number              // ถ้าแยกได้
  totalAttempts: number          // success + dupSelf + dupOther + notFound
  successRate: number            // %

  // Tickets
  tickets: number                // สิทธิ์ใน DB (1:1 ปัจจุบัน)
  expectedTickets: number        // สิทธิ์ตามสเปก = Σ(scans × perScan)

  // Members
  memberNew: number              // สมัครใหม่วันนี้
  memberOld: number              // เก่ามาวันนี้
  memberTotal?: number           // สะสมระบบ ณ สิ้นวัน
  uniqueUsers: number            // ผู้สแกน distinct วันนี้
  signedNotScanned?: number      // สมัครแต่ไม่สแกน

  // Health
  outage?: OutageInfo
}

export interface OutageInfo {
  start: string                  // ISO datetime
  end: string
  durationHours: number
  cause: string
}

// ─── Aggregated KPI (range) ─────────────────────────────────────────
export interface ScansTotalsResponse {
  from: DateString
  to: DateString
  days: number
  success: number
  dupSelf: number
  dupOther: number
  notFound: number
  totalAttempts: number
  successRate: number
  tickets: number                // DB sum
  expectedTickets: number        // Σ(scans × perScan)
  ticketGap: number              // expected - actual
  uniqueUsers: number            // ⚠️ sum-of-daily (not distinct) — see distinctUsers if available
  distinctUsers?: number         // true DISTINCT (requires DB GROUP BY)
  avgScansPerDay: number
}

// ─── Time series (for charts) ──────────────────────────────────────
export interface TimeseriesPoint {
  date: DateString
  success: number
  tickets: number                // DB
  expectedTickets: number        // spec
  uniqueUsers: number
}

export interface ScansTimeseriesResponse {
  from: DateString
  to: DateString
  points: TimeseriesPoint[]
}

// ─── Time of day ───────────────────────────────────────────────────
export interface TimeOfDayBucket {
  range: string                  // '00-06', '07-12', ...
  scans: number
  pct: number
}

export interface TimeOfDayResponse {
  from: DateString
  to: DateString
  buckets: TimeOfDayBucket[]
  peakHours: { rank: 1 | 2 | 3; hour: string; scans: number }[]
}

// ─── Members ───────────────────────────────────────────────────────
export interface MemberDailyRow {
  date: DateString
  weekday: string
  memberNew: number
  memberOld: number
  total: number                  // = memberNew + memberOld
  signedNotScanned?: number
  activationRate?: number        // (memberNew - signedNotScanned) / memberNew
  memberTotal?: number           // cumulative system-wide
}

export interface MembersDailyResponse {
  from: DateString
  to: DateString
  rows: MemberDailyRow[]
  totals: {
    memberNew: number
    memberOld: number
    avgNewPerDay: number
  }
}

// ─── Customers ─────────────────────────────────────────────────────
export interface HeavyUser {
  rank: number
  userHash: string               // hashed PII — never expose phone/email
  province: string
  scans: number
  skuDiversity: number
  age?: number
  flag?: 'fraud' | 'reseller' | 'normal'
}

export interface HeavyUsersResponse {
  date: DateString | { from: DateString; to: DateString }
  users: HeavyUser[]
}

export interface EngagementBucket {
  label: string                  // '1 scan', '2-5 scans', '6-10 scans', '10+ scans'
  users: number
  pct: number
}

export interface EngagementResponse {
  from: DateString
  to: DateString
  totalUsers: number             // sum-of-daily (event-level)
  avgScansPerUser: number
  medianScansPerUser: number
  maxScansPerUser: number
  buckets: EngagementBucket[]
}

export interface ProvinceRow {
  rank: number
  name: string
  scans: number
  users: number
  avgPerUser: number             // scans ÷ users — flag if > 5
  flag?: 'normal' | 'watch' | 'fraud'
}

export interface ProvincesResponse {
  date: DateString | { from: DateString; to: DateString }
  provinces: ProvinceRow[]
}

export interface RetentionResponse {
  date: DateString
  firstTime: number              // ครั้งแรกในระบบ
  returning: number
  total: number
  firstTimePct: number
  returningPct: number
}

// ─── SKU ───────────────────────────────────────────────────────────
export interface SkuMaster {
  sku: string
  displayName: string
  fullName?: string
  size?: string
  price: number
  pointsPerScan: number
  rightsPerScan: number          // ⭐ multiplier for spec tickets
}

export interface SkuRow {
  sku: string
  displayName: string
  perScan: number
  scans: number                  // 5/6-day cumulative
  specTickets: number            // = scans × perScan
  uniqueUsers?: number
  sharePct: number               // of total specTickets
}

export interface SkuListResponse {
  skus: SkuMaster[]
}

export interface SkuPerDayResponse {
  from: DateString
  to: DateString
  total: { scans: number; specTickets: number; activeSkus: number; deadSkus: number }
  rows: SkuRow[]                 // sorted by specTickets DESC
}

export interface SkuTimeseriesPoint {
  date: DateString
  scans: number
  specTickets: number
  uniqueUsers: number
}

export interface SkuTimeseriesResponse {
  sku: string
  displayName: string
  perScan: number
  from: DateString
  to: DateString
  points: SkuTimeseriesPoint[]
}

// ─── Baseline (3-month comparison) ─────────────────────────────────
export interface BaselineCompareRow {
  date: DateString               // วันที่ของ พ.ค.
  weekday: string
  marScans: number
  marWeekday: string
  aprScans: number
  aprWeekday: string
  mayScans: number
  mayWeekday: string
  deltaMar: number               // % vs มี.ค.
  deltaApr: number               // % vs เม.ย.
}

export interface BaselineCompareResponse {
  from: DateString
  to: DateString
  rows: BaselineCompareRow[]
  totals: {
    marScans: number
    aprScans: number
    mayScans: number
    deltaMar: number
    deltaApr: number
  }
}

// ─── System / Health ───────────────────────────────────────────────
export interface UptimeResponse {
  from: DateString
  to: DateString
  totalHours: number             // (days × 24)
  outageHours: number
  uptimePct: number              // ((total - outage) / total) × 100
  outages: OutageInfo[]
}
