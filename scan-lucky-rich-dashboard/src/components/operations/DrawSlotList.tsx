'use client'

import { Fragment, useState } from 'react'
import type { DrawRound, DrawWinner, PrizeSlot } from '@/config/draw-rounds'
import { roundSlots, GOLD, getRound, winnerAnnounceISOBySlot } from '@/config/draw-rounds'
import { numFmt } from '@/lib/utils'
import { findPrevWins, phoneLast9 } from './draw-utils'

const TH_MO_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// ป้ายประวัติรางวัล: ใช้วันที่ประกาศจริงเสมอ (10K = วันรายวัน · 100K = สิ้นเดือนที่ประกาศ · 1M = วันจับ)
function prevWinLabel(w: DrawWinner): string {
  const iso = winnerAnnounceISOBySlot(w.round, w.slotId)
  if (!iso) return getRound(w.round)?.prizeMonthShort ?? `รอบ ${w.round}`
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${TH_MO_SHORT[m]} ${y + 543}`
}
import KpiCard from '@/components/ui/KpiCard'
import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  round: DrawRound
  winners: DrawWinner[]
  onPick: (slot: PrizeSlot, existing?: DrawWinner) => void
  onRemove: (slot: PrizeSlot) => void
  onExport: () => void // CSV ละเอียด (สิทธิ์/ประวัติ/ที่อยู่) สำหรับทีมโทร
  onDownloadForm: () => void // Excel ตาม pattern ไฟล์ต้นฉบับ (10 คอลัมน์)
  onImport: () => void // อัปโหลดรายชื่อ → ระบุรายวันอัตโนมัติ
  onOpenClaim?: (phoneLast9: string) => void // กดผู้ได้รางวัล → ไปหน้ารับรางวัล
  onReload: () => void // โหลดรายชื่อใหม่ (หลังเติมสิทธิ์ย้อนหลัง)
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

export default function DrawSlotList({ round, winners, onPick, onRemove, onExport, onDownloadForm, onImport, onOpenClaim, onReload }: Props) {
  const [enriching, setEnriching] = useState(false)
  const ordered = DAY_ORDER.flatMap((t) => roundSlots(round).filter((s) => s.tier === t))
  const bySlot = new Map(winners.filter((w) => w.round === round.round).map((w) => [w.slotId, w]))
  const filled = ordered.filter((s) => bySlot.has(s.slotId)).length
  // มีคนที่ยังไม่มี "สิทธิ์ที่ส่ง" ไหม (เติมย้อนหลังได้)
  const missingRights = winners.some((w) => w.round === round.round && typeof w.rightsCount !== 'number')

  async function enrichRights() {
    setEnriching(true)
    try {
      await fetch('/api/draw/winners?enrich=1')
      onReload()
    } catch {
      /* เติมไม่สำเร็จ — ลองใหม่ได้ */
    } finally {
      setEnriching(false)
    }
  }
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
        <div className="flex justify-end gap-2 flex-wrap">
          <button onClick={onImport} className="px-3 py-1.5 rounded-md border border-[var(--primary)] text-[var(--primary)] text-[13px] font-semibold mr-auto" title="อัปโหลดไฟล์รายชื่อ (ชื่อ/นามสกุล/เบอร์) แล้วระบบจะระบุรายวันให้อัตโนมัติตามลำดับแถว">
            <i className="ti ti-upload mr-1" /> อัปโหลดรายชื่อ (ระบุรายวัน)
          </button>
          {missingRights && (
            <button onClick={enrichRights} disabled={enriching} className="px-3 py-1.5 rounded-md border border-[var(--primary)] text-[var(--primary)] text-[13px] font-semibold disabled:opacity-50" title="เติม 'สิทธิ์ที่ส่ง' ที่ยังว่าง — นับจำนวนสลิปจากระบบ (ครั้งแรกอาจ ~1-2 นาที)">
              <i className="ti ti-refresh mr-1" /> {enriching ? 'กำลังเติมสิทธิ์… (~1-2 นาที)' : 'เติมสิทธิ์ที่ส่ง'}
            </button>
          )}
          <button onClick={onExport} disabled={filled === 0} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[13px] font-semibold disabled:opacity-40" title="CSV ละเอียด — มีสิทธิ์ที่ส่ง / ประวัติรางวัล / ที่อยู่ สำหรับทีมโทร">
            <i className="ti ti-file-spreadsheet mr-1" /> Export CSV (ละเอียด)
          </button>
          <button onClick={onDownloadForm} className="px-3 py-1.5 rounded-md text-white text-[13px] font-semibold" style={{ background: 'var(--primary)' }} title="Excel ตามฟอร์มต้นฉบับ: ลำดับ · รางวัล · วันจับ · วันประกาศ · ชื่อ · นามสกุล · เบอร์ · รหัส · สินค้า · จังหวัด">
            <i className="ti ti-download mr-1" /> ดาวน์โหลดรายชื่อผู้โชคดี (Excel)
          </button>
        </div>
      </div>

      {/* ตารางรางวัล เรียงตามวัน (รางวัลประจำวันก่อน → รางวัลใหญ่ท้ายสุด)
          · เบอร์โทร "เต็ม" เฉพาะหน้านี้ เพื่อให้ทีมโทร + ส่งที่อยู่ไปรับรางวัล (หน้าอื่นยัง mask) */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1120px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] bg-[var(--bg-soft)] border-b border-[var(--border)]">
              <th className="font-semibold px-3 py-2.5 w-40">รางวัล</th>
              <th className="font-semibold px-3 py-2.5 w-48">ผู้ได้รางวัล</th>
              <th className="font-semibold px-3 py-2.5 w-32 text-center">เบอร์โทร</th>
              <th className="font-semibold px-3 py-2.5 w-20 text-center">สิทธิ์ที่ส่ง</th>
              <th className="font-semibold px-3 py-2.5 w-28 text-center">ประวัติรางวัล</th>
              <th className="font-semibold px-3 py-2.5">ที่อยู่ (ติดต่อ/ส่งรางวัล)</th>
              <th className="font-semibold px-3 py-2.5 w-24 text-center">รหัสสแกน</th>
              <th className="font-semibold px-3 py-2.5 w-56 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((slot, i) => {
              const w = bySlot.get(slot.slotId)
              const { kicker, main, sub, big } = slotLabel(slot, round)
              const pw = w ? findPrevWins(winners, w.phone, round.round) : []
              return (
                <Fragment key={slot.slotId}>
                  {i === firstBigIdx && firstBigIdx > 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 pt-3 pb-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#854d0e]">
                          <span className="h-px flex-1 bg-[var(--yellow)] opacity-40" /> รางวัลใหญ่รายเดือน <span className="h-px flex-1 bg-[var(--yellow)] opacity-40" />
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    className={`border-b border-[var(--border)] align-middle ${
                      big ? 'bg-[var(--yellow-soft)]' : w ? 'bg-[var(--positive-soft)]' : 'hover:bg-[var(--bg-soft)]'
                    }`}
                  >
                    {/* รางวัล */}
                    <td className="px-3 py-2.5">
                      <div className="text-[10px] text-[var(--text-secondary)] leading-tight">{kicker}</div>
                      <div className={`text-[13px] font-bold leading-tight whitespace-nowrap ${big ? 'text-[#854d0e]' : 'text-[var(--dark)]'}`}>{main}</div>
                      {sub && <div className="text-[10.5px] text-[var(--text-secondary)]">{sub}</div>}
                    </td>

                    {w ? (
                      <>
                        {/* ผู้ได้รางวัล — ชื่อบรรทัดเดียว */}
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-[13.5px] whitespace-nowrap truncate max-w-[180px]" title={w.name}>{w.name}</div>
                        </td>
                        {/* เบอร์โทร (เต็ม) */}
                        <td className="px-3 py-2.5 text-[13px] num text-center whitespace-nowrap">{w.phone || '—'}</td>
                        {/* สิทธิ์ที่ส่ง */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {typeof w.rightsCount === 'number' ? (
                            <span className="text-[13px] font-bold text-[var(--dark)] num">{w.rightsCount.toLocaleString()}</span>
                          ) : (
                            <span className="text-[12px] text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        {/* ประวัติรางวัล (เคยได้รอบ/เดือนไหน) */}
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          {pw.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center" title={pw.map((x) => `รอบ ${x.round} · ${x.prizeLabel}`).join(', ')}>
                              {pw.map((x) => (
                                <span key={x.slotId} className="text-[10.5px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5">
                                  {prevWinLabel(x)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#15803d]">ครั้งแรก</span>
                          )}
                        </td>
                        {/* ที่อยู่ */}
                        <td className="px-3 py-2.5 text-[12.5px]">
                          {w.address ? (
                            <span className="text-[var(--text)] whitespace-pre-wrap">{w.address}</span>
                          ) : (
                            <button onClick={() => onPick(slot, w)} className="text-[12px] text-[var(--text-muted)] italic hover:text-[var(--primary)]">
                              — เพิ่มที่อยู่
                            </button>
                          )}
                        </td>
                        {/* รหัสสแกน */}
                        <td className="px-3 py-2.5 text-[12px] text-[var(--text-secondary)] text-center whitespace-nowrap">{w.scanCode || '—'}</td>
                        {/* จัดการ */}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            {onOpenClaim && (
                              <button
                                onClick={() => onOpenClaim(phoneLast9(w.phone))}
                                className="flex-shrink-0 text-[11px] font-semibold text-[#15803d] bg-[#dcfce7] rounded px-2 py-1 hover:bg-[#bbf7d0]"
                                title="ไปหน้ารับรางวัล — เช็คว่าคนนี้ส่งเอกสารหรือยัง"
                              >
                                🏅 รับรางวัล →
                              </button>
                            )}
                            <button onClick={() => onPick(slot, w)} className="flex-shrink-0 text-[12px] text-[var(--primary)] font-semibold">แก้</button>
                            <button onClick={() => onRemove(slot)} className="flex-shrink-0 text-[12px] text-red-500 font-semibold">ลบ</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <td colSpan={7} className="px-3 py-2.5">
                        <button onClick={() => onPick(slot)} className="text-[13px] text-[var(--primary)] font-semibold">
                          ＋ ระบุผู้ได้รางวัล
                        </button>
                      </td>
                    )}
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
