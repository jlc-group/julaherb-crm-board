// 7 รอบจับรางวัล "สแกนลุ้นรวย สวยลุ้นล้าน" (ไทยรัฐ x Jula's Herb)
// การจับจริง = ปริ้นสลิปกระดาษ → โยนจับด้วยมือ · หน้า Operation ใช้ "บันทึก" ผู้ที่จับได้
//
// ⚠️ มูลค่า (totalValue) คำนวณจากจำนวนรางวัล × มูลค่าทอง เสมอ — กันพิมพ์ผิด
//    (ตารางต้นทางพิมพ์รอบ 3,5 = 770,000 แต่จริง = 790,000 → รวมทั้งหมด 5,670,000 พอดี)
//    ตรวจ: 100K=30, 10K=167, 1M=1 → 198 รางวัล / 5,670,000 บาท (ตรง src/config/campaign.ts)

export type GoldTier = '1M' | '100K' | '10K'

interface GoldMeta {
  label: string // ป้ายเต็ม
  short: string // ป้ายสั้น
  value: number // มูลค่า (บาท)
}

export const GOLD: Record<GoldTier, GoldMeta> = {
  '1M': { label: 'ทองคำ 1,000,000', short: 'ทอง 1M', value: 1_000_000 },
  '100K': { label: 'ทองคำ 100,000', short: 'ทอง 100K', value: 100_000 },
  '10K': { label: 'ทองคำ 10,000', short: 'ทอง 10K', value: 10_000 },
}

// ลำดับการแสดง tier (ใหญ่ → เล็ก)
export const TIER_ORDER: GoldTier[] = ['1M', '100K', '10K']

export interface PrizeGroup {
  tier: GoldTier
  label: string
  short: string
  value: number
  count: number
}

export interface DrawRound {
  round: number // 1..7
  drawDate: string // ISO ค.ศ. (สำหรับเทียบ/เรียง) เช่น '2026-06-24'
  drawDateLabel: string // ไทย พ.ศ. เช่น '24 มิ.ย. 2569'
  windowFrom: string // ช่วงสิทธิ์ของรอบ (สำหรับดึงพูลค้นหา) — เริ่ม (รอบก่อนหน้า/วันเริ่มแคมเปญ)
  windowTo: string // = drawDate (สแกนถึงวันจับ)
  prizeMonthName: string // เดือนที่ออกรางวัลของรอบนี้ (10K=ผู้โชคดีรายวันเดือนนี้, 100K=รางวัลเดือนนี้) เช่น 'กรกฎาคม'
  prizeMonthShort: string // เดือนย่อ+ปี สำหรับสร้างวันที่รายวัน เช่น 'ก.ค. 2569' → 'ผู้โชคดีประจำวันที่ 1 ก.ค. 2569'
  prizeMonthISO: string // YYYY-MM ของเดือนที่ออกรางวัล เช่น '2026-07' (สำหรับสร้างวันที่ประกาศจริงเพื่อ gate หน้าสาธารณะ)
  prizes: PrizeGroup[]
  totalCount: number
  totalValue: number
}

const CAMPAIGN_START = '2026-05-16'

function mkRound(
  round: number,
  drawDate: string,
  drawDateLabel: string,
  windowFrom: string,
  prizeMonthName: string,
  prizeMonthShort: string,
  prizeMonthISO: string,
  counts: { tier: GoldTier; count: number }[],
): DrawRound {
  const prizes: PrizeGroup[] = counts.map((c) => ({
    tier: c.tier,
    label: GOLD[c.tier].label,
    short: GOLD[c.tier].short,
    value: GOLD[c.tier].value,
    count: c.count,
  }))
  return {
    round,
    drawDate,
    drawDateLabel,
    windowFrom,
    windowTo: drawDate,
    prizeMonthName,
    prizeMonthShort,
    prizeMonthISO,
    prizes,
    totalCount: prizes.reduce((s, p) => s + p.count, 0),
    totalValue: prizes.reduce((s, p) => s + p.count * p.value, 0),
  }
}

