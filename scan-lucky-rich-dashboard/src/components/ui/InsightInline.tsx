'use client'

interface InsightInlineProps {
  html: string
  severity?: 'info' | 'warn' | 'danger'
}

export default function InsightInline({ html, severity = 'info' }: InsightInlineProps) {
  const cfg = {
    info:   { color: 'var(--primary)', icon: 'ti-bulb',           bg: 'var(--green-50)',  text: 'var(--green-900)' },
    warn:   { color: '#ca8a04',        icon: 'ti-alert-triangle', bg: 'var(--yellow-soft)', text: '#713f12' },
    danger: { color: 'var(--red)',     icon: 'ti-alert-octagon',  bg: 'var(--red-soft)',    text: '#991b1b' },
  }[severity]

  return (
    <div
      className="rounded-lg py-2 px-3 mt-3 text-[11.5px] leading-relaxed flex items-start gap-2"
      style={{
        borderLeft: `3px solid ${cfg.color}`,
        background: cfg.bg,
        color: cfg.text,
      }}
    >
      <i className={`ti ${cfg.icon} mt-[2px]`} style={{ color: cfg.color }} />
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
