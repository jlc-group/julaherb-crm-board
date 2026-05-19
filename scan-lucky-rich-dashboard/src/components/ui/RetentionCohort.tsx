'use client'
import { Bar } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { SAME_DAY_REPEAT, TIME_TO_REPEAT } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

export default function RetentionCohort() {
  const totalUsers = SAME_DAY_REPEAT.oneScan + SAME_DAY_REPEAT.twoScans + SAME_DAY_REPEAT.threeScans + SAME_DAY_REPEAT.fourPlusScans
  const repeatPct = ((totalUsers - SAME_DAY_REPEAT.oneScan) / totalUsers) * 100
  const oneShot = (SAME_DAY_REPEAT.oneScan / totalUsers) * 100

  const items = [
    { label: '1 scan',    count: SAME_DAY_REPEAT.oneScan,       color: '#94a3b8' },
    { label: '2 scans',   count: SAME_DAY_REPEAT.twoScans,      color: '#22c55e' },
    { label: '3 scans',   count: SAME_DAY_REPEAT.threeScans,    color: '#16a34a' },
    { label: '4+ scans',  count: SAME_DAY_REPEAT.fourPlusScans, color: '#facc15' },
  ]

  // peak interval
  const peakInterval = [...TIME_TO_REPEAT].sort((a, b) => b.users - a.users)[0]

  return (
    <ChartCard title="Retention: First → Second Scan" icon="ti-refresh">
      {/* Donut-like horizontal stacked bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[11px] mb-1">
          <span className="text-[var(--text-secondary)]">Distribution of scans/user</span>
          <span className="font-bold text-[var(--dark)] num">{numFmt(totalUsers)} users</span>
        </div>
        <div className="flex h-7 rounded-md overflow-hidden border border-[var(--border)] shadow-sm">
          {items.map((b) => {
            const w = (b.count / totalUsers) * 100
            return (
              <div
                key={b.label}
                className="flex items-center justify-center text-[10px] font-bold text-white relative group"
                style={{ width: `${w}%`, background: b.color }}
                title={`${b.label}: ${numFmt(b.count)} (${w.toFixed(1)}%)`}
              >
                {w > 8 && `${w.toFixed(0)}%`}
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 text-[10.5px] mt-1.5">
          {items.map(b => (
            <div key={b.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: b.color }} />
              <span className="text-[var(--text-secondary)]">{b.label}</span>
              <b className="text-[var(--dark)] num">{numFmt(b.count)}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Time to repeat */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
          <i className="ti ti-clock-hour-4 text-[var(--primary)]" /> เวลาระหว่าง scan ที่ 1 → 2
        </div>
        <div style={{ height: 140 }}>
          <Bar
            data={{
              labels: TIME_TO_REPEAT.map(t => t.bucket),
              datasets: [{
                label: 'Users',
                data: TIME_TO_REPEAT.map(t => t.users),
                backgroundColor: TIME_TO_REPEAT.map((_, i) => i === 0 ? '#16a34a' : i < 3 ? '#22c55e' : '#86efac'),
                borderRadius: 4,
                barPercentage: 0.7,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
              },
            }}
          />
        </div>
      </div>

      <InsightInline
        html={`<b>Repeat rate: ${repeatPct.toFixed(1)}%</b> • One-shot: ${oneShot.toFixed(1)}% — peak repeat ที่ <b>${peakInterval.bucket}</b> (${numFmt(peakInterval.users)} คน) — push LINE message ในช่วงเวลานี้ได้ผลสุด`}
      />
    </ChartCard>
  )
}
