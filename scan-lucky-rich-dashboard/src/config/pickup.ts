// ───────────────────────────────────────────────────────────────
// ตารางวันนัดหมาย "เข้ามารับรางวัล" (ฝั่งลูกค้า)
// กฎ (ยืนยันกับผู้ใช้ 2026-06-15):
//   • ฐาน = ทุก "อังคาร + พุธ" เริ่มสัปดาห์ของ 14–15 ก.ค. 2569
//   • พุธที่เป็น "วันจับรางวัลจริง" (ทีมออกไปไทยรัฐ) → เลื่อนเป็น "พฤหัส"
//   • วันที่ตรง "วันหยุดออฟฟิศ" → เลื่อนไปวันถัดไปที่ว่างในสัปดาห์นั้น (จ.–ศ. ข้ามวันหยุด/วันจับ/วันที่จองแล้ว)
//   • ช่วงเวลา: เช้า 10–12 (สูงสุด 5) · บ่าย 13–17 (สูงสุด 10) — ยังไม่บังคับโควต้า (UI เลือกอย่างเดียว)
// ───────────────────────────────────────────────────────────────
import { DRAW_ROUNDS } from './draw-rounds'

export interface PickupSlot {
  id: 'morning' | 'afternoon'
  period: string
  time: string
  capacity: number
}

export const PICKUP_SLOTS: PickupSlot[] = [
  { id: 'morning', period: 'ช่วงเช้า', time: '10:00 – 12:00 น.', capacity: 5 },
  { id: 'afternoon', period: 'ช่วงบ่าย', time: '13:00 – 17:00 น.', capacity: 10 },
]

export const PICKUP_WINDOW_START = '2026-07-14'
export const PICKUP_WINDOW_END = '2026-12-31'

// วันหยุดออฟฟิศ JLC 2569 (เฉพาะที่อยู่ในช่วงรับรางวัล ก.ค.–ธ.ค.)
export const OFFICE_HOLIDAYS: Record<string, string> = {
  '2026-07-28': 'วันเฉลิมพระชนมพรรษา ร.10',
  '2026-07-29': 'วันอาสาฬหบูชา',
  '2026-08-12': 'วันแม่แห่งชาติ',
  '2026-10-13': 'วันนวมินทรมหาราช',
  '2026-10-23': 'วันปิยมหาราช',
  '2026-12-07': 'ชดเชยวันพ่อแห่งชาติ',
  '2026-12-10': 'วันรัฐธรรมนูญ',
  '2026-12-31': 'วันสิ้นปี',
}

// ── helpers (calendar date, ไม่มี timezone) ──
const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`
function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function addDays(iso: string, n: number): string {
  const dt = parse(iso)
  dt.setDate(dt.getDate() + n)
  return isoOf(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}
const weekdayOf = (iso: string) => parse(iso).getDay() // 0=อา .. 6=ส

// วันจับรางวัลที่ตรง "วันพุธ" (ทีมออกไปไทยรัฐ) — derive จาก DRAW_ROUNDS
export const DRAW_WEDNESDAYS = new Set(
  DRAW_ROUNDS.map((r) => r.drawDate).filter((d) => weekdayOf(d) === 3),
)

const isHoliday = (iso: string) => iso in OFFICE_HOLIDAYS
const isDrawWed = (iso: string) => DRAW_WEDNESDAYS.has(iso)
const isBlocked = (iso: string) => isHoliday(iso) || isDrawWed(iso)
const inWindow = (iso: string) => iso >= PICKUP_WINDOW_START && iso <= PICKUP_WINDOW_END

// แก้วันรับของ 1 สัปดาห์ (รับ ISO ของวันจันทร์) → คืนวันรับรางวัลที่ผ่านกฎแล้ว
function resolveWeek(mondayISO: string): string[] {
  const days = [0, 1, 2, 3, 4].map((i) => addDays(mondayISO, i)) // จ..ศ
  const [, tue, wed, thu] = days
  // ฐาน: อังคาร + พุธ (ถ้าพุธเป็นวันจับ → เริ่มที่พฤหัส)
  const baseIntents = [tue, isDrawWed(wed) ? thu : wed]
  const used: string[] = []
  for (const intent of baseIntents) {
    const start = days.indexOf(intent)
    for (let j = start; j < days.length; j++) {
      const d = days[j]
      if (!isBlocked(d) && !used.includes(d)) {
        used.push(d)
        break
      }
    }
  }
  return used.filter(inWindow)
}

// คำนวณวันรับรางวัลทั้งหมดในช่วงแคมเปญ (ครั้งเดียว)
export const ALL_PICKUP_DATES: string[] = (() => {
  const out: string[] = []
  // วันจันทร์ของสัปดาห์ที่มี PICKUP_WINDOW_START (14 ก.ค. = อังคาร → จันทร์ = 13)
  let monday = addDays(PICKUP_WINDOW_START, -(weekdayOf(PICKUP_WINDOW_START) - 1))
  const guard = addDays(PICKUP_WINDOW_END, 7)
  while (monday <= guard) {
    out.push(...resolveWeek(monday))
    monday = addDays(monday, 7)
  }
  return Array.from(new Set(out)).sort()
})()

const PICKUP_SET = new Set(ALL_PICKUP_DATES)

// เดือนที่มีวันรับรางวัล (YYYY-MM) เรียงลำดับ — ใช้ทำตัวเลือกเดือนในปฏิทิน
export const PICKUP_MONTHS: string[] = Array.from(new Set(ALL_PICKUP_DATES.map((d) => d.slice(0, 7))))

export type DayType = 'pickup' | 'holiday' | 'draw' | 'closed'

// จัดประเภทของวันหนึ่ง ๆ สำหรับ render ปฏิทิน
export function classifyDay(iso: string): { type: DayType; label?: string } {
  if (PICKUP_SET.has(iso)) return { type: 'pickup' }
  if (isHoliday(iso)) return { type: 'holiday', label: OFFICE_HOLIDAYS[iso] }
  if (isDrawWed(iso)) return { type: 'draw', label: 'ทีมจับรางวัล' }
  return { type: 'closed' }
}

// วันรับรางวัลของเดือนที่ระบุ (year, month 1-based) — ISO[]
export function getPickupDays(year: number, month: number): string[] {
  const prefix = `${year}-${pad(month)}`
  return ALL_PICKUP_DATES.filter((d) => d.startsWith(prefix))
}

// ── label helpers (ใช้ร่วมกันระหว่างปฏิทินกับหน้า claim) ──
const TH_MONTH_FULL = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const TH_WEEKDAY_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์']
export const TH_WEEKDAY_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

// "กรกฎาคม 2569" จาก 'YYYY-MM'
export function pickupMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${TH_MONTH_FULL[m]} ${y + 543}`
}

// วัน + ชื่อวันสั้น ของวันรับรางวัล (สำหรับชิปในตาราง)
export function pickupChip(iso: string): { day: number; wd: string; shifted: boolean } {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return { day: d, wd: TH_WEEKDAY_SHORT[dow], shifted: dow !== 2 && dow !== 3 } // เลื่อน = ไม่ใช่ อังคาร(2)/พุธ(3)
}

// "วันอังคารที่ 14 กรกฎาคม 2569"
export function pickupDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = new Date(y, m - 1, d).getDay()
  return `${TH_WEEKDAY_FULL[wd]}ที่ ${d} ${TH_MONTH_FULL[m]} ${y + 543}`
}

export function slotById(id: string): PickupSlot | undefined {
  return PICKUP_SLOTS.find((s) => s.id === id)
}
