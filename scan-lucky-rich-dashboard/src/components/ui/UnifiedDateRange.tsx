'use client'
import { useEffect, useMemo, useState } from 'react'

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────
export type PresetKey =
  | 'today' | 'yesterday' | '7d' | '30d'
  | 'month' | 'quarter' | 'year' | 'campaign' | 'custom'

export interface DateRangeV2 {
  from: string   // YYYY-MM-DD
  to:   string   // YYYY-MM-DD
  preset: PresetKey
}

interface Props {
  value: DateRangeV2
  onChange: (r: DateRangeV2) => void
  /** Today's date override (for testing / hardcoded campaign demo). Defaults to new Date(). */
  today?: Date
  /** Campaign start (lower bound for "ทั้งแคมเปญ" + min date). Default 2026-05-16 */
  campaignStart?: string
  /** Campaign end (upper bound for max date). Default 2026-12-18 */
  campaignEnd?: string
}

const PRESETS: { key: PresetKey; label: string; icon?: string }[] = [
  { key: 'today',     label: 'วันนี้' },
  { key: 'yesterday', label: 'เมื่อวาน' },
  { key: '7d',        label: '7 วัน' },
  { key: '30d',       label: '30 วัน' },
  { key: 'month',     label: 'เดือนนี้' },
  { key: 'quarter',   label: 'Q นี้' },
  { key: 'year',      label: 'ปีนี้' },
  { key: 'campaign',  label: 'แคมเปญ' },
  { key: 'custom',    label: 'กำหนดเอง', icon: 'ti-adjustments' },
]

