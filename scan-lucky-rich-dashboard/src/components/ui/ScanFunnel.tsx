'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { FUNNEL_DATA } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

export default function ScanFunnel() {
  const top = FUNNEL_DATA[0].count
  // Compute step-over-step + total drop
  const rows = FUNNEL_DATA.map((s, i) => {
    const prev = i > 0 ? FUNNEL_DATA[i - 1].count : s.count
    const stepConv = prev > 0 ? (s.count / prev) * 100 : 100
    const totalConv = top > 0 ? (s.count / top) * 100 : 100
    return { ...s, stepConv, totalConv, dropoff: prev - s.count }
  })

  // Find biggest drop-off
  const biggestDrop = rows.slice(1).reduce((max, r) => r.dropoff > max.dropoff ? r : max, rows[1] || rows[0])

  return (
    <ChartCard title="Scan → Register → Verify Funnel" icon="ti-filter">
      <div className="space-y-2 py-2">
        {rows.map((r, i) => {
          const width = r.totalConv
          const isLast = i === rows.length - 1
          return (
            <div key={r.step}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-[var(--dark)]">
                  {i + 1}. {r.step}
                </span>
                <span className="font-extrabold num text-[var(--green-700)]">{numFmt(r.count)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-7 bg-[var(--bg-soft)] rounded-md overflow-hidden border border-[var(--border-soft)]">
                  <div
                    className={`h-full ${isLast ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 'bg-gradient-to-r from-[var(--green-500)] to-[var(--green-600)]'} flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(8, width)}%` }}
                  >
                    <span className="text-[10px] font-bold text-white">{r.totalConv.toFixed(1)}%</span>
                  </div>
                </div>
                {i > 0 && (
                  <span className={`text-[10px] font-bold w-14 text-right ${
                    r.stepConv < 80 ? 'text-[var(--red)]' : r.stepConv < 90 ? 'text-yellow-700' : 'text-[var(--green-700)]'
                  }`}>
                    ↓ {(100 - r.stepConv).toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] ml-1 mt-0.5">{r.description}</div>
            </div>
          )
        })}
      </div>

      <InsightInline
        severity={biggestDrop && biggestDrop.dropoff > top * 0.1 ? 'warn' : 'info'}
        html={`Conversion ทั้ง funnel: <b>${rows[rows.length - 1].totalConv.toFixed(1)}%</b> • Drop-off ใหญ่สุด: <b>${biggestDrop.step}</b> (-${numFmt(biggestDrop.dropoff)} คน)`}
      />
    </ChartCard>
  )
}
