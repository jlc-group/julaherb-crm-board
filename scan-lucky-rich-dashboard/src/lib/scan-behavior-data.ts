// Mock scan-behavior data — calibrated to match REAL_CAMPAIGN totals (15,869 rights / 5,485 users / 2 days)
// Will be replaced when scan-level DB export is available

import { REAL_CAMPAIGN } from '@/lib/real-data'

// ============================================================
// 1. Heatmap — Day × Hour (last 7 days × 24 hr)
//    Realistic peaks: ~12:00-14:00 (lunch) and 19:00-21:00 (evening)
// ============================================================

export const DAYS_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
export const HOURS_24 = Array.from({ length: 24 }, (_, i) => i)

function hourFactor(h: number): number {
  // shape: low at night, peak at lunch and evening
  if (h >= 0 && h <= 6)   return 0.05
  if (h >= 7 && h <= 9)   return 0.35 + (h - 7) * 0.1
  if (h >= 10 && h <= 11) return 0.55
  if (h === 12)           return 0.95
  if (h === 13)           return 1.0
  if (h === 14)           return 0.85
  if (h >= 15 && h <= 17) return 0.55 - (h - 15) * 0.05
  if (h === 18)           return 0.65
  if (h === 19)           return 0.88
  if (h === 20)           return 0.92
  if (h === 21)           return 0.78
  if (h === 22)           return 0.55
  return 0.25
}

function dayFactor(d: number): number {
  // Mon=0 ... Sun=6. Weekend slightly higher
  const arr = [0.95, 0.90, 0.95, 1.00, 1.10, 1.20, 1.15]
  return arr[d] || 1
}

export interface HeatmapCell {
  day: number      // 0..6 (จ..อา)
  hour: number     // 0..23
  scans: number
}

export const HEATMAP_DATA: HeatmapCell[] = (() => {
  const totalScans = REAL_CAMPAIGN.totalRights * 0.38  // ~6,030 scans → realistic scan count
  let raw = 0
  const cells: { day: number; hour: number; factor: number }[] = []
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const f = dayFactor(d) * hourFactor(h)
      cells.push({ day: d, hour: h, factor: f })
      raw += f
    }
  }
  return cells.map(c => ({
    day: c.day,
    hour: c.hour,
    scans: Math.round((c.factor / raw) * totalScans),
  }))
})()

// Peak window summary
export const HEATMAP_INSIGHTS = (() => {
  const sorted = [...HEATMAP_DATA].sort((a, b) => b.scans - a.scans)
  const top = sorted[0]
  const dayScans: number[] = Array(7).fill(0)
  HEATMAP_DATA.forEach(c => { dayScans[c.day] += c.scans })
  const bestDayIdx = dayScans.indexOf(Math.max(...dayScans))
  return {
    peakDay: DAYS_TH[top.day],
    peakHour: top.hour,
    peakScans: top.scans,
    bestDay: DAYS_TH[bestDayIdx],
    bestDayScans: dayScans[bestDayIdx],
  }
})()

// ============================================================
// 2. TV Airtime correlation — scans by 15-min slot across 1 day
//    Mock TV ad slots at known windows
// ============================================================

export interface TvSlot {
  startMinute: number  // minutes from 00:00
  durationMin: number
  label: string
}

export const TV_AD_SLOTS: TvSlot[] = [
  { startMinute: 7 * 60 + 30,  durationMin: 1, label: 'ข่าวเช้า 7:30' },
  { startMinute: 12 * 60 + 15, durationMin: 1, label: 'ข่าวเที่ยง 12:15' },
  { startMinute: 18 * 60 + 0,  durationMin: 1, label: 'ข่าวเย็น 18:00' },
  { startMinute: 19 * 60 + 30, durationMin: 1, label: 'ตะลอนข่าว 19:30' },
  { startMinute: 21 * 60 + 0,  durationMin: 1, label: 'ข่าวค่ำ 21:00' },
]

export interface ScanMinute {
  minute: number   // 0..1439 (one full day)
  scans: number
}

