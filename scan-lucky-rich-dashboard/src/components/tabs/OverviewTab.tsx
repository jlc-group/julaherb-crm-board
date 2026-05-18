'use client'
import { useState, useMemo } from 'react'
import DateRangeFilter, { computeRange, type DateRange } from '@/components/ui/DateRangeFilter'
import HeroSkuCard from '@/components/ui/HeroSkuCard'
import ParetoChart from '@/components/ui/ParetoChart'
import CrossSizeMatrix from '@/components/ui/CrossSizeMatrix'
import MomentumGauge from '@/components/ui/MomentumGauge'
import RightsPerUserHistogram from '@/components/ui/RightsPerUserHistogram'
import FirstScanCard from '@/components/ui/FirstScanCard'
import DeadSkuPanel from '@/components/ui/DeadSkuPanel'
import TierMixDonut from '@/components/ui/TierMixDonut'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import DataTable from '@/components/ui/DataTable'
import { numFmt, maskPhone } from '@/lib/utils'
import { PRODUCTS } from '@/config/products'
import { PRIZES } from '@/config/campaign'
import * as mock from '@/lib/mock-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'
ChartJS.defaults.borderColor = '#e5e7eb'

// ── Trend data ──
const TREND = {
  daily: {
    labels: ['1/5','2/5','3/5','4/5','5/5','6/5','7/5','8/5','9/5','10/5','11/5','12/5','13/5','14/5'],
    scans: [890,1023,1156,987,1245,1367,1189,1078,1234,1345,1123,1267,1198,1247],
    rights: [1320,1534,1723,1478,1867,2045,1778,1612,1845,2012,1678,1898,1789,1842],
  },
  weekly: {
    labels: ['W1 พ.ค.','W2 พ.ค.','W3 พ.ค.','W4 พ.ค.'],
    scans: [4056,5190,4780,3712],
    rights: [6055,7802,7135,5541],
  },
  monthly: {
    labels: ['ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.'],
    scans: [15400,18200,17800,19500,16800],
    rights: [23100,27300,26700,29250,25200],
  },
  draw: {
    labels: ['งวด 1','งวด 2','งวด 3','งวด 4'],
    scans: [33600,36000,34500,16800],
    rights: [50400,54000,51750,25200],
  },
} as const

type TrendMode = keyof typeof TREND

// Default to "วันนี้" but computed lazily to avoid SSR Date mismatch
const CAMPAIGN_START = '2026-05-16'
const DEFAULT_RANGE: DateRange = (() => {
  const r = computeRange('7d', new Date('2026-05-18'), CAMPAIGN_START)
  return { preset: '7d', ...r }
})()

