'use client'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'

interface Props {
  activeIdx: number
  onChange: (idx: number) => void
}

const DAY_TAGS: string[] = ['start', 'peak', 'weekday', '⚠️ 6h outage']

export default function DaySelector({ activeIdx, onChange }: Props) {
  return (
    <div className="day-selector">
      <div className="day-selector-label">📅 เลือกวัน</div>
      {DAILY_ENTRIES.map((d, i) => (
        <button
          key={d.date}
          onClick={() => onChange(i)}
          className={`day-btn ${activeIdx === i ? 'active' : ''}`}
        >
          <span className="d-date">{d.date.split('-')[2]} พ.ค.</span>
          <span className="d-dow">{d.weekday}</span>
          <span className="d-tag">{d.outage ? '⚠️ outage' : DAY_TAGS[i] || ''}</span>
        </button>
      ))}
    </div>
  )
}
