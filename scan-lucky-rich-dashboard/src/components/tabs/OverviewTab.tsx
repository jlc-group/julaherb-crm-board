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
import AlertBar from '@/components/ui/AlertBar'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'
import RecommendationsZone from '@/components/ui/RecommendationsZone'
import BaselineComparison from '@/components/ui/BaselineComparison'
import TrendLineChart from '@/components/ui/TrendLineChart'
import WeekdayMatchedCard from '@/components/ui/WeekdayMatchedCard'
import YearOverviewCard from '@/components/ui/YearOverviewCard'
import WeeklyMomentumCard from '@/components/ui/WeeklyMomentumCard'
import MonthlyScanRightsCard from '@/components/ui/MonthlyScanRightsCard'
import ScanHeatmapLive from '@/components/ui/ScanHeatmapLive'

import { DAILY_ENTRIES } from '@/lib/daily-update-data'  // ใช้สำหรับ chart components ที่ต้องการ timeOfDay/peakHours fields (ยังไม่มี API endpoint รองรับ)
import { numFmt, getCampaignToday } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { ScansTotalsResponse, MembersDailyResponse, UptimeResponse, DailyRow } from '@/lib/api/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Inter', 'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'

export default function OverviewTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: getCampaignToday() }))
  const [tablesOpen, setTablesOpen] = useState(false) // พับตารางรายวัน (minimal)

  // Resolve range → days array → primary day
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
    ? ` (ข้อมูล ${selectedDays.length})`
    : ''
  const dayTag = isMultiDay
    ? `${rangeDayCount} วัน${dataLabel}`
    : `${range.from.split('-')[2]} พ.ค.`

  // ─── API fetch (Layer 1: internal /api/* with adapter) ───
  const LIVE_REFRESH_MS = 30_000
  const apiTotals = useApi<ScansTotalsResponse>(`/api/scans/totals?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  const apiMembers = useApi<MembersDailyResponse>(`/api/members/daily?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  const apiUptime = useApi<UptimeResponse>(`/api/system/uptime?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  const apiDaily = useApi<DailyRow[]>(`/api/daily?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  const dailyRows = apiDaily.data ?? selectedDays
  const dailyTableRows = useMemo(() => [...dailyRows].sort((a, b) => b.date.localeCompare(a.date)), [dailyRows])
  const firstDate = useMemo(() => dailyRows.reduce((min, d) => (d.date < min ? d.date : min), dailyRows[0]?.date ?? ''), [dailyRows])
  const TH_MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const fmtDay = (date: string) => { const p = date.split('-'); return `${parseInt(p[2])} ${TH_MO[parseInt(p[1]) - 1]}` }

  const agg = useMemo(() => {
    const days = selectedDays.length > 0 ? selectedDays : [day]
    return {
      success: days.reduce((s, d) => s + d.success, 0),
      tickets: days.reduce((s, d) => s + d.tickets, 0),
      expectedTickets: days.reduce((s, d) => s + (d.expectedTickets ?? d.tickets), 0),
      dupSelf: days.reduce((s, d) => s + d.dupSelf, 0),
      dupOther: days.reduce((s, d) => s + d.dupOther, 0),
      notFound: days.reduce((s, d) => s + d.notFound, 0),
      memberNew: days.reduce((s, d) => s + (d.memberNew ?? d.newSignup), 0),
      memberOld: days.reduce((s, d) => s + (d.memberOld ?? (d.uniqueUsers - d.newScanned)), 0),
      uniqueUsers: days.reduce((s, d) => s + d.uniqueUsers, 0),
      successRate: (() => {
        const ok = days.reduce((s, d) => s + d.success, 0)
        const all = days.reduce((s, d) => s + d.success + d.dupSelf + d.dupOther + d.notFound, 0)
        return all > 0 ? (ok / all) * 100 : 0
      })(),
      outageDay: days.find(d => d.outage),
    }
  }, [selectedDays, day])

  // ── ตารางรายวัน (พับเก็บ) — แยกเป็นตัวแปรเพื่อจัดลำดับได้ ──
  const dailyTablesBlock = (
    <>
      <button
        onClick={() => setTablesOpen(o => !o)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] text-[12.5px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition"
      >
        <i className={`ti ti-chevron-${tablesOpen ? 'up' : 'down'} text-base`} />
        {tablesOpen ? 'ซ่อนตารางรายวัน' : `ดูตารางรายวัน (สแกน + สมาชิก · ${rangeDayCount} วัน)`}
      </button>

      {tablesOpen && (<>
      {/* 📱 ตาราง A — สถิติสแกน */}
      <div className="card p-4">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-[14px] font-bold text-[var(--dark)]">📱 สถิติสแกน (รายวัน)</h3>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">หน่วย: ครั้ง</span>
          <ApiSourceBadge endpoint="/api/daily" params="from&to" />
        </div>
        <p className="text-[11.5px] text-[var(--text-muted)] mb-2">
          แยกประเภทการสแกน • <b className="text-[var(--green-700)]">สแกนสำเร็จ</b> = ตัวที่ใช้นับสิทธิ์ • Hover หัวคอลัมน์เพื่อดูคำอธิบาย
        </p>
        <div className="flex flex-wrap gap-3 mb-3 text-[10.5px]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded" />
            <span className="text-[var(--text-secondary)]">คอลัมน์สีแดง = <b>ไม่นับรวมในสแกนสำเร็จ</b></span>
          </span>
        </div>
        {(() => {
          const sSuccess = dailyRows.reduce((s, d) => s + d.success, 0)
          const sDupSelf = dailyRows.reduce((s, d) => s + d.dupSelf, 0)
          const sDupOther = dailyRows.reduce((s, d) => s + d.dupOther, 0)
          const sNotFound = dailyRows.reduce((s, d) => s + (d.notFound ?? 0), 0)
          const sFailed = dailyRows.reduce((s, d) => s + ((d as { scanFailedOther?: number }).scanFailedOther ?? 0), 0)
          const sAttempts = sSuccess + sDupSelf + sDupOther + sNotFound + sFailed
          const sSpec = dailyRows.reduce((s, d) => s + (d.expectedTickets ?? d.tickets), 0)
          const rate = sAttempts > 0 ? (sSuccess / sAttempts) * 100 : 0
          return (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
              <MiniStat label="⭐ สแกนสำเร็จ" value={numFmt(sSuccess)} tone="green" />
              <MiniStat label="การสแกนทั้งหมด" value={numFmt(sAttempts)} tone="plain" />
              <MiniStat label="% สำเร็จ" value={`${rate.toFixed(1)}%`} tone="plain" />
              <MiniStat label="⛔ ซ้ำ/ไม่พบ" value={numFmt(sDupSelf + sDupOther + sNotFound + sFailed)} tone="red" />
              <MiniStat label="🎟️ สิทธิ์ (สเปก)" value={numFmt(sSpec)} tone="gold" />
            </div>
          )
        })()}
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-[var(--text-secondary)] text-[10px] tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
                <th className="text-left  py-2 px-2 font-bold cursor-help" title="วันที่ของรายงาน">วันที่</th>
                <th className="text-left  py-2 px-2 font-bold cursor-help" title="วันในสัปดาห์">วัน</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-green-50" title="⭐ จำนวนครั้งที่สแกน QR สำเร็จ — ตัวนี้คือที่ใช้นับสิทธิ์">⭐ สำเร็จ</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่สำเร็จ (Newly)">⛔ ไม่สำเร็จ</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่นับ — คนสแกน QR เดิม 2 ครั้ง">⛔ ซ้ำตัวเอง</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่นับ — สแกน QR ที่คนอื่นใช้แล้ว">⛔ ซ้ำคนอื่น</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่นับ — QR ที่ไม่อยู่ในระบบ">⛔ ไม่พบ</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สแกนทั้งหมด">รวม</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สำเร็จ ÷ รวม × 100">% สำเร็จ</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-yellow-50" title="สิทธิ์ตามสเปก">🎟️ สิทธิ์ (สเปก)</th>
                <th className="text-center py-2 px-2 font-bold cursor-help" title="ลักษณะเด่นของวัน">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {dailyTableRows.map(d => {
                const failedOther = (d as { scanFailedOther?: number }).scanFailedOther ?? 0
                const attempts = d.success + failedOther + d.dupSelf + d.dupOther + (d.notFound ?? 0)
                const maxSuccess = Math.max(...dailyRows.map(x => x.success))
                const tag = d.outage ? { l: 'ระบบล่ม', c: 'chip-red' }
                          : d.success === maxSuccess ? { l: 'peak', c: '' }
                          : d.date === firstDate ? { l: 'วันแรก', c: 'chip-gray' }
                          : { l: 'วันธรรมดา', c: 'chip-blue' }
                return (
                  <tr key={d.date} className={`border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)] ${d.outage ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2 px-2 font-bold text-[var(--dark)]">{fmtDay(d.date)}</td>
                    <td className="py-2 px-2 text-[var(--text-muted)]">{d.weekday}</td>
                    <td className="text-right py-2 px-2 num text-[var(--green-700)] font-bold bg-green-50/40">{numFmt(d.success)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)] bg-red-50/40">{numFmt(failedOther)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)] bg-red-50/40">{numFmt(d.dupSelf)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)] bg-red-50/40">{numFmt(d.dupOther)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--red)] bg-red-50/40">{numFmt(d.notFound ?? 0)}</td>
                    <td className="text-right py-2 px-2 num font-semibold">{numFmt(attempts)}</td>
                    <td className="text-right py-2 px-2 num font-bold" style={{ color: d.successRate >= 89 ? 'var(--green-700)' : '#ca8a04' }}>{d.successRate.toFixed(1)}%</td>
                    <td className="text-right py-2 px-2 num font-bold text-[var(--green-700)] bg-yellow-50/40">{d.expectedTickets != null ? numFmt(d.expectedTickets) : <span className="text-[var(--text-muted)]">—</span>}</td>
                    <td className="text-center py-2 px-2"><span className={`chip ${tag.c} text-[9.5px]`}>{tag.l}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👥 ตาราง B — สมาชิก */}
      <div className="card p-4">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-[14px] font-bold text-[var(--dark)]">👥 สมาชิก (รายวัน)</h3>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">หน่วย: คน</span>
          <ApiSourceBadge endpoint="/api/members/daily" params="from&to" />
        </div>
        <p className="text-[11.5px] text-[var(--text-muted)] mb-3">
          ใหม่ = สมัครใหม่วันนี้ • เก่า = สมาชิกเก่าที่มาวันนี้ • สะสม = สมาชิกทั้งหมดในระบบ
        </p>
        {(() => {
          const mNew = dailyRows.reduce((s, d) => s + (d.memberNew ?? (d as { newSignup?: number }).newSignup ?? 0), 0)
          const mOld = dailyRows.reduce((s, d) => s + (d.memberOld ?? 0), 0)
          const scanners = dailyRows.reduce((s, d) => s + d.uniqueUsers, 0)
          const lastTotal = [...dailyRows].reverse().find(d => d.memberTotal != null)?.memberTotal
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <MiniStat label="🆕 สมัครใหม่ (รวม)" value={numFmt(mNew)} tone="green" />
              <MiniStat label="🔁 เก่ามาสแกน (รวม)" value={numFmt(mOld)} tone="plain" />
              <MiniStat label="ผู้สแกนสะสม" value={numFmt(scanners)} tone="plain" sub="นับซ้ำรายวัน" />
              <MiniStat label="📈 สมาชิกสะสม (ล่าสุด)" value={lastTotal != null ? numFmt(lastTotal) : '—'} tone="gold" />
            </div>
          )
        })()}
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-[var(--text-secondary)] text-[10px] tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
                <th className="text-left  py-2 px-2 font-bold">วันที่</th>
                <th className="text-left  py-2 px-2 font-bold">วัน</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-green-50" title="สมัครใหม่วันนี้">🆕 ใหม่</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สมาชิกเก่าที่มาวันนี้">🔁 เก่า</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="ใหม่ + เก่า">รวมวันนี้</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="คนไม่ซ้ำที่สแกนวันนั้น">ผู้สแกน</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-yellow-50" title="สมาชิกสะสม cumulative">📈 สมาชิกสะสม</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สมัครวันนั้นแต่ยังไม่สแกน">สมัครไม่ scan</th>
              </tr>
            </thead>
            <tbody>
              {dailyTableRows.map(d => {
                const dailyAny = d as { memberNew?: number; newSignup?: number; memberOld?: number; newScanned?: number; memberTotal?: number; signedNotScanned?: number }
                const mNew = dailyAny.memberNew ?? dailyAny.newSignup ?? 0
                const mOld = dailyAny.memberOld ?? ((d.uniqueUsers ?? 0) - (dailyAny.newScanned ?? 0))
                const mTotal = dailyAny.memberTotal
                return (
                  <tr key={d.date} className={`border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)] ${d.outage ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2 px-2 font-bold text-[var(--dark)]">{fmtDay(d.date)}</td>
                    <td className="py-2 px-2 text-[var(--text-muted)]">{d.weekday}</td>
                    <td className="text-right py-2 px-2 num text-[var(--green-700)] font-bold bg-green-50/40">{numFmt(mNew)}</td>
                    <td className="text-right py-2 px-2 num">{numFmt(mOld)}</td>
                    <td className="text-right py-2 px-2 num font-semibold">{numFmt(mNew + mOld)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)]">{numFmt(d.uniqueUsers ?? 0)}</td>
                    <td className="text-right py-2 px-2 num font-bold text-[var(--dark)] bg-yellow-50/40">{mTotal != null ? numFmt(mTotal) : <span className="text-[var(--text-muted)]">—</span>}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)]">{numFmt(dailyAny.signedNotScanned ?? 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>)}
    </>
  )

  return (
    <div className="space-y-4">
      {/* ── STICKY HEADER (Title + Date range) ── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3"
           style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}>
        <TabHeader icon="📊" title="Scan Overview" subtitle="รายงานการสแกน QR แคมเปญ • 16 พ.ค. – 18 ธ.ค. 2026" />
        <UnifiedDateRange value={range} onChange={setRange} today={getCampaignToday()} />
      </div>

      {/* ── ALERT BAR ── */}
      <AlertBar outages={apiUptime.data?.outages} />

      {/* 1) ภาพรวมการสแกนทั้งปี (มิ.ย. API จริง + forecast · ม.ค.–พ.ค. สไลด์) */}
      <YearOverviewCard />

      {/* 2) ภาพรวม — KPI Snapshot (real API) */}
      <ZoneTitle num="A" title="ภาพรวม" dayTag={dayTag} />
      {(() => {
        const successVal = apiTotals.data?.success ?? agg.success
        const ticketsVal = apiTotals.data?.tickets ?? agg.tickets
        const expectedVal = apiTotals.data?.expectedTickets ?? agg.expectedTickets
        const dupSelfVal = apiTotals.data?.dupSelf ?? agg.dupSelf
        const dupOtherVal = apiTotals.data?.dupOther ?? agg.dupOther
        const notFoundVal = apiTotals.data?.notFound ?? agg.notFound
        const successRateVal = apiTotals.data?.successRate ?? agg.successRate
        const apiMemberNew = apiMembers.data?.totals.memberNew ?? agg.memberNew
        const apiMemberOld = apiMembers.data?.totals.memberOld ?? agg.memberOld
        const apiOutage = apiUptime.data?.outages?.find(o => o.isOngoing) ?? null

        const attempts = successVal + dupSelfVal + dupOtherVal + notFoundVal
        const dbGap = expectedVal - ticketsVal
        const outageInfo = apiOutage
        const lastResolvedOutage = apiUptime.data?.outages?.find(o => !o.isOngoing)

        const apiLoaded = !apiTotals.loading && !apiTotals.error && apiTotals.data
        const apiBadge = apiLoaded
          ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 align-middle">🟢 API</span>
          : apiTotals.loading
            ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-yellow-100 text-yellow-800 align-middle">⏳ Loading</span>
            : apiTotals.error
              ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-800 align-middle" title={apiTotals.error}>⚠️ {apiTotals.error}</span>
              : null
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="kpi-accent kpi-scans" title={`สแกนสำเร็จในช่วง ${dayTag}`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">⭐ สแกนสำเร็จ {apiBadge}</div>
              <div className="text-[26px] font-bold leading-tight">{numFmt(successVal)}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">จาก {numFmt(attempts)} ครั้ง • {successRateVal.toFixed(1)}%</div>
            </div>
            <div className="kpi-accent kpi-success" title={`สิทธิ์ตามสเปก — DB ${numFmt(ticketsVal)} · สเปก ${numFmt(expectedVal)}`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">🎟️ สิทธิ์ตามสเปก {apiBadge}</div>
              <div className="text-[26px] font-bold leading-tight">{numFmt(expectedVal)}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">DB {numFmt(ticketsVal)}{dbGap > 0 && <> • <span className="text-red-600 font-bold">−{numFmt(dbGap)}</span></>}</div>
            </div>
            <div className="kpi-accent kpi-users" title={`สมาชิก — ใหม่ ${numFmt(apiMemberNew)} · เก่า ${numFmt(apiMemberOld)}`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">👥 สมาชิก {!apiMembers.loading && !apiMembers.error && apiMembers.data ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 align-middle">🟢 API</span> : null}</div>
              <div className="text-[26px] font-bold leading-tight">{numFmt(apiMemberNew + apiMemberOld)}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">ใหม่ <b className="text-[var(--green-700)]">{numFmt(apiMemberNew)}</b> + เก่า {numFmt(apiMemberOld)}</div>
            </div>
            <div className="kpi-accent kpi-new" title={outageInfo ? `🚨 outage ${outageInfo.durationHours.toFixed(1)} ชม.` : 'ระบบปกติ'}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">{outageInfo ? '🚨 สถานะ' : '✅ สถานะ'} <ApiSourceBadge endpoint="/api/system/uptime" params="from&to" /></div>
              <div className={`text-[26px] font-bold leading-tight ${outageInfo ? 'text-red-600' : 'text-[var(--green-700)]'}`}>{outageInfo ? `ล่ม ${outageInfo.durationHours.toFixed(1)}ชม.` : 'ปกติ'}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">{outageInfo ? outageInfo.cause.split('—')[0].slice(0, 30) : lastResolvedOutage ? `last ${lastResolvedOutage.durationHours.toFixed(1)}h resolved` : `${selectedDays.length} วัน ใน range`}</div>
            </div>
          </div>
        )
      })()}

      {/* 3) แนวโน้มการสแกน */}
      <ZoneTitle num="B" title="แนวโน้มการสแกน" dayTag={dayTag} />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/scans/timeseries" params="from&to" /></div>
      <TrendLineChart days={dailyRows} rangeLabel={dayTag} />
      <div className="text-[10.5px] text-[var(--text-muted)] -mt-2 mb-1 flex items-start gap-1.5 px-1">
        <span>ℹ️</span>
        <span><b>สิทธิ์ตามสเปก</b> = สแกนสำเร็จ × สิทธิ์ต่อสินค้า (เฉลี่ย ×1.36) — ค่าโดยประมาณ • <b>DB ออกจริง</b> ยังมี bug 1:1 จึงต่ำกว่าสเปก</span>
      </div>

      {/* 4) Weekly Momentum + เทียบรายเดือน (real API) */}
      <ZoneTitle num="C" title="Weekly Momentum + เทียบรายเดือน" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyMomentumCard />
        <MonthlyScanRightsCard />
      </div>

      {/* 5) เวลาที่สแกน (วัน × ชั่วโมง · real API) */}
      <ZoneTitle num="D" title="เวลาที่สแกน (วัน × ชั่วโมง)" dayTag={dayTag} />
      <ScanHeatmapLive from={range.from} to={range.to} />

      {/* 6) เทียบเดือน + แผน */}
      <ZoneTitle num="E" title="เทียบเดือน + แผน" />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/baseline/compare" params="from&to" /></div>
      <BaselineComparison from={range.from} to={range.to} />
      <RecommendationsZone />

      {/* 7) ตารางสแกน (รายวัน) — พับเก็บ */}
      <ZoneTitle num="F" title="สถิติสแกน (รายวัน)" dayTag={dayTag} />
      {dailyTablesBlock}

      {/* 8) Apples-to-Apples — เทียบ DoW (วันในสัปดาห์) */}
      <ZoneTitle num="G" title="Apples-to-Apples — เทียบ DoW (วันในสัปดาห์)" />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/baseline/compare" params="from&to" /></div>
      <WeekdayMatchedCard from={range.from} to={range.to} />

      {/* Footer */}
      <div className="card p-3 flex items-center gap-3 text-[11px] text-[var(--text-muted)]"
           style={{ background: 'var(--brand-50)', borderLeft: '3px solid var(--brand-500)' }}>
        <i className="ti ti-info-circle text-[var(--brand-700)] text-base" />
        <span>ดูข้อมูลรายลูกค้า (Heavy Users, จังหวัด, Engagement) ที่หน้า <b className="text-[var(--brand-700)]">Customers</b> &nbsp;•&nbsp; ดู Top SKU ที่หน้า <b className="text-[var(--brand-700)]">Products</b></span>
      </div>
    </div>
  )
}

// กล่องสรุปเล็ก
function MiniStat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: 'green' | 'gold' | 'red' | 'plain' }) {
  const c = tone === 'green' ? { bg: '#f0faf3', bd: '#15803d22', fg: 'var(--green-700)' }
          : tone === 'gold' ? { bg: '#fffbf0', bd: '#b4530922', fg: '#b45309' }
          : tone === 'red' ? { bg: '#fef4f2', bd: '#dc262622', fg: '#c0392b' }
          : { bg: 'var(--bg-soft)', bd: 'var(--border-soft)', fg: 'var(--dark)' }
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: c.bg, border: `1px solid ${c.bd}` }}>
      <div className="text-[10px] text-[var(--text-secondary)] font-semibold">{label}</div>
      <div className="text-[18px] num font-extrabold leading-tight" style={{ color: c.fg }}>{value}</div>
      {sub && <div className="text-[9px] text-[var(--text-muted)]">{sub}</div>}
    </div>
  )
}