export default function OverviewTab() {
  const [trendMode, setTrendMode] = useState<TrendMode>('daily')
  const [scanLogPage, setScanLogPage] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE)

  // ── Filter scan log by selected date range ──
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

  // Reset to page 0 when filter changes
  useMemo(() => { setScanLogPage(0) }, [dateRange.from, dateRange.to])

  // ── Range duration (days) for filtered KPIs ──
  const rangeDays = Math.max(1, Math.round(
    (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / 86400000
  ) + 1)
  const uniqueUsers = new Set(scanLog.map(e => e.customerId)).size
  const filteredRights = scanLog.reduce((s, e) => s + (e.rightsEarned || 0), 0)

  const trend = TREND[trendMode]

  // ── Hourly data ──
  const hourLabels = Array.from({length: 17}, (_, i) => `${String(7+i).padStart(2,'0')}:00`)
  const todayHourly = [23,45,78,120,156,189,210,178,145,132,167,198,234,189,156,123,87]
  const yesterdayHourly = [18,38,65,98,134,167,185,156,132,118,145,176,198,167,134,112,76]

  // ── Dynamic KPI labels reflecting selected range ──
  const isToday = dateRange.preset === 'today'
  const isOneDay = dateRange.from === dateRange.to
  const scanLabel  = isToday ? 'สแกนวันนี้'  : isOneDay ? 'สแกน (วันที่เลือก)' : `สแกน ${rangeDays} วัน`
  const userLabel  = isToday ? 'ผู้สแกนวันนี้' : 'ผู้สแกน (ช่วงที่เลือก)'
  const rightLabel = isToday ? 'สิทธิ์วันนี้'  : 'สิทธิ์ (ช่วงที่เลือก)'

  return (
    <div className="space-y-5">
      {/* ── Date Range Filter ── */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        minDate={CAMPAIGN_START}
        maxDate="2026-05-18"
      />

      {/* ── KPI Grid (using REAL data) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="สิทธิ์รวม 2 วันแรก" value={numFmt(REAL_CAMPAIGN.totalRights)} badge={`+${REAL_CAMPAIGN.growthPct}%`} sub="16-17 พ.ค." />
        <KpiCard label="Unique Users" value={numFmt(REAL_CAMPAIGN.uniqueUsers)} sub={`เฉลี่ย ${(REAL_CAMPAIGN.totalRights / REAL_CAMPAIGN.uniqueUsers).toFixed(2)} สิทธิ์/คน`} />
        <KpiCard label="SKU ที่มียอด" value={`${REAL_CAMPAIGN.activeSkus}/${REAL_CAMPAIGN.totalSkus}`} sub={`Dead ${REAL_CAMPAIGN.deadSkus} SKU`} />
        <KpiCard label="สิทธิ์สะสม" value={numFmt(48370)} sub="จาก 11,520 คน" />
        <KpiCard label="สินค้าร่วมรายการ" value="97" gold sub="จาก 8 กลุ่มราคา" />
        <KpiCard label="รางวัลคงเหลือ" value="198" gold sub="มูลค่า 5,670,000 ฿" />
      </div>

      {/* ── Hero SKU + Concentration Risk ── */}
      <HeroSkuCard />

      {/* ── Pareto Chart ── */}
      <ParetoChart />

      {/* ── 3-col: Momentum + Dead SKU + Entry Product ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MomentumGauge />
        <DeadSkuPanel />
        <FirstScanCard />
      </div>

      {/* ── Tier Mix + Rights-per-User Distribution ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TierMixDonut />
        <RightsPerUserHistogram />
      </div>

      {/* ── Cross-Size Matrix ── */}
      <CrossSizeMatrix />

      <InsightInline html="Momentum ดีมาก สแกน <b>+12.3%</b> จากเมื่อวาน | ลูกค้าใหม่ <b>56.7%</b> — ยังดึงคนใหม่ได้ดี | สิทธิ์เฉลี่ย <b>4.2/คน</b> สูงกว่า baseline 3.0 | Projection ถึงสิ้นแคมเปญ: <b>645,923</b> สแกน" />

      {/* ── Chart Grid Row 1 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hourly Scans */}
        <ChartCard title="สแกนรายชั่วโมง (วันนี้ vs เมื่อวาน)" icon="ti-chart-line">
          <div style={{height: 260}}>
            <Line
              data={{
                labels: hourLabels,
                datasets: [
                  {
                    label: 'วันนี้',
                    data: todayHourly,
                    borderColor: '#1D9E75',
                    backgroundColor: 'rgba(29,158,117,.12)',
                    fill: true,
                    tension: .35,
                    borderWidth: 2,
                    pointRadius: 2,
                  },
                  {
                    label: 'เมื่อวาน',
                    data: yesterdayHourly,
                    borderColor: '#cbd5e1',
                    borderDash: [4,4],
                    fill: false,
                    tension: .35,
                    borderWidth: 1.5,
                    pointRadius: 0,
                  },
                ],
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
          <InsightInline html="Peak ช่วง <b>12:00-14:00</b> (พักเที่ยง) และ <b>19:00-21:00</b> (หลังเลิกงาน) — ควรลง content/ads ก่อน peak 30 นาที" />
        </ChartCard>

        {/* New vs Returning */}
        <ChartCard title="ลูกค้าใหม่ vs เก่า" icon="ti-users">
          <div style={{height: 260}} className="flex items-center justify-center">
            <div style={{width: 220, height: 220}}>
              <Doughnut
                data={{
                  labels: ['ลูกค้าใหม่','ลูกค้าเก่า'],
                  datasets: [{
                    data: [247, 189],
                    backgroundColor: ['#1D9E75','#EF9F27'],
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
          <InsightInline html="ลูกค้าใหม่ <b>56.7%</b> — ยังดึงคนใหม่เข้ามาได้ดี อัตราส่วนสมดุล" />
        </ChartCard>
      </div>

      {/* ── Trend Chart (Full Width) ── */}
      <ChartCard title="แนวโน้มการสแกน" icon="ti-trending-up" full>
        {/* Trend Tabs */}
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
        <div style={{height: 300}}>
          <Bar
            data={{
              labels: trend.labels,
              datasets: [
                {
                  type: 'bar' as const,
                  label: 'สแกน',
                  data: trend.scans,
                  backgroundColor: 'rgba(29,158,117,.6)',
                  borderRadius: 4,
                  barPercentage: .6,
                  order: 2,
                },
                {
                  type: 'line' as const,
                  label: 'สิทธิ์',
                  data: trend.rights,
                  borderColor: '#EF9F27',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  pointRadius: 3,
                  tension: .3,
                  order: 1,
                },
              ],
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
        <InsightInline html="สแกนเฉลี่ย <b>1,168/วัน</b> ช่วง 14 วันแรก — Trajectory ถ้ารักษาระดับนี้จะถึง <b>645,923</b> สแกนก่อนสิ้นแคมเปญ" />
      </ChartCard>

      {/* ── Scan Log ── */}
      <ChartCard title={isToday ? 'Scan Log วันนี้' : isOneDay ? `Scan Log ${dateRange.from}` : `Scan Log (${dateRange.from} → ${dateRange.to})`} icon="ti-list-details" full>
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

      {/* ── Anomaly Card ── */}
      <ChartCard title="Anomaly Detection" icon="ti-alert-triangle" full>
        <div className="grid grid-cols-3 gap-3">
          <AnomalyTile icon="ti-bolt"     color="#ef4444" value="2" label="Velocity Alerts" />
          <AnomalyTile icon="ti-flag"     color="#f5c536" value="3" label="Flagged Users" />
          <AnomalyTile icon="ti-map-pin"  color="#60a5fa" value="5" label="Geo Mismatches" />
        </div>
      </ChartCard>

      {/* ── Actions ── */}
      <InsightCard html={`
        <b>1. Ads timing:</b> ลง ads ก่อน peak 30 นาที → Facebook/IG 11:30 | TikTok 19:00<br/>
        <b>2. Push สิทธิ์:</b> สิทธิ์เฉลี่ย 4.2/คน ยังมีช่องว่าง — ทำ bundle "ซอง+หลอด ได้สิทธิ์ x2"<br/>
        <b>3. New customer:</b> ยังดี แต่ต้องเตรียม retention plan ให้คนใหม่กลับมา
      `} />
    </div>
  )
}

function AnomalyTile({ icon, color, value, label }: { icon: string; color: string; value: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-xl border" style={{ background: `${color}0d`, borderColor: `${color}33` }}>
      <i className={`ti ${icon} text-2xl`} style={{ color }} />
      <div className="text-3xl num mt-1" style={{ color }}>{value}</div>
      <div className="text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">{label}</div>
    </div>
  )
}
