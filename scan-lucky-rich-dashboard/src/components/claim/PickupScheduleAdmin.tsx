'use client'
import { useState } from 'react'
import {
  PICKUP_MONTHS, getPickupDays, pickupChip, pickupMonthLabel,
  PICKUP_SLOTS, ALL_PICKUP_DATES, OFFICE_HOLIDAYS, DRAW_WEDNESDAYS, PICKUP_WINDOW_START,
} from '@/config/pickup'

// แผงมอนิเตอร์ตารางวันรับรางวัล (admin) — read-only อ้างอิงกฎใน config/pickup.ts
export default function PickupScheduleAdmin() {
  const [open, setOpen] = useState(true)

  const capPerDay = PICKUP_SLOTS.reduce((s, x) => s + x.capacity, 0) // 5 + 10 = 15
  const totalDays = ALL_PICKUP_DATES.length
  const totalCap = totalDays * capPerDay
  const shiftedCount = ALL_PICKUP_DATES.filter((iso) => pickupChip(iso).shifted).length
  // วันที่งด (อยู่ในช่วงรับรางวัล)
  const holidaysInWindow = Object.keys(OFFICE_HOLIDAYS).filter((d) => d >= PICKUP_WINDOW_START)
  const drawsInWindow = Array.from(DRAW_WEDNESDAYS).filter((d) => d >= PICKUP_WINDOW_START)

  return (
    <div className="card p-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-2 text-left">
        <span className="text-[18px]">📅</span>
        <div className="flex-1">
          <div className="text-[13.5px] font-bold text-[var(--dark)]">ตารางวันรับรางวัล — มอนิเตอร์</div>
          <div className="text-[11px] text-[var(--text-secondary)]">วันที่/ช่วงเวลาที่เปิดให้ลูกค้าเข้ามารับ (อ้างอิงอัตโนมัติจากกฎ)</div>
        </div>
        <span className="text-[var(--text-secondary)] text-[13px]">{open ? '▲ ย่อ' : '▾ กาง'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ['วันเปิดรับรวม', `${totalDays} วัน`, 'ก.ค.–ธ.ค.'],
              ['ช่วงเวลา/วัน', '2 ช่วง', 'เช้า + บ่าย'],
              ['รับได้/วัน', `${capPerDay} คน`, '5 + 10'],
              ['รับได้รวม (เพดาน)', `${totalCap.toLocaleString('th-TH')} คน`, `${totalDays}×${capPerDay}`],
            ].map(([label, val, sub]) => (
              <div key={label} className="rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] px-3 py-2">
                <div className="text-[10.5px] text-[var(--text-secondary)]">{label}</div>
                <div className="text-[16px] font-bold text-[var(--dark)] leading-tight">{val}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
              </div>
            ))}
          </div>

          {/* legend */}
          <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-[#86efac] bg-[#f0fdf4]" /> วันปกติ (อังคาร/พุธ)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-[#fde68a] bg-[#fffbeb]" /> วันเลื่อน (เลี่ยงวันจับ/วันหยุด)</span>
          </div>

          {/* month-by-month chips */}
          <div className="space-y-2">
            {PICKUP_MONTHS.map((ym) => {
              const [y, m] = ym.split('-').map(Number)
              const days = getPickupDays(y, m)
              return (
                <div key={ym} className="flex gap-2.5 items-start">
                  <div className="w-[112px] flex-shrink-0 pt-1">
                    <div className="text-[12.5px] font-bold text-[var(--dark)]">{pickupMonthLabel(ym)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{days.length} วัน</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {days.map((iso) => {
                      const c = pickupChip(iso)
                      return (
                        <span
                          key={iso}
                          title={iso}
                          className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold border ${
                            c.shifted ? 'bg-[#fffbeb] border-[#fde68a] text-[#b45309]' : 'bg-[#f0fdf4] border-[#bbf7d0] text-[#15803d]'
                          }`}
                        >
                          {c.day}<span className="text-[9px] font-normal opacity-70 ml-0.5">{c.wd}.</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* slot + rule note */}
          <div className="rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] px-3 py-2.5 text-[11px] text-[var(--text-secondary)] space-y-1">
            <div><b className="text-[var(--dark)]">ช่วงเวลา:</b> {PICKUP_SLOTS.map((s) => `${s.period} ${s.time} (${s.capacity} คน)`).join(' · ')}</div>
            <div><b className="text-[var(--dark)]">กฎ:</b> เปิด อังคาร+พุธ · พุธที่ทีมไปจับรางวัล → เลื่อนเป็นพฤหัส · ตรงวันหยุดออฟฟิศ → เลื่อนวันถัดไปในสัปดาห์</div>
            <div><b className="text-[var(--dark)]">งด {holidaysInWindow.length} วันหยุด + {drawsInWindow.length} วันจับรางวัล</b> · เลื่อนรวม {shiftedCount} วัน</div>
            <div className="text-[10px] text-[var(--text-muted)]">* "รับได้รวม" = เพดานสูงสุดตามจำนวนช่อง · ยอดจองจริงจะแสดงเมื่อต่อระบบจองแล้ว</div>
          </div>
        </div>
      )}
    </div>
  )
}
