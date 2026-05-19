'use client'

import { useMemo, useState } from 'react'
import {
  buildSkuTable, applyTierFilter, sortRows, toCsv, rangeToDay,
  type SkuRow, type SortKey, type SortDir, type TierFilter,
} from '@/lib/sku-redemption'
import DateRangeFilter, { computeRange, type DateRange } from '@/components/ui/DateRangeFilter'
import { numFmt } from '@/lib/utils'

const CAMPAIGN_START = '2026-05-16'
const CAMPAIGN_END   = '2026-05-18'
const DEFAULT_RANGE: DateRange = (() => {
  const r = computeRange('campaign', new Date(CAMPAIGN_END), CAMPAIGN_START)
  return { preset: 'campaign', ...r }
})()

const TIER_OPTIONS: { key: TierFilter; label: string; icon?: string }[] = [
  { key: 'all',    label: 'ทั้งหมด' },
  { key: '1',      label: '1 สิทธิ์' },
  { key: '2',      label: '2 สิทธิ์' },
  { key: '3plus',  label: '3+ สิทธิ์' },
  { key: 'dead',   label: 'Dead', icon: 'ti-skull' },
]

const COLS: { key: SortKey; label: string; align?: 'left' | 'right' | 'center'; width?: string }[] = [
  { key: 'seq',            label: '#',          align: 'center', width: '40px' },
  { key: 'sku',            label: 'SKU',        align: 'left',   width: '90px' },
  // ชื่อ column — not sortable directly
  { key: 'price',          label: 'ราคา',       align: 'right',  width: '60px' },
  { key: 'rightsPerScan',  label: 'สิทธิ์/scan', align: 'center', width: '70px' },
  { key: 'rightsRedeemed', label: 'สิทธิ์ที่แลก', align: 'right',  width: '95px' },
  { key: 'users',          label: 'Users',      align: 'right',  width: '70px' },
  { key: 'rightsPerUser',  label: 'สิทธิ์/คน',   align: 'right',  width: '75px' },
  { key: 'sharePct',       label: '% Share',    align: 'left' },
]

const PER_PAGE = 25

