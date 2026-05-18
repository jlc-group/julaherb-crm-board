'use client'

interface InsightCardProps {
  html: string
  severity?: 'info' | 'warn' | 'danger'
}

export default function InsightCard({ html, severity = 'info' }: InsightCardProps) {
  const borderColor = severity === 'danger' ? 'var(--danger)' : severity === 'warn' ? 'var(--gold)' : 'var(--primary)'
  const bgGrad = severity === 'danger' ? 'from-red-50' : severity === 'warn' ? 'from-amber-50' : 'from-emerald-50'

  return (
    <div
      className={`bg-gradient-to-br ${bgGrad} to-white rounded-r-[10px] p-4 px-5 mb-5 text-[13px] leading-[1.7] text-[var(--text)]`}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <h4 className="text-[13px] font-bold mb-1.5 flex items-center gap-1.5">
        <i className="ti ti-rocket text-base" />
        Actions แนะนำ
      </h4>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
