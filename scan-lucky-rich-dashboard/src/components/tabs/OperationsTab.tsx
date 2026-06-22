'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DRAW_ROUNDS,
  getRound,
  roundSlots,
  DRAW_TOTAL_PRIZES,
  DRAW_TOTAL_VALUE,
} from '@/config/draw-rounds'
import type { DrawWinner, PrizeSlot } from '@/config/draw-rounds'
import { findPrevWins, type PoolCustomer } from '@/components/operations/draw-utils'
import { numFmt } from '@/lib/utils'
import TabHeader from '@/components/ui/TabHeader'
import DrawRoundSelector from '@/components/operations/DrawRoundSelector'
import DrawSlotList from '@/components/operations/DrawSlotList'
import WinnerPicker from '@/components/operations/WinnerPicker'

// หน้า "จับรางวัล" สำหรับวันงานจริง — บันทึกผู้ได้รางวัล 7 รอบ
// การจับจริง = ปริ้นสลิปกระดาษ → โยนจับด้วยมือ · หน้านี้ใช้ "บันทึก" คนที่จับได้
export default function OperationsTab({ onOpenClaim }: { onOpenClaim?: (phoneLast9: string) => void }) {
  const [winners, setWinners] = useState<DrawWinner[]>([])
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [picker, setPicker] = useState<{ slot: PrizeSlot; existing?: DrawWinner } | null>(null)
  const [today, setToday] = useState('')
  // พูลค้นหาของรอบที่เลือก (ดึงครั้งเดียวตอนเลือกรอบ)
  const [pool, setPool] = useState<PoolCustomer[]>([])
  const [poolMeta, setPoolMeta] = useState<{ loading: boolean; capped: boolean; total: number; error: string }>({
    loading: false,
    capped: false,
    total: 0,
    error: '',
  })

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/draw/winners')
      const b = await r.json()
      setWinners(b.winners ?? [])
    } catch {
      /* เก็บค่าเดิม */
    }
  }, [])

  useEffect(() => {
    load()
    const d = new Date()
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }, [load])

  // ดึงพูลค้นหาเมื่อเลือกรอบ (ครั้งเดียว/รอบ · มี s-maxage กันยิงซ้ำ)
  useEffect(() => {
    if (!selectedRound) {
      setPool([])
      return
    }
    let cancelled = false
    setPoolMeta({ loading: true, capped: false, total: 0, error: '' })
    fetch('/api/draw/pool?round=' + selectedRound)
      .then(async (r) => {
        const b = await r.json().catch(() => ({}))
        if (cancelled) return
        if (!r.ok) {
          setPool([])
          setPoolMeta({ loading: false, capped: false, total: 0, error: b.error ?? 'โหลดพูลไม่สำเร็จ' })
          return
        }
        setPool(b.customers ?? [])
        setPoolMeta({ loading: false, capped: !!b.capped, total: b.totalSlips ?? 0, error: '' })
      })
      .catch((e) => {
        if (!cancelled) {
          setPool([])
          setPoolMeta({ loading: false, capped: false, total: 0, error: String(e?.message ?? e) })
        }
      })
    return () => {
      cancelled = true
    }
  }, [selectedRound])

  const round = selectedRound ? getRound(selectedRound) ?? null : null

  async function removeSlot(slot: PrizeSlot) {
    if (!confirm('ลบผู้ได้รางวัลช่องนี้?')) return
    await fetch('/api/draw/winners?slotId=' + encodeURIComponent(slot.slotId), { method: 'DELETE' })
    load()
  }

  function exportCsv() {
    if (!round) return
    const slots = roundSlots(round)
    const bySlot = new Map(winners.filter((w) => w.round === round.round).map((w) => [w.slotId, w]))
    const rows: string[][] = [['รอบ', 'วันจับ', 'รางวัล', 'ลำดับ', 'ชื่อ-นามสกุล', 'เบอร์', 'สิทธิ์ที่ส่ง', 'ประวัติได้รางวัล', 'รหัสสแกน', 'ที่อยู่']]
    for (const s of slots) {
      const w = bySlot.get(s.slotId)
      const prev = w ? findPrevWins(winners, w.phone, round.round).map((x) => getRound(x.round)?.prizeMonthShort ?? `รอบ ${x.round}`).join(' / ') : ''
      rows.push([String(round.round), round.drawDateLabel, s.tierLabel, String(s.indexInTier), w?.name ?? '', w?.phone ?? '', w?.rightsCount != null ? String(w.rightsCount) : '', prev, w?.scanCode ?? '', w?.address ?? ''])
    }
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ผู้ได้รางวัล_รอบ${round.round}_${round.drawDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <TabHeader
        icon="🎁"
        title="จับรางวัล — บันทึกผู้โชคดี"
        subtitle={`7 รอบ · ${DRAW_TOTAL_PRIZES} รางวัล · ${numFmt(DRAW_TOTAL_VALUE)} บาท · บันทึกแล้ว ${winners.length}`}
      />

      <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-soft)] rounded-md px-3 py-2 leading-relaxed">
        การจับจริง = ปริ้นสลิปกระดาษ → โยนจับด้วยมือ · หน้านี้ใช้ <b>บันทึกคนที่จับได้</b> ลงช่องรางวัล
        <br />
        เลือกวันจับด้านล่าง → กดช่องรางวัล → ค้นชื่อ/เบอร์ หรือกรอกเองจากกระดาษ · <b>1 คนได้รางวัลเดียวต่อรอบ</b> (ข้ามรอบได้ ระบบเตือนให้)
      </div>

      <AnnouncePageLink />

      <DrawRoundSelector rounds={DRAW_ROUNDS} winners={winners} selected={selectedRound} onSelect={setSelectedRound} today={today} />

      {round ? (
        <>
          {/* สถานะพูลค้นหา */}
          {poolMeta.loading ? (
            <div className="text-[12px] text-[var(--text-secondary)]">⏳ กำลังโหลดพูลค้นหาของรอบนี้…</div>
          ) : poolMeta.error ? (
            <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
              ⚠️ โหลดพูลค้นหาไม่สำเร็จ — ใช้ “กรอกเอง” ได้ ({poolMeta.error})
            </div>
          ) : (
            <div className="text-[12px] text-[var(--text-secondary)]">
              🔎 พูลค้นหา: <b>{numFmt(pool.length)}</b> คน
              {poolMeta.capped && <span className="text-amber-700"> · พูลใหญ่ ค้นได้บางส่วน (~50k สลิปแรก) — ถ้าไม่เจอใช้กรอกเอง</span>}
            </div>
          )}
          <DrawSlotList
            round={round}
            winners={winners}
            onPick={(slot, existing) => setPicker({ slot, existing })}
            onRemove={removeSlot}
            onExport={exportCsv}
            onOpenClaim={onOpenClaim}
          />
        </>
      ) : (
        <div className="card p-8 text-center text-[var(--text-secondary)] text-sm">
          👆 เลือกรอบวันจับด้านบนเพื่อเริ่มบันทึกผู้ได้รางวัล
        </div>
      )}

      {picker && round && (
        <WinnerPicker
          slot={picker.slot}
          roundDateLabel={round.drawDateLabel}
          winners={winners}
          pool={pool}
          poolLoading={poolMeta.loading}
          poolCapped={poolMeta.capped}
          existing={picker.existing}
          onClose={() => setPicker(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}

// การ์ดลิงก์หน้าประกาศผลสาธารณะ (ให้ลูกค้าดูผลผู้โชคดี) — เปิด / พรีวิว(แอดมินเห็นทุกวัน) / คัดลอก
function AnnouncePageLink() {
  const [url, setUrl] = useState('/winners')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') setUrl(window.location.origin + '/winners')
  }, [])
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* คัดลอกไม่ได้ — กดเปิดลิงก์เองได้ */
    }
  }
  return (
    <div className="card p-3 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[18px]">🏆</span>
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-[var(--dark)]">หน้าประกาศผลผู้โชคดี (สาธารณะ · ให้ลูกค้าดู)</div>
          <div className="text-[11px] text-[var(--text-secondary)] truncate">{url}</div>
        </div>
      </div>
      <a
        href="/winners?preview=1"
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[12.5px] font-semibold flex-shrink-0 hover:bg-[var(--bg-soft)]"
        title="พรีวิวแบบแอดมิน — เห็นทุกวันรวมที่ยังไม่ถึงกำหนด (ลูกค้าจะไม่เห็นรายการอนาคต)"
      >
        👁 พรีวิว
      </a>
      <a
        href="/winners"
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 rounded-md text-white text-[12.5px] font-semibold flex-shrink-0"
        style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
      >
        เปิดหน้าประกาศผล ↗
      </a>
      <button onClick={copy} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[12.5px] font-semibold flex-shrink-0 hover:bg-[var(--bg-soft)]">
        {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอกลิงก์'}
      </button>
    </div>
  )
}
