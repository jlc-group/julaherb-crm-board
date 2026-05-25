'use client'
import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'

import TabHeader from '@/components/ui/TabHeader'
import UnifiedDateRange, { defaultRange, type DateRangeV2 } from '@/components/ui/UnifiedDateRange'
import ZoneTitle from '@/components/ui/ZoneTitle'
import SegmentMixCard from '@/components/ui/SegmentMixCard'
import EngagementDistribution from '@/components/ui/EngagementDistribution'
import HeavyUsersCard from '@/components/ui/HeavyUsersCard'
import TopProvincesCard from '@/components/ui/TopProvincesCard'
import InsightInline from '@/components/ui/InsightInline'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'

import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'

export default function CustomersTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: new Date('2026-05-24') }))

  const selectedDays = useMemo(
    () => DAILY_ENTRIES.filter(d => d.date >= range.from && d.date <= range.to),
    [range.from, range.to]
  )
  const day = selectedDays[selectedDays.length - 1] ?? DAILY_ENTRIES[DAILY_ENTRIES.length - 1]
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

  // Aggregate customer KPIs across selected days
  const totalUsers = selectedDays.reduce((s, d) => s + d.uniqueUsers, 0)
  // Repeat rate = (users with 2+ scans) / total — computed from engagementBuckets
  const repeatRate = (() => {
    let oneShot = 0, twoPlus = 0
    for (const d of selectedDays) {
      const b = d.engagementBuckets || []
      oneShot += b[0]?.users || 0
      twoPlus += (b[1]?.users || 0) + (b[2]?.users || 0) + (b[3]?.users || 0)
    }
    const total = oneShot + twoPlus
    return total > 0 ? Math.round((twoPlus / total) * 100) : 0
  })()
  const heavyCount = selectedDays.reduce((s, d) => s + d.heavyUsers.length, 0)
  const newSignupGrowth = (() => {
    if (selectedDays.length < 2) return 0
    const first = selectedDays[0].newSignup
    const last = selectedDays[selectedDays.length - 1].newSignup
    return ((last - first) / first) * 100
  })()

  return (
    <div className="space-y-4">
      {/* ── 1. TAB HEADER ── */}
      <TabHeader
        icon="👥"
        title="Customers"
        subtitle="Customer analytics — segmentation • behavior • retention • geography"
      />

      {/* ── 2. UNIFIED DATE RANGE (sticky) ── */}
      <div className="sticky top-0 z-30 -mx-1 px-1 pt-1 pb-2"
           style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}>
        <UnifiedDateRange value={range} onChange={setRange} today={new Date('2026-05-24')} />
      </div>

      {/* ════════════════════════════════════════════════════
          A — ภาพรวมลูกค้า (aggregate by date range)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="A" title="ภาพรวมลูกค้า" dayTag={isMultiDay ? `รวม ${selectedDays.length} วัน` : dayTag} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-accent kpi-users" title={`ลูกค้าที่มาสแกน รวม ${selectedDays.length} วันในช่วงเลือก (unique users)`}>
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            👥 ลูกค้าทั้งหมด <ApiSourceBadge endpoint="/api/scans/totals" params="from&to" />
          </div>
          <div className="text-[26px] font-bold leading-tight">{numFmt(totalUsers)}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">unique users · {selectedDays.length} วัน</div>
        </div>
        <div className="kpi-accent kpi-engage" title="% ของ user ที่กลับมาสแกนซ้ำ (2+ ครั้ง)">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            🔁 Repeat Rate <ApiSourceBadge endpoint="/api/customers/engagement" params="from&to" />
          </div>
          <div className="text-[26px] font-bold leading-tight">{repeatRate}%</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">industry avg 25-30%</div>
        </div>
        <div className="kpi-accent kpi-new" title="ผู้ใช้ที่สแกน 30+ ครั้ง — อาจเป็นสายเก็บหรือ fraud">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            🚩 Heavy Users <ApiSourceBadge endpoint="/api/customers/heavy-users" params="date&limit" />
          </div>
          <div className="text-[26px] font-bold leading-tight">{heavyCount}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{'>'} 30 scans / วัน รวม</div>
        </div>
        <div className="kpi-accent kpi-success" title="การเปลี่ยนแปลง newSignup ของ Day แรก vs ล่าสุด">
          <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
            📈 Signup Δ <ApiSourceBadge endpoint="/api/members/daily" params="from&to" />
          </div>
          <div className={`text-[26px] font-bold leading-tight ${newSignupGrowth >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}`}>
            {newSignupGrowth >= 0 ? '+' : ''}{newSignupGrowth.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">
            {selectedDays.length >= 2 ? `${selectedDays[0].newSignup} → ${selectedDays[selectedDays.length-1].newSignup}` : 'ต้องเลือก ≥ 2 วัน'}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          B — Mix + Segmentation (3 donuts + RFM minis)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="B" title="Mix + Segmentation" dayTag={dayTag} />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/engagement" params="from&to → RFM derived" /></div>
      <SegmentMixCard day={day} />

      {/* ════════════════════════════════════════════════════
          C — Behavior + Retention
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="C" title="Behavior + Retention" dayTag={dayTag} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/engagement" params="from&to" /></div>
          <EngagementDistribution day={day} rangeLabel={dayTag} />
        </div>
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/retention" params="date" /></div>
          <CohortRetentionCard />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          D — Leaderboards (Heavy Users + Top จังหวัด)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="D" title="Leaderboards" dayTag={dayTag} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/heavy-users" params="date&limit" /></div>
          <HeavyUsersCard day={day} />
        </div>
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/provinces" params="date&limit" /></div>
          <TopProvincesCard day={day} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          E — Action Items
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="E" title="Action Items" />
      <div className="card p-4" style={{ borderLeft: '3px solid var(--brand-500)' }}>
        <div className="text-[14px] font-bold text-[var(--dark)] mb-2 flex items-center gap-2">
          <i className="ti ti-target text-[var(--brand-500)]" /> สิ่งที่ควรทำ
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
          <div>
            <div className="font-bold text-[var(--positive)] mb-1">🏆 VIP Program</div>
            <div className="text-[11px] text-[var(--text-secondary)]">Champion 1,388 → early access รางวัลพิเศษ + LINE OA direct</div>
          </div>
          <div>
            <div className="font-bold text-[#d97706] mb-1">⚠️ At-Risk Re-engage</div>
            <div className="text-[11px] text-[var(--text-secondary)]">1,959 → push "ตอนนี้ยังมีรางวัล X ใบเหลือ" 7 วันก่อน churn</div>
          </div>
          <div>
            <div className="font-bold text-[var(--danger)] mb-1">🔄 Win-back Lost</div>
            <div className="text-[11px] text-[var(--text-secondary)]">1,383 → coupon ลด 30% + reactivate prompt</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────
// Cohort Retention (kept as embedded — uses week-cohort)
// ────────────────────────────────────────────────
function CohortRetentionCard() {
  const rows = [
    { name: '16 พ.ค. cohort', w0: 100, w1: 48, w2: null, w3: null, count: 440 },
    { name: '17 พ.ค. cohort', w0: 100, w1: 45, w2: null, w3: null, count: 460 },
    { name: '18 พ.ค. cohort', w0: 100, w1: null, w2: null, w3: null, count: 480 },
    { name: '19 พ.ค. cohort', w0: 100, w1: null, w2: null, w3: null, count: 308 },
  ]
  return (
    <div className="card p-4">
      <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">📅 Cohort Retention</h3>
      <p className="text-[11.5px] text-[var(--text-muted)] mb-3">W0 / W1 / W2 / W3 — % กลับมาสแกนซ้ำ</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-left  py-2 px-3 font-bold">Cohort</th>
              <th className="text-center py-2 px-3 font-bold">W0</th>
              <th className="text-center py-2 px-3 font-bold">W1</th>
              <th className="text-center py-2 px-3 font-bold">W2</th>
              <th className="text-center py-2 px-3 font-bold">W3</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.name} className="border-b border-[var(--border-soft)]">
                <td className="py-2 px-3 font-medium text-[var(--dark)]">
                  {c.name} <span className="text-[9px] text-[var(--text-muted)]">({c.count})</span>
                </td>
                {[c.w0, c.w1, c.w2, c.w3].map((v, i) => (
                  <td key={i} className="text-center py-2 px-3">
                    {v !== null ? (
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        v >= 70 ? 'bg-[var(--brand-500)] text-white' :
                        v >= 40 ? 'bg-[var(--brand-100)] text-[var(--brand-800)]' :
                                  'bg-yellow-100 text-yellow-800'
                      }`}>{v}%</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <InsightInline html="W1 retention ~45-48% — ตั้ง <b>2nd-scan bonus</b> ใน Day 2-3 เพื่อ activate กลุ่ม drop-off" />
      <div className="mt-2 text-[10px] text-[var(--text-muted)] italic">
        ⏳ W2+ data ยังไม่พอ — รอ data ถึง 30 พ.ค.
      </div>
    </div>
  )
}
