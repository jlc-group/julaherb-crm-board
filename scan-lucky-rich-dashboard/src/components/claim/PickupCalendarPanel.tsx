'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type DayType = 'pickup' | 'substitute' | 'holiday' | 'draw' | 'normal'
type SlotStatus = 'available' | 'full'
type FilterMode = 'all' | 'available' | 'full'

interface PickupDayConfig {
  month: number
  days: number[]
  substitutes: number[]
}

interface HolidayConfig {
  date: string
  label: string
}

interface DrawConfig {
  date: string
  round: number
  winners: number
}

interface Booking {
  id: string
  date: string
  slotId: number
  name: string
  phone: string
  prize: string
  status: 'confirmed' | 'pending'
}

interface CalendarDay {
  iso: string
  day: number
  inMonth: boolean
  isPickup: boolean
  isSubstitute: boolean
  holiday?: HolidayConfig
  draw?: DrawConfig
}

const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const WEEKDAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const MONTH_RANGE = [7, 8, 9, 10, 11, 12]
const STORAGE_KEY = 'pickupCalendarMonth'
const SLOT_CAPACITY = 7

const PICKUP_DAYS: PickupDayConfig[] = [
  { month: 7, days: [7, 8, 14, 15, 21, 22, 30, 31], substitutes: [30, 31] },
  { month: 8, days: [4, 5, 11, 13, 18, 19, 25, 26], substitutes: [13] },
  { month: 9, days: [1, 2, 8, 9, 15, 16, 22, 23], substitutes: [] },
  { month: 10, days: [6, 7, 14, 15, 20, 21, 27, 28], substitutes: [15] },
  { month: 11, days: [3, 4, 10, 11, 17, 18, 24, 25], substitutes: [] },
  { month: 12, days: [1, 2, 8, 9, 15, 16, 22, 23], substitutes: [] },
]

const HOLIDAYS: HolidayConfig[] = [
  { date: '2026-07-28', label: 'วันเฉลิมพระชนมพรรษา' },
  { date: '2026-07-29', label: 'วันอาสาฬหบูชา' },
  { date: '2026-08-12', label: 'วันแม่แห่งชาติ' },
  { date: '2026-10-13', label: 'วันนวมินทรมหาราช' },
  { date: '2026-12-07', label: 'วันพ่อแห่งชาติ' },
  { date: '2026-12-10', label: 'วันรัฐธรรมนูญ' },
  { date: '2026-12-31', label: 'วันสิ้นปี' },
]

const DRAWS: DrawConfig[] = [
  { date: '2026-06-24', round: 1, winners: 35 },
  { date: '2026-07-22', round: 2, winners: 35 },
  { date: '2026-08-26', round: 3, winners: 34 },
  { date: '2026-09-23', round: 4, winners: 35 },
  { date: '2026-10-21', round: 5, winners: 34 },
  { date: '2026-11-25', round: 6, winners: 19 },
  { date: '2026-12-18', round: 7, winners: 6 },
]

const SLOTS = [
  { id: 1, time: '09:00 - 10:00', period: 'เช้า' },
  { id: 2, time: '10:00 - 11:00', period: 'เช้า' },
  { id: 3, time: '11:00 - 12:00', period: 'เช้า' },
  { id: 4, time: '13:00 - 14:00', period: 'บ่าย' },
  { id: 5, time: '14:00 - 15:00', period: 'บ่าย' },
  { id: 6, time: '15:00 - 16:00', period: 'บ่าย' },
  { id: 7, time: '16:00 - 17:00', period: 'บ่าย' },
]

const MOCK_NAMES = [
  'Ngam Sriwili',
  'Suchada P.',
  'Kritsana M.',
  'Patchara K.',
  'Wanwisa R.',
  'Nattapong S.',
  'Araya T.',
  'Somchai L.',
  'Pimchanok V.',
  'Thitima N.',
]

