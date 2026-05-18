'use client'

interface InsightCardProps {
  html: string
  severity?: 'info' | 'warn' | 'danger'
}

export default function InsightCard({ html, severity = 'info' }: InsightCardProps) {
  return (
    <div className="card p-4 px-5 mt-4 text-[13px] leading-[1.75]"
         style={{
           background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
           borderLeft: '4px solid var(--primary)',
         }}>
      <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2 text-[var(--dark)]">
        <i className="ti ti-rocket text-lg text-[var(--primary)]" />
        Actions แนะนำ
        <span className="chip ml-auto">QUEST</span>
      </h4>
      <div className="text-[var(--text)]" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