// หมายเหตุ: รอบจับ "ปลายเดือน" → ออกรางวัลของ "เดือนถัดไป" (10K = ผู้โชคดีรายวัน 1..N ของเดือนนั้น)
//   เช่น รอบ 1 จับ 24 มิ.ย. → ประกาศผู้โชคดีประจำวันที่ 1–30 ก.ค. · 100K = รางวัลรายเดือนของเดือนเดียวกัน
export const DRAW_ROUNDS: DrawRound[] = [
  mkRound(1, '2026-06-24', '24 มิ.ย. 2569', CAMPAIGN_START, 'กรกฎาคม', 'ก.ค. 2569', '2026-07', [{ tier: '100K', count: 5 }, { tier: '10K', count: 30 }]),
  mkRound(2, '2026-07-22', '22 ก.ค. 2569', '2026-06-24', 'สิงหาคม', 'ส.ค. 2569', '2026-08', [{ tier: '100K', count: 5 }, { tier: '10K', count: 30 }]),
  mkRound(3, '2026-08-26', '26 ส.ค. 2569', '2026-07-22', 'กันยายน', 'ก.ย. 2569', '2026-09', [{ tier: '100K', count: 5 }, { tier: '10K', count: 29 }]),
  mkRound(4, '2026-09-23', '23 ก.ย. 2569', '2026-08-26', 'ตุลาคม', 'ต.ค. 2569', '2026-10', [{ tier: '100K', count: 5 }, { tier: '10K', count: 30 }]),
  mkRound(5, '2026-10-21', '21 ต.ค. 2569', '2026-09-23', 'พฤศจิกายน', 'พ.ย. 2569', '2026-11', [{ tier: '100K', count: 5 }, { tier: '10K', count: 29 }]),
  mkRound(6, '2026-11-25', '25 พ.ย. 2569', '2026-10-21', 'ธันวาคม', 'ธ.ค. 2569', '2026-12', [{ tier: '10K', count: 19 }]),
  mkRound(7, '2026-12-18', '18 ธ.ค. 2569', '2026-11-25', 'ธันวาคม', 'ธ.ค. 2569', '2026-12', [{ tier: '1M', count: 1 }, { tier: '100K', count: 5 }]),
]

// ── ช่องรางวัล (slot) — 1 ช่อง = 1 รางวัล ที่รอเติมชื่อ ───────────────────────
export interface PrizeSlot {
  slotId: string // คีย์ถาวร เช่น 'r1-100K-1' (ใช้ผูกกับ record ผู้ชนะ)
  round: number
  tier: GoldTier
  tierLabel: string
  tierShort: string
  value: number
  indexInTier: number // ลำดับในกลุ่ม tier (1-based)
}

// แตกรอบเป็นช่องรางวัลทั้งหมด เรียงตาม TIER_ORDER (1M → 100K → 10K)
export function roundSlots(round: DrawRound): PrizeSlot[] {
  const slots: PrizeSlot[] = []
  for (const tier of TIER_ORDER) {
    const grp = round.prizes.find((p) => p.tier === tier)
    if (!grp) continue
    for (let i = 1; i <= grp.count; i++) {
      slots.push({
        slotId: `r${round.round}-${tier}-${i}`,
        round: round.round,
        tier,
        tierLabel: grp.label,
        tierShort: grp.short,
        value: grp.value,
        indexInTier: i,
      })
    }
  }
  return slots
}

export function getRound(roundNo: number): DrawRound | undefined {
  return DRAW_ROUNDS.find((r) => r.round === roundNo)
}

// ── ป้าย "ความหมาย" ของแต่ละช่องรางวัล (ตามแคมเปญ) ──────────────────────────────
//   10K  = ผู้โชคดีรายวัน  → 'ผู้โชคดีประจำวันที่ {วันที่} {เดือน}'  (วันที่ = indexInTier)
//   100K = รางวัลรายเดือน  → 'รางวัลประจำเดือน{เดือน}'
//   1M   = รางวัลใหญ่ท้ายแคมเปญ
export function prizeAnnounce(roundNo: number, tier: string, indexInTier: number): string {
  const r = getRound(roundNo)
  if (!r) return ''
  if (tier === '10K') return `ผู้โชคดีประจำวันที่ ${indexInTier} ${r.prizeMonthShort}`
  if (tier === '100K') return `รางวัลประจำเดือน${r.prizeMonthName}`
  if (tier === '1M') return 'รางวัลใหญ่ท้ายแคมเปญ'
  return ''
}

// แยก tier + ลำดับ จาก slotId ('r1-10K-3' → tier '10K', index 3) — ใช้ฝั่งที่มีแต่ slotId (claims/verify)
export function slotParts(slotId: string): { tier: string; index: number } {
  const p = slotId.split('-')
  return { tier: p[1] ?? '', index: parseInt(p[2] ?? '0', 10) || 0 }
}

export function prizeAnnounceBySlot(roundNo: number, slotId: string): string {
  const { tier, index } = slotParts(slotId)
  return prizeAnnounce(roundNo, tier, index)
}

