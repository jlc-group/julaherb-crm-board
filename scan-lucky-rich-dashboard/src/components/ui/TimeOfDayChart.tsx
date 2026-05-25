'use client'
import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

interface Props {
  days: DailyEntry[]
  rangeLabel?: string
}

export default function TimeOfDayChart({ days, rangeLabel }: Props) {
  // Aggregate timeOfDay buckets across all selected days
  // Normalize to 6 fixed buckets so different days' labels merge correctly
  const { agg, totalScans, peakSlot, aggPeakHours, anyOutage } = useMemo(() => {
    // Fixed buckets (start hour → bucket label)
    const BUCKETS = [
      { label: '00-06', from: 0,  to: 6  },
      { label: '06-09', from: 6,  to: 9  },
      { label: '09-12', from: 9,  to: 12 },
      { label: '12-15', from: 12, to: 15 },
      { label: '15-18', from: 15, to: 18 },
      { label: '18-21', from: 18, to: 21 },
      { label: '21-24', from: 21, to: 24 },
    ]
    const bucketScans: number[] = new Array(BUCKETS.length).fill(0)
    const hourMap = new Map<string, number>()
    let outage: DailyEntry['outage'] | null = null

    // Parse start/end hour from a range string like '07-09', '00-03 (pre)', '19-22 (peak)'
    function parseRange(s: string): { from: number; to: number } | null {
      const m = s.match(/(\d{1,2})\s*-\s*(\d{1,2})/)
      if (!m) return null
      return { from: parseInt(m[1], 10), to: parseInt(m[2], 10) }
    }

    for (const d of days) {
      for (const t of d.timeOfDay || []) {
        const r = parseRange(t.range)
        if (!r || t.scans <= 0) continue
        const span = Math.max(r.to - r.from, 1)
        const scansPerHour = t.scans / span
        // distribute proportionally to overlapping fixed buckets
        for (let i = 0; i < BUCKETS.length; i++) {
          const b = BUCKETS[i]
          const overlap = Math.max(0, Math.min(r.to, b.to) - Math.max(r.from, b.from))
          if (overlap > 0) bucketScans[i] += scansPerHour * overlap
        }
      }
      for (const h of d.peakHours || []) {
        hourMap.set(h.hour, (hourMap.get(h.hour) || 0) + h.scans)
      }
      if (d.outage && !outage) outage = d.outage
    }

    const total = bucketScans.reduce((s, v) => s + v, 0)
    const agg = BUCKETS.map((b, i) => ({
      range: b.label,
      scans: Math.round(bucketScans[i]),
      pct: total ? (bucketScans[i] / total) * 100 : 0,
    }))

    const peak = [...agg].sort((a, b) => b.scans - a.scans)[0]

    const aggPeakHours = Array.from(hourMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, scans], i) => ({ rank: (i + 1) as 1 | 2 | 3, hour, scans }))

    return { agg, totalScans: total, peakSlot: peak, aggPeakHours, anyOutage: outage }
  }, [days])

  const hasData = agg.length > 0 && peakSlot

  if (!hasData) {
    return (
      <ChartCard title="Time of Day — peak hour" icon="ti-clock-hour-9" full>
        <div className="text-[10.5px] text-[var(--text-muted)] mb-2">
          {rangeLabel ? `📅 ${rangeLabel}` : '—'}
        </div>
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
          <i className="ti ti-clock-pause text-2xl mr-2" />
          ยังไม่มีข้อมูล time-of-day ในช่วงที่เลือก
        </div>
      </ChartCard>
    )
  }

  const isAggregated = days.length > 1

  return (
    <ChartCard title="Time of Day — peak hour" icon="ti-clock-hour-9" full>
      <div className="text-[10.5px] text-[var(--text-muted)] mb-2 flex items-center gap-2">
        <span>📅 {rangeLabel || `${days[0].date.split('-')[2]} พ.ค.`}</span>
        <span className="px-1.5 py-0.5 rounded bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold text-[9.5px]">
          {isAggregated ? `รวม ${days.length} วัน · ${numFmt(totalScans)} scans` : `${numFmt(totalScans)} scans`}
        </span>
        {anyOutage && <span className="text-[var(--red)]"><i className="ti ti-alert-octagon" /> Outage ในช่วง</span>}
      </div>

      <div style={{ height: 250 }}>
        <Bar
          data={{
            labels: agg.map(t => t.range),
            datasets: [{
              label: 'สแกน',
              data: agg.map(t => t.scans),
              backgroundColor: agg.map(t =>
                t.scans === 0 ? '#ef4444' :
                t.scans === peakSlot.scans ? '#6366f1' :
                '#a5b4fc'
              ),
              borderRadius: 4,
            }],
          }}
          plugins={[ChartDataLabels as any]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  afterLabel: (ctx: any) => `${agg[ctx.dataIndex].pct.toFixed(1)}% ของช่วง`,
                },
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                offset: 2,
                color: '#1e1b4b',
                font: { size: 10, weight: 'bold' },
                formatter: (v: number) => v === 0 ? '0' : numFmt(v),
              },
            } as any,
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, suggestedMax: peakSlot.scans * 1.15 },
            },
          }}
        />
      </div>

      {aggPeakHours.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
          <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-1.5">
            <i className="ti ti-trophy text-[#f59e0b]" /> Peak hours (top 3 ชั่วโมง{isAggregated ? ' — รวมทั้งช่วง' : ''})
          </div>
          <div className="grid grid-cols-3 gap-2">
            {aggPeakHours.map(ph => {
              const emoji = ph.rank === 1 ? '🥇' : ph.rank === 2 ? '🥈' : '🥉'
              return (
                <div key={ph.hour} className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)] text-center">
                  <div className="text-[10px] text-[var(--text-muted)]">{emoji} อันดับ {ph.rank}</div>
                  <div className="text-[16px] num font-extrabold text-[var(--dark)]">{ph.hour}</div>
                  <div className="text-[11px] num text-[var(--brand-700)] font-bold">{numFmt(ph.scans)} scans</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <InsightInline
        severity={anyOutage ? 'danger' : 'info'}
        html={anyOutage
          ? `🚨 <b>มี outage ในช่วงที่เลือก</b> — Peak ช่วง <b>${peakSlot.range}</b> = <b>${numFmt(peakSlot.scans)}</b> scans (${peakSlot.pct.toFixed(1)}%)`
          : `Peak ช่วง <b>${peakSlot.range}</b> = <b>${numFmt(peakSlot.scans)}</b> scans (${peakSlot.pct.toFixed(1)}%) • Top hour: <b>${aggPeakHours[0]?.hour || '—'}</b> → ลง LINE broadcast ก่อน 30 นาที`}
      />
    </ChartCard>
  )
}
