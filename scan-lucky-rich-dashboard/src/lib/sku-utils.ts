// Client-side SKU helpers — mirror server normalizeSku() + derive size tier from gram weight.
// (api-source.ts มี normalizeSku ฝั่ง server แต่ import ข้ามมา client ไม่ได้ → ทำ mirror เบาๆ ที่นี่)

const KEEP_PREFIX = new Set(['BOX', 'SET']) // กล่อง/เซ็ต — เก็บแยก (ดู sku-prefix-normalize)

/** ตัด prefix ช่องทาง (SCH-/TUB-/JAR-...) → base code · เว้น BOX-/SET- */
export function baseSku(sku: string): string {
  const m = /^([A-Z]{3})-(.+)$/.exec(sku)
  return m && !KEEP_PREFIX.has(m[1]) ? m[2] : sku
}

export type SizeTier = 'sachet' | 'tube'

/** กรัมจากท้ายรหัส เช่น L3-8G → 8, JHA1-40G → 40 */
export function skuGram(sku: string): number {
  const m = /(\d+)\s*G$/i.exec(baseSku(sku))
  return m ? parseInt(m[1], 10) : 0
}

/** ไซส์: ≥25G = หลอด (ใหญ่) · <25G = ซอง (เล็ก) — สินค้าที่สแกนจริงมีแค่ 2 แบบนี้ */
export function skuSize(sku: string): SizeTier {
  return skuGram(sku) >= 25 ? 'tube' : 'sachet'
}

export const SIZE_LABEL: Record<SizeTier, string> = {
  sachet: 'ซอง (เล็ก)',
  tube: 'หลอด (ใหญ่)',
}
export const SIZE_COLOR: Record<SizeTier, string> = {
  sachet: '#6366f1',
  tube: '#10b981',
}
