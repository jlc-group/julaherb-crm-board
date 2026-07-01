'use client'
// 🔍 Explorer — drill-down hub (เจาะมิติเอง) · cross-filter จริงรอ backend (docs/explorer-api-spec.md)
import { useMemo, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'

import TabHeader from '@/components/ui/TabHeader'
import UnifiedDateRange, { defaultRange, type DateRangeV2 } from '@/components/ui/UnifiedDateRange'
import ZoneTitle from '@/components/ui/ZoneTitle'
import ExplorerFilterPanel, { type SkuCatalogItem } from '@/components/ui/ExplorerFilterPanel'
import ExplorerSkuRankTable from '@/components/ui/ExplorerSkuRankTable'
import ExplorerSkuTrend from '@/components/ui/ExplorerSkuTrend'
import ExplorerCoScan from '@/components/ui/ExplorerCoScan'
import ScanHeatmapLive from '@/components/ui/ScanHeatmapLive'
import HeavyUsersCard from '@/components/ui/HeavyUsersCard'
import TopProvincesCard from '@/components/ui/TopProvincesCard'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'

import { useApi } from '@/lib/hooks/useApi'
import { getCampaignToday } from '@/lib/utils'
import { skuGram, skuSize, type SizeTier } from '@/lib/sku-utils'
import type { SkuPerDayResponse } from '@/lib/api/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Inter', 'Noto Sans Thai', sans-serif"

export default function ExplorerTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: getCampaignToday() }))
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [sizeFilter, setSizeFilter] = useState<SizeTier | 'all'>('all')

  // fetch ครั้งเดียว — ใช้ทั้ง catalog (picker) + Top SKU
  const perDay = useApi<SkuPerDayResponse>(`/api/sku/per-day?from=${range.from}&to=${range.to}`)
  const rows = perDay.data?.rows ?? []

  const catalog: SkuCatalogItem[] = useMemo(
    () => rows.map((r) => ({ sku: r.sku, name: r.displayName, gram: skuGram(r.sku), size: skuSize(r.sku), totalScans: r.scans }))
      .sort((a, b) => b.totalScans - a.totalScans),
    [rows],
  )

  // เทรนด์: ถ้ายังไม่เจาะ SKU → ใช้ top 5 เป็นค่าเริ่มต้น
  const trendSkus = selectedSkus.length ? selectedSkus : catalog.slice(0, 5).map((c) => c.sku)

  return (
    <div className="space-y-4">
      {/* sticky header */}
      <div className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3"
           style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}>
        <TabHeader icon="🔍" title="Explorer"
          subtitle="เจาะมิติเอง — เลือกไซส์/SKU แล้วดู Top · เทรนด์ · คู่สแกน · เวลา · พื้นที่" />
        <UnifiedDateRange value={range} onChange={setRange} today={getCampaignToday()} />
        <ExplorerFilterPanel catalog={catalog} selectedSkus={selectedSkus} onChangeSkus={setSelectedSkus} sizeFilter={sizeFilter} onChangeSize={setSizeFilter} />
      </div>

      {/* A — ตารางจัดอันดับ SKU (Kalodata-style: sort + sparkline + growth%) */}
      <ZoneTitle num="A" title="ตารางจัดอันดับ SKU" dayTag={`${range.from.split('-')[2]}–${range.to.split('-')[2]}`} />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/sku/daily-matrix" params="from&to" /></div>
      <ExplorerSkuRankTable perDayRows={rows} loading={perDay.loading} from={range.from} to={range.to} selectedSkus={selectedSkus} sizeFilter={sizeFilter} />

      {/* C — เทรนด์ + คู่สแกน */}
      <ZoneTitle num="B" title="เทรนด์ + สแกนคู่กับอะไร" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExplorerSkuTrend from={range.from} to={range.to} skus={trendSkus} isDefault={selectedSkus.length === 0} />
        <ExplorerCoScan selectedSkus={selectedSkus} />
      </div>

      {/* D — เวลา */}
      <ZoneTitle num="C" title="เวลาที่สแกน (วัน × ชั่วโมง)" />
      <ScanHeatmapLive from={range.from} to={range.to} />

      {/* E — รายคน + พื้นที่ (snapshot ตามวันสิ้นสุด) */}
      <ZoneTitle num="D" title="รายคน + พื้นที่" dayTag={`snapshot ${range.to.split('-')[2]}`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/heavy-users" params="date&limit" /></div>
          <HeavyUsersCard date={range.to} limit={20} />
        </div>
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/provinces" params="date&limit" /></div>
          <TopProvincesCard date={range.to} limit={10} />
        </div>
      </div>

      {/* F — locked (รอ backend cross-filter) */}
      <ZoneTitle num="E" title="เจาะลึกรายคน — รอ backend" />
      <div className="card p-4" style={{ borderLeft: '4px solid #cbd5e1', background: 'repeating-linear-gradient(45deg, #fff, #fff 10px, #fafbfc 10px, #fafbfc 20px)' }}>
        <div className="flex items-center gap-2 mb-2">
          <i className="ti ti-lock text-base text-slate-400" />
          <h3 className="text-[14px] font-bold text-slate-500">มิติที่รอ API (cross-filter จริง)</h3>
          <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">📋 ดู docs/explorer-api-spec.md</span>
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] mb-3">
          ตอนนี้ Explorer เจาะได้ตามมิติที่มีข้อมูล (ไซส์/SKU/เวลา/พื้นที่-snapshot) — ส่วน <b>cross หลายมิติพร้อมกัน</b> ต้องรอ backend เปิด <code className="bg-white px-1 rounded border">/dashboard/explore</code>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: '🎂', t: 'อายุ 18-25 สแกนอะไร', d: 'dob มีใน DB · API ยังไม่ส่ง' },
            { icon: '🚻', t: 'แยกเพศ ชาย/หญิง', d: 'DB ยังไม่มี field gender' },
            { icon: '💨', t: 'สแกนแล้วหายเลยมั้ย', d: 'churn-after-scan รายคน' },
            { icon: '👑', t: 'ใครคือ Royalty', d: 'drill-down ลูกค้ารายคน + filter' },
          ].map((x) => (
            <div key={x.t} className="rounded-lg p-2.5 bg-white/70 border border-slate-200">
              <div className="text-[16px] mb-0.5 grayscale opacity-70">{x.icon}</div>
              <div className="text-[11.5px] font-semibold text-slate-500">{x.t}</div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
