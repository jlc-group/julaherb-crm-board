'use client'
// 📈 ภาพรวมการสแกนทั้งปี (All Scan รายเดือน)
// ม.ค.–พ.ค. = ข้อมูลอ้างอิงจากสไลด์ (ระดับแพลตฟอร์ม · ยังไม่มี API)
// มิ.ย. = ข้อมูลจริงจาก /api/daily (totalAttempts = สแกนทั้งหมด) + คำนวณ forecast เอง
import type { ReactNode } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { numFmt, getCampaignToday } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { DailyRow } from '@/lib/api/types'
import { MONTHLY_ALL_SCAN } from '@/config/campaign-monthly'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLOR = { actual: '#1D9E75', partial: '#cbd5e1', forecast: '#EF9F27' }
const REF = MONTHLY_ALL_SCAN.filter((m) => m.kind === 'actual') // ม.ค.–พ.ค. (5 เดือน อ้างอิงสไลด์)
const JAN_ATH = REF[0]?.value ?? 278191
const MAY = REF[REF.length - 1]?.value ?? 261293
const att = (d: DailyRow) => d.totalAttempts ?? (d.success + d.dupSelf + d.dupOther + (d.notFound ?? 0))

export default function YearOverviewCard() {
  const to = getCampaignToday().toISOString().slice(0, 10)
  const { data } = useApi<DailyRow[]>(`/api/daily?from=2026-06-01&to=${to}`)
  const june = (data ?? []).filter((d) => d.date.startsWith('2026-06')).sort((a, b) => a.date.localeCompare(b.date))

  const days = june.length
  const actual = june.reduce((s, d) => s + att(d), 0)
  // rate จากวันที่ "จบแล้ว" (ตัดวันสุดท้าย = วันนี้/อาจ partial) เพื่อ forecast ที่ไม่ถูกวันค้างดึงลง
  const completeDays = Math.max(1, days - 1)
  const completeSum = june.slice(0, completeDays).reduce((s, d) => s + att(d), 0)
  const rate = completeSum / completeDays
  const remaining = Math.max(0, 30 - completeDays)
  const mk = (mult: number) => Math.round(completeSum + rate * mult * remaining)
  const forecast = mk(1)
  const ratePerDay = days > 0 ? Math.round(actual / days) : 0
  const refAvg = REF.reduce((s, m) => s + m.value, 0) / (REF.length || 1)
  const liftVsAvg = refAvg > 0 ? Math.round((rate / (refAvg / 30) - 1) * 100) : 0 // rate/วัน เทียบเฉลี่ย/วันของ ม.ค.-พ.ค.
  const momPct = ((forecast / MAY - 1) * 100)
  const athPct = ((forecast / JAN_ATH - 1) * 100)
  const beatsAth = forecast >= JAN_ATH
  const hasApi = days > 0

  // bars: ม.ค.-พ.ค. (สไลด์) + มิ.ย. ปัจจุบัน (เทา) + มิ.ย. คาด (ทอง)
  const labels = [...REF.map((m) => m.month), `มิ.ย. (${days}ว.)`, 'มิ.ย. (คาด)']
  const values = [...REF.map((m) => m.value), actual, forecast]
  const colors = [...REF.map(() => COLOR.actual), COLOR.partial, COLOR.forecast]

  const Kpi = ({ accent, label, value, sub }: { accent: string; label: string; value: ReactNode; sub: ReactNode }) => (
    <div className={`kpi-accent ${accent}`}>
      <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-[24px] font-bold leading-tight">{value}</div>
      <div className="text-[10.5px] text-[var(--text-muted)] mt-1">{sub}</div>
    </div>
  )

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-chart-bar text-base text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">📈 ภาพรวมการสแกนทั้งปี — All Scan รายเดือน</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800"
              title="มิ.ย. = ข้อมูลจริงจาก API · ม.ค.–พ.ค. = อ้างอิงสไลด์ (รอ API)">🟢 มิ.ย. API · ม.ค.–พ.ค. สไลด์</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">ม.ค.–พ.ค. อ้างอิงระดับแพลตฟอร์ม (สไลด์) · มิ.ย. = สแกนทั้งหมดจริง + Forecast ปิดเดือน</div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi accent="kpi-mint" label={`มิ.ย. ปัจจุบัน (${hasApi ? days : 0}/30 วัน)`} value={hasApi ? numFmt(actual) : '—'}
             sub={hasApi ? <>{numFmt(ratePerDay)} สแกน/วัน · <b className={liftVsAvg >= 0 ? 'text-[var(--positive)]' : 'text-red-600'}>{liftVsAvg >= 0 ? '+' : ''}{liftVsAvg}%</b> vs เฉลี่ย ม.ค.–พ.ค.</> : 'รอข้อมูล API'} />
        <Kpi accent="kpi-lavender" label="Forecast ปิดเดือน" value={<span style={{ color: '#b45309' }}>{hasApi ? numFmt(forecast) : '—'}</span>}
             sub={hasApi ? <><b className={momPct >= 0 ? 'text-[var(--positive)]' : 'text-red-600'}>{momPct >= 0 ? '+' : ''}{momPct.toFixed(1)}%</b> vs พ.ค.</> : 'รอข้อมูล'} />
        <Kpi accent="kpi-coral" label="vs สูงสุดเดิม (ม.ค.)" value={hasApi ? <span className={beatsAth ? 'text-[var(--green-700)]' : 'text-[var(--dark)]'}>{athPct >= 0 ? '+' : ''}{athPct.toFixed(1)}%</span> : '—'}
             sub={hasApi ? (beatsAth ? <>ทุบสถิติ {numFmt(JAN_ATH)} 🏆</> : <>ใกล้สถิติเดิม {numFmt(JAN_ATH)}</>) : `สถิติเดิม ${numFmt(JAN_ATH)}`} />
        <Kpi accent="kpi-pink" label={`เหลือ ${hasApi ? remaining : '—'} วัน`} value={hasApi ? numFmt(Math.max(0, forecast - actual)) : '—'} sub="ต้องทำอีกเพื่อถึงเป้า" />
      </div>

      {/* กราฟแท่ง */}
      <div style={{ height: 260 }}>
        <Bar
          data={{ labels, datasets: [{
            label: 'All Scan', data: values, backgroundColor: colors, borderRadius: 5,
            borderColor: labels.map((_, i) => (i === values.length - 1 ? '#b45309' : 'transparent')),
            borderWidth: labels.map((_, i) => (i === values.length - 1 ? 1.5 : 0)), barPercentage: 0.72,
          }] }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${numFmt(Number(c.parsed.y))} สแกน` } } },
            scales: { x: { grid: { display: false }, ticks: { font: { size: 9.5 } } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => numFmt(Number(v)) } } },
          }}
        />
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: COLOR.actual }} /> ม.ค.–พ.ค. (สไลด์)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: COLOR.partial }} /> มิ.ย. ปัจจุบัน (จริง)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-[#b45309]" style={{ background: COLOR.forecast }} /> มิ.ย. คาด</span>
      </div>

      {/* Scenarios */}
      {hasApi && (
        <div className="mt-4 pt-3 border-t border-[var(--border-soft)]">
          <div className="text-[11px] font-bold text-[var(--dark)] mb-2">🎯 Scenarios ปิดเดือน มิ.ย. (จากเรตจริง)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {[
              { key: 'pess', label: 'Pessimistic', emoji: '📉', note: 'rate ตก −10%', value: mk(0.9), likely: 5 },
              { key: 'base', label: 'Base', emoji: '🎯', note: 'rate ปัจจุบัน', value: forecast, likely: 70 },
              { key: 'opt', label: 'Optimistic', emoji: '📈', note: 'rate +10%', value: mk(1.1), likely: 25 },
            ].map((s) => {
              const isBase = s.key === 'base'
              const p = (s.value / MAY - 1) * 100
              return (
                <div key={s.key} className="rounded-xl p-3 border"
                     style={isBase ? { background: '#f0fdf4', borderColor: '#16a34a', borderWidth: 1.5 } : { background: 'var(--bg-soft)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--dark)]">
                    <span>{s.emoji}</span> {s.label}
                    <span className="ml-auto text-[9.5px] font-semibold text-[var(--text-muted)]">{s.likely}% likely</span>
                  </div>
                  <div className="text-[20px] font-bold leading-tight mt-1" style={{ color: isBase ? '#15803d' : 'var(--text)' }}>{numFmt(s.value)}</div>
                  <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5"><b className={p >= 0 ? 'text-[var(--positive)]' : 'text-red-600'}>{p >= 0 ? '+' : ''}{p.toFixed(1)}%</b> vs พ.ค. · {s.note}</div>
                </div>
              )
            })}
          </div>
          <div className="text-[10.5px] text-[var(--text-secondary)] mt-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2">
            💡 {beatsAth
              ? <><b>Base case = New All-Time High</b> — สูงกว่า ม.ค. ({numFmt(JAN_ATH)})</>
              : <>Base case ปิดที่ <b>{numFmt(forecast)}</b> — <b>{athPct >= 0 ? 'เกิน' : 'ต่ำกว่า'}สถิติเดิม</b> ม.ค. ({numFmt(JAN_ATH)}) {Math.abs(athPct).toFixed(1)}%</>}
          </div>
        </div>
      )}
    </div>
  )
}