export const SCANS_PER_15MIN: ScanMinute[] = (() => {
  const slots: ScanMinute[] = []
  for (let m = 0; m < 1440; m += 15) {
    const h = m / 60
    let base = hourFactor(Math.floor(h)) * 25  // baseline per 15-min
    // spike windows around TV ads (5-15 min after ad)
    for (const t of TV_AD_SLOTS) {
      const delta = m - t.startMinute
      if (delta >= 0 && delta <= 25) {
        const spike = Math.exp(-Math.pow(delta - 6, 2) / 60) * 60
        base += spike
      }
    }
    // add mild noise (deterministic via index)
    const noise = ((m * 13) % 11) - 5
    slots.push({ minute: m, scans: Math.max(0, Math.round(base + noise)) })
  }
  return slots
})()

// Compute lift per TV slot
export const TV_LIFT = TV_AD_SLOTS.map(slot => {
  const beforeWindow = SCANS_PER_15MIN.filter(s => s.minute >= slot.startMinute - 30 && s.minute < slot.startMinute)
  const afterWindow  = SCANS_PER_15MIN.filter(s => s.minute >= slot.startMinute && s.minute < slot.startMinute + 30)
  const before = beforeWindow.reduce((a, b) => a + b.scans, 0) / Math.max(1, beforeWindow.length)
  const after  = afterWindow.reduce((a, b) => a + b.scans, 0)  / Math.max(1, afterWindow.length)
  const liftPct = before > 0 ? ((after - before) / before) * 100 : 0
  return {
    label: slot.label,
    startMinute: slot.startMinute,
    avgBefore: Math.round(before),
    avgAfter:  Math.round(after),
    liftPct,
  }
})

// ============================================================
// 3. Funnel — Scan → Register → Verified → Rights Granted
// ============================================================

export interface FunnelStep {
  step: string
  count: number
  description: string
}

export const FUNNEL_DATA: FunnelStep[] = (() => {
  const granted = REAL_CAMPAIGN.totalRights  // 15,869
  return [
    { step: 'เปิด QR / กด link',       count: Math.round(granted * 1.45), description: 'Landing impression' },
    { step: 'กรอกข้อมูล (เริ่ม)',       count: Math.round(granted * 1.22), description: 'Form start' },
    { step: 'ส่งฟอร์มสำเร็จ',           count: Math.round(granted * 1.08), description: 'Submit' },
    { step: 'Verify ผ่าน (ได้สิทธิ์)',  count: granted,                    description: 'Rights granted' },
  ]
})()

// ============================================================
// 4. Retention — First scan → Second scan cohort
// ============================================================

export interface RetentionRow {
  bucket: string
  newScanners: number
  cameBackPct: number   // % of those who scanned a 2nd time
  avgDaysBetween: number
}

// Synthesized to match overall avg rights/user = 2.89
export const RETENTION_DATA: RetentionRow[] = [
  { bucket: 'D1 acquirers', newScanners: 2640, cameBackPct: 58, avgDaysBetween: 0.6 },
  { bucket: 'D2 acquirers', newScanners: 2845, cameBackPct: 0,  avgDaysBetween: 0   }, // เพิ่งมาวันนี้
]

// Same-day repeat behavior
export const SAME_DAY_REPEAT = {
  oneScan:        2240,
  twoScans:       1370,
  threeScans:     823,
  fourPlusScans:  1052,
}

// First → Second scan time distribution (mins between)
export const TIME_TO_REPEAT: { bucket: string; users: number }[] = [
  { bucket: '< 5 นาที',   users: 412 },
  { bucket: '5-30 นาที',  users: 624 },
  { bucket: '30 นาที-1 ชม.', users: 318 },
  { bucket: '1-6 ชม.',    users: 287 },
  { bucket: '6-24 ชม.',   users: 156 },
  { bucket: '1-2 วัน',    users: 152 },
]

// ============================================================
// 5. Verification — Failures / Duplicates / Invalid
// ============================================================

export interface VerificationStat {
  type: string
  count: number
  pct: number
  severity: 'low' | 'mid' | 'high'
  hint: string
}

const TOTAL_ATTEMPTS = 17_840   // total scan attempts
const TOTAL_VALID    = 15_869   // = REAL_CAMPAIGN.totalRights

