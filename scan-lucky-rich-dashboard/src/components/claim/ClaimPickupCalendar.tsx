'use client'
import { useEffect, useState } from 'react'
import { getPickupDays, classifyDay, PICKUP_SLOTS, PICKUP_MONTHS, pickupDateLabel } from '@/config/pickup'

const TH_MONTH: Record<string, string> = {
  '07': 'กรกฎาคม', '08': 'สิงหาคม', '09': 'กันยายน', '10': 'ตุลาคม', '11': 'พฤศจิกายน', '12': 'ธันวาคม',
}
const WD_SHORT = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const pad = (n: number) => String(n).padStart(2, '0')
const beYear = (y: number) => y + 543

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${TH_MONTH[m]} ${beYear(Number(y))}`
}

export default function ClaimPickupCalendar({ initial, onChange, allowedMonths }: {
  initial?: { date: string; slotId: string } | null
  onChange: (date: string | null, slotId: string | null) => void
  allowedMonths?: string[] // จำกัดเดือนที่จองได้ — ผู้โชคดีรอบไหน จองได้แค่เดือนของรอบนั้น
}) {
  // เดือนที่เลือกได้ (ถ้าระบุ allowedMonths ใช้เฉพาะที่อยู่ในนั้น เรียงตามปฏิทิน)
  const allowed = allowedMonths?.length ? PICKUP_MONTHS.filter((m) => allowedMonths.includes(m)) : PICKUP_MONTHS
  const months = allowed.length ? allowed : PICKUP_MONTHS
  const initIdx = initial ? months.indexOf(initial.date.slice(0, 7)) : -1
  const [mIdx, setMIdx] = useState(initIdx >= 0 ? initIdx : 0)
  const [selected, setSelected] = useState<string | null>(initial?.date ?? null)
  const [slot, setSlot] = useState<string | null>(initial?.slotId ?? null)
  // จำนวนคิวที่จองแล้วต่อ (วัน, ช่วง) — ดึงจาก server (เลขล้วน) เพื่อโชว์ "ที่ว่าง"
  const [counts, setCounts] = useState<Record<string, { morning: number; afternoon: number }>>({})
  useEffect(() => {
    fetch('/api/draw/appointments?counts=1')
      .then((r) => r.json())
      .then((b) => setCounts(b.counts ?? {}))
      .catch(() => {})
  }, [])

  const ym = months[mIdx] ?? months[0]
  const [year, month] = ym.split('-').map(Number)
  const pickupDays = new Set(getPickupDays(year, month))

  const firstDow = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function gotoMonth(delta: number) {
    const next = mIdx + delta
    if (next < 0 || next >= months.length) return
    setMIdx(next)
    setSelected(null)
    setSlot(null)
    onChange(null, null)
  }
  function pickDay(iso: string) {
    setSelected(iso)
    setSlot(null)
    onChange(iso, null) // เปลี่ยนวัน → รอเลือกรอบใหม่
  }
  function pickSlot(id: string) {
    setSlot(id)
    onChange(selected, id)
  }

  return (
    <div className="bg-white rounded-2xl border border-[var(--border)] p-4">
      {/* header */}
      <div className="flex items-start gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#15803d] text-white text-[12px] font-bold flex-shrink-0">1</span>
        <div className="flex-1">
          <div className="text-[15px] font-bold text-[#14532d]">นัดหมายรับรางวัล</div>
          <div className="text-[11.5px] text-[var(--text-secondary)]">เลือกวันและเวลาที่สะดวก</div>
        </div>
        <span className="text-[10.5px] font-semibold text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-2 py-1 flex-shrink-0">จ.–ศ. เท่านั้น</span>
      </div>

      {/* month nav — ซ่อนปุ่มเลื่อนถ้าจองได้เดือนเดียว (ผู้โชคดีถูกล็อกเดือนตามรอบ) */}
      <div className="flex items-center justify-between mb-2">
        {months.length > 1 ? (
          <button onClick={() => gotoMonth(-1)} disabled={mIdx === 0} aria-label="เดือนก่อนหน้า"
            className="w-8 h-8 rounded-full border border-[var(--border)] text-[#15803d] text-[18px] leading-none flex items-center justify-center disabled:opacity-30 active:scale-95 transition">‹</button>
        ) : <span className="w-8" />}
        <div className="text-[14px] font-bold text-[#14532d]">{monthLabel(ym)}</div>
        {months.length > 1 ? (
          <button onClick={() => gotoMonth(1)} disabled={mIdx === months.length - 1} aria-label="เดือนถัดไป"
            className="w-8 h-8 rounded-full border border-[var(--border)] text-[#15803d] text-[18px] leading-none flex items-center justify-center disabled:opacity-30 active:scale-95 transition">›</button>
        ) : <span className="w-8" />}
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WD_SHORT.map((w, i) => (
          <div key={i} className="text-center text-[10.5px] font-semibold text-[var(--text-muted)] py-1">{w}</div>
        ))}
      </div>

      {/* day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const iso = `${ym}-${pad(d)}`
          const { type } = classifyDay(iso)
          const isSel = selected === iso
          if (type === 'pickup') {
            return (
              <button
                key={i}
                onClick={() => pickDay(iso)}
                className={`aspect-square rounded-full text-[13px] font-semibold flex items-center justify-center transition active:scale-95 ${
                  isSel ? 'text-white' : 'text-[#15803d] border border-[#86efac] bg-white'
                }`}
                style={isSel ? { background: '#15803d' } : undefined}
              >
                {d}
              </button>
            )
          }
          // holiday / draw / closed → ปิด
          const isOff = type === 'holiday' || type === 'draw'
          return (
            <div key={i} className={`aspect-square rounded-full text-[13px] flex items-center justify-center ${isOff ? 'text-[#cbb6b6] bg-[#fdf2f2]' : 'text-[var(--text-muted)]'}`}>
              {d}
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="flex items-center justify-center gap-3 mt-3 text-[10.5px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border border-[#86efac] bg-white" /> เลือกได้</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ background: '#15803d' }} /> เลือกแล้ว</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#fdf2f2] border border-[#f0d5d5]" /> ปิด/วันจับ</span>
      </div>

      {/* slot picker */}
      {selected && (
        <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#15803d] text-white text-[12px] font-bold flex-shrink-0">2</span>
            <div>
              <div className="text-[12.5px] font-bold text-[#14532d] leading-tight">เลือกช่วงเวลา</div>
              <div className="text-[10.5px] text-[var(--text-secondary)]">{pickupDateLabel(selected)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PICKUP_SLOTS.map((s) => {
              const on = slot === s.id
              const c = selected ? counts[selected] : undefined
              const booked = c ? (s.id === 'afternoon' ? c.afternoon : c.morning) : 0
              const full = booked >= s.capacity
              return (
                <button
                  key={s.id}
                  onClick={() => { if (!full) pickSlot(s.id) }}
                  disabled={full}
                  className={`rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98] disabled:active:scale-100 ${
                    full ? 'border-[var(--border)] bg-[var(--bg-soft)] opacity-60' : on ? 'border-[#16a34a] bg-[#f0fdf4]' : 'border-[var(--border)] bg-white'
                  }`}
                >
                  <div className="text-[13px] font-bold text-[#14532d]">{s.period}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{s.time}</div>
                  <div className="mt-1 text-[11px] font-semibold">
                    {full ? <span className="text-[#b91c1c]">เต็มแล้ว</span> : <span className="text-[#15803d]">ยังว่าง</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
