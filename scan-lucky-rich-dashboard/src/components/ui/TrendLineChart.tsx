'use client'
import { useState, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface Series {
  key: 'tickets' | 'success'
  label: string
  color: string
  enabled: boolean
}

interface Props {
  /** Days within the selected date range (from top filter) */
  days: DailyEntry[]
  rangeLabel?: string
}

export default function TrendLineChart({ days, rangeLabel }: Props) {
  const [series, setSeries] = useState<Series[]>([
    { key: 'tickets', label: '🎟️ สิทธิ์ (ตามสเปก)', color: '#6366f1', enabled: true },
    { key: 'success', label: '⭐ สแกนสำเร็จ',        color: '#10b981', enabled: true },
  ])

  // Use days from prop (driven by top-level date range)
  const { labels, ticketsData, scansData, totals } = useMemo(() => {
    if (days.length === 0) {
      return { labels: [], ticketsData: [], scansData: [], totals: { tickets: 0, success: 0 } }
    }
    return {
      labels: days.map(d => `${d.date.split('-')[2]} พ.ค.`),
      ticketsData: days.map(d => d.expectedTickets ?? d.tickets),
      scansData: days.map(d => d.success),
      totals: {
        tickets: days.reduce((s, d) => s + (d.expectedTickets ?? d.tickets), 0),
        success: days.reduce((s, d) => s + d.success, 0),
      },
    }
  }, [days])

  const datasets: any[] = []
  if (series[0].enabled && days.length > 0) {
    datasets.push({
      label: series[0].label,
      data: ticketsData,
      borderColor: series[0].color,
      backgroundColor: series[0].color + '15',
      tension: 0.35,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#fff',
      pointBorderColor: series[0].color,
      pointBorderWidth: 2.5,
      borderWidth: 2.5,
      fill: true,
    })
  }
  if (series[1].enabled && days.length > 0) {
    datasets.push({
      label: series[1].label,
      data: scansData,
      borderColor: series[1].color,
      backgroundColor: series[1].color + '12',
      tension: 0.35,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#fff',
      pointBorderColor: series[1].color,
      pointBorderWidth: 2.5,
      borderWidth: 2.5,
      fill: true,
    })
  }

  const toggleSeries = (idx: number) => {
    setSeries(prev => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s))
  }

  return (
    <div className="card p-4">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="text-[14px] font-bold text-[var(--dark)] mb-0.5">📈 แนวโน้ม สิทธิ์ vs สแกนสำเร็จ</h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            {rangeLabel ? `${rangeLabel} • ` : ''}{days.length} จุดข้อมูล
            {days.length === 0 && <span className="ml-1 text-[var(--warn)]">— ไม่มีข้อมูลในช่วงที่เลือก</span>}
          </p>
        </div>

        {/* Series toggle pills */}
        <div className="flex gap-2 flex-wrap">
          {series.map((s, i) => (
            <button
              key={s.key}
              onClick={() => toggleSeries(i)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[11.5px] font-semibold rounded-full border transition-all ${
                s.enabled
                  ? 'border-transparent shadow-sm'
                  : 'border-[var(--border)] bg-white text-[var(--text-muted)] opacity-60'
              }`}
              style={s.enabled ? { background: s.color + '15', color: s.color, borderColor: s.color + '40' } : {}}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: s.enabled ? s.color : '#cbd5e1' }} />
              {s.label}
              <span className="ml-1 text-[10px] opacity-70">
                {s.enabled ? '●' : '○'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 280 }}>
        {datasets.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-[var(--text-muted)]">
            {days.length === 0
              ? 'ไม่มีข้อมูลในช่วงเวลาที่เลือก — ลองเลือกช่วงอื่นที่ด้านบน'
              : 'เลือกอย่างน้อย 1 เส้นเพื่อแสดงกราฟ'}
          </div>
        ) : (
          <Line
            data={{ labels, datasets }}
            plugins={[ChartDataLabels as any]}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1e293b',
                  titleFont: { size: 12, weight: 'bold' },
                  bodyFont: { size: 12 },
                  padding: 10,
                  cornerRadius: 8,
                  callbacks: {
                    label: (ctx) => `  ${ctx.dataset.label}: ${numFmt(ctx.parsed.y ?? 0)}`,
                  },
                },
                datalabels: {
                  align: 'top',
                  anchor: 'end',
                  offset: 6,
                  color: (ctx: any) => ctx.dataset.borderColor,
                  font: { size: 10.5, weight: 'bold', family: "'Mali', 'Noto Sans Thai', sans-serif" },
                  formatter: (v: number) => numFmt(v),
                  display: (ctx: any) => ctx.dataset.data.length <= 10,
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
                y: {
                  beginAtZero: true,
                  grid: { color: '#f1f5f9' },
                  ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => numFmt(Number(v)) },
                },
              },
            }}
          />
        )}
      </div>

      {/* Footer — totals */}
      {days.length > 1 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)] flex flex-wrap gap-4 text-[11.5px]">
          {series[0].enabled && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: series[0].color }} />
              <span className="text-[var(--text-secondary)]">{series[0].label} รวม:</span>
              <b className="num text-[var(--dark)]">{numFmt(totals.tickets)}</b>
            </div>
          )}
          {series[1].enabled && (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: series[1].color }} />
              <span className="text-[var(--text-secondary)]">{series[1].label} รวม:</span>
              <b className="num text-[var(--dark)]">{numFmt(totals.success)}</b>
            </div>
          )}
          {series[0].enabled && series[1].enabled && totals.success > 0 && (
            <div className="ml-auto text-[var(--text-muted)]">
              สิทธิ์/สแกน = <b className="text-[var(--brand-700)]">{(totals.tickets / totals.success).toFixed(2)}×</b>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
