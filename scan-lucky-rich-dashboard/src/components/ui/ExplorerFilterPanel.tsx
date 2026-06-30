'use client'
// 🎛️ Explorer Filter Panel — ตัวกรองรวม (controlled by ExplorerTab)
// ✅ ใช้ได้จริง: ไซส์ (ซอง/หลอด) + SKU multi-pick  ·  🔒 รอ backend: อายุ/เพศ/จังหวัด/เซกเมนต์
import { useMemo, useState } from 'react'
import { numFmt } from '@/lib/utils'
import { SIZE_LABEL, type SizeTier } from '@/lib/sku-utils'

export interface SkuCatalogItem { sku: string; name: string; gram: number; size: SizeTier; totalScans: number }

interface Props {
  catalog: SkuCatalogItem[]
  selectedSkus: string[]
  onChangeSkus: (skus: string[]) => void
  sizeFilter: SizeTier | 'all'
  onChangeSize: (s: SizeTier | 'all') => void
}

// 🔒 ฟิลเตอร์ที่ยังไม่มีข้อมูล — ปุ่มเห็นแต่กดไม่ได้ (รอ backend เปิด /dashboard/explore)
const LOCKED = [
  { icon: '🎂', label: 'อายุ 18-25…', why: 'dob มีใน DB แต่ API ยังไม่ส่ง age' },
  { icon: '🚻', label: 'เพศ', why: 'DB ยังไม่มี field gender — ต้องเริ่มเก็บ' },
  { icon: '📍', label: 'จังหวัด', why: 'มีแค่ top-N snapshot รายวัน · ยังกรองรายคนไม่ได้' },
  { icon: '🧩', label: 'เซกเมนต์/RFM', why: 'มี list แต่ยังกรองลูกค้าตามเซกเมนต์ไม่ได้' },
]

export default function ExplorerFilterPanel({ catalog, selectedSkus, onChangeSkus, sizeFilter, onChangeSize }: Props) {
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  const sizeOptions: { key: SizeTier | 'all'; label: string }[] = [
    { key: 'all', label: 'ทุกไซส์' },
    { key: 'sachet', label: SIZE_LABEL.sachet },
    { key: 'tube', label: SIZE_LABEL.tube },
  ]

  // grid ใน picker — กรองตามไซส์ที่เลือก + คำค้น, เรียงตามยอดสแกน
  const filteredForPicker = useMemo(() => {
    const q = search.trim().toLowerCase()
    return catalog
      .filter((s) => (sizeFilter === 'all' ? true : s.size === sizeFilter))
      .filter((s) => (!q ? true : s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)))
  }, [catalog, search, sizeFilter])

  function toggleSku(sku: string) {
    onChangeSkus(selectedSkus.includes(sku) ? selectedSkus.filter((s) => s !== sku) : [...selectedSkus, sku].slice(0, 8))
  }

  return (
    <div className="card p-3.5 space-y-3" style={{ borderLeft: '4px solid var(--brand-500)' }}>
      {/* แถวที่ 1: ไซส์ + ปุ่ม locked */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">ไซส์</span>
        <div className="inline-flex bg-[var(--bg-soft)] rounded-lg p-1 border border-[var(--border)]">
          {sizeOptions.map((o) => (
            <button key={o.key} onClick={() => onChangeSize(o.key)}
              className={`px-3 py-1 text-[11.5px] font-semibold rounded-md transition-all ${
                sizeFilter === o.key ? 'bg-[var(--brand-500)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-white'
              }`}>
              {o.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">🔒 รอ backend</span>
        {LOCKED.map((l) => (
          <span key={l.label}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
            title={`รอ backend — ${l.why}\n(ดู docs/explorer-api-spec.md)`}>
            <span className="opacity-60">{l.icon}</span>{l.label}
            <i className="ti ti-lock text-[9px]" />
          </span>
        ))}
      </div>

      {/* แถวที่ 2: SKU multi-pick (chips + เพิ่ม) */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">SKU</span>
        {selectedSkus.length === 0 && (
          <span className="text-[11px] text-[var(--text-muted)] italic">ทั้งหมดในไซส์ที่เลือก (ยังไม่เจาะ SKU)</span>
        )}
        {selectedSkus.map((sku) => {
          const info = catalog.find((c) => c.sku === sku)
          return (
            <button key={sku} onClick={() => toggleSku(sku)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)]"
              title={`คลิกเพื่อลบ • ${info?.name || sku}`}>
              <span className="font-mono">{sku}</span><span className="text-[9px] opacity-60">×</span>
            </button>
          )
        })}
        <button onClick={() => setShowPicker(!showPicker)}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand-500)] hover:text-[var(--brand-700)]">
          <i className="ti ti-plus text-[10px] mr-0.5" /> เพิ่ม SKU
        </button>
        {selectedSkus.length > 0 && (
          <button onClick={() => onChangeSkus([])} className="text-[10px] text-[var(--danger)] font-semibold px-2 py-1 hover:bg-red-50 rounded">ล้าง</button>
        )}
      </div>

      {/* picker dropdown */}
      {showPicker && (
        <div className="p-3 bg-[var(--bg-soft)] rounded-lg border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <i className="ti ti-search text-[var(--text-muted)]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา SKU / ชื่อสินค้า…"
              className="flex-1 px-2 py-1 text-[11.5px] border border-[var(--border)] rounded bg-white focus:outline-none focus:border-[var(--brand-500)]" />
            <button onClick={() => setShowPicker(false)} className="text-[10px] text-[var(--text-muted)] font-semibold px-2 py-1 hover:bg-white rounded">✕ ปิด</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
            {filteredForPicker.slice(0, 60).map((s) => {
              const active = selectedSkus.includes(s.sku)
              return (
                <button key={s.sku} onClick={() => toggleSku(s.sku)}
                  className={`text-left text-[10.5px] px-2 py-1.5 rounded border transition-all ${
                    active ? 'bg-[var(--brand-50)] border-[var(--brand-500)] text-[var(--brand-700)] font-semibold' : 'bg-white border-[var(--border)] text-[var(--text)] hover:border-[var(--brand-200)]'
                  }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono">{s.sku}</span>
                    {active ? <i className="ti ti-check text-[var(--brand-700)]" /> : <span className="text-[8px] text-[var(--text-muted)]">{s.gram}G</span>}
                  </div>
                  <div className="truncate text-[9px] text-[var(--text-muted)] mt-0.5">{s.name}</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">รวม {numFmt(s.totalScans)} สแกน</div>
                </button>
              )
            })}
            {filteredForPicker.length === 0 && <div className="col-span-full text-center text-[11px] text-[var(--text-muted)] py-4">ไม่พบ SKU</div>}
          </div>
        </div>
      )}
    </div>
  )
}
