'use client'
import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import DateRangeFilter, { computeRange, type DateRange } from '@/components/ui/DateRangeFilter'
import MomentumGauge from '@/components/ui/MomentumGauge'
import BaselineComparison from '@/components/ui/BaselineComparison'
import AppleToAppleComparison from '@/components/ui/AppleToAppleComparison'
import ScanHeatmap from '@/components/ui/ScanHeatmap'
import CustomerMixCard from '@/components/ui/CustomerMixCard'
import ForecastWidget from '@/components/ui/ForecastWidget'
import { numFmt, maskPhone } from '@/lib/utils'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import { VERIFICATION_KPIS } from '@/lib/scan-behavior-data'
import { DAILY_STATS } from '@/lib/daily-sku-data'
import * as mock from '@/lib/mock-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'
ChartJS.defaults.borderColor = '#e5e7eb'

// ── Daily trend data (real campaign data) ──
const DAILY_TREND = {
  labels: ['16/5','17/5','18/5'],
  dates:  ['2026-05-16','2026-05-17','2026-05-18'],
  scans:  [7160, 8709, 6432],
} as const

const CAMPAIGN_START = '2026-05-16'
const DEFAULT_RANGE: DateRange = (() => {
  const r = computeRange('campaign', new Date('2026-05-18'), CAMPAIGN_START)
  return { preset: 'campaign', ...r }
})()

