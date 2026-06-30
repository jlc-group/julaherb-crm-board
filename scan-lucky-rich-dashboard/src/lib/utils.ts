export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return 'xxx-xxx-xxxx'
  return 'xxx-xxx-' + phone.slice(-4)
}

/**
 * Mask แบบสลิปจับฉลาก — โชว์ 6 ตัวหน้า ปิด 4 ตัวท้าย
 *   "0811234567" → "081-123-xxxx"
 * (ตาม spec หน้า Print List — ต่างจาก maskPhone() ที่โชว์ 4 ตัวท้าย)
 */
export function maskPhone6(phone: string): string {
  const d = (phone || '').replace(/\D/g, '')
  if (d.length < 6) return 'xxx-xxx-xxxx'
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-xxxx`
}

/**
 * Mask หน้าประกาศผลผู้โชคดี — โชว์ 3 ตัวหน้า ปิด 7 ตัวท้าย
 *   "0967491234" → "096 xxxxxxx"
 */
export function maskPhone3(phone: string): string {
  const d = (phone || '').replace(/\D/g, '')
  if (d.length < 3) return 'xxx xxxxxxx'
  return `${d.slice(0, 3)} xxxxxxx`
}

/**
 * ตัดชื่อสินค้าให้เหลือชื่อหน้า (สำหรับสลิป)
 *   "กันแดดทานตะวันทาตัว 100 กรัม (L21-100G)" → "กันแดดทานตะวันทาตัว"
 *   "X - หลอด (Y)" → "X"
 */
export function stripProductSuffix(displayName: string): string {
  return (displayName || '')
    .replace(/\s*\([^)]*\)\s*$/, '')                                 // ลบ " (L21-100G)"
    .replace(/\s+\d+(\.\d+)?\s*(กรัม|ก\.|มล\.|มล|ml|g)\s*$/i, '')     // ลบ " 100 กรัม"
    .split(' - ')[0]                                                  // "X - หลอด" → "X"
    .trim()
}

export function numFmt(n: number): string {
  return n.toLocaleString('th-TH')
}

export function statusColor(s: string): string {
  return s === 'confirmed' ? '#1D9E75' : s === 'pending' ? '#EF9F27' : s === 'forfeited' ? '#e74c3c' : '#888'
}

export function statusLabel(s: string): string {
  return s === 'confirmed' ? 'ยืนยันแล้ว' : s === 'pending' ? 'รอยืนยัน' : s === 'forfeited' ? 'สละสิทธิ์' : 'ยังไม่ประกาศ'
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ─── Campaign date helpers ───
// Campaign period: 16 พ.ค. – 18 ธ.ค. 2569 (Buddhist Era) = 16 May – 18 Dec 2026
export const CAMPAIGN_START = '2026-05-16'
export const CAMPAIGN_END = '2026-12-18'

/**
 * Today clamped to campaign window.
 * - ก่อน campaign start → return CAMPAIGN_START
 * - หลัง campaign end → return CAMPAIGN_END
 * - ระหว่าง campaign → return today จริง
 *
 * ใช้แทน `new Date('2026-05-24')` ที่ hardcoded ทุก tab — ทำให้ data ติดตามวันจริง
 */
export function getCampaignToday(): Date {
  const now = new Date()
  const start = new Date(CAMPAIGN_START)
  const end = new Date(CAMPAIGN_END)
  if (now < start) return start
  if (now > end) return end
  return now
}
