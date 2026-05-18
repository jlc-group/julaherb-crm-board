'use client'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

export default function MomentumGauge() {
  const { day1, day2, growthPct } = REAL_CAMPAIGN
  const accelerating = growthPct > 15
  const status = accelerating ? 'ACCELERATING' : growthPct > 0 ? 'STEADY' : 'SLOWING'
  const chipClass = accelerating ? 'chip' : growthPct > 0 ? 'chip chip-yellow' : 'chip chip-red'
  const statusIcon = accelerating ? 'ti-rocket' : growthPct > 0 ? 'ti-arrow-up-right' : 'ti-arrow-down-right'
  const iconColor  = accelerating ? 'var(--primary)' : growthPct > 0 ? '#ca8a04' : 'var(--red)'

  const projectedTotal = Math.round((day1.rights + day2.rights) / 2 * 217)
  const xpGain = day2.rights - day1.rights

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className={`ti ${statusIcon} text-lg`} style={{ color: iconColor }} />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Daily Momentum</h3>
        <span className={`${chipClass} ml-auto`}>{accelerating && '🚀 '}{status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg p-2.5 border border-[var(--border-soft)] bg-[var(--bg-soft)]">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">Day 1</div>
          <div className="text-[18px] num text-[var(--dark)]">{numFmt(day1.rights)}</div>
          <div className="text-[10px] text-[var(--text-muted)]">16 พ.ค.</div>
        </div>
        <div className="rounded-lg p-2.5 border border-[var(--green-200)] bg-[var(--green-50)]">
          <div className="text-[10px] text-[var(--green-700)] uppercase tracking-wide font-bold">Day 2 ↑</div>
          <div className="text-[18px] num text-[var(--green-800)]">{numFmt(day2.rights)}</div>
          <div className="text-[10px] font-bold text-[var(--primary)]">+{growthPct.toFixed(1)}% (+{numFmt(xpGain)})</div>
        </div>
      </div>

      <div className="mb-1">
        <div className="flex justify-between text-[9.5px] text-[var(--text-muted)] mb-1">
          <span>-20%</span><span>0</span><span>+20%</span><span>+40%</span>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden border border-[var(--border)]"
             style={{ background: 'linear-gradient(90deg, var(--red-soft) 0%, var(--yellow-soft) 50%, var(--green-100) 100%)' }}>
          <div className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow"
               style={{
                 left: `${Math.min(100, Math.max(0, ((growthPct + 20) / 60) * 100))}%`,
                 transform: 'translate(-50%, -50%)',
                 background: 'var(--primary)',
               }} />
        </div>
      </div>

      <div className="mt-3 text-[11px] bg-[var(--green-50)] border border-[var(--green-200)] rounded-lg p-2.5 text-[var(--green-900)]">
        <div className="font-bold text-[var(--green-700)] uppercase text-[10px] tracking-wider mb-0.5 flex items-center gap-1">
          <i className="ti ti-crystal-ball" /> Forecast
        </div>
        <div>Conservative: <b>{numFmt(projectedTotal)}</b> สิทธิ์ทั้งแคมเปญ</div>
      </div>
    </div>
  )
}
