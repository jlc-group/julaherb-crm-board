'use client'
import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import DateRangeFilter, { computeRange, type DateRange } from '@/components/ui/DateRangeFilter'
import MomentumGauge from '@/components/ui/MomentumGauge'
import BaselineComparison from '@/components/ui/BaselineComparison'
import AppleToAppleComparison from '@/components/ui/AppleToAppleComparison'
import ScanHeatmap from '@/components/ui/ScanHeatmap'
import TvAirtimeChart from '@/components/ui/TvAirtimeChart'
import ScanFunnel from '@/components/ui/ScanFunnel'
import RetentionCohort from '@/components/ui/RetentionCohort'
import VerificationPanel from '@/components/ui/VerificationPanel'
import { numFmt, maskPhone } from '@/lib/utils'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import { VERIFICATION_KPIS, SAME_DAY_REPEAT, FUNNEL_DATA, TV_LIFT } from '@/lib/scan-behavior-data'
import * as mock from '@/lib/mock-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'
ChartJS.defaults.borderColor = '#e5e7eb'

// ── Trend data (mock — will replace when DB ready) ──
const TREND = {
  daily:   { labels: ['16/5','17/5','18/5'], scans: [7160, 8709, 6432] },
  weekly:  { labels: ['W1 พ.ค.','W2 พ.ค.','W3 พ.ค.','W4 พ.ค.'], scans: [4056,5190,4780,3712] },
  monthly: { labels: ['ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.'], scans: [15400,18200,17800,19500,16800] },
  draw:    { labels: ['งวด 1','งวด 2','งวด 3','งวด 4'], scans: [33600,36000,34500,16800] },
} as const

type TrendMode = keyof typeof TREND

const CAMPAIGN_START = '2026-05-16'
const DEFAULT_RANGE: DateRange = (() => {
  const r = computeRange('campaign', new Date('2026-05-18'), CAMPAIGN_START)
  return { preset: 'campaign', ...r }
})()

export default function OverviewTab() {
  const [trendMode, setTrendMode] = useState<TrendMode>('daily')
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

  const trend = TREND[trendMode]

  // ── KPI computed ──
  const totalUsers = SAME_DAY_REPEAT.oneScan + SAME_DAY_REPEAT.twoScans + SAME_DAY_REPEAT.threeScans + SAME_DAY_REPEAT.fourPlusScans
  const repeatPct  = ((totalUsers - SAME_DAY_REPEAT.oneScan) / totalUsers) * 100
  const funnelConv = (FUNNEL_DATA[FUNNEL_DATA.length - 1].count / FUNNEL_DATA[0].count) * 100
  const bestLift   = [...TV_LIFT].sort((a, b) => b.liftPct - a.liftPct)[0]

  return (
    <div className="space-y-5">
      {/* ── Date Range Filter ── */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        minDate={CAMPAIGN_START}
        maxDate="2026-05-18"
      />

      {/* ── SECTION 1: Performance KPI ── */}
      <SectionTitle icon="ti-dashboard" title="Performance Overview" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="สิทธิ์รวม (3 วัน)" value={numFmt(REAL_CAMPAIGN.totalRights)} badge="+21.6%" sub="16-18 พ.ค." />
        <KpiCard label="Unique Users"     value={numFmt(REAL_CAMPAIGN.uniqueUsers)} sub={`เฉลี่ย ${(REAL_CAMPAIGN.totalRights / REAL_CAMPAIGN.uniqueUsers).toFixed(2)} สิทธิ์/คน`} />
        <KpiCard label="Scan Attempts"    value={numFmt(VERIFICATION_KPIS.totalAttempts)} sub={`Valid ${VERIFICATION_KPIS.validRatePct.toFixed(1)}%`} />
        <KpiCard label="Funnel Conversion" value={`${funnelConv.toFixed(1)}%`} sub={`${numFmt(FUNNEL_DATA[0].count)} → ${numFmt(FUNNEL_DATA[FUNNEL_DATA.length-1].count)}`} />
        <KpiCard label="Repeat Scanner"   value={`${repeatPct.toFixed(1)}%`} sub={`${numFmt(totalUsers - SAME_DAY_REPEAT.oneScan)} จาก ${numFmt(totalUsers)} คน`} />
        <KpiCard label="Best TV Slot"     value={`+${bestLift.liftPct.toFixed(0)}%`} sub={bestLift.label} gold />
      </div>

      <MomentumGauge />

      {/* ── SECTION 2: Campaign Lift Analysis ── */}
      <SectionTitle icon="ti-target" title="Campaign Lift Analysis" sub="วัดผลแคมเปญเทียบ baseline" />
      <BaselineComparison />
      <AppleToAppleComparison />

      {/* ── SECTION 3: Time Patterns ── */}
      <SectionTitle icon="ti-clock" title="Time Patterns" sub="เมื่อไหร่ที่คนสแกน" />
      <ScanHeatmap />
      <TvAirtimeChart />

      {/* Trend chart */}
      <ChartCard title="แนวโน้มการสแกน" icon="ti-trending-up" full>
        <div className="flex gap-1 mb-3">
          {([
            ['daily','รายวัน'],['weekly','รายสัปดาห์'],['monthly','รายเดือน'],['draw','รอบจับรางวัล'],
          ] as [TrendMode, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTrendMode(key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                trendMode === key
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:bg-[var(--green-50)] hover:text-[var(--green-700)] border border-[var(--border)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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

      {/* ── SECTION 4: User Behavior ── */}
      <SectionTitle icon="ti-users" title="User Behavior" sub="ใคร / ยังไง" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScanFunnel />
        <RetentionCohort />
      </div>

      <ChartCard title="ลูกค้าใหม่ vs เก่า" icon="ti-user-plus">
        <div style={{ height: 240 }} className="flex items-center justify-center">
          <div style={{ width: 220, height: 220 }}>
            <Doughnut
              data={{
                labels: ['ลูกค้าใหม่','ลูกค้าเก่า'],
                datasets: [{
                  data: [4445, 3397],
                  backgroundColor: ['#16a34a','#facc15'],
                  borderWidth: 0,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
              }}
            />
          </div>
        </div>
        <InsightInline html="ลูกค้าใหม่ <b>56.7%</b> — ยังดึงคนใหม่ได้ดี อัตราส่วนสมดุล" />
      </ChartCard>

      {/* ── SECTION 5: Quality ── */}
      <SectionTitle icon="ti-shield-check" title="Quality & Verification" sub="คุณภาพ scan / fraud detection" />
      <VerificationPanel />

      {/* ── SECTION 6: Detail ── */}
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
        <b>3. Repeat rate:</b> ${repeatPct.toFixed(0)}% — ยังมี one-shot อีก 40%+ → upsell "สแกนอีก 1 = สิทธิ์ x2"<br/>
        <b>4. TV ROI:</b> ${bestLift.label} ให้ lift สูงสุด +${bestLift.liftPct.toFixed(0)}% — เพิ่ม budget slot นี้
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
