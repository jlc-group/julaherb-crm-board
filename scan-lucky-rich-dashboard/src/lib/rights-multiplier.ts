// ════════════════════════════════════════════════════════════════
// 🎟️ สิทธิ์ต่อ scan (rights multiplier) — สำหรับคำนวณ "สิทธิ์ตามสเปก"
// ════════════════════════════════════════════════════════════════
//
// ที่มาของ "สิทธิ์ต่อสินค้า":
//   saversureV2 lucky_draw_campaigns.max_tickets_per_user (ผูก 1 ตัวต่อ V1 product)
//   → mirror อยู่ใน PRODUCTS_MASTER.rightsPerScan (ค่า 1-11 ตรงกัน)
//
// ปัญหา: saversureV2 ไม่ส่ง "จำนวนสแกนต่อ SKU รายวัน" แบบ live
//   (/dashboard/top-products เสีย, campaign-report ไม่มี section_16)
//   → คำนวณ per-SKU รายวันเป๊ะไม่ได้
//
// วิธีชั่วคราว (blended): ใช้ค่าเฉลี่ยสิทธิ์ต่อ scan จาก SKU mix จริง
//   M = Σ(scans_per_sku × rightsPerScan_sku) / Σ(scans_per_sku)
//   แล้ว  สิทธิ์ตามสเปก(วัน) ≈ สแกนสำเร็จ(วัน) × M
//
// 🔄 อนาคต: เมื่อ saversureV2 เพิ่ม ticket_per_scan + per-SKU daily
//   → เลิกใช้ค่า blended นี้ ดึง per-SKU จริงมาคูณแทน
// ════════════════════════════════════════════════════════════════

import { PRODUCTS_MASTER } from '@/config/products-real'
import LIVE from '@/lib/live-data.json'

/** ดึงรหัส SKU จากชื่อที่มีวงเล็บท้าย เช่น "ดีดีครีมแตงโม (L3-8G)" → "L3-8G" */
function extractSkuCode(raw: string): string {
  const groups = String(raw).match(/\(([^()]+)\)/g)
  if (groups && groups.length) return groups[groups.length - 1].slice(1, -1).trim()
  return String(raw).trim()
}

function computeBlendedMultiplier(): number {
  const rights = new Map(PRODUCTS_MASTER.map((p) => [p.sku, p.rightsPerScan]))
  const cum = ((LIVE as any)?.snapshot?.cumulativeSkus ?? []) as Array<{ sku: string; scans: number }>

  let totalScans = 0
  let totalSpec = 0
  for (const s of cum) {
    const code = extractSkuCode(s.sku)
    const rp = rights.get(code)
    if (rp == null) continue // SKU ที่ไม่อยู่ใน master → ข้าม
    totalScans += s.scans
    totalSpec += s.scans * rp
  }
  return totalScans > 0 ? totalSpec / totalScans : 1
}

/**
 * ค่าเฉลี่ยสิทธิ์ต่อ scan (blended) จาก SKU mix จริง ≈ 1.36
 * ใช้ประมาณ "สิทธิ์ตามสเปก" = สแกนสำเร็จ × ค่านี้
 */
export const CAMPAIGN_RIGHTS_MULTIPLIER = computeBlendedMultiplier()

/** แปลงยอดสแกนสำเร็จ → สิทธิ์ตามสเปก (ปัดเป็นจำนวนเต็ม) */
export function scansToSpecRights(success: number): number {
  return Math.round(success * CAMPAIGN_RIGHTS_MULTIPLIER)
}
