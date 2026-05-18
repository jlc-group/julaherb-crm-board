'use client'
import { useState, useEffect, useRef } from 'react'

export type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'campaign' | 'custom'

export interface DateRange {
  preset: DatePreset
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

interface Props {
  value: DateRange
  onChange: (r: DateRange) => void
  /** Earliest selectable date (campaign start). Default: 2026-05-16 */
  minDate?: string
  /** Latest selectable date (campaign end). Default: today */
  maxDate?: string
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today',    label: 'วันนี้' },
  { key: 'yesterday',label: 'เมื่อวาน' },
  { key: '7d',       label: '7 วันล่าสุด' },
  { key: '30d',      label: '30 วันล่าสุด' },
  { key: 'campaign', label: 'ทั้งแคมเปญ' },
  { key: 'custom',   label: 'กำหนดเอง' },
]

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function thaiShort(iso: string): string {
  // 2026-05-18 → 18 พ.ค. 69
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${months[m - 1]} ${String(y + 543).slice(-2)}`
}

export function computeRange(preset: DatePreset, today: Date, campaignStart: string): { from: string; to: string } {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const yest = new Date(t); yest.setDate(t.getDate() - 1)
  const d7   = new Date(t); d7.setDate(t.getDate() - 6)
  const d30  = new Date(t); d30.setDate(t.getDate() - 29)

  switch (preset) {
    case 'today':     return { from: toISO(t),    to: toISO(t) }
    case 'yesterday': return { from: toISO(yest), to: toISO(yest) }
    case '7d':        return { from: toISO(d7),   to: toISO(t) }
    case '30d':       return { from: toISO(d30),  to: toISO(t) }
    case 'campaign':  return { from: campaignStart, to: toISO(t) }
    case 'custom':    return { from: toISO(d7),   to: toISO(t) }
  }
}

export default function DateRangeFilter({ value, onChange, minDate = '2026-05-16', maxDate }: Props) {
  const [showCustom, setShowCustom] = useState(value.preset === 'custom')
  const [draftFrom, setDraftFrom] = useState(value.from)
  const [draftTo, setDraftTo]     = useState(value.to)
  const popRef = useRef<HTMLDivElement>(null)
  const today  = maxDate || toISO(new Date())

  useEffect(() => {
    setDraftFrom(value.from)
    setDraftTo(value.to)
  }, [value.from, value.to])

  // close popover on outside click
  useEffect(() => {
    if (!showCustom) return
    function onDoc(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setShowCustom(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [showCustom])

  function applyPreset(p: DatePreset) {
    if (p === 'custom') {
      setShowCustom(s => !s)
      return
    }
    const r = computeRange(p, new Date(), minDate)
    onChange({ preset: p, ...r })
    setShowCustom(false)
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return
    const from = draftFrom <= draftTo ? draftFrom : draftTo
    const to   = draftFrom <= draftTo ? draftTo : draftFrom
    onChange({ preset: 'custom', from, to })
    setShowCustom(false)
  }

  const isSameDay = value.from === value.to
  const rangeLabel = isSameDay ? thaiShort(value.from) : `${thaiShort(value.from)} – ${thaiShort(value.to)}`

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-3 flex flex-wrap items-center gap-3">
      {/* Icon + label */}
      <div className="flex items-center gap-2 pr-3 border-r border-gray-100">
        <i className="ti ti-calendar-event text-[var(--primary)] text-lg" />
        <div>
          <div className="text-[10px] text-gray-400 leading-tight">ช่วงเวลา</div>
          <div className="text-[12px] font-semibold text-[var(--dark)] leading-tight">{rangeLabel}</div>
        </div>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-1.5 items-center relative">
        {PRESETS.map(p => {
          const active = value.preset === p.key
          return (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.key === 'custom' && <i className="ti ti-adjustments mr-1" />}
              {p.label}
            </button>
          )
        })}

        {/* Custom popover */}
        {showCustom && (
          <div
            ref={popRef}
            className="absolute top-full left-0 mt-2 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex gap-2 items-end"
            style={{ minWidth: 320 }}
          >
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">จาก</label>
              <input
                type="date"
                value={draftFrom}
                min={minDate}
                max={today}
                onChange={e => setDraftFrom(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-[12px] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1">ถึง</label>
              <input
                type="date"
                value={draftTo}
                min={minDate}
                max={today}
                onChange={e => setDraftTo(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-[12px] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              onClick={applyCustom}
              className="bg-[var(--primary)] text-white text-[11px] font-medium px-3 py-1.5 rounded hover:bg-[var(--mid)]"
            >
              ใช้งาน
            </button>
          </div>
        )}
      </div>

      {/* Spacer + compare toggle (placeholder for future) */}
      <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-400">
        <i className="ti ti-info-circle" />
        <span>เปรียบเทียบกับช่วงก่อนหน้าอัตโนมัติ</span>
      </div>
    </div>
  )
}
