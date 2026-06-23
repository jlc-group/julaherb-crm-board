import type { DrawWinner } from '@/config/draw-rounds'

// ลูกค้า 1 คนในพูลค้นหา (dedup จาก print-slips ของรอบ) — มาจาก /api/draw/pool
export interface PoolCustomer {
  name: string
  phone: string // raw
  codes: string[] // รหัสสแกนของคนนี้ (สำหรับค้นด้วยรหัส)
  rights?: number // จำนวนสิทธิ์ที่ส่งเข้าลุ้น (= จำนวน slip ของเบอร์นี้ในรอบ)
  products?: Record<string, { name: string; sku: string }> // รหัสสแกน → สินค้า (ให้ WinnerPicker จับสินค้าของใบที่จับได้)
  address?: string // ที่อยู่ (ถ้าพูลคืนมา) — ปกติดึงเพิ่มจาก /customers/search ตอนเลือก
}

// เบอร์ 9 หลักท้าย — ใช้เป็นคีย์เทียบคน (กัน 0 นำหาย / ชื่อซ้ำ)
export function phoneLast9(p: string): string {
  const d = (p || '').replace(/\D/g, '')
  return d.length >= 9 ? d.slice(-9) : d
}

// เคยได้รางวัลในรอบก่อน ๆ (round น้อยกว่ารอบปัจจุบัน) — สำหรับขึ้น note
export function findPrevWins(winners: DrawWinner[], phone: string, currentRound: number): DrawWinner[] {
  const k = phoneLast9(phone)
  if (!k) return []
  return winners.filter((w) => w.round < currentRound && phoneLast9(w.phone) === k)
}

// เบอร์นี้ได้รางวัลในรอบเดียวกันแล้วไหม (คนละช่อง) — กันซ้ำในรอบ
export function findSameRoundWin(
  winners: DrawWinner[],
  phone: string,
  round: number,
  exceptSlot?: string,
): DrawWinner | undefined {
  const k = phoneLast9(phone)
  if (!k) return undefined
  return winners.find((w) => w.round === round && w.slotId !== exceptSlot && phoneLast9(w.phone) === k)
}
