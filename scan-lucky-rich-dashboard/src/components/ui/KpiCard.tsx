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
    <div className={`bg-white rounded-[10px] p-4 border border-[var(--border)] relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${gold ? 'bg-[var(--gold)]' : 'bg-[var(--primary)]'}`} />
      <div className="text-[11px] text-[var(--text-secondary)] mb-1 font-medium">{label}</div>
      <div className="text-2xl font-bold text-[var(--dark)]" style={valueStyle}>
        {value}
        {badge && (
          <span className={`inline-block text-[10px] px-1.5 rounded-[10px] font-semibold ml-1.5 ${
            badgeDown ? 'bg-red-100 text-[var(--danger)]' : 'bg-[var(--light)] text-[var(--primary)]'
          }`}>{badge}</span>
        )}
      </div>
      {sub && <div className="text-[11px] text-[var(--text-secondary)] mt-1">{sub}</div>}
    </div>
  )
}
