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
    <div
      className={`bg-white rounded-[10px] p-4 border border-[var(--border)] ${full ? 'col-span-full' : ''} ${className}`}
      style={style}
    >
      {title && (
        <h3 className="text-[13px] font-semibold mb-3 text-[var(--dark)] flex items-center gap-2">
          {icon && <i className={`ti ${icon} text-lg`} />}
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
