'use client'

interface InsightInlineProps {
  html: string
  severity?: 'info' | 'warn' | 'danger'
}

export default function InsightInline({ html, severity = 'info' }: InsightInlineProps) {
  const borderColor = severity === 'danger' ? 'var(--danger)' : severity === 'warn' ? 'var(--gold)' : 'var(--primary)'
  const bg = severity === 'danger' ? '#fef5f5' : severity === 'warn' ? '#fefbf3' : '#f8fcfa'

  return (
    <div
      className="rounded-r-md py-2.5 px-3.5 -mt-2 mb-4 text-xs leading-relaxed text-[var(--text)]"
      style={{ borderLeft: `3px solid ${borderColor}`, background: bg }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
