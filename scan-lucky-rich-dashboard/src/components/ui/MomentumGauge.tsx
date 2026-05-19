'use client'
import { useMemo } from 'react'
import { DAILY_STATS } from '@/lib/daily-sku-data'
import { numFmt } from '@/lib/utils'

interface Props {
  /** Selected date range. If omitted → show whole campaign (3 days). */
  fromDate?: string
  toDate?: string
}

export default function MomentumGauge({ fromDate, toDate }: Props = {}) {
  // Filter DAILY_STATS by date range
  const days = useMemo(() => {
    if (!fromDate || !toDate) return DAILY_STATS
    return DAILY_STATS.filter(d => d.date >= fromDate && d.date <= toDate)
  }, [fromDate, toDate])

  if (days.length === 0) {
    return (
      <div className="card p-4">
        <div className="text-center text-[var(--text-muted)] py-4 text-[12px]">
          <i className="ti ti-info-circle text-2xl block mb-1" />
          ไม่มีข้อมูลในช่วงที่เลือก
        </div>
      </div>
    )
  }

  // Single day: show big number + compare to previous day if exists in full DAILY_STATS
  if (days.length === 1) {
    const d = days[0]
    const idx = DAILY_STATS.findIndex(x => x.date === d.date)
    const prev = idx > 0 ? DAILY_STATS[idx - 1] : null
    const growthPct = prev && prev.totalRights > 0
      ? ((d.totalRights - prev.totalRights) / prev.totalRights) * 100
      : 0
    const positive = growthPct >= 0
    const accelerating = growthPct > 15
    const status = !prev ? 'NO PREV' : accelerating ? 'ACCELERATING' : positive ? 'UP' : 'DOWN'
    const chipClass = !prev ? 'chip chip-gray' : positive ? (accelerating ? 'chip' : 'chip chip-yellow') : 'chip chip-red'
    const iconColor = !prev ? 'var(--text-muted)' : positive ? 'var(--primary)' : 'var(--red)'
    const dayLabel = d.date.split('-')[2] + ' พ.ค. (' + d.weekday + ')'

    return (
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className={`ti ${accelerating ? 'ti-rocket' : positive ? 'ti-arrow-up-right' : 'ti-arrow-down-right'} text-lg`} style={{ color: iconColor }} />
          <h3 className="text-[13px] font-bold text-[var(--dark)]">Daily Momentum</h3>
          <span className={`${chipClass} ml-auto`}>{status}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {prev ? (
            <div className="rounded-lg p-2.5 border border-[var(--border-soft)] bg-[var(--bg-soft)]">
              <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">เมื่อวาน</div>
              <div className="text-[18px] num text-[var(--dark)]">{numFmt(prev.totalRights)}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{prev.date.split('-')[2]} พ.ค. ({prev.weekday})</div>
            </div>
          ) : (
            <div className="rounded-lg p-2.5 border border-[var(--border-soft)] bg-[var(--bg-soft)] text-center text-[var(--text-muted)] text-[11px] flex items-center justify-center">
              ไม่มีข้อมูลวันก่อนหน้า
            </div>
          )}
          <div className="rounded-lg p-2.5 border border-[var(--green-200)] bg-[var(--green-50)]">
            <div className="text-[10px] text-[var(--green-700)] uppercase tracking-wide font-bold">{dayLabel}</div>
            <div className="text-[18px] num text-[var(--green-800)]">{numFmt(d.totalRights)}</div>
            {prev && (
              <div className={`text-[10px] font-bold ${positive ? 'text-[var(--primary)]' : 'text-[var(--red)]'}`}>
                {positive ? '+' : ''}{growthPct.toFixed(1)}% ({positive ? '+' : ''}{numFmt(d.totalRights - prev.totalRights)})
              </div>
            )}
          </div>
        </div>

        {prev && <GaugeBar pct={growthPct} />}

        <div className="mt-3 text-[11px] bg-[var(--green-50)] border border-[var(--green-200)] rounded-lg p-2.5 text-[var(--green-900)]">
          <div className="font-bold text-[var(--green-700)] uppercase text-[10px] tracking-wider mb-0.5 flex items-center gap-1">
            <i className="ti ti-bolt" /> Single-day pulse
          </div>
          <div>Users: <b>{numFmt(d.uniqueUsers)}</b> • SKU active: <b>{d.skuActive}</b> • สิทธิ์/คน: <b>{d.rightsPerUser.toFixed(2)}</b></div>
        </div>
      </div>
    )
  }

  // Multi-day (2-3 days): show all days in row + overall growth
  const first = days[0]
  const last  = days[days.length - 1]
  const overallGrowth = first.totalRights > 0
    ? ((last.totalRights - first.totalRights) / first.totalRights) * 100
    : 0
  const accelerating = overallGrowth > 15
  const positive = overallGrowth >= 0
  const status = accelerating ? 'ACCELERATING' : positive ? 'STEADY' : 'SLOWING'
  const chipClass = accelerating ? 'chip' : positive ? 'chip chip-yellow' : 'chip chip-red'
  const iconColor  = accelerating ? 'var(--primary)' : positive ? '#ca8a04' : 'var(--red)'
  const totalRange = days.reduce((s, d) => s + d.totalRights, 0)
  const projected  = Math.round(totalRange / days.length * 213)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className={`ti ${accelerating ? 'ti-rocket' : positive ? 'ti-arrow-up-right' : 'ti-arrow-down-right'} text-lg`}
           style={{ color: iconColor }} />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Daily Momentum</h3>
        <span className={`${chipClass} ml-auto`}>{accelerating && '🚀 '}{status}</span>
      </div>

      <div className={`grid gap-2 mb-3`} style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d, i) => {
          const isLast = i === days.length - 1
          const prev = i > 0 ? days[i - 1] : null
          const delta = prev ? ((d.totalRights - prev.totalRights) / prev.totalRights) * 100 : 0
          return (
            <div key={d.date}
                 className={`rounded-lg p-2.5 border ${isLast ? 'border-[var(--green-200)] bg-[var(--green-50)]' : 'border-[var(--border-soft)] bg-[var(--bg-soft)]'}`}>
              <div className={`text-[10px] uppercase tracking-wide font-bold ${isLast ? 'text-[var(--green-700)]' : 'text-[var(--text-secondary)]'}`}>
                {d.date.split('-')[2]} พ.ค.
              </div>
              <div className={`text-[16px] num ${isLast ? 'text-[var(--green-800)]' : 'text-[var(--dark)]'}`}>{numFmt(d.totalRights)}</div>
              <div className="text-[9.5px] text-[var(--text-muted)]">{d.weekday}</div>
              {prev && (
                <div className={`text-[9.5px] font-bold ${delta >= 0 ? 'text-[var(--primary)]' : 'text-[var(--red)]'}`}>
                  {delta >= 0 ? '▲ +' : '▼ '}{delta.toFixed(1)}%
                </div>
              )}
            </div>
          )
        })}
      </div>

      <GaugeBar pct={overallGrowth} />

      <div className="mt-3 text-[11px] bg-[var(--green-50)] border border-[var(--green-200)] rounded-lg p-2.5 text-[var(--green-900)]">
        <div className="font-bold text-[var(--green-700)] uppercase text-[10px] tracking-wider mb-0.5 flex items-center gap-1">
          <i className="ti ti-crystal-ball" /> Forecast (linear extrapolation)
        </div>
        <div>Conservative: <b>{numFmt(projected)}</b> สิทธิ์ ตลอดแคมเปญ (213 วัน)</div>
      </div>
    </div>
  )
}

function GaugeBar({ pct }: { pct: number }) {
  return (
    <div className="mb-1">
      <div className="flex justify-between text-[9.5px] text-[var(--text-muted)] mb-1">
        <span>-20%</span><span>0</span><span>+20%</span><span>+40%</span>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden border border-[var(--border)]"
           style={{ background: 'linear-gradient(90deg, var(--red-soft) 0%, var(--yellow-soft) 50%, var(--green-100) 100%)' }}>
        <div className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow"
             style={{
               left: `${Math.min(100, Math.max(0, ((pct + 20) / 60) * 100))}%`,
               transform: 'translate(-50%, -50%)',
               background: pct >= 0 ? 'var(--primary)' : 'var(--red)',
             }} />
      </div>
    </div>
  )
}
