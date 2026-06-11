'use client'

import type { DrawRound, DrawWinner } from '@/config/draw-rounds'
import { numFmt } from '@/lib/utils'

interface Props {
  rounds: DrawRound[]
  winners: DrawWinner[]
  selected: number | null
  onSelect: (round: number) => void
  today: string // ISO 'YYYY-MM-DD' (ว่าง = ยังไม่รู้)
}

export default function DrawRoundSelector({ rounds, winners, selected, onSelect, today }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {rounds.map((r) => {
        const filled = winners.filter((w) => w.round === r.round).length
        const done = r.totalCount > 0 && filled >= r.totalCount
        const isToday = today !== '' && r.drawDate === today
        const isPast = today !== '' && r.drawDate < today && !done
        const active = selected === r.round
        return (
          <button
            key={r.round}
            onClick={() => onSelect(r.round)}
            className={`card p-3 text-left transition ${active ? 'ring-2 ring-[var(--primary)]' : ''}`}
            style={active ? { borderColor: 'var(--primary)' } : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">รอบ {r.round}</span>
              {isToday ? (
                <span className="chip chip-red">วันนี้</span>
              ) : done ? (
                <span className="chip">ครบ ✓</span>
              ) : isPast ? (
                <span className="chip chip-gray">เลยแล้ว</span>
              ) : null}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-1 leading-none">จับฉลาก</div>
            <div className="text-[14px] font-bold text-[var(--dark)] leading-tight">{r.drawDateLabel}</div>
            <div className="text-[11px] font-semibold text-[#15803d] mt-1">→ ผู้โชคดีเดือน{r.prizeMonthName}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {r.totalCount} รางวัล · {numFmt(r.totalValue)}฿
            </div>
            <div className={`text-[12px] font-semibold mt-1 ${done ? 'text-[var(--positive)]' : 'text-[var(--text-secondary)]'}`}>
              กรอก {filled}/{r.totalCount}
            </div>
          </button>
        )
      })}
    </div>
  )
}