function iso(month: number, day: number): string {
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function toBE(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${d} ${MONTHS_TH[m - 1]} ${y + 543}`
}

function getInitialMonth(): number {
  if (typeof window === 'undefined') return 7
  const saved = Number(window.localStorage.getItem(STORAGE_KEY))
  return MONTH_RANGE.includes(saved) ? saved : 7
}

function seededCount(date: string, slotId: number): number {
  const n = date.replace(/\D/g, '').split('').reduce((sum, x) => sum + Number(x), 0)
  return (n + slotId * 3) % 8
}

function buildMockBookings(): Booking[] {
  const rows: Booking[] = []
  for (const cfg of PICKUP_DAYS) {
    for (const day of cfg.days) {
      const date = iso(cfg.month, day)
      for (const slot of SLOTS) {
        const booked = seededCount(date, slot.id)
        for (let i = 0; i < booked; i++) {
          const seed = (cfg.month * 31 + day * 7 + slot.id + i) % MOCK_NAMES.length
          rows.push({
            id: `${date}-${slot.id}-${i}`,
            date,
            slotId: slot.id,
            name: MOCK_NAMES[seed],
            phone: `xxx-xxx-${String(5900 + seed * 13 + i).slice(-4)}`,
            prize: i % 5 === 0 ? 'ทองคำ 100,000' : 'ทองคำ 10,000',
            status: i % 4 === 0 ? 'pending' : 'confirmed',
          })
        }
      }
    }
  }
  return rows
}

const BOOKINGS = buildMockBookings()

function monthDays(month: number): CalendarDay[] {
  const start = new Date(2026, month - 1, 1)
  const last = new Date(2026, month, 0).getDate()
  const leading = start.getDay()
  const pickup = PICKUP_DAYS.find((x) => x.month === month)
  const days: CalendarDay[] = []
  for (let i = 0; i < leading; i++) {
    const d = new Date(2026, month - 1, 1 - (leading - i))
    days.push({ iso: iso(d.getMonth() + 1, d.getDate()), day: d.getDate(), inMonth: false, isPickup: false, isSubstitute: false })
  }
  for (let day = 1; day <= last; day++) {
    const date = iso(month, day)
    days.push({
      iso: date,
      day,
      inMonth: true,
      isPickup: pickup?.days.includes(day) ?? false,
      isSubstitute: pickup?.substitutes.includes(day) ?? false,
      holiday: HOLIDAYS.find((x) => x.date === date),
      draw: DRAWS.find((x) => x.date === date),
    })
  }
  while (days.length % 7 !== 0) {
    const prev = days[days.length - 1]
    const d = new Date(prev.iso + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    days.push({ iso: iso(d.getMonth() + 1, d.getDate()), day: d.getDate(), inMonth: false, isPickup: false, isSubstitute: false })
  }
  return days
}

function dayType(day: CalendarDay): DayType {
  if (day.holiday) return 'holiday'
  if (day.isSubstitute) return 'substitute'
  if (day.isPickup) return 'pickup'
  if (day.draw) return 'draw'
  return 'normal'
}

function dayStyle(type: DayType): string {
  if (type === 'pickup') return 'bg-[#E1F5EE] border-[#a7dccb]'
  if (type === 'substitute') return 'bg-[#FAEEDA] border-[#edcf96]'
  if (type === 'holiday') return 'bg-[#FCEBEB] border-[#efb6b6]'
  if (type === 'draw') return 'bg-[#E6F1FB] border-[#afd0ec]'
  return 'bg-white border-[var(--border)]'
}

function slotStatus(booked: number): SlotStatus {
  return booked >= SLOT_CAPACITY ? 'full' : 'available'
}

function csvEscape(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function PickupCalendarPanel() {
  const [month, setMonth] = useState(getInitialMonth)
  const [selectedDate, setSelectedDate] = useState('2026-07-07')
  const [filter, setFilter] = useState<FilterMode>('all')

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(month))
  }, [month])

  useEffect(() => {
    const firstPickup = PICKUP_DAYS.find((x) => x.month === month)?.days[0] ?? 1
    setSelectedDate(iso(month, firstPickup))
  }, [month])

  const days = useMemo(() => monthDays(month), [month])
  const monthBookings = useMemo(() => BOOKINGS.filter((b) => Number(b.date.slice(5, 7)) === month), [month])
  const selected = days.find((d) => d.iso === selectedDate)
  const pickupDayCount = PICKUP_DAYS.find((x) => x.month === month)?.days.length ?? 0
  const monthSlots = pickupDayCount * SLOTS.length
  const monthPeopleCapacity = monthSlots * SLOT_CAPACITY
  const bookedCount = monthBookings.length
  const occupiedSlots = useMemo(() => {
    const keys = new Set(monthBookings.map((b) => `${b.date}-${b.slotId}`))
    return keys.size
  }, [monthBookings])
  const occupancyPct = monthSlots ? Math.round((occupiedSlots / monthSlots) * 100) : 0
  const fullSlots = useMemo(() => {
    let total = 0
    for (const cfg of PICKUP_DAYS.filter((x) => x.month === month)) {
      for (const day of cfg.days) {
        const date = iso(month, day)
        for (const slot of SLOTS) {
          if (BOOKINGS.filter((b) => b.date === date && b.slotId === slot.id).length >= SLOT_CAPACITY) total++
        }
      }
    }
    return total
  }, [month])

  function shift(delta: number) {
    setMonth((m) => Math.min(12, Math.max(7, m + delta)))
  }

  function goToday() {
    const now = new Date()
    const realMonth = now.getFullYear() === 2026 ? now.getMonth() + 1 : 7
    setMonth(MONTH_RANGE.includes(realMonth) ? realMonth : 7)
    setSelectedDate(MONTH_RANGE.includes(realMonth) ? iso(realMonth, now.getDate()) : '2026-07-07')
  }

  function exportCsv() {
    const header = ['date', 'slot', 'time', 'name', 'phone', 'prize', 'status']
    const rows = monthBookings.map((b) => {
      const slot = SLOTS.find((s) => s.id === b.slotId)
      return [b.date, b.slotId, slot?.time ?? '', b.name, b.phone, b.prize, b.status]
    })
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pickup-bookings-2026-${String(month).padStart(2, '0')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const selectedBookings = BOOKINGS.filter((b) => b.date === selectedDate)
  const selectedType = selected ? dayType(selected) : 'normal'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-bold">เดือนนี้</div>
          <div className="text-[24px] font-extrabold text-[var(--dark)]">{occupiedSlots}/{monthSlots}</div>
          <div className="text-[12px] text-[var(--text-secondary)]">{occupancyPct}% slots · {bookedCount}/{monthPeopleCapacity} คน</div>
        </div>
        <div className="card p-3">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-bold">วันเปิดรับ</div>
          <div className="text-[24px] font-extrabold text-[var(--dark)]">{pickupDayCount}</div>
          <div className="text-[12px] text-[var(--text-secondary)]">วัน x 7 slots</div>
        </div>
        <div className="card p-3">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-bold">Slot เต็ม</div>
          <div className="text-[24px] font-extrabold text-[var(--dark)]">{fullSlots}</div>
          <div className="text-[12px] text-[var(--text-secondary)]">จาก 56 slots/เดือน</div>
        </div>
        <div className="card p-3">
          <div className="text-[11px] uppercase tracking-wide text-[var(--text-muted)] font-bold">Scope</div>
          <div className="text-[18px] font-extrabold text-[var(--dark)]">Internal Admin</div>
          <div className="text-[12px] text-[var(--text-secondary)]">ไม่ใช่หน้า Customer</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="mr-auto">
            <div className="text-[18px] font-extrabold text-[var(--dark)]">{MONTHS_TH[month - 1]} พ.ศ. 2569</div>
            <div className="text-[11px] text-[var(--text-secondary)]">ปฏิทินจองคิวรับรางวัล Saversure V2 สำหรับ Ops Team</div>
          </div>
          <button onClick={() => shift(-1)} disabled={month <= 7} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[12px] font-semibold disabled:opacity-40">ก่อนหน้า</button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[12px] font-semibold">Today</button>
          <button onClick={() => shift(1)} disabled={month >= 12} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[12px] font-semibold disabled:opacity-40">ถัดไป</button>
          <button onClick={exportCsv} className="px-3 py-1.5 rounded-md text-white text-[12px] font-semibold bg-[var(--primary)]">Export CSV</button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3 text-[11px]">
          <Legend color="#E1F5EE" label="วันรับรางวัลปกติ" />
          <Legend color="#FAEEDA" label="วันทดแทน" />
          <Legend color="#FCEBEB" label="วันหยุดราชการ" />
          <Legend color="#E6F1FB" label="วันจับรางวัล" />
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAYS_TH.map((d) => (
            <div key={d} className="text-center text-[11px] font-bold text-[var(--text-muted)] py-1">{d}</div>
          ))}
          {days.map((day) => {
            const type = dayType(day)
            const isSelected = selectedDate === day.iso
            const bookings = BOOKINGS.filter((b) => b.date === day.iso)
            return (
              <button
                key={day.iso}
                onClick={() => setSelectedDate(day.iso)}
                className={`min-h-[82px] rounded-md border p-2 text-left transition ${dayStyle(type)} ${day.inMonth ? '' : 'opacity-35'} ${isSelected ? 'ring-2 ring-[#1D9E75]' : 'hover:ring-1 hover:ring-[#1D9E75]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold text-[var(--dark)]">{day.day}</span>
                  {day.iso === '2026-06-11' && <span className="text-[9px] font-bold text-[#1D9E75]">วันนี้</span>}
                </div>
                <div className="mt-1 space-y-1">
                  {day.isPickup && <Badge tone={day.isSubstitute ? 'sub' : 'pickup'}>{day.isSubstitute ? 'ทดแทน' : 'รับรางวัล'}</Badge>}
                  {day.holiday && <Badge tone="holiday">{day.holiday.label}</Badge>}
                  {day.draw && <Badge tone="draw">จับรางวัล R{day.draw.round}</Badge>}
                  {day.isPickup && <div className="text-[10px] text-[var(--text-secondary)]">{bookings.length}/{SLOTS.length * SLOT_CAPACITY} booked</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="mr-auto">
            <div className="text-[15px] font-extrabold text-[var(--dark)]">{toBE(selectedDate)}</div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              {selected?.holiday ? selected.holiday.label : selected?.isPickup ? 'เปิดรับลูกค้าเข้ามารับรางวัล' : 'ไม่มีรอบรับรางวัล'}
              {selected?.draw ? ` · จับรางวัลรอบ ${selected.draw.round} (${selected.draw.winners} ผู้ชนะ)` : ''}
            </div>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'available', 'full'] as FilterMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${filter === v ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)]'}`}
              >
                {v === 'all' ? 'ทั้งหมด' : v === 'available' ? 'ว่าง' : 'เต็ม'}
              </button>
            ))}
          </div>
        </div>

        {selected?.isPickup ? (
          <div className="space-y-2">
            {SLOTS.map((slot) => {
              const slotBookings = selectedBookings.filter((b) => b.slotId === slot.id)
              const status = slotStatus(slotBookings.length)
              if (filter === 'available' && status === 'full') return null
              if (filter === 'full' && status !== 'full') return null
              return (
                <div key={slot.id} className="rounded-lg border border-[var(--border)] p-3 flex gap-3 flex-wrap">
                  <div className="w-[140px] flex-shrink-0">
                    <div className="text-[13px] font-bold text-[var(--dark)]">{slot.time}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">Slot {slot.id} · {slot.period}</div>
                  </div>
                  <div className="w-[100px] flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[11px] font-bold ${status === 'full' ? 'bg-gray-200 text-gray-700' : 'bg-[#dcfce7] text-[#15803d]'}`}>
                      {slotBookings.length}/{SLOT_CAPACITY} booked
                    </span>
                  </div>
                  <div className="flex-1 min-w-[240px]">
                    {slotBookings.length === 0 ? (
                      <div className="text-[12px] text-[var(--text-muted)]">ยังไม่มีผู้จอง</div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-1.5">
                        {slotBookings.map((b) => (
                          <div key={b.id} className="text-[12px] bg-[var(--bg-soft)] border border-[var(--border)] rounded px-2 py-1">
                            <span className="font-semibold">{b.name}</span>
                            <span className="text-[var(--text-secondary)]"> · {b.phone}</span>
                            <span className="text-[#b45309]"> · {b.prize}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] px-4 py-6 text-center text-[13px] text-[var(--text-secondary)]">
            {selected?.holiday ? 'วันนี้เป็นวันหยุดราชการ ไม่เปิดรับลูกค้าเข้ามารับรางวัล' : 'วันนี้ไม่มี time slot สำหรับรับรางวัล'}
          </div>
        )}
      </div>

      <div className="text-[10.5px] text-[var(--text-muted)]">
        อ้างอิงใบอนุญาตที่ 111-117/2569 · ปฏิทินวันหยุดราชการ บริษัท เจแอลซี กรุ๊ป จำกัด · ปี พ.ศ. 2569
      </div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3 h-3 rounded border border-black/10" style={{ background: color }} />
      {label}
    </span>
  )
}

function Badge({ tone, children }: { tone: 'pickup' | 'sub' | 'holiday' | 'draw'; children: ReactNode }) {
  const cls =
    tone === 'pickup'
      ? 'bg-[#c8eadf] text-[#085041]'
      : tone === 'sub'
        ? 'bg-[#f2d9aa] text-[#7c4a03]'
        : tone === 'holiday'
          ? 'bg-[#f5caca] text-[#9f1d1d]'
          : 'bg-[#cde4f8] text-[#15547b]'
  return <div className={`inline-flex max-w-full rounded px-1.5 py-0.5 text-[9.5px] font-bold ${cls}`}>{children}</div>
}
