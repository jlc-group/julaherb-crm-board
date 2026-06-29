'use client'
// 📈 Weekly Momentum (สไลด์ 5) — สแกนสำเร็จรายสัปดาห์ + WoW% · คำนวณจริงจาก /api/daily ทั้งแคมเปญ
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt, CAMPAIGN_START, getCampaignToday } from '@/lib/utils'
import type { DailyRow } from '@/lib/api/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface WeekAgg { idx: number; from: string; to: string; total: number; days: number; avg: number; wow: number | null }

const pad = (n: number) => String(n).padStart(2, '0')
const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parse = (s: string) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd) }
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return isoOf(d) }
const dayDiff = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)
const shortDate = (iso: string) => { const p = iso.split('-'); return `${p[2]}/${p[1]}` }

export default function WeeklyMomentumCard() {
  const to = getCampaignToday().toISOString().slice(0, 10)
  const { data, loading } = useApi<DailyRow[]>(`/api/daily?from=${CAMPAIGN_START}&to=${to}`)
  const rows = (data ?? []).slice().sort((a, b) => a.date.localeCompare(b.date))

  // group เป็นสัปดาห์ ๆ ละ 7 วัน เริ่มจาก CAMPAIGN_START
  const map = new Map<number, { total: number; days: number }>()
  for (const r of rows) {
    const wi = Math.floor(dayDiff(CAMPAIGN_START, r.date) / 7)
    if (wi < 0) continue
    const cur = map.get(wi) ?? { total: 0, days: 0 }
    cur.total += r.success
    cur.days += 1
    map.set(wi, cur)
  }
  const weeks: WeekAgg[] = Array.from(map.keys()).sort((a, b) => a - b).map((wi, i, arr) => {
    const v = map.get(wi)!
    const from = addDays(CAMPAIGN_START, wi * 7)
    const to2 = addDays(from, 6)
    const prevWi = arr[i - 1]
    const prevTotal = prevWi != null ? map.get(prevWi)?.total ?? null : null
    const wow = prevTotal && prevTotal > 0 ? ((v.total - prevTotal) / prevTotal) * 100 : null
    return { idx: wi, from, to: to2, total: v.total, days: v.days, avg: v.days > 0 ? Math.round(v.total / v.days) : 0, wow }
  })

  const best = weeks.reduce<WeekAgg | null>((m, w) => (w.wow != null && (!m || (m.wow ?? -999) < w.wow) ? w : m), null)

  if (loading && !weeks.length) {
    return <div className="card p-4 text-[12px] text-[var(--text-muted)]">กำลังโหลด Weekly Momentum…</div>
  }

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-chart-bar text-base text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">📈 Weekly Momentum — สแกนสำเร็จรายสัปดาห์</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>

      {/* กราฟแท่ง WoW */}
      <div style={{ height: 200 }} className="mb-3">
        <Bar
          data={{
            labels: weeks.map((w) => `W${w.idx + 1}`),
            datasets: [{
              label: 'สำเร็จ',
              data: weeks.map((w) => w.total),
              backgroundColor: weeks.map((w) => (best && w.idx === best.idx ? '#EF9F27' : '#1D9E75')),
              borderRadius: 5,
              barPercentage: 0.7,
            }],
          }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (c) => {
                const w = weeks[c.dataIndex]
                return `${numFmt(w.total)} (${w.days} วัน · เฉลี่ย ${numFmt(w.avg)}/วัน)`
              } } },
            },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => numFmt(Number(v)) } } },
          }}
        />
      </div>

      {/* ตาราง */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
              <th className="text-left py-1.5 px-2">สัปดาห์</th>
              <th className="text-right py-1.5 px-2">สำเร็จรวม</th>
              <th className="text-right py-1.5 px-2">เฉลี่ย/วัน</th>
              <th className="text-right py-1.5 px-2">% WoW</th>
              <th className="text-center py-1.5 px-2">วัน</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w) => (
              <tr key={w.idx} className="border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)]">
                <td className="py-1.5 px-2 font-semibold text-[var(--dark)]">W{w.idx + 1} <span className="text-[10px] text-[var(--text-muted)]">({shortDate(w.from)}–{shortDate(w.to)})</span></td>
                <td className="text-right py-1.5 px-2 num font-bold text-[var(--green-700)]">{numFmt(w.total)}</td>
                <td className="text-right py-1.5 px-2 num">{numFmt(w.avg)}</td>
                <td className="text-right py-1.5 px-2 num font-bold" style={{ color: w.wow == null ? 'var(--text-muted)' : w.wow >= 0 ? 'var(--positive)' : '#dc2626' }}>
                  {w.wow == null ? '—' : `${w.wow >= 0 ? '+' : ''}${w.wow.toFixed(1)}%`}
                </td>
                <td className="text-center py-1.5 px-2 text-[var(--text-muted)]">{w.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {best && (
        <div className="text-[10.5px] text-[var(--text-secondary)] mt-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2">
          💡 สัปดาห์ที่โตเด่นสุด: <b>W{best.idx + 1}</b> <b className="text-[var(--positive)]">+{best.wow!.toFixed(1)}%</b> WoW
        </div>
      )}
    </div>
  )
}
