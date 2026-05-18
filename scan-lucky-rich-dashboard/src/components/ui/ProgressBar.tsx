'use client'

interface ProgressBarProps {
  label: string
  current: number
  total: number
}

export default function ProgressBar({ label, current, total }: ProgressBarProps) {
  const pct = total > 0 ? ((current / total) * 100) : 0
  const color = pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--gold)' : 'var(--primary)'

  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{current} / {total}</span>
      </div>
      <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
