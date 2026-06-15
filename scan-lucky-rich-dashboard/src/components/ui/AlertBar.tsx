'use client'
import type { OutageInfo } from '@/lib/api/types'

// แสดง outage จริงจาก saversureV2 (/api/system/uptime) — ถ้าไม่มี outage ก็ไม่แสดงอะไร
export default function AlertBar({ outages }: { outages?: OutageInfo[] }) {
  const list = (outages ?? []).filter(o => o.durationHours > 0)
  if (list.length === 0) return null

  const c = { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', dot: '#dc2626' }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {list.slice(0, 3).map((o, i) => {
        const date = o.start.split('T')[0]
        const time = `${o.start.split('T')[1]?.slice(0, 5) ?? ''} – ${o.end.split('T')[1]?.slice(0, 5) ?? ''}`
        return (
          <div key={i}
               className="px-3 py-2 rounded-lg flex items-center gap-2 text-[12px] border"
               style={{ background: c.bg, borderColor: c.border + '40', color: c.text }}
               title={`${time} • ${o.cause}`}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: c.dot }} />
            <span className="text-[14px] flex-shrink-0">🚨</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold truncate">Outage: {date} — {o.durationHours.toFixed(1)} ชม.</div>
              <div className="text-[10.5px] opacity-80 truncate">{time} • {o.cause}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
