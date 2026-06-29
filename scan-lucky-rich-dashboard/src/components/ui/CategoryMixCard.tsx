'use client'
// 🗂️ Category Mix — สัดส่วนสิทธิ์ตามหมวดสินค้า (Serum/Sunscreen/Cleanser...) · กลุ่ม B
// หมวดมาจาก product-images.ts (แมพ SKU→หมวดตามคลังสินค้า)
import { productCategory } from '@/config/product-images'
import { numFmt } from '@/lib/utils'
import InsightInline from '@/components/ui/InsightInline'
import type { SkuRow } from '@/lib/sku-redemption'

const COLORS = ['#1D9E75', '#EF9F27', '#085041', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6', '#f59e0b', '#6366f1', '#94a3b8']

export default function CategoryMixCard({ rows }: { rows: SkuRow[] }) {
  const agg = new Map<string, { rights: number; skus: number }>()
  let total = 0
  for (const r of rows) {
    if (r.rightsRedeemed <= 0) continue
    const cat = productCategory(r.sku) ?? 'อื่นๆ'
    const cur = agg.get(cat) ?? { rights: 0, skus: 0 }
    cur.rights += r.rightsRedeemed
    cur.skus += 1
    agg.set(cat, cur)
    total += r.rightsRedeemed
  }
  const cats = Array.from(agg.entries())
    .map(([name, v]) => ({ name, rights: v.rights, skus: v.skus, pct: total > 0 ? (v.rights / total) * 100 : 0 }))
    .sort((a, b) => b.rights - a.rights)

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-category text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">🗂️ Category Mix — สัดส่วนสิทธิ์ตามหมวด</h3>
      </div>

      {/* แถบสัดส่วนแนวนอน */}
      <div className="flex w-full h-8 rounded-lg overflow-hidden border border-[var(--border)] mb-4">
        {cats.map((c, i) => (
          <div key={c.name}
               className="flex items-center justify-center text-[10px] font-bold text-white transition-all hover:opacity-90"
               style={{ background: COLORS[i % COLORS.length], width: `${c.pct}%` }}
               title={`${c.name}: ${numFmt(c.rights)} สิทธิ์ (${c.pct.toFixed(1)}%)`}>
            {c.pct >= 9 && `${c.pct.toFixed(0)}%`}
          </div>
        ))}
      </div>

      {/* รายการต่อหมวด */}
      <div className="space-y-1.5">
        {cats.map((c, i) => (
          <div key={c.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-soft)] transition">
            <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-[var(--dark)] truncate">{c.name}</div>
              <div className="text-[10.5px] text-[var(--text-muted)]">{c.skus} SKUs</div>
            </div>
            <div className="text-right">
              <div className="text-[15px] font-bold num text-[var(--brand-700)]">{numFmt(c.rights)}</div>
              <div className="text-[10.5px] text-[var(--text-muted)]">{c.pct.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>

      {cats[0] && (
        <InsightInline html={`หมวด <b>${cats[0].name}</b> นำสุด <b>${cats[0].pct.toFixed(0)}%</b> ของสิทธิ์ทั้งหมด — โฟกัส stock/โปรหมวดนี้`} />
      )}
    </div>
  )
}
