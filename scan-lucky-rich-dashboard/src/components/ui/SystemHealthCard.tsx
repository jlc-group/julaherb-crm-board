'use client'
import { SYSTEM_HEALTH } from '@/lib/daily-update-data'

export default function SystemHealthCard() {
  const { uptimePct, outageHours, totalHours, incidents } = SYSTEM_HEALTH
  const isHealthy = uptimePct >= 99
  const color = isHealthy ? 'var(--primary)' : uptimePct >= 95 ? '#ca8a04' : 'var(--red)'

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-heartbeat text-lg" style={{ color }} />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">System Health</h3>
        <span className="ml-auto chip" style={{ background: color + '20', color }}>
          {isHealthy ? '✅ HEALTHY' : uptimePct >= 95 ? '🟡 WARNING' : '🔴 CRITICAL'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[var(--bg-soft)] rounded-lg p-2.5 border border-[var(--border-soft)]">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide font-bold">Uptime (4 วัน)</div>
          <div className="text-[24px] num leading-tight" style={{ color }}>{uptimePct.toFixed(1)}%</div>
          <div className="text-[10px] text-[var(--text-muted)]">{(totalHours - outageHours).toFixed(1)}h / {totalHours}h</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2.5 border border-red-100">
          <div className="text-[10px] text-[var(--red)] uppercase tracking-wide font-bold">Outage Hours</div>
          <div className="text-[24px] num leading-tight text-[var(--red)]">{outageHours.toFixed(1)}h</div>
          <div className="text-[10px] text-[var(--text-muted)]">{incidents.length} incidents</div>
        </div>
      </div>

      <div>
        <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-1.5">
          <i className="ti ti-alert-triangle text-[var(--red)]" /> Recent Incidents
        </div>
        {incidents.map((inc, i) => (
          <div key={i} className="bg-red-50/40 border border-red-100 rounded-lg px-2.5 py-1.5 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--dark)]">{inc.date}</span>
              <span className="text-[10px] text-[var(--red)] font-bold">{inc.durationHours.toFixed(1)}h ({inc.severity})</span>
            </div>
            <div className="text-[10px] text-[var(--text)] mt-0.5">⏰ {inc.start} – {inc.end}</div>
            <div className="text-[9.5px] text-[var(--text-muted)] italic mt-0.5">{inc.cause}</div>
          </div>
        ))}
      </div>

      {!isHealthy && (
        <div className="mt-2 text-[10.5px] text-[var(--red)] italic flex items-start gap-1.5">
          <i className="ti ti-info-circle mt-0.5" />
          <span>ก่อน cutover production: ตั้ง persistent log + alerting + DR plan</span>
        </div>
      )}
    </div>
  )
}