// ── วันที่ "ประกาศจริง" (ISO 'YYYY-MM-DD') ของช่องรางวัล — ใช้ gate หน้าประกาศผลสาธารณะ ─────
//   10K  = วันที่ {index} ของเดือนออกรางวัล (เช่น r1-10K-1 → 2026-07-01)
//   100K = วันสุดท้ายของเดือนออกรางวัล (ประกาศรายเดือนปลายเดือน)
//   1M   = วันจับรอบสุดท้าย (drawDate)
export function winnerAnnounceISO(roundNo: number, tier: string, indexInTier: number): string {
  const r = getRound(roundNo)
  if (!r) return ''
  if (tier === '10K') return `${r.prizeMonthISO}-${String(indexInTier).padStart(2, '0')}`
  if (tier === '100K') {
    const [y, m] = r.prizeMonthISO.split('-').map(Number)
    const last = new Date(y, m, 0).getDate() // วันสุดท้ายของเดือน (m แบบ 1-based → Date(y,m,0) = ปลายเดือนนั้น)
    return `${r.prizeMonthISO}-${String(last).padStart(2, '0')}`
  }
  if (tier === '1M') return r.drawDate
  return ''
}

export function winnerAnnounceISOBySlot(roundNo: number, slotId: string): string {
  const { tier, index } = slotParts(slotId)
  return winnerAnnounceISO(roundNo, tier, index)
}

// สรุปทั้งแคมเปญ (ตรวจความถูกต้อง)
export const DRAW_TOTAL_PRIZES = DRAW_ROUNDS.reduce((s, r) => s + r.totalCount, 0) // = 198
export const DRAW_TOTAL_VALUE = DRAW_ROUNDS.reduce((s, r) => s + r.totalValue, 0) // = 5,670,000

// ── ผู้ได้รางวัล 1 คน/1 ช่อง (เก็บใน data/draw-winners.json ผ่าน /api/draw/winners) ──
export interface DrawWinner {
  round: number
  slotId: string
  tier: string
  prizeLabel: string
  name: string
  phone: string // raw — mask ตอนแสดง (ยกเว้นหน้า Operations โชว์เต็มเพื่อทีมโทร/ส่งรางวัล)
  scanCode?: string
  productSku?: string // SKU ของสินค้าที่สแกนใบที่จับได้ (เก็บตอนเลือกจากพูล)
  productName?: string // ชื่อสินค้าที่สแกนใบที่จับได้ — ให้ลูกค้าเตรียมเอามาแสดง
  address?: string // ที่อยู่ลูกค้า — กรอกเอง/auto-fill เมื่อ backend เปิด endpoint
  province?: string // จังหวัด — fallback โชว์เมื่อยังไม่มีที่อยู่เต็ม (รู้ว่าลูกค้ายังไม่กรอกที่อยู่)
  rightsCount?: number // จำนวนสิทธิ์ที่ส่งเข้าลุ้น (เก็บตอนเลือกจากพูล)
  userId?: string
  assignedAt: string
}

// ── เอกสารรับรางวัล 1 record/คน (key = เบอร์ 9 หลักท้าย) เก็บใน data/draw-claims.json ──
export type ClaimStatus = 'submitted' | 'approved' | 'rejected' | 'handed_over'
export interface DrawClaim {
  phoneLast9: string
  phone: string
  name: string
  rounds: number[] // รอบที่ได้รางวัล
  prizes: string[] // ป้ายรางวัลที่ได้
  hasProxy: boolean // มีคนมารับแทน
  files: { idCard?: string; poa?: string; proxyIdCard?: string } // ชื่อไฟล์ใน data/claims/{phoneLast9}/
  submittedAt?: string
  status: ClaimStatus
  reviewedAt?: string
  reviewNote?: string
}

// ── นัดหมายเข้ารับรางวัลหน้างาน (key = เบอร์ 9 หลักท้าย) เก็บใน data/draw-appointments.json ──
//   booked = จองแล้วรอเข้ารับ · done = ส่งเอกสาร+รับของเรียบร้อย · no_show = ไม่มาตามนัด
export type AppointmentStatus = 'booked' | 'done' | 'no_show'
export interface DrawAppointment {
  phoneLast9: string
  phone: string
  name: string
  date: string // วันนัด YYYY-MM-DD (อ้างอิงวันเปิดรับใน config/pickup)
  slotId: 'morning' | 'afternoon'
  pickupMode?: 'self' | 'proxy' // วิธีรับ — รับด้วยตนเอง / มอบอำนาจ
  prizes: string[] // ป้ายรางวัลที่ได้
  rounds: number[]
  status: AppointmentStatus
  bookedAt?: string
  updatedAt?: string
}
