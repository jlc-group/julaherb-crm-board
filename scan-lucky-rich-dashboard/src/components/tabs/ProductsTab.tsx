'use client'
import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import HeroSkuCard from '@/components/ui/HeroSkuCard'
import CrossSizeMatrix from '@/components/ui/CrossSizeMatrix'
import CrossScanPairsCard from '@/components/ui/CrossScanPairsCard'
import FirstScanCard from '@/components/ui/FirstScanCard'
import ProductMasterTable from '@/components/ui/ProductMasterTable'
import InsightInline from '@/components/ui/InsightInline'
import ZoneTitle from '@/components/ui/ZoneTitle'
import TabHeader from '@/components/ui/TabHeader'
import UnifiedDateRange, { defaultRange, type DateRangeV2 } from '@/components/ui/UnifiedDateRange'
import Top5SkuCard from '@/components/ui/Top5SkuCard'
import SkuTrendLineChart from '@/components/ui/SkuTrendLineChart'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'

import { buildSkuTable, getTierBuckets } from '@/lib/sku-redemption'
import { RANK_MOVEMENT } from '@/lib/daily-sku-data'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import type { DayKey } from '@/lib/per-sku-daily'
import { numFmt, getCampaignToday } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { SkuPerDayResponse, SkuListResponse } from '@/lib/api/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'

const TIER_COLORS: Record<string, string> = {
  '1':     '#6366f1',
  '2':     '#818cf8',
  '3plus': '#a5b4fc',
}

const TREND_ICON: Record<string, { icon: string; color: string }> = {
  up:    { icon: 'ti-trending-up',   color: '#10b981' },
  down:  { icon: 'ti-trending-down', color: '#ef4444' },
  flat:  { icon: 'ti-minus',         color: '#9ca3af' },
  mixed: { icon: 'ti-arrows-shuffle', color: '#f59e0b' },
}

