'use client'

interface Props {
  icon?: string
  title: string
  subtitle?: string
  /** Optional right-side action (e.g. export button) */
  action?: React.ReactNode
}

export default function TabHeader({ icon, title, subtitle, action }: Props) {
  return (
    <div className="flex items-center gap-3 py-1">
      {icon && (
        <span className="text-[26px] leading-none" aria-hidden>{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-[18px] font-bold text-[var(--dark)] leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-[11.5px] text-[var(--text-secondary)] leading-snug mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  )
}
