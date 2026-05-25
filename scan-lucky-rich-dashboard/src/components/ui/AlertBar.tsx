'use client'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'

export default function AlertBar() {
  const alerts: { type: 'neg' | 'warn' | 'pos'; icon: string; title: string; body: string }[] = []

  // Outage alert
  const outageDay = DAILY_ENTRIES.find(d => d.outage)
  if (outageDay && outageDay.outage) {
    const o = outageDay.outage
    alerts.push({
      type: 'neg',
      icon: '🚨',
      title: `Outage: ${outageDay.date.split('-')[2]} พ.ค. — ${o.durationHours.toFixed(1)} ชั่วโมง`,
      body: `${o.start.split('T')[1].slice(0,5)} – ${o.end.split('T')[1].slice(0,5)} • ${o.cause}`,
    })
  }

  // Duplicate-other trend alert
  // Use dupOther + notFound combined as "fraud signal" trend
  const dupOtherPcts = DAILY_ENTRIES.map(d => {
    const total = d.success + d.dupSelf + d.dupOther + d.notFound
    return ((d.dupOther + d.notFound) / total) * 100
  })
  if (dupOtherPcts.length >= 2 && dupOtherPcts[dupOtherPcts.length - 1] > dupOtherPcts[0] * 1.5) {
    alerts.push({
      type: 'warn',
      icon: '⛔',
      title: 'Duplicate-other rate กำลังเพิ่ม',
      body: `จาก ${dupOtherPcts[0].toFixed(1)}% (วันแรก) → ${dupOtherPcts[dupOtherPcts.length-1].toFixed(1)}% (ล่าสุด) • อาจเป็น QR ก๊อปปี้`,
    })
  }

  // Positive: signup growth
  const signupRates = DAILY_ENTRIES.map(d => (d.newScanned / d.uniqueUsers) * 100)
  if (signupRates[signupRates.length - 1] > signupRates[0]) {
    alerts.push({
      type: 'pos',
      icon: '✅',
      title: 'อัตราสมาชิกใหม่กำลังเพิ่ม',
      body: `จาก ${signupRates[0].toFixed(1)}% → ${signupRates[signupRates.length-1].toFixed(1)}% — acquisition layer ทำงาน`,
    })
  }

  if (alerts.length === 0) return null

  const colorMap = {
    neg:  { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', dot: '#dc2626' },
    warn: { bg: '#fffbeb', border: '#d97706', text: '#92400e', dot: '#d97706' },
    pos:  { bg: '#ecfdf5', border: '#10b981', text: '#065f46', dot: '#10b981' },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {alerts.map((a, i) => {
        const c = colorMap[a.type]
        return (
          <div key={i}
               className="px-3 py-2 rounded-lg flex items-center gap-2 text-[12px] border"
               style={{ background: c.bg, borderColor: c.border + '40', color: c.text }}
               title={a.body}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
            <span className="text-[14px] flex-shrink-0">{a.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">{a.title}</div>
              <div className="text-[10.5px] opacity-80 truncate">{a.body}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
