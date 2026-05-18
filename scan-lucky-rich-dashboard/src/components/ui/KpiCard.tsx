'use client'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  badge?: string
  badgeDown?: boolean
  gold?: boolean
  valueStyle?: React.CSSProperties
}

export default function KpiCard({ label, value, sub, badge, badgeDown, gold, valueStyle }: KpiCardProps) {
  return (
    <div className={`card card-accent-top ${gold ? 'is-yellow' : ''} p-4 float-up`}>
      <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold mb-1.5">
        {label}
      </div>
      <div className={`text-[22px] num leading-tight ${gold ? 'text-[#854d0e]' : 'text-[var(--dark)]'}`} style={valueStyle}>
        {value}
        {badge && (
          <span className={`inline-block text-[10px] font-bold ml-2 align-middle ${badgeDown ? 'chip chip-red' : 'chip'}`}>
            {badge}
          </span>
        )}
      </div>
      {sub && <div className="text-[11px] text-[var(--text-secondary)] mt-1">{sub}</div>}
    </div>
  )
}
