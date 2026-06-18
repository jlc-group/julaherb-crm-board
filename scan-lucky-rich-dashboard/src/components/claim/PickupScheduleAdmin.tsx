'use client'
import { useState, useMemo } from 'react'
import {
  PICKUP_MONTHS, getPickupDays, pickupChip, pickupMonthLabel,
  PICKUP_SLOTS, ALL_PICKUP_DATES, classifyDay, pickupDateLabel,
  TH_WEEKDAY_SHORT,
} from '@/config/pickup'

function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const firstDow = new Date(year, month - 1, 1).getDay()
  const totalDays = new Date(year, month, 0).getDate()
  const cells: (string | null)[] = Array(firstDow).fill(null)
  for (let d = 1; d <= totalDays; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export default function PickupScheduleAdmin() {
  const [open, setOpen]         = useState(true)
  const [monthIdx, setMonthIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const totalDays = ALL_PICKUP_DATES.length
  const capPerDay = PICKUP_SLOTS.reduce((s, x) => s + x.capacity, 0)
  const totalCap  = totalDays * capPerDay

  const ym = PICKUP_MONTHS[monthIdx]
  const [y, m] = ym.split('-').map(Number)
  const weeks = useMemo(() => buildMonthGrid(y, m), [y, m])
  const openDaysThisMonth = getPickupDays(y, m).length


  return (
    <div className="card p-4">
      {/* ── Header ── */}
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 text-left">
        <span className="text-[18px]">📅</span>
        <div className="flex-1">
          <div className="text-[13.5px] font-bold text-[var(--dark)]">ตารางวันรับรางวัล</div>
          <div className="text-[11px] text-[var(--text-secondary)]">คลิกวันที่เปิดเพื่อดูรายละเอียด เช้า / บ่าย</div>
        </div>
        <span className="text-[var(--text-secondary)] text-[13px]">{open ? '▲ ย่อ' : '▾ กาง'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">

          {/* ── KPI 2 cards ── */}
          <div className="grid grid-cols-2 gap-2">
            {[
              ['วันเปิดรับรวม', `${totalDays} วัน`, 'ก.ค. – ธ.ค.'],
              ['รับได้รวม (เพดาน)', `${totalCap.toLocaleString('th-TH')} คน`, `${totalDays} วัน × ${capPerDay} คน/วัน`],
            ].map(([label, val, sub]) => (
              <div key={label} className="rounded-lg bg-[var(--bg-soft)] border border-[var(--border)] px-3 py-2">
                <div className="text-[10.5px] text-[var(--text-secondary)]">{label}</div>
                <div className="text-[18px] font-bold text-[var(--dark)] leading-tight">{val}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
              </div>
            ))}
          </div>

          {/* ── Month navigator ── */}
          <div className="flex items-center justify-between">
            <button
              disabled={monthIdx === 0}
              onClick={() => { setMonthIdx(i => i - 1); setSelected(null) }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-soft)] disabled:opacity-25 text-[var(--dark)] text-[18px]"
            >‹</button>
            <div className="text-[13px] font-bold text-[var(--dark)]">
              {pickupMonthLabel(ym)}
              <span className="ml-2 text-[11px] font-normal text-[var(--text-muted)]">({openDaysThisMonth} วันเปิด)</span>
            </div>
            <button
              disabled={monthIdx === PICKUP_MONTHS.length - 1}
              onClick={() => { setMonthIdx(i => i + 1); setSelected(null) }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-soft)] disabled:opacity-25 text-[var(--dark)] text-[18px]"
            >›</button>
          </div>

          {/* ── Calendar grid ── */}
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-[var(--bg-soft)] border-b border-[var(--border)]">
              {TH_WEEKDAY_SHORT.map(wd => (
                <div key={wd} className="py-2 text-center text-[11px] font-semibold text-[var(--text-secondary)]">{wd}</div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t border-[var(--border)]">
                {week.map((iso, di) => {
                  if (!iso) {
                    return (
                      <div
                        key={`empty-${wi}-${di}`}
                        className="h-14 border-r border-[var(--border)] last:border-r-0 bg-[var(--bg-soft)] opacity-40"
                      />
                    )
                  }

                  const cls   = classifyDay(iso)
                  const chip  = cls.type === 'pickup' ? pickupChip(iso) : null
                  const [,, dayStr] = iso.split('-')
                  const dayNum = Number(dayStr)
                  const isSelected = selected === iso
                  const isPickup   = cls.type === 'pickup'

                  const styles: Record<string, string> = {
                    pickup:  chip?.shifted
                      ? 'bg-[#fffbeb] hover:bg-[#fef9c3] text-[#b45309]'
                      : 'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#15803d]',
                    holiday: 'bg-[#fef2f2] text-[#dc2626]',
                    draw:    'bg-[#eff6ff] text-[#2563eb]',
                    closed:  'text-[var(--text-muted)]',
                  }

                  const badges: Record<string, string> = {
                    holiday: 'หยุด',
                    draw:    'จับ',
                  }
                  const badge = chip?.shifted ? 'เลื่อน' : (badges[cls.type] ?? '')

                  return (
                    <div
                      key={iso}
                      onClick={() => isPickup && setSelected(isSelected ? null : iso)}
                      className={[
                        'relative h-14 border-r border-[var(--border)] last:border-r-0 p-1.5 flex flex-col transition-colors',
                        styles[cls.type] ?? '',
                        isPickup ? 'cursor-pointer' : 'cursor-default',
                        isSelected ? 'ring-2 ring-inset ring-[var(--primary)]' : '',
                      ].join(' ')}
                    >
                      <span className="text-[12.5px] font-bold leading-none">{dayNum}</span>
                      {badge && (
                        <span className="mt-auto text-[8.5px] font-semibold leading-none opacity-75">{badge}</span>
                      )}
                      {isPickup && !badge && (
                        <span className="mt-auto text-[7.5px] leading-none opacity-50 text-[var(--text-muted)]">เช้า·บ่าย</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap gap-3 text-[10.5px] text-[var(--text-secondary)]">
            {[
              ['#f0fdf4', '#86efac', 'เปิดรับ (ปกติ)'],
              ['#fffbeb', '#fde68a', 'เปิดรับ (เลื่อน)'],
              ['#eff6ff', '#bfdbfe', 'วันจับรางวัล'],
              ['#fef2f2', '#fca5a5', 'วันหยุด'],
            ].map(([bg, border, label]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded" style={{ background: bg, border: `1px solid ${border}` }} />
                {label}
              </span>
            ))}
          </div>

          {/* ── Detail panel ── */}
          {selected && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">

              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-soft)] border-b border-[var(--border)]">
                <div>
                  <div className="text-[13px] font-bold text-[var(--dark)]">{pickupDateLabel(selected)}</div>
                  {pickupChip(selected).shifted && (
                    <span className="text-[10.5px] text-[#b45309] font-medium">⚠ วันเลื่อน (ไม่ตรงอังคาร/พุธ)</span>
                  )}
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--border)] text-[var(--text-secondary)] text-[18px] leading-none"
                >×</button>
              </div>

              {/* Both slots side by side */}
              <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
                {PICKUP_SLOTS.map(slot => (
                  <div key={slot.id} className="p-3 space-y-2">
                    {/* Slot header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[12.5px] font-bold text-[var(--dark)]">{slot.period}</span>
                        <span className="ml-1.5 text-[10.5px] text-[var(--text-muted)]">{slot.time}</span>
                      </div>
                      <div className="text-[10.5px] text-[var(--text-muted)] bg-[var(--bg-soft)] border border-[var(--border)] rounded-full px-2 py-0.5">
                        0 / {slot.capacity}
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="h-1.5 rounded-full bg-[var(--border)]">
                      <div className="h-full w-0 rounded-full bg-[var(--primary)]" />
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead className="bg-[var(--bg-soft)]">
                          <tr>
                            {['#', 'ชื่อลูกค้า', 'เบอร์โทร', 'รางวัล', 'สถานะ'].map(h => (
                              <th key={h} className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan={5} className="px-2 py-5 text-center text-[var(--text-muted)] text-[11px]">
                              ยังไม่มีข้อมูลการจอง
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  )
}
