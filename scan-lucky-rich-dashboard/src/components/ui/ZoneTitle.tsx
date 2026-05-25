'use client'

interface Props {
  num: number | string
  title: string
  dayTag?: string
}

export default function ZoneTitle({ num, title, dayTag }: Props) {
  return (
    <div className="zone-title">
      <span className="text-[var(--brand-700)] font-bold">{num}.</span>&nbsp;{title}
      {dayTag && <span className="day-tag">{dayTag}</span>}
    </div>
  )
}
