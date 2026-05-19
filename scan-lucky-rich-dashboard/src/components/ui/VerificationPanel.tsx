'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { VERIFICATION_KPIS, VERIFICATION_BREAKDOWN } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

const SEVERITY_COLOR = {
  low:  { chip: 'chip',         text: 'var(--green-700)' },
  mid:  { chip: 'chip chip-yellow', text: '#854d0e' },
  high: { chip: 'chip chip-red',    text: 'var(--red)' },
}

export default function VerificationPanel() {
  const { totalAttempts, totalValid, validRatePct, failedCount } = VERIFICATION_KPIS
  const sorted = [...VERIFICATION_BREAKDOWN].sort((a, b) => b.count - a.count)
  const top = sorted[0]
  const maxPct = Math.max(...sorted.map(s => s.pct))

  return (
    <ChartCard title="Verification & Failure Analysis" icon="ti-shield-check" full>
      {/* Top KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Kpi label="Scan Attempts รวม"  value={numFmt(totalAttempts)} sub="ครั้ง" color="var(--dark)" />
        <Kpi label="Valid Rate"         value={`${validRatePct.toFixed(1)}%`} sub={`${numFmt(totalValid)} ผ่าน`} color="var(--primary)" />
        <Kpi label="Failed"             value={numFmt(failedCount)} sub={`${(100 - validRatePct).toFixed(1)}%`} color="var(--red)" />
        <Kpi label="ปัญหาหลัก"          value={top.type.split(' ')[0]} sub={`${numFmt(top.count)} ครั้ง`} color="#ca8a04" />
      </div>

      {/* Breakdown bars */}
      <div className="space-y-2">
        {sorted.map(s => {
          const cfg = SEVERITY_COLOR[s.severity]
          return (
            <div key={s.type}>
              <div className="flex items-center gap-2 text-[11.5px] mb-1">
                <span className={cfg.chip}>{s.severity.toUpperCase()}</span>
                <span className="font-semibold text-[var(--dark)] flex-1">{s.type}</span>
                <span className="text-[var(--text-muted)] text-[10px]">{s.hint}</span>
                <span className="num font-bold text-[var(--dark)] w-16 text-right">{numFmt(s.count)}</span>
                <span className="num font-bold w-12 text-right" style={{ color: cfg.text }}>{s.pct.toFixed(1)}%</span>
              </div>
              <div className="progress" style={{ height: 5 }}>
                <div
                  className={`progress-fill ${s.severity === 'high' ? 'is-red' : s.severity === 'mid' ? 'is-yellow' : ''}`}
                  style={{ width: `${(s.pct / maxPct) * 100}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <InsightInline
        severity={top.severity === 'high' ? 'danger' : 'warn'}
        html={`<b>${top.type}</b> คิดเป็น <b>${top.pct.toFixed(0)}%</b> ของ failure ทั้งหมด — ${top.hint} | ตรวจ ${sorted.filter(x => x.severity === 'high').length > 0 ? '"Suspicious velocity" ก่อน (high risk)' : 'Duplicate UX flow ก่อน'}`}
      />
    </ChartCard>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card-accent-top card p-3" style={{ borderTopColor: color }}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1">{label}</div>
      <div className="text-[20px] num leading-tight" style={{ color }}>{value}</div>
      <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">{sub}</div>
    </div>
  )
}
