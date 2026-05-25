'use client'
/**
 * 🖨️ PrintListTab — รายชื่อสำหรับปริ้นลงสลิป (4 คอลัมน์ A4)
 *
 * Data flow (เมื่อต่อ DB จริง):
 *   GET /api/v1/scan-history?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=10000
 *   หรือ direct SQL: SELECT u.display_name, u.phone, sh.id, p.display_name AS product, p.size
 *                    FROM scan_history sh JOIN users u JOIN products p
 *                    WHERE sh.scan_type='success' AND sh.scanned_at BETWEEN $1 AND $2
 *
 * ตอนนี้ใช้ mock generator จาก DAILY_ENTRIES + PRODUCTS_MASTER เพื่อ preview layout
 * Phone: แสดง mask — เปิดเฉพาะ 3 ตัวท้าย (xxx-xxx-x789) เพื่อความเป็นส่วนตัวบนสลิป
 */
import { useMemo, useState } from 'react'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { PRODUCTS_MASTER } from '@/config/products-real'
import { numFmt } from '@/lib/utils'
import TabHeader from '@/components/ui/TabHeader'
import UnifiedDateRange, { defaultRange, type DateRangeV2 } from '@/components/ui/UnifiedDateRange'

interface ScanSlip {
  id: string          // 8-char scan code (uppercase hex-ish)
  name: string        // ชื่อ-นามสกุล
  phone: string       // เบอร์โทร 10 หลัก (raw — จะ mask ตอน render)
  productName: string // ชื่อภาษาไทย (ไม่มี SKU)
  sku: string         // รหัสสินค้า เช่น "L4-40G"
  scannedAt: string   // YYYY-MM-DD
}

/** Mask phone: เหลือ 3 ตัวท้าย — "092-841-2014" → "xxx-xxx-x014" */
function maskPhone(phone: string): string {
  const digits = phone.replace(/-/g, '')              // "0928412014"
  const visible = digits.slice(-3)                    // "014"
  const hidden = digits.slice(0, -3).replace(/\d/g, 'x') // "xxxxxxx"
  const all = hidden + visible                        // "xxxxxxx014"
  return `${all.slice(0, 3)}-${all.slice(3, 6)}-${all.slice(6)}` // "xxx-xxx-x014"
}

// ─── Mock generator ────────────────────────────────────────────────────────
const FIRST_NAMES = ['สมชาย', 'มาลี', 'วิภา', 'ปรีชา', 'รัตนา', 'อนุชา', 'สุดา', 'ธนวัฒน์', 'นภา', 'กิตติพงษ์', 'ปิยะ', 'จิราพร', 'อรทัย', 'ภาณุพงศ์', 'เพ็ญพิชชา', 'ชลธิชา', 'ธีรพล', 'พรทิพย์', 'ศักดิ์ดา', 'มณีรัตน์']
const LAST_NAMES  = ['ศรีสุข', 'ใจดี', 'พงษ์ไพร', 'ทองคำ', 'แก้วใส', 'อ่อนหวาน', 'มั่นคง', 'รักไทย', 'ก้าวหน้า', 'พิทักษ์', 'ขจรกิตติ', 'รุ่งโรจน์', 'นาคา', 'วงศ์งาม', 'เจริญสุข', 'สุวรรณ', 'บุญมา', 'ไชยศรี', 'พรหมเทพ', 'รัตนกุล']

function rand(seed: number): number {
  // Mulberry32 PRNG for stable output per seed
  let t = seed + 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
function pick<T>(arr: T[], seed: number): T { return arr[Math.floor(rand(seed) * arr.length)] }
function thaiPhone(seed: number): string {
  const prefixes = ['081', '082', '083', '084', '085', '086', '087', '088', '089', '090', '091', '092', '093', '094', '095', '096', '097', '098', '099']
  const p = pick(prefixes, seed)
  const mid = String(Math.floor(rand(seed + 1) * 900 + 100))
  const end = String(Math.floor(rand(seed + 2) * 9000 + 1000))
  return `${p}-${mid}-${end}`
}
function scanCode(seed: number): string {
  const chars = '0123456789ABCDEF'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(rand(seed + i) * 16)]
  return out
}

