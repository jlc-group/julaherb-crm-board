'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  PICKUP_MONTHS, getPickupDays, pickupChip, pickupMonthLabel,
  PICKUP_SLOTS, ALL_PICKUP_DATES, classifyDay, pickupDateLabel,
  TH_WEEKDAY_SHORT,
} from '@/config/pickup'
import { winnerAnnounceISOBySlot } from '@/config/draw-rounds'
import type { DrawAppointment, AppointmentStatus, DrawWinner } from '@/config/draw-rounds'

const TH_MO_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// ป้าย "ผู้โชคดีของวันที่ ..." จาก slot ของผู้ชนะ (10K = วันรายวัน · 100K = สิ้นเดือนประกาศ · 1M = วันจับ)
function wonDateLabel(w: DrawWinner): string {
  const iso = winnerAnnounceISOBySlot(w.round, w.slotId)
  if (!iso) return `รอบ ${w.round}`
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${TH_MO_SHORT[m]} ${y + 543}`
}

const last9 = (p: string) => (p || '').replace(/\D/g, '').slice(-9)

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

const STATUS_META: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  booked:  { label: 'รอเข้ารับ',   color: '#92400e', bg: '#fef3c7' },
  done:    { label: '✓ รับของแล้ว', color: '#15803d', bg: '#dcfce7' },
  no_show: { label: 'ไม่มาตามนัด',  color: '#b91c1c', bg: '#fee2e2' },
}

export default function PickupScheduleAdmin({ focusPhone = null }: { focusPhone?: string | null }) {
  const [open, setOpen]         = useState(true)
  const [monthIdx, setMonthIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [appts, setAppts]       = useState<DrawAppointment[]>([])
  const [winners, setWinners]   = useState<DrawWinner[]>([])
  const [q, setQ]               = useState('')

  const load = useCallback(async () => {
    try {
      const [ar, wr] = await Promise.all([fetch('/api/draw/appointments'), fetch('/api/draw/winners')])
      const ab = await ar.json()
      const wb = await wr.json()
      setAppts(ab.appointments ?? [])
      setWinners(wb.winners ?? [])
    } catch { /* keep */ }
  }, [])
  useEffect(() => { load() }, [load])

  // เบอร์ 9 หลักท้าย → รายการช่อง/วันที่ที่เป็นผู้โชคดี (เรียงตามวันประกาศ)
  const wonByPhone = useMemo(() => {
    const m = new Map<string, DrawWinner[]>()
    for (const w of winners) {
      const k = last9(w.phone)
      const arr = m.get(k) ?? []
      arr.push(w)
      m.set(k, arr)
    }
    Array.from(m.values()).forEach((arr) => arr.sort((a, b) => winnerAnnounceISOBySlot(a.round, a.slotId).localeCompare(winnerAnnounceISOBySlot(b.round, b.slotId))))
    return m
  }, [winners])

  // index: date → slotId → appointment[]
  const byDate = useMemo(() => {
    const m = new Map<string, DrawAppointment[]>()
    for (const a of appts) {
      const arr = m.get(a.date) ?? []
      arr.push(a)
      m.set(a.date, arr)
    }
    return m
  }, [appts])

  const summary = useMemo(() => {
    const s = { total: appts.length, done: 0, booked: 0, no_show: 0 }
    for (const a of appts) s[a.status]++
    return s
  }, [appts])

  // โฟกัสเบอร์ที่กดมาจาก Operations → เปิดวันที่คนนั้นจองไว้
  useEffect(() => {
    if (!focusPhone) return
    const a = appts.find((x) => x.phoneLast9 === focusPhone)
    if (a) { setSelected(a.date); const mi = PICKUP_MONTHS.indexOf(a.date.slice(0, 7)); if (mi >= 0) setMonthIdx(mi) }
  }, [focusPhone, appts])

  async function setStatus(phoneLast9: string, status: AppointmentStatus) {
    setAppts((prev) => prev.map((a) => (a.phoneLast9 === phoneLast9 ? { ...a, status } : a))) // optimistic
    try {
      await fetch('/api/draw/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneLast9, status }),
      })
    } catch { load() }
  }

  // ค้นหาตามชื่อ / เบอร์
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    const digits = s.replace(/\D/g, '')
    return appts
      .filter((a) => (a.name && a.name.toLowerCase().includes(s)) || (digits.length >= 3 && a.phone.replace(/\D/g, '').includes(digits)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 50)
  }, [q, appts])

  const slotLabel = (id: string) => PICKUP_SLOTS.find((s) => s.id === id)?.period ?? id
  // รายการรางวัลของคนหนึ่ง: คู่ "วันที่ · รางวัล" ต่อรางวัล (เรียงตามวันประกาศ)
  const wonLines = (phoneLast9: string) =>
    (wonByPhone.get(phoneLast9) ?? []).map((w) => ({ key: w.slotId, date: wonDateLabel(w), prize: w.prizeLabel.replace('ทองคำ', 'ทอง') }))
  function goToDay(date: string) {
    const mi = PICKUP_MONTHS.indexOf(date.slice(0, 7))
    if (mi >= 0) setMonthIdx(mi)
    setSelected(date)
  }

  const totalDays = ALL_PICKUP_DATES.length
  const capPerDay = PICKUP_SLOTS.reduce((s, x) => s + x.capacity, 0)

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
          <div className="text-[13.5px] font-bold text-[var(--dark)]">ตรวจเอกสารหน้างาน — ตามวันนัดรับรางวัล</div>
          <div className="text-[11px] text-[var(--text-secondary)]">คลิกวันที่เปิดเพื่อดูว่าใครจองมา เช้า / บ่าย แล้วกดอัปเดตสถานะรับของ</div>
        </div>
        <span className="text-[var(--text-secondary)] text-[13px]">{open ? '▲ ย่อ' : '▾ กาง'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">

          {/* ── Appointment summary KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ['จองทั้งหมด', summary.total, 'คน', 'var(--dark)', 'var(--bg-soft)'],
              ['รับของแล้ว', summary.done, 'เสร็จสิ้น', '#15803d', '#f0fdf4'],
              ['รอเข้ารับ', summary.booked, 'ตามนัด', '#b45309', '#fffbeb'],
              ['ไม่มาตามนัด', summary.no_show, 'พลาดนัด', '#b91c1c', '#fef2f2'],
            ].map(([label, val, sub, color, bg]) => (
              <div key={label as string} className="rounded-lg border border-[var(--border)] px-3 py-2" style={{ background: bg as string }}>
                <div className="text-[10.5px] text-[var(--text-secondary)]">{label}</div>
                <div className="text-[20px] font-bold leading-tight" style={{ color: color as string }}>{val as number}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
              </div>
            ))}
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">
            เปิดรับรวม {totalDays} วัน · เพดาน {capPerDay} คน/วัน (เช้า {PICKUP_SLOTS[0].capacity} · บ่าย {PICKUP_SLOTS[1].capacity})
          </div>

          {/* ── ค้นหาผู้รับรางวัล ── */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[14px]">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ / เบอร์โทร ผู้รับรางวัล…"
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-[var(--border)] text-[13px] outline-none focus:border-[var(--primary)]"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)] text-[16px] leading-none">×</button>
            )}
          </div>

          {/* ── ผลการค้นหา ── */}
          {q.trim() && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="px-3 py-2 bg-[var(--bg-soft)] border-b border-[var(--border)] text-[12px] font-semibold text-[var(--dark)]">
                ผลการค้นหา “{q.trim()}” — เจอ {results.length} คน{results.length >= 50 ? '+ (แสดง 50 แรก)' : ''}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px] min-w-[680px]">
                  <thead className="bg-[var(--bg-soft)]">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)]">ลูกค้า</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)]">วันนัดเข้ารับ</th>
                      <th className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)]">รางวัลที่ได้รับ (วัน · รางวัล)</th>
                      <th className="px-2 py-1.5 text-right font-semibold text-[var(--text-secondary)] w-32">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {results.length === 0 ? (
                      <tr><td colSpan={4} className="px-2 py-6 text-center text-[var(--text-muted)] text-[12px]">ไม่พบชื่อ/เบอร์นี้ในรายการจอง</td></tr>
                    ) : (
                      results.map((a) => {
                        const lines = wonLines(a.phoneLast9)
                        return (
                          <tr key={a.phoneLast9} className={a.status === 'done' ? 'bg-[#f0fdf4]' : a.status === 'no_show' ? 'bg-[#fef2f2]' : ''}>
                            <td className="px-2 py-1.5 align-top">
                              <div className="font-semibold text-[var(--dark)] whitespace-nowrap">{a.name || '(ไม่มีชื่อ)'}</div>
                              <div className="text-[10.5px] text-[var(--text-secondary)] num">{a.phone}</div>
                              {lines.length > 1 && <div className="inline-block mt-0.5 text-[9.5px] font-bold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded px-1.5 py-0.5">🎁 รวม {lines.length} รางวัล</div>}
                            </td>
                            <td className="px-2 py-1.5 align-top">
                              <button onClick={() => goToDay(a.date)} className="text-[11px] font-semibold text-[var(--primary)] hover:underline whitespace-nowrap">
                                📅 {pickupDateLabel(a.date)}
                              </button>
                              <div className="text-[10.5px] text-[var(--text-secondary)]">{slotLabel(a.slotId)}</div>
                            </td>
                            <td className="px-2 py-1.5 align-top">
                              {lines.length ? (
                                <div className="flex flex-col gap-0.5">
                                  {lines.map((l) => (
                                    <span key={l.key} className="whitespace-nowrap"><span className="font-semibold text-[var(--primary)]">📅 {l.date}</span> <span className="text-[#b45309]">· {l.prize}</span></span>
                                  ))}
                                </div>
                              ) : <span className="text-[10.5px] text-[var(--text-muted)]">—</span>}
                            </td>
                            <td className="px-2 py-1.5 align-top text-right">
                              <select
                                value={a.status}
                                onChange={(e) => setStatus(a.phoneLast9, e.target.value as AppointmentStatus)}
                                className="text-[11px] font-semibold rounded-md border px-1.5 py-1 cursor-pointer outline-none"
                                style={{ color: STATUS_META[a.status].color, background: STATUS_META[a.status].bg, borderColor: STATUS_META[a.status].color + '40' }}
                              >
                                <option value="booked">รอเข้ารับ</option>
                                <option value="done">✓ รับของแล้ว</option>
                                <option value="no_show">ไม่มาตามนัด</option>
                              </select>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
            <div className="grid grid-cols-7 bg-[var(--bg-soft)] border-b border-[var(--border)]">
              {TH_WEEKDAY_SHORT.map(wd => (
                <div key={wd} className="py-2 text-center text-[11px] font-semibold text-[var(--text-secondary)]">{wd}</div>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t border-[var(--border)]">
                {week.map((iso, di) => {
                  if (!iso) {
                    return <div key={`empty-${wi}-${di}`} className="h-16 border-r border-[var(--border)] last:border-r-0 bg-[var(--bg-soft)] opacity-40" />
                  }

                  const cls   = classifyDay(iso)
                  const chip  = cls.type === 'pickup' ? pickupChip(iso) : null
                  const dayNum = Number(iso.split('-')[2])
                  const isSelected = selected === iso
                  const isPickup   = cls.type === 'pickup'
                  const dayAppts = byDate.get(iso) ?? []

                  const styles: Record<string, string> = {
                    pickup:  chip?.shifted ? 'bg-[#fffbeb] hover:bg-[#fef9c3] text-[#b45309]' : 'bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#15803d]',
                    holiday: 'bg-[#fef2f2] text-[#dc2626]',
                    draw:    'bg-[#eff6ff] text-[#2563eb]',
                    closed:  'text-[var(--text-muted)]',
                  }
                  const badges: Record<string, string> = { holiday: 'หยุด', draw: 'จับ' }
                  const badge = chip?.shifted ? 'เลื่อน' : (badges[cls.type] ?? '')

                  return (
                    <div
                      key={iso}
                      onClick={() => isPickup && setSelected(isSelected ? null : iso)}
                      className={[
                        'relative h-16 border-r border-[var(--border)] last:border-r-0 p-1.5 flex flex-col transition-colors',
                        styles[cls.type] ?? '',
                        isPickup ? 'cursor-pointer' : 'cursor-default',
                        isSelected ? 'ring-2 ring-inset ring-[var(--primary)]' : '',
                      ].join(' ')}
                    >
                      <span className="text-[12.5px] font-bold leading-none">{dayNum}</span>
                      {badge && <span className="text-[8.5px] font-semibold leading-none opacity-75 mt-0.5">{badge}</span>}
                      {isPickup && dayAppts.length > 0 && (
                        <span className="mt-auto inline-flex items-center gap-0.5 self-start text-[9px] font-bold text-white bg-[var(--primary)] rounded-full px-1.5 py-0.5 leading-none">
                          👤 {dayAppts.length}
                        </span>
                      )}
                      {isPickup && dayAppts.length === 0 && !badge && (
                        <span className="mt-auto text-[7.5px] leading-none opacity-40 text-[var(--text-muted)]">ว่าง</span>
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
            <span className="flex items-center gap-1"><span className="text-[10px] font-bold text-white bg-[var(--primary)] rounded-full px-1.5 leading-none">👤</span> มีคนจอง</span>
          </div>

          {/* ── Detail panel ── */}
          {selected && (
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-soft)] border-b border-[var(--border)]">
                <div>
                  <div className="text-[13px] font-bold text-[var(--dark)]">{pickupDateLabel(selected)}</div>
                  {pickupChip(selected).shifted && <span className="text-[10.5px] text-[#b45309] font-medium">⚠ วันเลื่อน (ไม่ตรงอังคาร/พุธ)</span>}
                </div>
                <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--border)] text-[var(--text-secondary)] text-[18px] leading-none">×</button>
              </div>

              <div className="grid md:grid-cols-2 md:divide-x divide-[var(--border)]">
                {PICKUP_SLOTS.map(slot => {
                  const rows = (byDate.get(selected) ?? []).filter((a) => a.slotId === slot.id)
                  const doneCount = rows.filter((a) => a.status === 'done').length
                  return (
                    <div key={slot.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[12.5px] font-bold text-[var(--dark)]">{slot.period}</span>
                          <span className="ml-1.5 text-[10.5px] text-[var(--text-muted)]">{slot.time}</span>
                        </div>
                        <div className="text-[10.5px] text-[var(--text-secondary)] bg-[var(--bg-soft)] border border-[var(--border)] rounded-full px-2 py-0.5">
                          จอง {rows.length}/{slot.capacity} · รับแล้ว {doneCount}
                        </div>
                      </div>

                      <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(100, (rows.length / slot.capacity) * 100)}%` }} />
                      </div>

                      <div className="rounded-lg border border-[var(--border)] overflow-x-auto">
                        <table className="w-full text-[11.5px] min-w-[460px]">
                          <thead className="bg-[var(--bg-soft)]">
                            <tr>
                              <th className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)]">ลูกค้า</th>
                              <th className="px-2 py-1.5 text-left font-semibold text-[var(--text-secondary)]">รางวัลที่ได้รับ (วัน · รางวัล)</th>
                              <th className="px-2 py-1.5 text-right font-semibold text-[var(--text-secondary)] w-32">สถานะ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {rows.length === 0 ? (
                              <tr><td colSpan={3} className="px-2 py-5 text-center text-[var(--text-muted)] text-[11px]">ยังไม่มีคนจองช่วงนี้</td></tr>
                            ) : (
                              rows.map((a) => {
                                const lines = wonLines(a.phoneLast9)
                                return (
                                <tr key={a.phoneLast9} className={a.status === 'done' ? 'bg-[#f0fdf4]' : a.status === 'no_show' ? 'bg-[#fef2f2]' : ''}>
                                  <td className="px-2 py-1.5 align-top">
                                    <div className="font-semibold text-[var(--dark)] whitespace-nowrap">{a.name || '(ไม่มีชื่อ)'}</div>
                                    <div className="text-[10.5px] text-[var(--text-secondary)] num">{a.phone}</div>
                                    {lines.length > 1 && <div className="inline-block mt-0.5 text-[9.5px] font-bold text-[#b45309] bg-[#fffbeb] border border-[#fde68a] rounded px-1.5 py-0.5">🎁 รวม {lines.length} รางวัล</div>}
                                  </td>
                                  <td className="px-2 py-1.5 align-top">
                                    {lines.length ? (
                                      <div className="flex flex-col gap-0.5">
                                        {lines.map((l) => (
                                          <span key={l.key} className="whitespace-nowrap"><span className="font-semibold text-[var(--primary)]">📅 {l.date}</span> <span className="text-[#b45309]">· {l.prize}</span></span>
                                        ))}
                                      </div>
                                    ) : <span className="text-[10.5px] text-[var(--text-muted)]">—</span>}
                                  </td>
                                  <td className="px-2 py-1.5 align-top text-right">
                                    <select
                                      value={a.status}
                                      onChange={(e) => setStatus(a.phoneLast9, e.target.value as AppointmentStatus)}
                                      className="text-[11px] font-semibold rounded-md border px-1.5 py-1 cursor-pointer outline-none"
                                      style={{ color: STATUS_META[a.status].color, background: STATUS_META[a.status].bg, borderColor: STATUS_META[a.status].color + '40' }}
                                    >
                                      <option value="booked">รอเข้ารับ</option>
                                      <option value="done">✓ รับของแล้ว</option>
                                      <option value="no_show">ไม่มาตามนัด</option>
                                    </select>
                                  </td>
                                </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
