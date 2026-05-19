'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { FORECAST } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

export default function ForecastWidget() {
  const { toDate, dailyAvg3day, daysRemaining, drawDate, scenarios } = FORECAST
  const maxScenario = Math.max(scenarios.linear.value, scenarios.midDecay15.value, scenarios.decay30.value)

  const rows = [
    { ...scenarios.linear,     icon: 'ti-rocket'   },
    { ...scenarios.midDecay15, icon: 'ti-scale'    },
    { ...scenarios.decay30,    icon: 'ti-arrow-down-right' },
  ]

  return (
    <ChartCard title="Campaign Forecast — ถึง draw date" icon="ti-crystal-ball" full>
      {/* Top KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg p-3 border border-[var(--green-200)] bg-[var(--green-50)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--green-700)] font-bold">สิทธิ์สะสมถึงวันนี้</div>
          <div className="text-[22px] num text-[var(--green-800)] leading-tight">{numFmt(toDate)}</div>
          <div className="text-[10px] text-[var(--text-muted)]">campaign-to-date</div>
        </div>

        <div className="rounded-lg p-3 border border-[var(--border-soft)] bg-[var(--bg-soft)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-bold">Daily Avg (3 วันแรก)</div>
          <div className="text-[22px] num text-[var(--dark)] leading-tight">{numFmt(dailyAvg3day)}</div>
          <div className="text-[10px] text-[var(--text-muted)]">สิทธิ์/วัน</div>
        </div>

        <div className="rounded-lg p-3 border border-[var(--border-soft)] bg-[var(--bg-soft)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-bold">Days Remaining</div>
          <div className="text-[22px] num text-[var(--dark)] leading-tight">{daysRemaining}</div>
          <div className="text-[10px] text-[var(--text-muted)]">ถึง draw date</div>
        </div>

        <div className="rounded-lg p-3 border border-yellow-200 bg-yellow-50">
          <div className="text-[10px] uppercase tracking-wide text-yellow-800 font-bold">Draw Date</div>
          <div className="text-[16px] num text-yellow-900 leading-tight pt-1">18 ธ.ค. 2569</div>
          <div className="text-[10px] text-[var(--text-muted)]">{drawDate}</div>
        </div>
      </div>

      {/* 3 scenarios bars */}
      <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-2">
        <i className="ti ti-chart-line text-[var(--primary)]" /> Forecast Scenarios
      </div>
      <div className="space-y-2.5">
        {rows.map(s => {
          const widthPct = (s.value / maxScenario) * 100
          return (
            <div key={s.label}>
              <div className="flex justify-between text-[11.5px] mb-1">
                <span className="font-semibold text-[var(--dark)] flex items-center gap-1">
                  <i className={`ti ${s.icon}`} style={{ color: s.color }} />
                  {s.label}
                </span>
                <span className="num font-extrabold" style={{ color: s.color }}>
                  ~{fmtCompact(s.value)} สิทธิ์
                </span>
              </div>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <InsightInline
        severity="warn"
        html={`ต้อง config prize ให้รับ <b>scenario กลาง = ~${fmtCompact(scenarios.midDecay15.value)} สิทธิ์</b> เป็นอย่างต่ำ — ตอนนี้ ${numFmt(toDate)} ใน ${Math.round((toDate / scenarios.midDecay15.value) * 100)}% ของ mid-case แล้ว`}
      />
    </ChartCard>
  )
}