function generateSlips(from: string, to: string): ScanSlip[] {
  const slips: ScanSlip[] = []
  let seed = 1000
  for (const day of DAILY_ENTRIES) {
    if (day.date < from || day.date > to) continue
    // Generate ~20 sample slips per day (reduced from real count for browser perf)
    const sampleCount = Math.min(day.success, 25)
    for (let i = 0; i < sampleCount; i++) {
      seed += 7
      const product = PRODUCTS_MASTER[Math.floor(rand(seed) * PRODUCTS_MASTER.length)]
      // strip "(SKU)" suffix AND size suffix like " 8 กรัม", " 70 มล.", " 200 มล."
      const shortName = product.displayName
        .replace(/\s*\([^)]+\)$/, '')                 // remove "(L4-8G)"
        .replace(/\s+\d+(\.\d+)?\s*(กรัม|ก\.|มล\.|มล|ml|g)\s*$/i, '')  // remove " 8 กรัม"
        .trim()
      slips.push({
        id: scanCode(seed),
        name: `${pick(FIRST_NAMES, seed + 100)} ${pick(LAST_NAMES, seed + 200)}`,
        phone: thaiPhone(seed + 300),
        productName: shortName,
        sku: product.sku,
        scannedAt: day.date,
      })
    }
  }
  return slips
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function PrintListTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: new Date('2026-05-24') }))
  const { from, to } = range

  const slips = useMemo(() => generateSlips(from, to), [from, to])

  // ── สรุปช่วงวันที่จาก DAILY_ENTRIES (ข้อมูลจริง ไม่ใช่ mock slips) ──
  const rangeSummary = useMemo(() => {
    const days = DAILY_ENTRIES.filter(d => d.date >= from && d.date <= to)
    const totalScans   = days.reduce((s, d) => s + d.success, 0)
    const totalRights  = days.reduce((s, d) => s + (d.expectedTickets ?? d.tickets), 0)
    const totalUsers   = days.reduce((s, d) => s + d.uniqueUsers, 0)   // unique ต่อวัน (อาจซ้ำข้ามวัน)
    return { totalScans, totalRights, totalUsers, days: days.length }
  }, [from, to])

  const COLS = 4
  const ROWS_PER_PAGE = 14  // 14 rows × 4 cols = 56 slips per A4 (card ~19mm — 5 บรรทัด)
  const PAGES = Math.ceil(slips.length / (COLS * ROWS_PER_PAGE))

  return (
    <div className="space-y-4">
      {/* ── STICKY HEADER (Title + Date range — เลื่อนตามคอนเทนต์) ── */}
      <div
        className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3 print:hidden"
        style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}
      >
        <TabHeader
          icon="🖨️"
          title="Print List"
          subtitle="พิมพ์รายชื่อสำหรับจับฉลาก • Grid 4 คอลัมน์ A4"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[400px]">
            <UnifiedDateRange value={range} onChange={setRange} today={new Date('2026-05-24')} />
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md text-white font-semibold text-[13px] hover:opacity-90 transition whitespace-nowrap"
            style={{ background: 'var(--brand-700, #14532d)' }}
          >
            <i className="ti ti-printer mr-1.5" />
            ปริ้น ({slips.length} รายการ · {PAGES} หน้า)
          </button>
        </div>
      </div>

      <div className="print:hidden">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold">
            📅 {from} → {to} ({rangeSummary.days} วัน)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            🧾 สแกนสำเร็จ {numFmt(rangeSummary.totalScans)} ครั้ง
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold">
            🎟️ สิทธิ์ทั้งหมด {numFmt(rangeSummary.totalRights)} สิทธิ์
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold">
            👤 User ที่สแกน ~{numFmt(rangeSummary.totalUsers)} คน
            <span className="opacity-60 font-normal ml-1">(รวมทุกวัน อาจซ้ำข้ามวัน)</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            📄 {PAGES} หน้า A4 ({COLS * ROWS_PER_PAGE} ใบ/หน้า)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-800 font-semibold">
            ⚠ สลิปเป็น mock — wire DB เมื่อ <code className="font-mono">/api/v1/scan-history</code> พร้อม
          </span>
        </div>

        {/* Preview note */}
        <div className="mt-2 text-[11px] text-[var(--text-muted)] italic">
          💡 preview แบบ on-screen — กดปริ้นเพื่อดู A4 layout จริง (4 columns · gap 2.5mm) · เบอร์โทรจะแสดง mask xxx-xxx-x789 บนสลิป
        </div>
      </div>

      {/* ─── Print area (visible both on screen + on paper) ─── */}
      <div className="print-area">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gap: '2.5mm',
          }}
        >
          {slips.map((s, i) => (
            <div
              key={`${s.id}-${i}`}
              className="slip-card"
              style={{
                border: '1px solid #94a3b8',
                padding: '2mm 3mm',
                textAlign: 'center',
                lineHeight: 1.2,
                background: 'white',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2mm', // ใช้ gap เดียวกันทุกบรรทัด — ทุกการ์ดเป็นระเบียบเท่ากัน
                overflow: 'hidden',
                fontFamily: "'Sarabun', sans-serif",
                fontSize: '13px',
                color: '#000000',
                fontWeight: 400,
              }}
            >
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.name}
              </div>
              <div>
                {s.id}
              </div>
              {/* บรรทัด 3: ชื่อสินค้าภาษาไทย (เผื่อ 2 บรรทัด — การ์ดสูงเท่ากันเสมอ) */}
              <div
                style={{
                  wordBreak: 'break-word',
                  minHeight: '2.4em',
                }}
                title={s.productName}
              >
                {s.productName}
              </div>
              {/* บรรทัด 4: รหัส SKU */}
              <div>
                ({s.sku})
              </div>
              <div>
                {maskPhone(s.phone)}
              </div>
            </div>
          ))}
        </div>

        {slips.length === 0 && (
          <div className="text-center py-20 text-[var(--text-muted)] text-[14px]">
            ไม่มีข้อมูลในช่วงวันที่เลือก
          </div>
        )}
      </div>
    </div>
  )
}
