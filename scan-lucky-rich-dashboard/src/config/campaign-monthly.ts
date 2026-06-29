// ───────────────────────────────────────────────────────────────
// ข้อมูลภาพรวมการสแกน "รายเดือนทั้งปี" (All Scan ระดับแพลตฟอร์ม ไม่ใช่เฉพาะแคมเปญนี้)
// ⚠️ ตอนนี้ HARDCODE จากสไลด์ Campaign Update (ของจริงจากทีม) — ยังไม่มี API
// TODO: ต่อ API รายเดือนจาก backend แล้วแทนค่าตรงนี้ (ดู YearOverviewCard)
// ที่มา: สไลด์ 2 "ภาพรวม All scan รายเดือน ม.ค.–มิ.ย. 2026"
// ───────────────────────────────────────────────────────────────

export type MonthKind = 'actual' | 'partial' | 'forecast'

export interface MonthlyScanPoint {
  month: string        // ป้ายแกน
  value: number        // จำนวนสแกนรวมทั้งเดือน
  momPct: number | null // % เทียบเดือนก่อนหน้า (null = เดือนฐาน/พิเศษ)
  kind: MonthKind
}

// All Scan รายเดือน (ระดับแพลตฟอร์ม) — ม.ค. = All-Time High เดิม 278,191
export const MONTHLY_ALL_SCAN: MonthlyScanPoint[] = [
  { month: 'ม.ค.',          value: 278191, momPct: null,  kind: 'actual' },
  { month: 'ก.พ.',          value: 247279, momPct: -11.1, kind: 'actual' },
  { month: 'มี.ค.',         value: 260767, momPct: 5.5,   kind: 'actual' },
  { month: 'เม.ย.',         value: 244079, momPct: -6.4,  kind: 'actual' },
  { month: 'พ.ค.',          value: 261293, momPct: 7.1,   kind: 'actual' },
  { month: 'มิ.ย. (17 ว.)', value: 160289, momPct: null,  kind: 'partial' },
  { month: 'มิ.ย. (คาด)',   value: 282863, momPct: 8.3,   kind: 'forecast' },
]

// ตัวเลขสรุปหัวการ์ด (จากสไลด์ 2)
export const YEAR_OVERVIEW_META = {
  currentMonthLabel: 'มิ.ย.',
  currentScans: 160289,        // ปัจจุบัน 17/30 วัน
  daysElapsed: 17,
  daysTotal: 30,
  currentRatePerDay: 9429,     // สแกน/วัน เดือนนี้
  avgRateJanMay: 7777,         // ค่าเฉลี่ย/วัน ม.ค.–พ.ค.
  liftVsAvgPct: 21,            // rate สูงกว่าค่าเฉลี่ย +21%
  prevAthMonth: 'ม.ค.',
  prevAth: 278191,             // All-Time High เดิม
  forecastClose: 282863,       // คาดปิดเดือน (base)
  forecastMoMPct: 8.3,         // +8.3% vs พ.ค.
  forecastVsAthPct: 1.7,       // +1.7% vs ม.ค. (ทุบสถิติใหม่)
  daysLeft: 13,
  scansNeeded: 122574,         // ต้องทำอีกเพื่อถึง forecast
}

// 3 Scenarios ปิดเดือน มิ.ย. (จากสไลด์ 2 / 11)
export interface CloseScenario {
  key: 'pessimistic' | 'base' | 'optimistic'
  label: string
  emoji: string
  note: string
  value: number
  momPct: number
  likelyPct: number
}

export const JUNE_CLOSE_SCENARIOS: CloseScenario[] = [
  { key: 'pessimistic', label: 'Pessimistic', emoji: '📉', note: 'rate ตก −10%',  value: 270606, momPct: 3.6,  likelyPct: 5 },
  { key: 'base',        label: 'Base',        emoji: '🎯', note: 'rate ปัจจุบัน',  value: 282863, momPct: 8.3,  likelyPct: 70 },
  { key: 'optimistic',  label: 'Optimistic',  emoji: '📈', note: 'rate +10% (Sun)', value: 295120, momPct: 12.9, likelyPct: 25 },
]
