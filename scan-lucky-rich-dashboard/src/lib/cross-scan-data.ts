/**
 * Cross-Scan Pairs — SKU ที่ลูกค้าคนเดียวกันสแกน "คู่กัน"
 * (co-occurrence: ต่างจาก cross-size ที่เป็นสินค้าเดียวกันคนละไซส์)
 *
 * ⚠️ MOCK DATA — ตัวเลขชุดนี้อิงภาพอ้างอิงแคมเปญ (ทั้งแคมเปญ) เพื่อให้หน้าตา
 * ตรงกับที่ทีมคาดหวัง ยังไม่ได้คำนวณจาก scan_log จริง
 *
 * TODO(api): แทนที่ด้วย GET /api/sku/co-scan?from=&to= ที่ group scan_log
 *   ตาม user_hash แล้วนับจำนวนคนที่สแกน SKU สองตัวนี้ทั้งคู่
 *   (ผ่าน data-source adapter เดิม src/lib/api/adapter.ts) — เปลี่ยนแค่ที่มา
 *   ของ CROSS_SCAN_PAIRS ส่วน component CrossScanPairsCard ไม่ต้องแก้
 */

export interface CrossScanPair {
  rank: number
  /** ชื่อไทยสินค้าตัวที่ 1 */
  productA: string
  /** ชื่อไทยสินค้าตัวที่ 2 */
  productB: string
  /** ไซส์ + รหัส เช่น "L3-8G × L4-8G (ซอง 8g)" */
  sizeLabel: string
  /** จำนวนลูกค้าที่สแกนทั้งคู่ */
  bothScanned: number
}

export const CROSS_SCAN_PAIRS: CrossScanPair[] = [
  { rank: 1,  productA: 'ดีดีครีมแตงโม',            productB: 'เซรั่มลำไย',             sizeLabel: 'L3-8G × L4-8G (ซอง 8g)',        bothScanned: 2916 },
  { rank: 2,  productA: 'ดีดีครีมแตงโม',            productB: 'เซรั่มแครอท',            sizeLabel: 'L3-8G × L6-8G (ซอง 8g)',        bothScanned: 2099 },
  { rank: 3,  productA: 'เซรั่มแครอท',              productB: 'เซรั่มลำไย',             sizeLabel: 'L6-8G × L4-8G (ซอง 8g)',        bothScanned: 1987 },
  { rank: 4,  productA: 'ดีดีครีมแตงโม',            productB: 'กันแดดแตงโม 3D ออร่า',    sizeLabel: 'L3-8G × L10-7G (ซอง 8g/7g)',    bothScanned: 1888 },
  { rank: 5,  productA: 'โดสส้มแดงกลูต้าซีไฮยา',     productB: 'ดีดีครีมแตงโม',          sizeLabel: 'L7-6G × L3-8G (ซอง 6g/8g)',     bothScanned: 1365 },
  { rank: 6,  productA: 'เซรั่มลำไย',               productB: 'กันแดดแตงโม 3D ออร่า',    sizeLabel: 'L4-8G × L10-7G',                bothScanned:  996 },
  { rank: 7,  productA: 'โดสส้มแดงกลูต้าซีไฮยา',     productB: 'เซรั่มแครอท',            sizeLabel: 'L7-6G × L6-8G',                 bothScanned:  903 },
  { rank: 8,  productA: 'เซรั่มแครอท',              productB: 'กันแดดแตงโม 3D ออร่า',    sizeLabel: 'L6-8G × L10-7G',                bothScanned:  898 },
  { rank: 9,  productA: 'ดีดีครีมแตงโม ซอง',         productB: 'ดีดีครีมแตงโม หลอด',      sizeLabel: 'L3-8G × L3-40G (ซอง 8g × หลอด 40g)', bothScanned: 845 },
  { rank: 10, productA: 'โดสส้มแดงกลูต้าซีไฮยา',     productB: 'เซรั่มลำไย',             sizeLabel: 'L7-6G × L4-8G',                 bothScanned:  841 },
]
