'use client'
// 🖼️ Top SKU พร้อมรูปสินค้า (สไลด์ 10) — แมพ SKU → รูปจาก public/products
import { productImage, productCategory } from '@/config/product-images'
import { numFmt } from '@/lib/utils'
import type { SkuRow } from '@/lib/sku-redemption'

export default function ProductImageGrid({ rows, rangeLabel, topN = 12 }: {
  rows: SkuRow[]
  rangeLabel?: string
  topN?: number
}) {
  const top = [...rows]
    .filter((r) => r.rightsRedeemed > 0)
    .sort((a, b) => b.rightsRedeemed - a.rightsRedeemed)
    .slice(0, topN)

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-photo text-base text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">🏆 Top {top.length} สินค้า — พร้อมรูป</h3>
        {rangeLabel && <span className="ml-auto text-[10px] text-[var(--text-muted)] font-bold uppercase">{rangeLabel}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {top.map((r, i) => {
          const img = productImage(r.sku)
          const cat = productCategory(r.sku)
          return (
            <div key={r.sku} className="rounded-xl border border-[var(--border)] overflow-hidden bg-white hover:shadow-md transition">
              <div className="relative aspect-square bg-[var(--bg-soft)] flex items-center justify-center">
                {img
                  ? <img src={img} alt={r.displayName} className="w-full h-full object-contain p-2" loading="lazy" />
                  : <div className="text-[var(--text-muted)] text-[11px] text-center px-2"><i className="ti ti-photo-off text-2xl block mb-1" />ไม่มีรูป</div>}
                <span className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-[var(--dark)] text-white text-[11px] font-bold flex items-center justify-center shadow">{i + 1}</span>
                {r.sharePct != null && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-[#fef3c7] text-[#92600a] border border-[#fcd34d]">{r.sharePct.toFixed(1)}%</span>
                )}
              </div>
              <div className="p-2">
                <div className="text-[11.5px] font-bold text-[var(--dark)] leading-tight line-clamp-2" title={r.displayName}>{r.displayName}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[9.5px] text-[var(--brand-700)] font-semibold">{r.sku}</span>
                  {cat && <span className="text-[9px] text-[var(--text-muted)] truncate ml-1" title={cat}>{cat}</span>}
                </div>
                <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">{numFmt(r.rightsRedeemed)} สิทธิ์</div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-[10px] text-[var(--text-muted)] mt-2.5">🖼️ รูปจากคลังสินค้าจุฬาเฮิร์บ · แมพอัตโนมัติตามรหัส SKU</div>
    </div>
  )
}
