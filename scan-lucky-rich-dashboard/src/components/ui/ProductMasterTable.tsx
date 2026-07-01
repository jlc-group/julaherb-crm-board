'use client'

import { useMemo, useState } from 'react'
import { PRODUCTS_MASTER } from '@/config/products-real'
import { PER_SKU_DAILY, DAY_KEYS, type DayKey } from '@/lib/per-sku-daily'
import { numFmt } from '@/lib/utils'

const DAY_LABELS: Record<DayKey, { dow: string; tag?: string }> = {
  '16': { dow: 'เสาร์', tag: 'start' },
  '17': { dow: 'อาทิตย์', tag: 'peak' },
  '18': { dow: 'จันทร์' },
  '19': { dow: 'อังคาร', tag: 'outage 6h' },
  '20': { dow: 'พุธ', tag: 'recovery' },
  '21': { dow: 'พฤหัสบดี', tag: 'outage 2h' },
  '22': { dow: 'ศุกร์', tag: 'outage 2.5h' },
  '23': { dow: 'เสาร์', tag: 'stable' },
  '24': { dow: 'อาทิตย์', tag: 'peak' },
}

type TierFilter = 'all' | '1' | '2' | '3plus' | 'dead'
type SortKey = 'sku' | 'price' | 'rightsPerScan' | 'totalScans' | 'totalTickets'
type SortDir = 'asc' | 'desc'

const TIER_OPTIONS: { key: TierFilter; label: string; icon?: string }[] = [
  { key: 'all',    label: 'ทั้งหมด' },
  { key: '1',      label: '1 สิทธิ์' },
  { key: '2',      label: '2 สิทธิ์' },
  { key: '3plus',  label: '3+ สิทธิ์' },
  { key: 'dead',   label: 'Dead', icon: 'ti-skull' },
]

interface Props {
  /** Days to show in the matrix — driven by top-level date range */
  visibleDays: DayKey[]
}