export default function ProductMasterTable() {
  const [search, setSearch] = useState('')
  const [tier, setTier]     = useState<TierFilter>('all')
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE)
  const [sortKey, setSortKey] = useState<SortKey>('rightsRedeemed')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  const day = useMemo(() => rangeToDay(dateRange.from, dateRange.to), [dateRange.from, dateRange.to])
  const base = useMemo(() => buildSkuTable(day), [day])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = applyTierFilter(base, tier)
    if (q) {
      rows = rows.filter(r =>
        r.sku.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q)
      )
    }
    return sortRows(rows, sortKey, sortDir)
  }, [base, search, tier, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageData = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  // Reset to page 0 on filter changes
  useMemo(() => { setPage(0) }, [search, tier, day, sortKey, sortDir])
  const isSpecificDay = day !== 'all'

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'seq' || key === 'sku' ? 'asc' : 'desc')
    }
  }

  function handleExport() {
    const csv = toCsv(filtered)
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }) // BOM for Excel Thai
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-master-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Totals row
  const totalRights = filtered.reduce((s, r) => s + r.rightsRedeemed, 0)
  const totalUsers  = filtered.reduce((s, r) => s + r.users, 0)
  const heroCount   = filtered.filter(r => r.status === 'hero').length
  const deadCount   = filtered.filter(r => r.status === 'dead').length

  return (
    <div className="card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-2 flex-wrap">
        <i className="ti ti-list-details text-[var(--primary)] text-lg" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">Product Master</h3>
        <span className="chip">{base.length} SKU</span>
        <span className="text-[11px] text-[var(--text-muted)] ml-1">
          • แสดง {filtered.length} • Hero {heroCount} • Dead {deadCount}
        </span>
        <button
          onClick={handleExport}
          className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-full border border-[var(--green-200)] text-[var(--green-700)] hover:bg-[var(--green-50)] transition"
        >
          <i className="ti ti-download mr-1" /> Export CSV
        </button>
      </div>

      {/* Date selector — same UX as Overview */}
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
        minDate={CAMPAIGN_START}
        maxDate={CAMPAIGN_END}
      />

      {/* Search + Tier filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-[320px]">
          <i className="ti ti-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา SKU / ชื่อสินค้า..."
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-[var(--border)] rounded-full focus:outline-none focus:border-[var(--primary)] bg-[var(--bg-soft)]"
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
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:bg-[var(--green-50)] hover:text-[var(--green-700)] border border-[var(--border)]'
                }`}
              >
                {opt.icon && <i className={`ti ${opt.icon} mr-1`} />}
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--border-soft)]">
        <table className="w-full text-[12px]">
          <thead className="bg-[var(--bg-soft)] sticky top-0">
            <tr className="text-[var(--text-secondary)] text-[10.5px] uppercase tracking-wider">
              {COLS.slice(0, 2).map(c => (
                <Th key={c.key} col={c} sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort(c.key)} />
              ))}
              <th className="text-left py-2 px-2 font-bold">ชื่อสินค้า</th>
              {COLS.slice(2).map(c => (
                <Th key={c.key} col={c} sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort(c.key)} />
              ))}
              <th className="text-center py-2 px-2 font-bold" style={{ width: 90 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr><td colSpan={10} className="text-center py-8 text-[var(--text-muted)] text-[12px]">
                <i className="ti ti-mood-empty text-2xl block mb-1" />
                ไม่พบสินค้าที่ตรงกับเงื่อนไข
              </td></tr>
            )}
            {pageData.map((r) => (
              <tr key={r.sku} className="border-t border-[var(--border-soft)] hover:bg-[var(--green-50)]/40 transition">
                <td className="text-center py-2 px-2 text-[var(--text-muted)]">{r.seq}</td>
                <td className="py-2 px-2 font-mono text-[11px] text-[var(--green-700)] font-semibold">{r.sku}</td>
                <td className="py-2 px-2 max-w-[260px]">
                  <div className="truncate font-medium text-[var(--dark)]" title={r.fullName}>{r.displayName}</div>
                  <div className="truncate text-[10px] text-[var(--text-muted)]">{r.priceCategory}</div>
                </td>
                <td className="text-right py-2 px-2 num text-[var(--text)]">{r.price}฿</td>
                <td className="text-center py-2 px-2 num">
                  <span className="chip chip-gray" style={{ minWidth: 28, justifyContent: 'center' }}>{r.rightsPerScan}</span>
                </td>
                <td className={`text-right py-2 px-2 num font-bold ${r.rightsRedeemed > 0 ? 'text-[var(--dark)]' : 'text-[var(--text-muted)]'}`}>
                  {numFmt(r.rightsRedeemed)}
                </td>
                <td className={`text-right py-2 px-2 num ${r.users > 0 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                  {numFmt(r.users)}
                </td>
                <td className="text-right py-2 px-2 num">
                  {r.rightsPerUser > 0 ? (
                    <span className={`font-bold ${r.rightsPerUser >= 2 ? 'text-[var(--green-700)]' : 'text-[var(--text-secondary)]'}`}>
                      {r.rightsPerUser.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">—</span>
                  )}
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <div className="progress flex-1" style={{ height: 6, minWidth: 50 }}>
                      <div className="progress-fill" style={{ width: `${Math.max(0.5, r.sharePct * 3)}%` }} />
                    </div>
                    <span className="text-[10.5px] num font-bold text-[var(--green-800)] w-10 text-right">
                      {r.sharePct.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="text-center py-2 px-2">
                  <StatusChip status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[var(--green-200)] bg-[var(--green-50)] font-bold text-[var(--dark)]">
                <td colSpan={5} className="text-right py-2 px-2 text-[11px] uppercase tracking-wider">รวม ({filtered.length} SKU)</td>
                <td className="text-right py-2 px-2 num">{numFmt(totalRights)}</td>
                <td className="text-right py-2 px-2 num text-[var(--green-700)]">{numFmt(totalUsers)}</td>
                <td className="text-right py-2 px-2 num text-[var(--green-800)]">
                  {totalUsers > 0 ? (totalRights / totalUsers).toFixed(2) : '—'}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--green-200)] hover:text-[var(--green-700)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &laquo; ก่อนหน้า
          </button>
          <span className="text-[11px] text-[var(--text-secondary)] num">
            หน้า <b className="text-[var(--dark)]">{page + 1}</b> / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="px-3 py-1 rounded-full text-[11px] font-semibold border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--green-200)] hover:text-[var(--green-700)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป &raquo;
          </button>
        </div>
      )}
    </div>
  )
}

function Th({
  col, sortKey, sortDir, onClick,
}: {
  col: { key: SortKey; label: string; align?: 'left' | 'right' | 'center'; width?: string }
  sortKey: SortKey; sortDir: SortDir; onClick: () => void
}) {
  const active = sortKey === col.key
  const align = col.align || 'left'
  return (
    <th
      onClick={onClick}
      className={`py-2 px-2 font-bold cursor-pointer select-none hover:text-[var(--primary)] ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      } ${active ? 'text-[var(--primary)]' : ''}`}
      style={{ width: col.width }}
    >
      {col.label}
      {active && <i className={`ti ${sortDir === 'asc' ? 'ti-chevron-up' : 'ti-chevron-down'} ml-0.5`} />}
    </th>
  )
}

function StatusChip({ status }: { status: SkuRow['status'] }) {
  if (status === 'hero')   return <span className="chip chip-yellow">🔥 Hero</span>
  if (status === 'active') return <span className="chip">🟢 Active</span>
  return <span className="chip chip-red">💀 Dead</span>
}