export default function ProductsTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: getCampaignToday() }))
  const selectedDays = useMemo(
    () => DAILY_ENTRIES.filter(d => d.date >= range.from && d.date <= range.to),
    [range.from, range.to]
  )
  const day = selectedDays[selectedDays.length - 1] ?? DAILY_ENTRIES[DAILY_ENTRIES.length - 1]
  // Compute full range day count (regardless of data availability) for label
  const rangeDayCount = useMemo(() => {
    const ms = new Date(range.to).getTime() - new Date(range.from).getTime()
    return Math.round(ms / 86400000) + 1
  }, [range.from, range.to])
  const isMultiDay = rangeDayCount > 1
  const dataLabel = selectedDays.length < rangeDayCount && selectedDays.length > 0
    ? ` (มีข้อมูล ${selectedDays.length})`
    : ''
  const dayTag = isMultiDay
    ? `${rangeDayCount} วัน${dataLabel}`
    : `${range.from.split('-')[2]} พ.ค.`

  // Convert selected DailyEntries to DayKey[] for buildSkuTable
  const selectedDayKeys = useMemo<DayKey[]>(
    () => selectedDays.map(d => d.date.split('-')[2] as DayKey),
    [selectedDays]
  )
  const allRows = useMemo(
    () => selectedDayKeys.length > 0 ? buildSkuTable(selectedDayKeys) : buildSkuTable('all'),
    [selectedDayKeys]
  )
  const tiers = useMemo(() => getTierBuckets(allRows), [allRows])
  const sortedByRights = useMemo(() => [...allRows].sort((a, b) => b.rightsRedeemed - a.rightsRedeemed), [allRows])

  // ─── API calls (Layer 1 internal /api/*) ───
  const apiSkuList = useApi<SkuListResponse>(`/api/sku/list`)
  const apiSkuPerDay = useApi<SkuPerDayResponse>(`/api/sku/per-day?from=${range.from}&to=${range.to}`)

  // KPI — API-first with static fallback
  const totalSku = apiSkuPerDay.data?.total.activeSkus != null && apiSkuPerDay.data?.total.deadSkus != null
    ? apiSkuPerDay.data.total.activeSkus + apiSkuPerDay.data.total.deadSkus
    : allRows.length
  const deadCount = apiSkuPerDay.data?.total.deadSkus ?? allRows.filter(r => r.rightsRedeemed === 0).length
  const activeCount = apiSkuPerDay.data?.total.activeSkus ?? (totalSku - deadCount)
  const top1 = sortedByRights[0]
  const totalRights = apiSkuPerDay.data?.total.specTickets ?? allRows.reduce((s, r) => s + r.rightsRedeemed, 0)
  const top1Pct = totalRights > 0 ? (top1.rightsRedeemed / totalRights) * 100 : 0
  const top10 = sortedByRights.slice(0, 10).reduce((s, r) => s + r.rightsRedeemed, 0)
  const top10Pct = (top10 / totalRights) * 100
  const apiBadge = (loading: boolean, error: string | null, hasData: boolean) =>
    hasData ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 align-middle">🟢 API</span>
    : loading ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-yellow-100 text-yellow-800 align-middle">⏳</span>
    : error ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-800 align-middle" title={error}>⚠️</span>
    : null

  return (
    <div className="space-y-4">
      {/* ── 1+2. STICKY HEADER (Title + Date range ติดมาด้วยกัน) ── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3"
           style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}>
        <TabHeader
          icon="📦"
          title="Products"
          subtitle="SKU analytics — 97 SKUs • Hero / Tier / Cross-size / Master table"
        />
        <UnifiedDateRange value={range} onChange={setRange} today={getCampaignToday()} />
      </div>

      {/* ⚠️ SKU detail snapshot indicator */}
      <div className="card p-2.5 text-[11px] flex items-start gap-2"
           style={{ background: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 8 }}>
        <span className="text-base flex-shrink-0">⚠️</span>
        <div className="flex-1">
          <b className="text-yellow-800">SKU breakdown ใช้ snapshot ถึง 24 พ.ค.</b>
          <span className="text-[var(--text)]"> — saversureV2 <code className="bg-white/60 px-1 rounded">/dashboard/campaign-report</code> ยังไม่ส่ง <code className="bg-white/60 px-1 rounded">section_16_sku_daily_matrix</code> (per-day SKU rollup) → Hero / Top5 / Cross-size / Master table ยังอ่านจาก <code className="bg-white/60 px-1 rounded">PRODUCTS_MASTER</code> + <code className="bg-white/60 px-1 rounded">DAILY_ENTRIES</code> ที่ค้างวันที่ 24 พ.ค. KPI ด้านบนเป็น live count จาก <code className="bg-white/60 px-1 rounded">/products</code></span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          A — ภาพรวม SKU (aggregate by date range)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="A" title="ภาพรวม SKU" dayTag={dayTag} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-accent kpi-pink" title="จำนวน SKU ในแคมเปญทั้งหมด">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            SKU ทั้งหมด {apiBadge(apiSkuList.loading, apiSkuList.error, !!apiSkuList.data)}
          </div>
          <div className="text-[26px] font-bold leading-tight">{totalSku}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Active {activeCount} • Dead {deadCount}</div>
        </div>
        <div className="kpi-accent kpi-coral" title={`Top 1 SKU: ${top1?.sku}`}>
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            Top 1 share {apiBadge(apiSkuPerDay.loading, apiSkuPerDay.error, !!apiSkuPerDay.data)}
          </div>
          <div className="text-[26px] font-bold leading-tight">{top1Pct.toFixed(1)}%</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{top1?.sku} ({numFmt(top1?.rightsRedeemed || 0)})</div>
        </div>
        <div className="kpi-accent kpi-lavender" title="สัดส่วน Top 10 SKU ของยอดรวม">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            Top 10 share {apiBadge(apiSkuPerDay.loading, apiSkuPerDay.error, !!apiSkuPerDay.data)}
          </div>
          <div className="text-[26px] font-bold leading-tight">{top10Pct.toFixed(1)}%</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">Pareto concentration</div>
        </div>
        <div className="kpi-accent kpi-mint" title="สิทธิ์ที่ใช้แลกรวมทั้งแคมเปญ">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            สิทธิ์ที่แลก {apiBadge(apiSkuPerDay.loading, apiSkuPerDay.error, !!apiSkuPerDay.data)}
          </div>
          <div className="text-[26px] font-bold leading-tight">{numFmt(totalRights)}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{tiers.length} tiers</div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          B — Top Performers (Hero + Top 5 per-day)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="B" title="Top Performers" dayTag={dayTag} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/sku/per-day" params="from&to → rows[0]" /></div>
          <HeroSkuCard rows={allRows} rangeLabel={dayTag} dayCount={selectedDays.length} />
        </div>
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/sku/per-day" params="from&to → rows.slice(0,5)" /></div>
          <Top5SkuCard day={day} rows={allRows} rangeLabel={dayTag} />
        </div>
      </div>

      {/* SKU Trend Line — เลือก SKU ดูกราฟเส้นรายวัน (scale ถึงสิ้นปี) */}
      <div className="mb-1"><ApiSourceBadge endpoint="/api/sku/[sku]/timeseries" params="from&to (per selected SKU)" /></div>
      <SkuTrendLineChart days={selectedDays} rangeLabel={dayTag} />

      {/* ════════════════════════════════════════════════════
          C — Mix Analysis (Tier + CrossSize)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="C" title="Mix Analysis" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="ti ti-chart-bar text-lg" style={{ color: 'var(--brand-500)' }} />
            <h3 className="text-[14px] font-bold text-[var(--dark)]">🎯 Tier Mix — สัดส่วนสิทธิ์ตาม Tier</h3>
            <ApiSourceBadge endpoint="/api/sku/per-day" params="from&to → group by perScan" />
          </div>

          {/* Stacked horizontal proportion bar */}
          <div className="mb-4">
            <div className="flex w-full h-8 rounded-lg overflow-hidden border border-[var(--border)]">
              {tiers.map((t, i) => (
                <div key={t.key}
                     className="flex items-center justify-center text-[11px] font-bold text-white transition-all hover:opacity-90"
                     style={{
                       background: TIER_COLORS[t.key] || '#a5b4fc',
                       width: `${t.sharePct}%`,
                     }}
                     title={`${t.label}: ${numFmt(t.rightsClaimed)} สิทธิ์ (${t.sharePct.toFixed(1)}%)`}>
                  {t.sharePct >= 8 && `${t.sharePct.toFixed(0)}%`}
                </div>
              ))}
            </div>
          </div>

          {/* Detail rows per tier */}
          <div className="space-y-2">
            {tiers.map(t => (
              <div key={t.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-soft)] transition">
                <div className="w-3 h-3 rounded flex-shrink-0" style={{ background: TIER_COLORS[t.key] || '#a5b4fc' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-[var(--dark)] truncate">{t.label}</div>
                  <div className="text-[10.5px] text-[var(--text-muted)]">{t.skuCount} SKUs</div>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold num text-[var(--brand-700)]">{numFmt(t.rightsClaimed)}</div>
                  <div className="text-[10.5px] text-[var(--text-muted)]">{t.sharePct.toFixed(1)}% share</div>
                </div>
              </div>
            ))}
          </div>

          <InsightInline html={`<b>${tiers[0]?.label}</b> (ซองเล็ก) ครอง <b>${tiers[0]?.sharePct.toFixed(0)}%</b> — โอกาส push premium tier ผ่าน bundling`} />
        </div>
        <CrossSizeMatrix />
      </div>
      <div className="mt-4">
        <CrossScanPairsCard />
      </div>

      {/* ════════════════════════════════════════════════════
          D — Rank Dynamics (FirstScan + Rank Movement)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="D" title="Rank Dynamics" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/sku/per-day" params="from=X&to=X (per day) → first appearance" /></div>
          <FirstScanCard />
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="ti ti-arrows-vertical text-lg" style={{ color: 'var(--brand-500)' }} />
            <h3 className="text-[13px] font-bold text-[var(--dark)]">Rank Movement (Top 10)</h3>
            <ApiSourceBadge endpoint="/api/sku/per-day" params="from=X&to=X per day → rank by tickets" />
            <span className="ml-auto text-[10px] text-[var(--text-muted)] font-bold uppercase">6 วัน</span>
          </div>
          <div className="text-[10.5px] text-[var(--text-secondary)] mb-2">
            Top 10 SKU เคลื่อนตัวอย่างไรระหว่าง 16-21 พ.ค.
          </div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[var(--text-muted)] text-[9.5px] uppercase tracking-wider">
                <th className="text-left py-1">SKU</th>
                <th className="text-center py-1 w-8">16</th>
                <th className="text-center py-1 w-8">17</th>
                <th className="text-center py-1 w-8">18</th>
                <th className="text-center py-1 w-8">19</th>
                <th className="text-center py-1 w-8">20</th>
                <th className="text-center py-1 w-10">Trend</th>
              </tr>
            </thead>
            <tbody>
              {RANK_MOVEMENT.map(m => {
                const t = TREND_ICON[m.trend]
                return (
                  <tr key={m.sku} className="border-t border-[var(--border-soft)]">
                    <td className="py-1.5 truncate max-w-[140px]" title={m.name}>
                      <span className="font-mono text-[10px] text-[var(--brand-700)] mr-1 font-semibold">{m.sku}</span>
                    </td>
                    <td className="text-center num text-[var(--text)]">{m.rank16}</td>
                    <td className="text-center num text-[var(--text)]">{m.rank17}</td>
                    <td className="text-center num text-[var(--text)]">{m.rank18}</td>
                    <td className="text-center num text-[var(--text)]">{m.rank19}</td>
                    <td className="text-center num text-[var(--text)]">{m.rank20}</td>
                    <td className="text-center">
                      <i className={`ti ${t.icon} text-base`} style={{ color: t.color }} title={m.trend} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          E — Master Table (Dead SKU alert inline)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="E" title="Master Table" />
      {deadCount > 0 && (
        <div className="card p-3 flex items-center gap-3 text-[12px] border-l-2"
             style={{ background: '#fef2f2', borderLeftColor: '#dc2626' }}>
          <i className="ti ti-skull text-[#dc2626] text-lg" />
          <div className="flex-1">
            <span className="font-bold text-[#991b1b]">💀 Dead SKU: {deadCount} ตัว</span>
            <span className="text-[11px] text-[var(--text-secondary)] ml-2">
              ไม่มีคนสแกนเลยตลอดแคมเปญ → ตรวจ shelf placement / QR visibility
            </span>
          </div>
          <span className="text-[10.5px] text-[var(--text-muted)] italic">
            → ใช้ filter <b>"Dead"</b> ในตารางด้านล่าง
          </span>
        </div>
      )}
      <div className="mb-1"><ApiSourceBadge endpoint="/api/sku/per-day" params="from&to → all 97 SKUs with daily breakdown" /></div>
      <ProductMasterTable visibleDays={selectedDayKeys} />

      {/* ════════════════════════════════════════════════════
          F — Action Items
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="F" title="Action Items" />
      <div className="card p-4" style={{ borderLeft: '3px solid var(--brand-500)' }}>
        <div className="text-[14px] font-bold text-[var(--dark)] mb-2 flex items-center gap-2">
          <i className="ti ti-target" style={{ color: 'var(--brand-500)' }} /> สิ่งที่ควรทำ
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
          <div>
            <div className="font-bold mb-1" style={{ color: 'var(--brand-700)' }}>📦 Hero SKU stock plan</div>
            <div className="text-[11px] text-[var(--text-secondary)]">{top1?.sku} ครอง {top1Pct.toFixed(0)}% — backup supply + alert ถ้า inv {'<'} 7 วัน</div>
          </div>
          <div>
            <div className="font-bold mb-1" style={{ color: 'var(--brand-700)' }}>🎁 Tier upsell bundle</div>
            <div className="text-[11px] text-[var(--text-secondary)]">ดัน customers ขึ้น Tier 2/3+ (premium) ผ่าน bundle promo</div>
          </div>
          <div>
            <div className="font-bold mb-1" style={{ color: '#d97706' }}>💀 Dead SKU ({deadCount} ตัว)</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Audit shelf placement + QR visibility ภายในสัปดาห์</div>
          </div>
          <div>
            <div className="font-bold mb-1" style={{ color: 'var(--positive)' }}>🚪 Entry product</div>
            <div className="text-[11px] text-[var(--text-secondary)]">L3-8G เป็น entry — protect supply + cross-sell หลัง first scan</div>
          </div>
        </div>
      </div>
    </div>
  )
}