export default function ProductMasterTable({ visibleDays }: Props) {
  const [search, setSearch] = useState('')
  const [tier, setTier]     = useState<TierFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('totalTickets')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Build matrix rows
  const allRows = useMemo(() => {
    return PRODUCTS_MASTER.map(p => {
      const days: Record<DayKey, { scans: number; tickets: number }> = {} as any
      let totalScans = 0
      let totalTickets = 0
      for (const dk of DAY_KEYS) {
        const v = PER_SKU_DAILY[p.sku]?.[dk]
        const scans = v?.r ?? 0
        const tickets = scans * p.rightsPerScan
        days[dk] = { scans, tickets }
        if (visibleDays.includes(dk)) {
          totalScans += scans
          totalTickets += tickets
        }
      }
      const status: 'hero' | 'active' | 'dead' =
        totalScans === 0 ? 'dead' :
        totalTickets >= 500 ? 'hero' :
        'active'
      return {
        ...p,
        days,
        totalScans,
        totalTickets,
        status,
      }
    })
  }, [visibleDays])

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = allRows
    if (tier !== 'all') {
      if (tier === 'dead') {
        rows = rows.filter(r => r.totalScans === 0)
      } else if (tier === '1') {
        rows = rows.filter(r => r.rightsPerScan === 1)
      } else if (tier === '2') {
        rows = rows.filter(r => r.rightsPerScan === 2)
      } else if (tier === '3plus') {
        rows = rows.filter(r => r.rightsPerScan >= 3)
      }
    }
    if (q) {
      rows = rows.filter(r =>
        r.sku.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q)
      )
    }
    // sort
    const sorted = [...rows].sort((a, b) => {
      let av: any, bv: any
      switch (sortKey) {
        case 'sku':           av = a.sku; bv = b.sku; break
        case 'price':         av = a.price; bv = b.price; break
        case 'rightsPerScan': av = a.rightsPerScan; bv = b.rightsPerScan; break
        case 'totalScans':    av = a.totalScans; bv = b.totalScans; break
        case 'totalTickets':  av = a.totalTickets; bv = b.totalTickets; break
      }
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [allRows, search, tier, sortKey, sortDir])

  // Footer totals
  const grandTotalScans   = filtered.reduce((s, r) => s + r.totalScans, 0)
  const grandTotalTickets = filtered.reduce((s, r) => s + r.totalTickets, 0)
  const dayTotals = useMemo(() => {
    const out: Record<DayKey, { scans: number; tickets: number }> = {} as any
    for (const dk of DAY_KEYS) {
      out[dk] = { scans: 0, tickets: 0 }
    }
    filtered.forEach(r => {
      for (const dk of visibleDays) {
        out[dk].scans   += r.days[dk].scans
        out[dk].tickets += r.days[dk].tickets
      }
    })
    return out
  }, [filtered, visibleDays])

  const heroCount = filtered.filter(r => r.status === 'hero').length
  const deadCount = filtered.filter(r => r.status === 'dead').length

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'sku' ? 'asc' : 'desc')
    }
  }

  function handleExport() {
    const headers = ['รหัส', 'ชื่อ', 'ราคา', 'สิทธิ์/สแกน']
    visibleDays.forEach(dk => {
      headers.push(`Scans ${dk}/5`, `สิทธิ์ ${dk}/5`)
    })
    headers.push('Total Scans', 'Total สิทธิ์')
    const lines = [headers.join(',')]
    filtered.forEach(r => {
      const row = [r.sku, `"${r.displayName}"`, r.price, r.rightsPerScan]
      visibleDays.forEach(dk => {
        row.push(r.days[dk].scans, r.days[dk].tickets)
      })
      row.push(r.totalScans, r.totalTickets)
      lines.push(row.join(','))
    })
    const csv = lines.join('\n')
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sku-matrix-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <i className="ti ti-table text-[var(--brand-500)] text-lg" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">SKU × Day Matrix</h3>
        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-amber-100 text-amber-800">🟠 static 16–24 พ.ค.</span>
        <span className="chip">{PRODUCTS_MASTER.length} SKU</span>
        <span className="text-[11px] text-[var(--text-muted)] ml-1">
          • แสดง {filtered.length} • Hero {heroCount} • Dead {deadCount}
        </span>
        <button
          onClick={handleExport}
          className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-full border border-[var(--brand-200)] text-[var(--brand-700)] hover:bg-[var(--brand-50)] transition"
        >
          <i className="ti ti-download mr-1" /> Export CSV
        </button>
      </div>

      {/* Caption */}
      <div className="text-[10.5px] text-[var(--text-muted)] italic flex items-center gap-2">
        <span>Jula's Herb × ไทยรัฐ · {PRODUCTS_MASTER.length} SKUs · ตารางนี้ยังใช้ snapshot ใน repo (`PER_SKU_DAILY`) ไม่ใช่ live API — "สิทธิ์" คือ scans × rightsPerScan (ตามสเปก Excel)</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-[var(--brand-700)] bg-[var(--brand-50)] px-2 py-0.5 rounded-full font-semibold not-italic">
          <i className="ti ti-arrow-up text-[10px]" />
          ใช้ตัวกรองวันที่ด้านบน
        </span>
      </div>

      {/* Search + Tier filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-[320px]">
          <i className="ti ti-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา SKU / ชื่อสินค้า..."
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[var(--border)] rounded-full focus:outline-none focus:border-[var(--brand-500)] bg-[var(--bg-soft)]"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIER_OPTIONS.map(opt => {
            const active = tier === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => setTier(opt.key)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  active
                    ? 'bg-[var(--brand-500)] text-white shadow-sm'
                    : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] border border-[var(--border)]'
                }`}
              >
                {opt.icon && <i className={`ti ${opt.icon} mr-1`} />}
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Matrix Table — sticky columns (left 4) + sticky header (top 2 rows) */}
      <div className="overflow-auto rounded-lg border border-[var(--border-soft)]" style={{ maxHeight: 600 }}>
        <table className="text-[11.5px] border-collapse" style={{ minWidth: 900 + visibleDays.length * 160 }}>
          <thead>
            {/* Row 1: Day group header (sticky top: 0) */}
            <tr className="text-[10px] uppercase tracking-wider">
              <th colSpan={4}
                  className="py-2 px-2 text-left border-b border-[var(--brand-100)] text-[var(--brand-700)]"
                  style={{ position: 'sticky', top: 0, left: 0, zIndex: 35, minWidth: 480, background: '#eef2ff' }}>
                SKU INFO
              </th>
              {visibleDays.map(dk => (
                <th key={`g-${dk}`} colSpan={2}
                    className="py-2 px-2 text-center border-b border-l border-[var(--brand-100)] text-[var(--brand-700)]"
                    style={{ position: 'sticky', top: 0, zIndex: 22, background: '#eef2ff' }}>
                  <div className="text-[10.5px] font-bold text-[var(--brand-700)]">
                    วัน{DAY_LABELS[dk].dow} {dk}/5
                    {DAY_LABELS[dk].tag && (
                      <span className="ml-1 text-[9px] font-normal text-[var(--text-muted)]">({DAY_LABELS[dk].tag})</span>
                    )}
                  </div>
                </th>
              ))}
              <th colSpan={2}
                  className="py-2 px-2 text-center border-b border-l border-[var(--brand-200)] text-[var(--brand-800)]"
                  style={{ position: 'sticky', top: 0, zIndex: 22, background: '#c7d2fe' }}>
                รวม {visibleDays.length} วัน
              </th>
            </tr>
            {/* Row 2: Column headers (sticky top: 32 to clear row 1) */}
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider">
              <ThSticky onClick={() => toggleSort('sku')} active={sortKey === 'sku'} dir={sortDir} align="left"
                        left={0} width={80} top={32}>รหัส</ThSticky>
              <th className="py-2 px-2 text-left font-bold"
                  style={{ position: 'sticky', left: 80, top: 32, zIndex: 28, minWidth: 240, background: '#f1f5f9' }}>ชื่อ + ขนาด</th>
              <ThSticky onClick={() => toggleSort('price')} active={sortKey === 'price'} dir={sortDir} align="right"
                        left={320} width={70} top={32}>ราคา (B)</ThSticky>
              <ThSticky onClick={() => toggleSort('rightsPerScan')} active={sortKey === 'rightsPerScan'} dir={sortDir} align="center"
                        left={390} width={90} top={32}>สิทธิ์/สแกน</ThSticky>
              {visibleDays.map(dk => (
                <th key={`c-${dk}`} className="text-right py-2 px-2 font-bold border-l border-[var(--border-soft)]" colSpan={2}
                    style={{ position: 'sticky', top: 32, zIndex: 15, background: '#f1f5f9' }}>
                  <div className="flex">
                    <span className="flex-1 text-right text-[var(--brand-700)]">Scans</span>
                    <span className="flex-1 text-right text-[#be185d]">สิทธิ์</span>
                  </div>
                </th>
              ))}
              <Th onClick={() => toggleSort('totalScans')} active={sortKey === 'totalScans'} dir={sortDir} align="right"
                  extraClass="border-l border-[var(--brand-200)]"
                  stickyTop={32}
                  bg="#e0e7ff">Total Scans</Th>
              <Th onClick={() => toggleSort('totalTickets')} active={sortKey === 'totalTickets'} dir={sortDir} align="right"
                  stickyTop={32}
                  bg="#e0e7ff">Total สิทธิ์</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6 + visibleDays.length * 2} className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                <i className="ti ti-mood-empty text-2xl block mb-1" />
                ไม่พบสินค้าที่ตรงกับเงื่อนไข
              </td></tr>
            )}
            {filtered.map((r, idx) => {
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafbfc'
              return (
              <tr key={r.sku} className="border-t border-[var(--border-soft)] hover:bg-[var(--brand-50)]/30 transition group">
                <td className="py-1.5 px-2 font-mono text-[10.5px] text-[var(--brand-700)] font-semibold whitespace-nowrap"
                    style={{ position: 'sticky', left: 0, zIndex: 5, background: rowBg, width: 80 }}>{r.sku}</td>
                <td className="py-1.5 px-2 max-w-[280px] truncate"
                    title={r.fullName}
                    style={{ position: 'sticky', left: 80, zIndex: 5, background: rowBg, minWidth: 240 }}>
                  <span className="text-[var(--dark)]">{r.displayName.replace(/\s*\([^)]+\)$/, '')}</span>
                </td>
                <td className="text-right py-1.5 px-2 num text-[var(--text)]"
                    style={{ position: 'sticky', left: 320, zIndex: 5, background: rowBg, width: 70 }}>{r.price}</td>
                <td className="text-center py-1.5 px-2"
                    style={{ position: 'sticky', left: 390, zIndex: 5, background: rowBg, width: 90, borderRight: '1px solid var(--border-soft)' }}>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    r.rightsPerScan === 1 ? 'bg-[var(--bg-soft)] text-[var(--text-secondary)]' :
                    r.rightsPerScan === 2 ? 'bg-blue-50 text-blue-700' :
                    r.rightsPerScan >= 5 ? 'bg-yellow-50 text-yellow-700' :
                    'bg-indigo-50 text-indigo-700'
                  }`}>
                    {r.rightsPerScan}
                  </span>
                </td>
                {visibleDays.map(dk => {
                  const d = r.days[dk]
                  return (
                    <DayCells key={dk} scans={d.scans} tickets={d.tickets} hasMultiplier={r.rightsPerScan > 1} />
                  )
                })}
                <td className="text-right py-1.5 px-2 num font-bold text-[var(--brand-700)] border-l border-[var(--brand-200)] bg-[var(--brand-50)]/30">
                  {r.totalScans > 0 ? numFmt(r.totalScans) : <span className="text-[var(--text-muted)]">—</span>}
                </td>
                <td className="text-right py-1.5 px-2 num font-bold text-[#be185d] bg-pink-50/40">
                  {r.totalTickets > 0 ? numFmt(r.totalTickets) : <span className="text-[var(--text-muted)]">—</span>}
                </td>
              </tr>
              )
            })}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[var(--brand-200)] font-bold text-[var(--dark)]">
                <td colSpan={4}
                    className="text-right py-2 px-2 text-[11px] uppercase tracking-wider border-r border-[var(--brand-200)]"
                    style={{ position: 'sticky', left: 0, bottom: 0, zIndex: 18, background: '#e0e7ff' }}>
                  รวม ({filtered.length} SKU)
                </td>
                {visibleDays.map(dk => (
                  <DayCells key={`tot-${dk}`} scans={dayTotals[dk].scans} tickets={dayTotals[dk].tickets} isTotal />
                ))}
                <td className="text-right py-2 px-2 num text-[var(--brand-700)] border-l border-[var(--brand-300)]"
                    style={{ position: 'sticky', bottom: 0, zIndex: 12, background: '#c7d2fe' }}>
                  {numFmt(grandTotalScans)}
                </td>
                <td className="text-right py-2 px-2 num text-[#be185d]"
                    style={{ position: 'sticky', bottom: 0, zIndex: 12, background: '#fbcfe8' }}>
                  {numFmt(grandTotalTickets)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function DayCells({ scans, tickets, hasMultiplier, isTotal }: {
  scans: number; tickets: number; hasMultiplier?: boolean; isTotal?: boolean
}) {
  const isZero = scans === 0
  const totalStyle: React.CSSProperties | undefined = isTotal
    ? { position: 'sticky', bottom: 0, zIndex: 10 }
    : undefined
  return (
    <>
      <td className={`text-right py-1.5 px-2 num border-l border-[var(--border-soft)] ${
        isTotal ? 'font-bold' : ''
      } ${isZero ? 'text-[var(--text-muted)]' : 'text-[var(--brand-700)]'}`}
          style={isTotal ? { ...totalStyle, background: '#e0e7ff' } : undefined}>
        {isZero ? '0' : numFmt(scans)}
      </td>
      <td className={`text-right py-1.5 px-2 num ${
        isTotal ? 'font-bold' : ''
      } ${isZero ? 'text-[var(--text-muted)]' : 'text-[#be185d]'} ${hasMultiplier && !isZero ? 'font-bold' : ''}`}
          style={isTotal ? { ...totalStyle, background: '#fce7f3' } : undefined}>
        {isZero ? '0' : numFmt(tickets)}
      </td>
    </>
  )
}

function Th({ onClick, active, dir, align, extraClass = '', stickyTop, bg, children }: {
  onClick: () => void; active: boolean; dir: SortDir; align: 'left' | 'right' | 'center'; extraClass?: string; stickyTop?: number; bg?: string; children: React.ReactNode
}) {
  const style: React.CSSProperties = stickyTop != null
    ? { position: 'sticky', top: stickyTop, zIndex: 15, background: bg || '#f8fafc' }
    : (bg ? { background: bg } : {})
  return (
    <th
      onClick={onClick}
      className={`py-2 px-2 font-bold cursor-pointer select-none hover:text-[var(--brand-500)] ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${active ? 'text-[var(--brand-500)]' : ''} ${extraClass}`}
      style={style}
    >
      {children}
      {active && <i className={`ti ${dir === 'asc' ? 'ti-chevron-up' : 'ti-chevron-down'} ml-0.5`} />}
    </th>
  )
}

function ThSticky({ onClick, active, dir, align, left, width, top, children }: {
  onClick: () => void; active: boolean; dir: SortDir;
  align: 'left' | 'right' | 'center';
  left: number; width: number; top: number;
  children: React.ReactNode
}) {
  return (
    <th
      onClick={onClick}
      className={`py-2 px-2 font-bold cursor-pointer select-none hover:text-[var(--brand-500)] ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${active ? 'text-[var(--brand-500)]' : ''}`}
      style={{ position: 'sticky', left, top, zIndex: 28, width, minWidth: width, background: '#f1f5f9' }}
    >
      {children}
      {active && <i className={`ti ${dir === 'asc' ? 'ti-chevron-up' : 'ti-chevron-down'} ml-0.5`} />}
    </th>
  )
}
