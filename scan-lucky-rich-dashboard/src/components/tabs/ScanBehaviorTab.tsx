'use client'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import KpiCard from '@/components/ui/KpiCard'
import InsightInline from '@/components/ui/InsightInline'
import BaselineComparison from '@/components/ui/BaselineComparison'
import AppleToAppleComparison from '@/components/ui/AppleToAppleComparison'
import ScanHeatmap from '@/components/ui/ScanHeatmap'
import TvAirtimeChart from '@/components/ui/TvAirtimeChart'
import ScanFunnel from '@/components/ui/ScanFunnel'
import RetentionCohort from '@/components/ui/RetentionCohort'
import VerificationPanel from '@/components/ui/VerificationPanel'
import DemoBanner from '@/components/ui/DemoBanner'
import { numFmt, getCampaignToday, CAMPAIGN_START } from '@/lib/utils'
import { VERIFICATION_KPIS, SAME_DAY_REPEAT, FUNNEL_DATA, TV_LIFT } from '@/lib/scan-behavior-data'
import { REAL_CAMPAIGN } from '@/lib/real-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Inter', 'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'

export default function ScanBehaviorTab() {
  const totalUsers = SAME_DAY_REPEAT.oneScan + SAME_DAY_REPEAT.twoScans + SAME_DAY_REPEAT.threeScans + SAME_DAY_REPEAT.fourPlusScans
  const repeatPct  = ((totalUsers - SAME_DAY_REPEAT.oneScan) / totalUsers) * 100
  const funnelEnd  = FUNNEL_DATA[FUNNEL_DATA.length - 1].count
  const funnelStart = FUNNEL_DATA[0].count
  const overallConv = (funnelEnd / funnelStart) * 100
  const bestLift = [...TV_LIFT].sort((a, b) => b.liftPct - a.liftPct)[0]

  return (
    <div className="space-y-5">
      <DemoBanner reason="ScanBehaviorTab ส่วนใหญ่ยังเป็น mock — BaselineComparison ใช้ /api/baseline/compare ได้, ส่วนที่เหลือ (TV airtime, funnel, heatmap, retention cohort) ยังไม่มี API dedicated" />
      {/* ── Top KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          label="Total Scan Attempts"
          value={numFmt(VERIFICATION_KPIS.totalAttempts)}
          sub={`Valid ${VERIFICATION_KPIS.validRatePct.toFixed(1)}%`}
        />
        <KpiCard
          label="Failed Scans"
          value={numFmt(VERIFICATION_KPIS.failedCount)}
          sub={`${(100 - VERIFICATION_KPIS.validRatePct).toFixed(1)}% rate`}
        />
        <KpiCard
          label="Funnel Conversion"
          value={`${overallConv.toFixed(1)}%`}
          sub={`${numFmt(funnelStart)} → ${numFmt(funnelEnd)}`}
        />
        <KpiCard
          label="Repeat Scanner"
          value={`${repeatPct.toFixed(1)}%`}
          sub={`${numFmt(totalUsers - SAME_DAY_REPEAT.oneScan)} จาก ${numFmt(totalUsers)} คน`}
        />
        <KpiCard
          label="Best TV Slot"
          value={`+${bestLift.liftPct.toFixed(0)}%`}
          sub={bestLift.label}
          gold
        />
      </div>

      <InsightInline
        html={`Valid rate <b>${VERIFICATION_KPIS.validRatePct.toFixed(1)}%</b> | <b>${repeatPct.toFixed(0)}%</b> ของผู้ใช้กลับมาสแกนซ้ำ | TV slot ที่ดีสุด: <b>${bestLift.label}</b> ดัน scan <b>+${bestLift.liftPct.toFixed(0)}%</b>`}
      />

      {/* ── Baseline Comparison (3-month) ── */}
      <BaselineComparison from={CAMPAIGN_START} to={getCampaignToday().toISOString().slice(0, 10)} />

      {/* ── Apples-to-Apples weekday-matched ── */}
      <AppleToAppleComparison />

      {/* ── #1 Heatmap (full width) ── */}
      <ScanHeatmap />

      {/* ── #2 TV airtime (full width) ── */}
      <TvAirtimeChart />

      {/* ── #3 + #4 : Funnel | Retention ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScanFunnel />
        <RetentionCohort />
      </div>

      {/* ── #5 Verification (full width) ── */}
      <VerificationPanel />

      {/* Mock-data notice */}
      <div className="text-[10.5px] text-[var(--text-muted)] italic text-center pt-2 border-t border-[var(--border-soft)]">
        <i className="ti ti-info-circle" /> ตัวเลขในหน้านี้เป็น mock — calibrate ตาม REAL_CAMPAIGN totals แล้ว
        จะ swap เป็น scan-level data จริงเมื่อ DB export พร้อม (ดู DATA_REQUEST.md sheet "scans")
      </div>
    </div>
  )
}
