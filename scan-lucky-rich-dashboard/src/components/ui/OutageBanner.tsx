'use client'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'

export default function OutageBanner() {
  const dayWithOutage = DAILY_ENTRIES.find(d => d.outage)
  if (!dayWithOutage || !dayWithOutage.outage) return null

  const o = dayWithOutage.outage
  const dateStr = `${dayWithOutage.date.split('-')[2]} พ.ค. (${dayWithOutage.weekday})`

  return (
    <div className="card p-3 flex items-start gap-3" style={{ background: 'var(--red-soft)', borderColor: 'var(--red)', borderWidth: 1.5 }}>
      <i className="ti ti-alert-octagon text-2xl text-[var(--red)]" style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.4))' }} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-extrabold text-[13px] text-[var(--red)]">🚨 SYSTEM OUTAGE — {dateStr}</span>
          <span className="chip chip-red text-[10px]">{o.durationHours.toFixed(1)} ชั่วโมง</span>
        </div>
        <div className="text-[11.5px] text-[var(--text)] leading-relaxed">
          API down ระหว่าง <b>{o.start.split('T')[1].slice(0,5)} – {o.end.split('T')[1].slice(0,5)}</b> →
          ส่งผลให้ scan วันที่ 19 ตก {dayWithOutage.success.toLocaleString()} (เทียบวันปกติ ~7,000-9,000) — <b>หลังกู้ระบบ recover ทันที</b>
        </div>
        <div className="text-[10.5px] text-[var(--text-muted)] italic mt-0.5">
          ⚠️ ตัวเลขวันที่ 19 ไม่ใช่ apples-to-apples กับวัน 16-18 • Cause: {o.cause}
        </div>
      </div>
    </div>
  )
}
