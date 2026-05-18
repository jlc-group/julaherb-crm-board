'use client'

interface ChartCardProps {
  title?: string
  icon?: string
  full?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function ChartCard({ title, icon, full, children, className = '', style }: ChartCardProps) {
  return (
    <div className={`card p-4 float-up ${full ? 'col-span-full' : ''} ${className}`} style={style}>
      {title && (
        <h3 className="text-[13px] font-bold mb-3 text-[var(--dark)] flex items-center gap-2">
          {icon && <i className={`ti ${icon} text-base text-[var(--primary)]`} />}
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
