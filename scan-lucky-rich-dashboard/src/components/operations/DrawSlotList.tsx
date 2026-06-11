'use client'

import type { DrawRound, DrawWinner, PrizeSlot } from '@/config/draw-rounds'
import { roundSlots, GOLD } from '@/config/draw-rounds'
import { maskPhone, numFmt } from '@/lib/utils'
import { findPrevWins, phoneLast9 } from './draw-utils'
import KpiCard from '@/components/ui/KpiCard'
import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  round: DrawRound
  winners: DrawWinner[]
  onPick: (slot: PrizeSlot, existing?: DrawWinner) => void
  onRemove: (slot: PrizeSlot) => void
  onExport: () => void
  onOpenClaim?: (phoneLast9: string) => void // กดผู้ได้รางวัล → ไปหน้ารับรางวัล
}

// เรียงตามวัน: รางวัลประจำวัน (10K) ก่อน → รางวัลใหญ่รายเดือน (100K) → ใหญ่สุด (1M) ท้ายสุด
const DAY_ORDER: Array<'10K' | '100K' | '1M'> = ['10K', '100K', '1M']

function slotLabel(slot: PrizeSlot, round: DrawRound): { kicker: string; main: string; sub: string; big: boolean } {
  if (slot.tier === '10K')
    return { kicker: 'ผู้โชคดีประจำ', main: `วันที่ ${slot.indexInTier} ${round.prizeMonthShort}`, sub: 'ทอง 10,000', big: false }
  if (slot.tier === '100K')
    return { kicker: `รางวัลประจำเดือน${round.prizeMonthName}`, main: `รางวัลที่ ${slot.indexInTier}`, sub: 'ทอง 100,000', big: true }
  return { kicker: 'รางวัลใหญ่ท้ายแคมเปญ', main: '🏆 ทอง 1 ล้าน', sub: '', big: true }
}

export default function DrawSlotList({ round, winners, onPick, onRemove, onExport, onOpenClaim }: Props) {
  const ordered = DAY_ORDER.flatMap((t) => roundSlots(round).filter((s) => s.tier === t))
  const bySlot = new Map(winners.filter((w) => w.round === round.round).map((w) => [w.slotId, w]))
  const filled = ordered.filter((s) => bySlot.has(s.slotId)).length
  // ตำแหน่งแรกของรางวัลใหญ่ (สำหรับเส้นคั่นบาง ๆ — เฉพาะตอนมีทั้งรางวัลประจำวัน + รางวัลใหญ่)
  const firstBigIdx = ordered.findIndex((s) => s.tier !== '10K')

  return (
    <div className="space-y-4">
      {/* สรุปรอบ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="รอบที่" value={round.round} sub={round.drawDateLabel} />
        <KpiCard label="รางวัลรอบนี้" value={round.totalCount} sub="รางวัล" />
        <KpiCard label="มูลค่า" value={numFmt(round.totalValue)} sub="บาท" gold />
        <KpiCard label="กรอกแล้ว" value={`${filled}/${round.totalCount}`} sub={filled === round.totalCount ? 'ครบแล้ว ✓' : 'รอเติม'} />
      </div>

      <div className="card p-4">
        <ProgressBar label="ความคืบหน้าการบันทึก" current={filled} total={round.totalCount} />
        <div className="flex justify-end">
          <button onClick={onExport} disabled={filled === 0} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[13px] font-semibold disabled:opacity-40">
            <i className="ti ti-download mr-1" /> Export CSV
          </button>
        </div>
      </div>

      {/* รายการรางวัล เรียงตามวัน (รางวัลประจำวันก่อน → รางวัลใหญ่ท้ายสุด) */}
      <div className="card p-3 sm:p-4 space-y-1.5">
        {ordered.map((slot, i) => {
          const w = bySlot.get(slot.slotId)
          const { kicker, main, sub, big } = slotLabel(slot, round)
          const pw = w ? findPrevWins(winners, w.phone, round.round) : []
          return (
            <div key={slot.slotId}>
              {i === firstBigIdx && firstBigIdx > 0 && (
                <div className="flex items-center gap-2 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#854d0e]">
                  <span className="h-px flex-1 bg-[var(--yellow)] opacity-40" /> รางวัลใหญ่รายเดือน <span className="h-px flex-1 bg-[var(--yellow)] opacity-40" />
                </div>
              )}
              <div
                className={`rounded-md border px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${
                  big ? 'border-[var(--yellow)] bg-[var(--yellow-soft)]' : w ? 'border-[var(--primary)] bg-[var(--positive-soft)]' : 'border-[var(--border)]'
                }`}
              >
                <div className="w-36 flex-shrink-0">
                  <div className="text-[10px] text-[var(--text-secondary)] leading-tight">{kicker}</div>
                  <div className={`text-[13px] font-bold leading-tight ${big ? 'text-[#854d0e]' : 'text-[var(--dark)]'}`}>{main}</div>
                  {sub && <div className="text-[10.5px] text-[var(--text-secondary)]">{sub}</div>}
                </div>
                {w ? (
                  <>
                    <div className="min-w-0 grow shrink basis-[180px]">
                      <div className="font-semibold text-sm truncate">{w.name}</div>
                      <div className="text-[12px] text-[var(--text-secondary)]">
                        {maskPhone(w.phone)}
                        {w.scanCode ? ` · ${w.scanCode}` : ''}
                        {pw.length > 0 && <span className="text-amber-700"> · ⚠️ เคยได้ {pw.map((x) => `รอบ ${x.round}`).join(', ')}</span>}
                      </div>
                    </div>
                    {onOpenClaim && (
                      <button
                        onClick={() => onOpenClaim(phoneLast9(w.phone))}
                        className="text-[11px] font-semibold text-[#15803d] bg-[#dcfce7] rounded px-2 py-1 flex-shrink-0 hover:bg-[#bbf7d0]"
                        title="ไปหน้ารับรางวัล — เช็คว่าคนนี้ส่งเอกสารหรือยัง"
                      >
                        🏅 รับรางวัล →
                      </button>
                    )}
                    <button onClick={() => onPick(slot, w)} className="text-[12px] text-[var(--primary)] font-semibold flex-shrink-0">แก้</button>
                    <button onClick={() => onRemove(slot)} className="text-[12px] text-red-500 font-semibold flex-shrink-0">ลบ</button>
                  </>
                ) : (
                  <button onClick={() => onPick(slot)} className="flex-1 text-left text-[13px] text-[var(--primary)] font-semibold">
                    ＋ ระบุผู้ได้รางวัล
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
