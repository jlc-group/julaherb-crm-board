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
import TimeOfDayChart from '@/components/ui/TimeOfDayChart'
import TrendLineChart from '@/components/ui/TrendLineChart'
import WeekdayMatchedCard from '@/components/ui/WeekdayMatchedCard'

import { DAILY_ENTRIES } from '@/lib/daily-update-data'  // ใช้สำหรับ chart components ที่ต้องการ timeOfDay/peakHours fields (ยังไม่มี API endpoint รองรับ)
import { numFmt } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { ScansTotalsResponse, MembersDailyResponse, UptimeResponse, DailyRow } from '@/lib/api/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'

export default function OverviewTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: new Date('2026-05-24') }))

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
  // ที่มาข้อมูล: src/lib/api/mock-source.ts (อ่านจาก daily-update-data.ts เหมือนเดิม)
  // เปลี่ยน DATA_SOURCE=db ใน .env.local → ดึงจาก Postgres แทนได้โดยไม่แก้ component
  // ป้าย "Live": refresh เงียบๆ ทุก 30 วิ (polling สุภาพ — หยุดเมื่อสลับแท็บ + backoff เมื่อ error)
  const LIVE_REFRESH_MS = 30_000
  const apiTotals = useApi<ScansTotalsResponse>(`/api/scans/totals?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  const apiMembers = useApi<MembersDailyResponse>(`/api/members/daily?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  const apiUptime = useApi<UptimeResponse>(`/api/system/uptime?from=${range.from}&to=${range.to}`, { refreshMs: LIVE_REFRESH_MS })
  // Fetch full campaign range for tables (always show all days regardless of date filter)
  const apiDaily = useApi<DailyRow[]>(`/api/daily?from=2026-05-16&to=2026-05-24`)

  // Aggregate KPI for multi-day mode (static fallback ระหว่าง API loading)
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

  return (
    <div className="space-y-4">
      {/* ── 1+2. STICKY HEADER (Title + Date range ติดมาด้วยกัน) ── */}
      <div className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3"
           style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}>
        <TabHeader
          icon="📊"
          title="Scan Overview"
          subtitle="รายงานการสแกน QR แคมเปญ • 16 พ.ค. – 18 ธ.ค. 2026"
        />
        <UnifiedDateRange value={range} onChange={setRange} today={new Date('2026-05-24')} />
      </div>

      {/* ── 3. ALERT BAR ── */}
      <div className="mb-1"><ApiSourceBadge endpoint="/api/system/uptime" params="from&to → outages[]" /></div>
      <AlertBar />

      {/* ════════════════════════════════════════════════════
          ZONE 1 — KPI Snapshot (per-day)
          🔌 Wired to internal API (/api/scans/totals, /api/members/daily, /api/system/uptime)
          → Falls back to static aggregation during loading or on API failure
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="A" title="ภาพรวม" dayTag={dayTag} />
      {(() => {
        // Prefer API data when available; fallback to static-derived agg
        const successVal = apiTotals.data?.success ?? agg.success
        const ticketsVal = apiTotals.data?.tickets ?? agg.tickets
        const expectedVal = apiTotals.data?.expectedTickets ?? agg.expectedTickets
        const dupSelfVal = apiTotals.data?.dupSelf ?? agg.dupSelf
        const dupOtherVal = apiTotals.data?.dupOther ?? agg.dupOther
        const notFoundVal = apiTotals.data?.notFound ?? agg.notFound
        const successRateVal = apiTotals.data?.successRate ?? agg.successRate
        const apiMemberNew = apiMembers.data?.totals.memberNew ?? agg.memberNew
        const apiMemberOld = apiMembers.data?.totals.memberOld ?? agg.memberOld
        const apiOutage = apiUptime.data?.outages?.[0] ?? agg.outageDay?.outage

        const attempts = successVal + dupSelfVal + dupOtherVal + notFoundVal
        const dbGap = expectedVal - ticketsVal
        const outageInfo = apiOutage

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
            {/* CARD 1 — สแกนสำเร็จ */}
            <div className="kpi-accent kpi-scans"
                 title={`สแกนสำเร็จในช่วง ${dayTag} — ไม่นับซ้ำตัวเอง/ซ้ำคนอื่น/ไม่พบ\nเป็นตัวเลขที่ใช้คำนวณสิทธิ์`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
                ⭐ สแกนสำเร็จ {apiBadge}
              </div>
              <div className="text-[26px] font-bold leading-tight">{numFmt(successVal)}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">จาก {numFmt(attempts)} ครั้ง • {successRateVal.toFixed(1)}%</div>
            </div>

            {/* CARD 2 — 🎟️ สิทธิ์ตามสเปก (HERO) */}
            <div className="kpi-accent kpi-success"
                 title={`สิทธิ์ที่ควรได้ตามสเปก Excel — Σ(scans × rightsPerScan)\nDB ปัจจุบัน: ${numFmt(ticketsVal)} ใบ (1:1 bug)\nตามสเปก: ${numFmt(expectedVal)} ใบ\nขาดหายไป: ${numFmt(dbGap)} ใบ`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
                🎟️ สิทธิ์ตามสเปก {apiBadge}
              </div>
              <div className="text-[26px] font-bold leading-tight">{numFmt(expectedVal)}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">
                DB {numFmt(ticketsVal)}{dbGap > 0 && <> • <span className="text-red-600 font-bold">−{numFmt(dbGap)}</span></>}
              </div>
            </div>

            {/* CARD 3 — 👥 สมาชิก */}
            <div className="kpi-accent kpi-users"
                 title={`สมาชิกในช่วง ${dayTag}\n• สมัครใหม่: ${numFmt(apiMemberNew)} คน\n• เก่ามาสแกน: ${numFmt(apiMemberOld)} คน${day.memberTotal ? `\n• สะสมระบบ (ล่าสุด): ${numFmt(day.memberTotal)} คน` : ''}`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
                👥 สมาชิก {!apiMembers.loading && !apiMembers.error && apiMembers.data ? <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 align-middle">🟢 API</span> : null}
              </div>
              <div className="text-[26px] font-bold leading-tight">{numFmt(apiMemberNew + apiMemberOld)}</div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">
                ใหม่ <b className="text-[var(--green-700)]">{numFmt(apiMemberNew)}</b> + เก่า {numFmt(apiMemberOld)}
              </div>
            </div>

            {/* CARD 4 — สถานะระบบ */}
            <div className="kpi-accent kpi-new"
                 title={outageInfo
                   ? `🚨 พบ outage ${outageInfo.durationHours.toFixed(1)} ชม. — ${outageInfo.start.split('T')[0]}\nช่วงเวลา: ${outageInfo.start.split('T')[1].slice(0,5)} – ${outageInfo.end.split('T')[1].slice(0,5)}\nสาเหตุ: ${outageInfo.cause}`
                   : `ระบบทำงานปกติในช่วงนี้ — ไม่มี outage รายงาน`}>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">
                {outageInfo ? '🚨 สถานะ' : '✅ สถานะ'} <ApiSourceBadge endpoint="/api/system/uptime" params="from&to" />
              </div>
              <div className={`text-[26px] font-bold leading-tight ${outageInfo ? 'text-red-600' : 'text-[var(--green-700)]'}`}>
                {outageInfo ? `ล่ม ${outageInfo.durationHours.toFixed(1)}ชม.` : 'ปกติ'}
              </div>
              <div className="text-[12px] text-[var(--text-muted)] mt-1">
                {outageInfo ? outageInfo.cause.split('—')[0].slice(0, 30) : `${selectedDays.length} วัน ใน range`}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ════════════════════════════════════════════════════
          ZONE 2 — Trend + ตารางสแกน + ตารางสมาชิก (รายวันตาม range)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="B" title="แนวโน้ม + ตารางรายวัน (สแกน / สมาชิก)" dayTag={dayTag} />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/scans/timeseries" params="from&to" /></div>
      <TrendLineChart days={selectedDays} rangeLabel={dayTag} />

      {/* ───────────────────────────────────────────────────
          📱 ตาราง A — สถิติสแกน (ครั้ง / events)
      ─────────────────────────────────────────────────── */}
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
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-[var(--text-secondary)] text-[10px] tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
                <th className="text-left  py-2 px-2 font-bold cursor-help" title="วันที่ของรายงาน">วันที่</th>
                <th className="text-left  py-2 px-2 font-bold cursor-help" title="วันในสัปดาห์">วัน</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-green-50" title="⭐ จำนวนครั้งที่สแกน QR สำเร็จ — ตัวนี้คือที่ใช้นับสิทธิ์">⭐ สำเร็จ</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่สำเร็จ (Newly) — ประเภทอื่นๆ ที่ไม่ใช่ ซ้ำตัวเอง/ซ้ำคนอื่น/ไม่พบ • ปกติ = 0">⛔ ไม่สำเร็จ</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่นับ — คนสแกน QR เดิม 2 ครั้ง">⛔ ซ้ำตัวเอง</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่นับ — สแกน QR ที่คนอื่นใช้แล้ว (อาจเป็น QR ก๊อปปี้)">⛔ ซ้ำคนอื่น</th>
                <th className="text-right py-2 px-2 font-bold bg-red-50 cursor-help" title="ไม่นับ — QR ที่ไม่อยู่ในระบบ (พิมพ์ผิด/เก่า/ก๊อป)">⛔ ไม่พบ</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สแกนทั้งหมด = สำเร็จ + ไม่สำเร็จ + ซ้ำตัวเอง + ซ้ำคนอื่น + ไม่พบ">รวม</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สำเร็จ ÷ รวมทั้งหมด × 100">% สำเร็จ</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-yellow-50" title="สิทธิ์ตามสเปก Excel = Σ(scans × rightsPerScan) — เช่น L3-40G ×5, D3-70G ×2&#10;(DB ปัจจุบันให้ 1:1 ทุก SKU — bug)">🎟️ สิทธิ์ (สเปก)</th>
                <th className="text-center py-2 px-2 font-bold cursor-help" title="ลักษณะเด่นของวัน">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {(apiDaily.data ?? DAILY_ENTRIES).map(d => {
                const failedOther = (d as { scanFailedOther?: number }).scanFailedOther ?? 0
                const attempts = d.success + failedOther + d.dupSelf + d.dupOther + (d.notFound ?? 0)
                const sourceList = apiDaily.data ?? DAILY_ENTRIES
                const tag = d.outage ? { l: 'ระบบล่ม 6 ชม.', c: 'chip-red' }
                          : d.success === Math.max(...sourceList.map(x => x.success)) ? { l: 'peak', c: '' }
                          : d.date === sourceList[0].date ? { l: 'วันแรก', c: 'chip-gray' }
                          : { l: 'วันธรรมดา', c: 'chip-blue' }
                return (
                  <tr key={d.date} className={`border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)] ${d.outage ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2 px-2 font-bold text-[var(--dark)]">{d.date.split('-')[2]} พ.ค.</td>
                    <td className="py-2 px-2 text-[var(--text-muted)]">{d.weekday}</td>
                    <td className="text-right py-2 px-2 num text-[var(--green-700)] font-bold bg-green-50/40"
                        title={d.tickets < d.success ? `DB tickets: ${numFmt(d.tickets)} (น้อยกว่าสำเร็จ ${d.success - d.tickets} จาก race condition — ไม่ critical)` : `DB tickets: ${numFmt(d.tickets)}`}>
                      {numFmt(d.success)}
                    </td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)] bg-red-50/40">{numFmt(failedOther)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)] bg-red-50/40">{numFmt(d.dupSelf)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)] bg-red-50/40">{numFmt(d.dupOther)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--red)] bg-red-50/40">{numFmt(d.notFound ?? 0)}</td>
                    <td className="text-right py-2 px-2 num font-semibold">{numFmt(attempts)}</td>
                    <td className="text-right py-2 px-2 num font-bold" style={{ color: d.successRate >= 89 ? 'var(--green-700)' : '#ca8a04' }}>{d.successRate.toFixed(1)}%</td>
                    <td className="text-right py-2 px-2 num font-bold text-[var(--green-700)] bg-yellow-50/40"
                        title={d.expectedTickets ? `Σ(scans × rightsPerScan จาก Excel master) = ${numFmt(d.expectedTickets)} ใบ\nDB ปัจจุบัน: ${numFmt(d.tickets)} ใบ (ขาด ${numFmt(d.expectedTickets - d.tickets)} ใบ)` : ''}>
                      {d.expectedTickets != null ? numFmt(d.expectedTickets) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="text-center py-2 px-2"><span className={`chip ${tag.c} text-[9.5px]`}>{tag.l}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────
          👥 ตาราง B — สมาชิก (คน / people)
      ─────────────────────────────────────────────────── */}
      <div className="card p-4">
        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-[14px] font-bold text-[var(--dark)]">👥 สมาชิก (รายวัน)</h3>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">หน่วย: คน</span>
          <ApiSourceBadge endpoint="/api/members/daily" params="from&to" />
        </div>
        <p className="text-[11.5px] text-[var(--text-muted)] mb-3">
          ใหม่ = สมัครใหม่วันนี้ • เก่า = สมาชิกเก่าที่มาวันนี้ • สะสม = สมาชิกทั้งหมดในระบบ (cumulative)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-[var(--text-secondary)] text-[10px] tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
                <th className="text-left  py-2 px-2 font-bold">วันที่</th>
                <th className="text-left  py-2 px-2 font-bold">วัน</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-green-50" title="สมาชิกที่สมัครใหม่วันนี้ (คน)">🆕 ใหม่</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สมาชิกเก่าที่มาวันนี้ (คน)">🔁 เก่า</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="รวมที่มาวันนี้ = ใหม่ + เก่า (คน)">รวมวันนี้</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="จำนวนคนไม่ซ้ำที่สแกนวันนั้น (unique scanners)">ผู้สแกน</th>
                <th className="text-right py-2 px-2 font-bold cursor-help bg-yellow-50" title="สมาชิกสะสมทั้งหมดในระบบ (cumulative สิ้นวัน)">📈 สมาชิกสะสม</th>
                <th className="text-right py-2 px-2 font-bold cursor-help" title="สมัครวันนั้นแต่ยังไม่สแกน">สมัครไม่ scan</th>
              </tr>
            </thead>
            <tbody>
              {(apiDaily.data ?? DAILY_ENTRIES).map(d => {
                const dailyAny = d as { memberNew?: number; newSignup?: number; memberOld?: number; newScanned?: number; memberTotal?: number; signedNotScanned?: number }
                const mNew = dailyAny.memberNew ?? dailyAny.newSignup ?? 0
                const mOld = dailyAny.memberOld ?? ((d.uniqueUsers ?? 0) - (dailyAny.newScanned ?? 0))
                const mTotal = dailyAny.memberTotal
                return (
                  <tr key={d.date} className={`border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)] ${d.outage ? 'bg-red-50/40' : ''}`}>
                    <td className="py-2 px-2 font-bold text-[var(--dark)]">{d.date.split('-')[2]} พ.ค.</td>
                    <td className="py-2 px-2 text-[var(--text-muted)]">{d.weekday}</td>
                    <td className="text-right py-2 px-2 num text-[var(--green-700)] font-bold bg-green-50/40">{numFmt(mNew)}</td>
                    <td className="text-right py-2 px-2 num">{numFmt(mOld)}</td>
                    <td className="text-right py-2 px-2 num font-semibold">{numFmt(mNew + mOld)}</td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)]">{numFmt(d.uniqueUsers ?? 0)}</td>
                    <td className="text-right py-2 px-2 num font-bold text-[var(--dark)] bg-yellow-50/40">
                      {mTotal != null ? numFmt(mTotal) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="text-right py-2 px-2 num text-[var(--text-muted)]">{numFmt(dailyAny.signedNotScanned ?? 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-[10.5px] text-[var(--text-muted)] flex items-center gap-2">
          <span>💡</span>
          <span>"รวมวันนี้" อาจ ≠ "ผู้สแกน" เพราะ <b>สมาชิก = ทุก activity (login/scan/redeem)</b> ส่วน <b>ผู้สแกน = สแกนจริง</b> เท่านั้น</span>
        </div>
      </div>

      {/* Info callout: DB ticket bug impact */}
      <div className="card p-3 flex items-start gap-3 text-[12px]" style={{ background: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1.5 }}>
        <span className="text-[20px] flex-shrink-0">🟡</span>
        <div className="flex-1">
          <div className="font-bold text-yellow-800 mb-1">DB Bug: ขาดสิทธิ์ ~11,500 ใบ ในแคมเปญ 5 วัน</div>
          <div className="text-[11px] text-[var(--text)] leading-relaxed">
            <b>ตามสเปก Excel:</b> SKU 40g/70g/30g บางตัวให้ <b>2-5 สิทธิ์/scan</b> (L3-40G ×5, D3-70G ×2, C4-35G ×4 ฯลฯ)
            <br/>
            <b>DB ตอนนี้:</b> ให้ <b>1 สิทธิ์ทุก scan ทุก SKU</b> (1:1 bug) + บางวัน race condition เล็กน้อย
            <br/>
            <b>ตัวเลขจริง 5 วัน:</b> DB <b>35,651 ใบ</b> vs ตามสเปก <b>47,127 ใบ</b> → <b className="text-red-700">ขาด 11,476 ใบ (~32%)</b> ส่วนใหญ่จาก L3-40G, L4-40G, L10-30G, L6-40G, L7-30G — <b>ต้อง verify + แก้ DB ก่อน prize draw</b>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          C — เวลาที่สแกน (TimeOfDay only)
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="C" title="เวลาที่สแกน" dayTag={dayTag} />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/scans/time-of-day" params="from&to" /></div>
      <TimeOfDayChart days={selectedDays} rangeLabel={dayTag} />

      {/* ════════════════════════════════════════════════════
          D — เทียบเดือน + แผน
      ════════════════════════════════════════════════════ */}
      <ZoneTitle num="D" title="เทียบเดือน + แผน" />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/baseline/compare" params="from&to" /></div>
      <BaselineComparison />
      <div className="mb-1"><ApiSourceBadge endpoint="/api/baseline/compare" params="from&to" /></div>
      <WeekdayMatchedCard />
      <RecommendationsZone />

      {/* Footer: where did the other widgets go? */}
      <div className="card p-3 flex items-center gap-3 text-[11px] text-[var(--text-muted)]"
           style={{ background: 'var(--brand-50)', borderLeft: '3px solid var(--brand-500)' }}>
        <i className="ti ti-info-circle text-[var(--brand-700)] text-base" />
        <span>
          ดูข้อมูลรายลูกค้า (Heavy Users, จังหวัด, Engagement, Segment) ที่หน้า <b className="text-[var(--brand-700)]">Customers</b>
          &nbsp;•&nbsp; ดู Top SKU รายวัน ที่หน้า <b className="text-[var(--brand-700)]">Products</b>
        </span>
      </div>
    </div>
  )
}