const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function thaiShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${THAI_MONTHS[m - 1]} ${String(y + 543).slice(-2)}`
}

function thaiDow(iso: string): string {
  const dows = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']
  return dows[new Date(iso).getDay()]
}

function daysBetween(from: string, to: string): number {
  const f = new Date(from).getTime()
  const t = new Date(to).getTime()
  return Math.round((t - f) / 86400000) + 1
}

export function computeRangeV2(preset: PresetKey, today: Date, campaignStart: string, campaignEnd: string): { from: string; to: string } {
  const t = new Date(today)
  t.setHours(0, 0, 0, 0)
  const today0 = toISO(t)

  const yest = new Date(t); yest.setDate(t.getDate() - 1)
  const d7   = new Date(t); d7.setDate(t.getDate() - 6)
  const d30  = new Date(t); d30.setDate(t.getDate() - 29)

  const monthStart = new Date(t.getFullYear(), t.getMonth(), 1)
  const quarterStart = new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1)
  const yearStart    = new Date(t.getFullYear(), 0, 1)

  switch (preset) {
    case 'today':     return { from: today0,            to: today0 }
    case 'yesterday': return { from: toISO(yest),       to: toISO(yest) }
    case '7d':        return { from: toISO(d7),         to: today0 }
    case '30d':       return { from: toISO(d30),        to: today0 }
    case 'month':     return { from: toISO(monthStart), to: today0 }
    case 'quarter':   return { from: toISO(quarterStart), to: today0 }
    case 'year':      return { from: toISO(yearStart),  to: today0 }
    case 'campaign':  return { from: campaignStart, to: today0 < campaignEnd ? today0 : campaignEnd }
    case 'custom':    return { from: toISO(d7),         to: today0 }
  }
}

/** Detect which preset matches a (from, to) range. Returns 'custom' if none. */
function detectPreset(from: string, to: string, today: Date, campaignStart: string, campaignEnd: string): PresetKey {
  for (const p of PRESETS) {
    if (p.key === 'custom') continue
    const r = computeRangeV2(p.key, today, campaignStart, campaignEnd)
    if (r.from === from && r.to === to) return p.key
  }
  return 'custom'
}

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
export default function UnifiedDateRange({
  value, onChange,
  today = new Date(),
  campaignStart = '2026-05-16',
  campaignEnd   = '2026-12-18',
}: Props) {
  const [draftFrom, setDraftFrom] = useState(value.from)
  const [draftTo, setDraftTo]     = useState(value.to)
  const [editMode, setEditMode]   = useState(false)

  useEffect(() => {
    setDraftFrom(value.from)
    setDraftTo(value.to)
  }, [value.from, value.to])

  const dayCount = useMemo(() => daysBetween(value.from, value.to), [value.from, value.to])
  const rangeLabel = useMemo(() => {
    if (value.from === value.to) return thaiShort(value.from)
    return `${thaiShort(value.from)} → ${thaiShort(value.to)}`
  }, [value.from, value.to])

  const dowRange = useMemo(() => {
    if (value.from === value.to) return thaiDow(value.from)
    return `${thaiDow(value.from)}–${thaiDow(value.to)}`
  }, [value.from, value.to])

  // Detect active preset
  const activePreset = value.preset === 'custom'
    ? detectPreset(value.from, value.to, today, campaignStart, campaignEnd)
    : value.preset

  function applyPreset(p: PresetKey) {
    if (p === 'custom') {
      setEditMode(true)
      return
    }
    const r = computeRangeV2(p, today, campaignStart, campaignEnd)
    onChange({ preset: p, ...r })
    setEditMode(false)
  }

  function applyCustom() {
    if (!draftFrom || !draftTo) return
    const from = draftFrom <= draftTo ? draftFrom : draftTo
    const to   = draftFrom <= draftTo ? draftTo : draftFrom
    onChange({ preset: 'custom', from, to })
    setEditMode(false)
  }

  return (
    <div className="card p-3">
      {/* Row 1: Date inputs + summary */}
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <i className="ti ti-calendar-event text-[var(--brand-500)] text-lg flex-shrink-0" />

        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-[var(--text-muted)] uppercase text-[10px] tracking-wider">จาก</span>
          <input
            type="date"
            value={draftFrom}
            min={campaignStart}
            max={campaignEnd}
            onChange={e => {
              setDraftFrom(e.target.value)
              if (e.target.value && draftTo) {
                onChange({ preset: 'custom', from: e.target.value, to: draftTo })
              }
            }}
            className="px-2 py-1 text-[12px] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--brand-500)] num"
          />
          <span className="text-[var(--text-muted)]">→</span>
          <span className="text-[var(--text-muted)] uppercase text-[10px] tracking-wider">ถึง</span>
          <input
            type="date"
            value={draftTo}
            min={campaignStart}
            max={campaignEnd}
            onChange={e => {
              setDraftTo(e.target.value)
              if (e.target.value && draftFrom) {
                onChange({ preset: 'custom', from: draftFrom, to: e.target.value })
              }
            }}
            className="px-2 py-1 text-[12px] border border-[var(--border)] rounded focus:outline-none focus:border-[var(--brand-500)] num"
          />
        </div>

        {/* Summary chip */}
        <div className="flex items-center gap-2 text-[11.5px] px-3 py-1 rounded-full"
             style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
          <i className="ti ti-clock-hour-3 text-[12px]" />
          <span className="font-bold num">{dayCount} วัน</span>
          <span className="opacity-60">•</span>
          <span>{dowRange}</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)]">
          <span className="live-dot" />
          <span>Live</span>
        </div>
      </div>

      {/* Row 2: Preset chips */}
      <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-[var(--border-soft)]">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-1">ทางลัด</span>
        {PRESETS.map(p => {
          const active = activePreset === p.key
          return (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                active
                  ? 'bg-[var(--brand-500)] text-white shadow-sm'
                  : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] border border-[var(--border)]'
              }`}
            >
              {p.icon && <i className={`ti ${p.icon} mr-1`} />}
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Default range factory — used by tabs to init state
// ────────────────────────────────────────────────────────────────
export function defaultRange(opts?: { preset?: PresetKey; today?: Date; campaignStart?: string; campaignEnd?: string }): DateRangeV2 {
  const today = opts?.today ?? new Date()
  const cs = opts?.campaignStart ?? '2026-05-16'
  const ce = opts?.campaignEnd   ?? '2026-12-18'
  const preset = opts?.preset ?? 'campaign'
  const r = computeRangeV2(preset, today, cs, ce)
  return { preset, ...r }
}

// ────────────────────────────────────────────────────────────────
// Helper for tabs: get list of dates from range that match available data
// ────────────────────────────────────────────────────────────────
export function rangeDates(from: string, to: string): string[] {
  const out: string[] = []
  const f = new Date(from)
  const t = new Date(to)
  while (f <= t) {
    out.push(toISO(f))
    f.setDate(f.getDate() + 1)
  }
  return out
}