export const VERIFICATION_KPIS = {
  totalAttempts: TOTAL_ATTEMPTS,
  totalValid:    TOTAL_VALID,
  validRatePct:  (TOTAL_VALID / TOTAL_ATTEMPTS) * 100,
  failedCount:   TOTAL_ATTEMPTS - TOTAL_VALID,
}

// ============================================================
// 6. Baseline Comparison — 16/17/18 of มี.ค. / เม.ย. / พ.ค. 2026
//    Real data from scan_history (campaign starts in พ.ค.)
// ============================================================

export interface BaselineRow {
  day: 16 | 17 | 18
  mar:  { scans: number; weekday: string }
  apr:  { scans: number; weekday: string }
  may:  { scans: number; weekday: string }  // campaign month
}

export const BASELINE_3MO: BaselineRow[] = [
  { day: 16,
    mar: { scans: 7452, weekday: 'จันทร์' },
    apr: { scans: 7375, weekday: 'พฤหัส' },
    may: { scans: 8082, weekday: 'เสาร์' } },
  { day: 17,
    mar: { scans: 8236, weekday: 'อังคาร' },
    apr: { scans: 8004, weekday: 'ศุกร์' },
    may: { scans: 9772, weekday: 'อาทิตย์' } },
  { day: 18,
    mar: { scans: 7841, weekday: 'พุธ' },
    apr: { scans: 9524, weekday: 'เสาร์' },
    may: { scans: 7358, weekday: 'จันทร์' } },
]

export const BASELINE_TOTALS = {
  mar: BASELINE_3MO.reduce((s, r) => s + r.mar.scans, 0),  // 23,529
  apr: BASELINE_3MO.reduce((s, r) => s + r.apr.scans, 0),  // 24,903
  may: BASELINE_3MO.reduce((s, r) => s + r.may.scans, 0),  // 25,212
}

// ============================================================
// 7. Apples-to-Apples weekday-matched comparison
//    From the 16-17-18 dataset, only Mon & Sat have matching pairs
// ============================================================

export interface WeekdayMatchRow {
  weekday: string
  baseline: { label: string; date: string; scans: number }  // ก่อนแคมเปญ
  campaign: { label: string; date: string; scans: number }  // พ.ค. (มีแคมเปญ)
}

export const WEEKDAY_MATCHED: WeekdayMatchRow[] = [
  {
    weekday: 'จันทร์',
    baseline: { label: 'มี.ค.', date: '16 มี.ค.', scans: 7452 },
    campaign: { label: 'พ.ค. 🎯', date: '18 พ.ค.', scans: 7358 },
  },
  {
    weekday: 'เสาร์',
    baseline: { label: 'เม.ย.', date: '18 เม.ย.', scans: 9524 },
    campaign: { label: 'พ.ค. 🎯', date: '16 พ.ค.', scans: 8082 },
  },
]

export const VERIFICATION_BREAKDOWN: VerificationStat[] = (() => {
  const failures = TOTAL_ATTEMPTS - TOTAL_VALID  // 1,971
  const items = [
    { type: 'Duplicate code (ใช้ซ้ำ)',   count: Math.round(failures * 0.42), severity: 'mid'  as const, hint: 'cheat attempt / user งง' },
    { type: 'Invalid format',             count: Math.round(failures * 0.22), severity: 'low'  as const, hint: 'พิมพ์ผิด หรือ OCR fail' },
    { type: 'Expired campaign code',      count: Math.round(failures * 0.10), severity: 'low'  as const, hint: 'ของเก่าก่อนแคมเปญ' },
    { type: 'Code not registered',        count: Math.round(failures * 0.15), severity: 'mid'  as const, hint: 'SKU ไม่ได้ลงระบบ' },
    { type: 'Suspicious velocity (>5/min)', count: Math.round(failures * 0.07), severity: 'high' as const, hint: 'bot suspicion' },
    { type: 'Network / system error',     count: Math.round(failures * 0.04), severity: 'low'  as const, hint: 'ระบบล่ม / lag' },
  ]
  const total = items.reduce((s, x) => s + x.count, 0)
  return items.map(x => ({ ...x, pct: (x.count / total) * 100 }))
})()
