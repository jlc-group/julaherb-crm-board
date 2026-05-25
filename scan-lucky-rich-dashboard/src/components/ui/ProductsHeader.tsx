'use client'
import { buildSkuTable } from '@/lib/sku-redemption'
import { numFmt } from '@/lib/utils'

export default function ProductsHeader() {
  const rows = buildSkuTable('all')
  const activeSku = rows.filter(r => r.rightsRedeemed > 0).length
  const totalRights = rows.reduce((s, r) => s + r.rightsRedeemed, 0)
  const heroShare = rows.length > 0
    ? ((rows.sort((a, b) => b.rightsRedeemed - a.rightsRedeemed)[0]?.rightsRedeemed || 0) / totalRights) * 100
    : 0

  return (
    <div className="products-header">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold tracking-widest opacity-90 uppercase mb-1">
            📦 PRODUCT PORTFOLIO · 97 SKU
          </div>
          <div className="text-[22px] font-bold mb-1">
            🎀 SKU Deep Dive
          </div>
          <div className="text-[13px] opacity-90">
            Hero / Tier / Cross-size / Master table · ดูข้อมูล per-day ที่ Scan Overview Zone 4
          </div>
        </div>
        <div className="flex gap-6 flex-wrap items-end">
          <Stat label="Active SKU"   value={`${activeSku}/${rows.length}`} />
          <Stat label="สิทธิ์รวม"     value={numFmt(totalRights)} />
          <Stat label="Hero share"    value={`${heroShare.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[11px] opacity-80 tracking-wider uppercase">{label}</span>
      <span className="text-[18px] font-bold leading-tight num">{value}</span>
    </div>
  )
}