export default function OverviewTab() {
  const [scanLogPage, setScanLogPage] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE)

  const filteredScanLog = useMemo(() => {
    const fromTs = new Date(dateRange.from + 'T00:00:00').getTime()
    const toTs   = new Date(dateRange.to   + 'T23:59:59').getTime()
    return mock.MOCK_SCAN_LOG.filter(e => {
      const t = new Date(e.scannedAt).getTime()
      return t >= fromTs && t <= toTs
    })
  }, [dateRange.from, dateRange.to])

  const perPage = 20
  const scanLog = filteredScanLog
  const totalPages = Math.max(1, Math.ceil(scanLog.length / perPage))
  const pageData = scanLog.slice(scanLogPage * perPage, (scanLogPage + 1) * perPage)
  useMemo(() => { setScanLogPage(0) }, [dateRange.from, dateRange.to])

  // ── Trend (filter by selected range) ──
  const trend = useMemo(() => {
    const keepIdx = DAILY_TREND.dates
      .map((d, i) => d >= dateRange.from && d <= dateRange.to ? i : -1)
      .filter(i => i >= 0)
    if (keepIdx.length === 0) return DAILY_TREND
    return {
      labels: keepIdx.map(i => DAILY_TREND.labels[i]),
      scans:  keepIdx.map(i => DAILY_TREND.scans[i]),
    }
  }, [dateRange.from, dateRange.to])

  // ── KPI computed from selected date range ──
  // Find DAILY_STATS rows that fall within the selected range
  const rangeStats = useMemo(() => {
    return DAILY_STATS.filter(d => d.date >= dateRange.from && d.date <= dateRange.to)
  }, [dateRange.from, dateRange.to])

  const rangeRights = rangeStats.reduce((s, d) => s + d.totalRights, 0)
  const rangeUsers  = rangeStats.reduce((s, d) => s + d.uniqueUsers, 0)
  const rangeDays   = rangeStats.length
  const rangeLabel  = rangeDays === 0
    ? 'ไม่มีข้อมูลในช่วงนี้'
    : rangeDays === 1
      ? `${rangeStats[0].date.split('-')[2]} พ.ค. (${rangeStats[0].weekday})`
      : `${rangeStats[0].date.split('-')[2]}-${rangeStats[rangeStats.length-1].date.split('-')[2]} พ.ค. (${rangeDays} วัน)`

  // Scale all other "campaign-totals" proportionally to selected range vs full campaign
  const rangeFactor = REAL_CAMPAIGN.totalRights > 0 ? rangeRights / REAL_CAMPAIGN.totalRights : 0
  const rangeAttempts = Math.round(VERIFICATION_KPIS.totalAttempts * rangeFactor)
  const rangeValid    = Math.round(VERIFICATION_KPIS.totalValid    * rangeFactor)
  const rangeValidRate = rangeAttempts > 0 ? (rangeValid / rangeAttempts) * 100 : 0

  // Growth between consecutive days in range (if 2+ days)
  const growthBadge = rangeStats.length >= 2
    ? `${((rangeStats[rangeStats.length-1].totalRights - rangeStats[0].totalRights) / rangeStats[0].totalRights * 100).toFixed(1)}%`
    : undefined


  return (
    <div className="space-y-5">
      {/* ── Date Range Filter ── */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        minDate={CAMPAIGN_START}
        maxDate="2026-05-18"
      />

      {/* ── SECTION 1: Performance KPI (reactive to date range) ── */}
      <SectionTitle icon="ti-dashboard" title="Performance Overview" sub={rangeLabel} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label={rangeDays === 1 ? 'สิทธิ์ (วันที่เลือก)' : `สิทธิ์ (${rangeDays} วัน)`}
          value={numFmt(rangeRights)}
          badge={growthBadge}
          sub={rangeLabel}
        />
        <KpiCard
          label="Unique Users"
          value={numFmt(rangeUsers)}
          sub={rangeUsers > 0 ? `เฉลี่ย ${(rangeRights / rangeUsers).toFixed(2)} สิทธิ์/คน` : '—'}
        />
        <KpiCard
          label="Scan Attempts"
          value={numFmt(rangeAttempts)}
          sub={`Valid ${rangeValidRate.toFixed(1)}%`}
        />
        <KpiCard
          label="สิทธิ์/คน เฉลี่ย"
          value={rangeUsers > 0 ? (rangeRights / rangeUsers).toFixed(2) : '—'}
          sub={`${numFmt(rangeRights)} ÷ ${numFmt(rangeUsers)}`}
          gold
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MomentumGauge fromDate={dateRange.from} toDate={dateRange.to} />
        <CustomerMixCard />
      </div>

      <ForecastWidget />

      {/* ── SECTION 2: Campaign Lift Analysis ── */}
      <SectionTitle icon="ti-target" title="Campaign Lift Analysis" sub="วัดผลแคมเปญเทียบ baseline" />
      <BaselineComparison />
      <AppleToAppleComparison />

      {/* ── SECTION 3: Time Patterns ── */}
      <SectionTitle icon="ti-clock" title="Time Patterns" sub="เมื่อไหร่ที่คนสแกน" />
      <ScanHeatmap />

      {/* Trend chart — daily only */}
      <ChartCard title="แนวโน้มการสแกนรายวัน" icon="ti-trending-up" full>
        <div style={{ height: 280 }}>
          <Bar
            data={{
              labels: trend.labels,
              datasets: [{
                type: 'bar' as const,
                label: 'สแกน',
                data: trend.scans,
                backgroundColor: 'rgba(34,197,94,0.7)',
                borderRadius: 4,
                barPercentage: 0.6,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
              scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
              },
            }}
          />
        </div>
      </ChartCard>

      {/* ── SECTION 4: Detail Log ── */}
      <SectionTitle icon="ti-list-details" title="Detail Log" />
      <ChartCard title="Scan Log" icon="ti-list-details" full>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-[var(--text-secondary)]"><span className="live-dot mr-2" />{numFmt(scanLog.length)} รายการ</span>
          <button className="text-[11px] font-semibold px-3 py-1 rounded-full border border-[var(--green-200)] text-[var(--green-700)] hover:bg-[var(--green-50)] transition">
            <i className="ti ti-download mr-1" /> Export CSV
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {pageData.map(entry => (
            <div key={entry.id} className="rounded-lg p-2.5 text-[11px] bg-[var(--bg-soft)] border border-[var(--border-soft)] hover:border-[var(--green-200)] transition">
              <div className="font-bold text-[var(--dark)] truncate">{entry.customerName}</div>
              <div className="text-[var(--primary)] font-mono text-[10px]">{entry.scanCode}</div>
              <div className="truncate text-[var(--text)] mt-0.5">{entry.productName}</div>
              <div className="text-[var(--text-muted)] mt-0.5">{maskPhone(entry.phone)}</div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              disabled={scanLogPage === 0}
              onClick={() => setScanLogPage(p => p - 1)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--green-200)] hover:text-[var(--green-700)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              &laquo; ก่อนหน้า
            </button>
            <span className="text-[11px] text-[var(--text-secondary)] num">
              หน้า <b className="text-[var(--dark)]">{scanLogPage + 1}</b> / {totalPages}
            </span>
            <button
              disabled={scanLogPage >= totalPages - 1}
              onClick={() => setScanLogPage(p => p + 1)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--green-200)] hover:text-[var(--green-700)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ถัดไป &raquo;
            </button>
          </div>
        )}
      </ChartCard>

      {/* ── Actions ── */}
      <InsightCard html={`
        <b>1. Ads timing:</b> ลง ads ก่อน peak 30 นาที → Facebook/IG 11:30 | TikTok 19:00<br/>
        <b>2. Campaign lift:</b> baseline lift +1.31% — ต่ำกว่าธรรมชาติ ต้อง push LINE broadcast<br/>
        <b>3. Weekend strategy:</b> เสาร์-อาทิตย์ยอดสูง (peak 17/5 = 8,709) — focus content + push ใน window นี้
      `} />
    </div>
  )
}

function SectionTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2 pt-2 pb-1 border-b border-[var(--border-soft)]">
      <i className={`ti ${icon} text-lg text-[var(--primary)]`} />
      <h2 className="text-[14px] font-extrabold text-[var(--dark)] uppercase tracking-wider">{title}</h2>
      {sub && <span className="text-[11px] text-[var(--text-muted)]">— {sub}</span>}
    </div>
  )
}
