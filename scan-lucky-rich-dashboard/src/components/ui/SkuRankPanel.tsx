'use client'
// 📊 SkuRankPanel — ตารางจัดอันดับสินค้าสไตล์ Kalodata (self-contained สำหรับหน้า Products)
// sort หลายคอลัมน์ + sparkline + growth% + ดัชนีกระจุกตัว + size-mix · fetch per-day + daily-matrix เอง
import { useMemo, useState } from 'react'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'
import { productImage, productCategory } from '@/config/product-images'
import { skuSize, SIZE_LABEL, SIZE_COLOR, type SizeTier } from '@/lib/sku-utils'
import RankedTable, { type RankColumn } from '@/components/ui/RankedTable'
import Sparkline from '@/components/ui/Sparkline'
import ConcentrationStrip from '@/components/ui/ConcentrationStrip'
import type { SkuPerDayResponse, SkuDailyMatrixResponse } from '@/lib/api/types'

interface Row {
  sku: string; name: string; scans: number; share: number; growth: number | null
  series: number[]; size: SizeTier; category: string; img: string | null
}
const stripSku = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim()

export default function SkuRankPanel({ from, to }: { from: string; to: string }) {
  const [sizeFilter, setSizeFilter] = useState<SizeTier | 'all'>('all')
  const perDay = useApi<SkuPerDayResponse>(`/api/sku/per-day?from=${from}&to=${to}`)
  const dm = useApi<SkuDailyMatrixResponse>(`/api/sku/daily-matrix?from=${from}&to=${to}`)

  const seriesBySku = useMemo(() => {
    const raw = dm.data?.data ?? []
    if (!raw.length) return null
    const dates = Array.from(new Set(raw.map((r) => r.date))).sort()
    const m = new Map<string, Map<string, number>>()
    for (const r of raw) { let e = m.get(r.sku); if (!e) { e = new Map(); m.set(r.sku, e) } e.set(r.date, (e.get(r.date) ?? 0) + r.scans) }
    const out = new Map<string, number[]>()
    for (const [sku, e] of Array.from(m.entries())) out.set(sku, dates.map((d) => e.get(d) ?? 0))
    return out
  }, [dm.data])

  const rows = useMemo<Row[]>(() => {
    let base: Row[] = (perDay.data?.rows ?? []).map((r) => {
      const series = seriesBySku?.get(r.sku) ?? []
      let growth: number | null = null
      if (series.length >= 2) {
        const mid = Math.floor(series.length / 2)
        const a = series.slice(0, mid).reduce((s, v) => s + v, 0)
        const b = series.slice(mid).reduce((s, v) => s + v, 0)
        growth = a > 0 ? ((b - a) / a) * 100 : null
      }
      return { sku: r.sku, name: stripSku(r.displayName || r.sku), scans: r.scans, share: 0, growth, series, size: skuSize(r.sku), category: productCategory(r.sku) ?? 'อื่นๆ', img: productImage(r.sku) }
    })
    if (sizeFilter !== 'all') base = base.filter((r) => r.size === sizeFilter)
    const total = base.reduce((s, r) => s + r.scans, 0) || 1
    base.forEach((r) => { r.share = (r.scans / total) * 100 })
    return base.sort((a, b) => b.scans - a.scans)
  }, [perDay.data, seriesBySku, sizeFilter])

  const sizeMix = useMemo(() => {
    const m: Record<SizeTier, number> = { sachet: 0, tube: 0 }
    for (const r of rows) m[r.size] += r.scans
    return m
  }, [rows])
  const mixTotal = sizeMix.sachet + sizeMix.tube
  const hasSeries = seriesBySku != null

  const columns: RankColumn<Row>[] = [
    { key: 'rank', label: '#', width: '30px', align: 'center', render: (_r, i) => <span className="text-[10px] font-bold text-[var(--text-muted)]">{i + 1}</span> },
    { key: 'img', label: '', width: '40px', render: (r) => r.img
        ? <img src={r.img} alt="" loading="lazy" className="w-8 h-8 rounded object-contain bg-white border border-[var(--border-soft)]" />
        : <span className="w-8 h-8 rounded bg-[var(--bg-soft)] border border-[var(--border-soft)] inline-flex items-center justify-center text-[9px] text-[var(--text-muted)]">—</span> },
    { key: 'sku', label: 'SKU', sortable: true, sortValue: (r) => r.sku, render: (r) => <span className="font-mono font-semibold text-[var(--dark)]">{r.sku}</span> },
    { key: 'name', label: 'สินค้า', render: (r) => <span className="text-[var(--text-secondary)] block max-w-[190px] truncate" title={r.name}>{r.name}</span> },
    { key: 'size', label: 'ไซส์', sortable: true, sortValue: (r) => r.size, render: (r) => <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold whitespace-nowrap" style={{ background: SIZE_COLOR[r.size] + '18', color: SIZE_COLOR[r.size] }}>{SIZE_LABEL[r.size]}</span> },
    { key: 'category', label: 'หมวด', sortable: true, sortValue: (r) => r.category, render: (r) => <span className="text-[10.5px] text-[var(--text-muted)] whitespace-nowrap">{r.category}</span> },
    { key: 'scans', label: 'สแกน', align: 'right', sortable: true, sortValue: (r) => r.scans, render: (r) => <span className="num font-bold text-[var(--dark)]">{numFmt(r.scans)}</span> },
    { key: 'share', label: 'Share', align: 'right', sortable: true, sortValue: (r) => r.share, render: (r) => <span className="num text-[var(--text-secondary)]">{r.share.toFixed(1)}%</span> },
    ...(hasSeries ? [
      { key: 'growth', label: 'โต%', align: 'right' as const, sortable: true, sortValue: (r: Row) => r.growth ?? -Infinity, render: (r: Row) => {
          if (r.growth == null) return <span className="text-[var(--text-muted)]">—</span>
          const up = r.growth >= 0
          return <span className="num font-bold inline-flex items-center gap-0.5" style={{ color: up ? '#16a34a' : '#dc2626' }}><i className={`ti ti-arrow-${up ? 'up' : 'down'}-right text-[11px]`} />{Math.abs(r.growth).toFixed(0)}%</span>
        } },
      { key: 'trend', label: 'เทรนด์', width: '84px' as const, render: (r: Row) => <Sparkline series={r.series} color={r.growth != null && r.growth < 0 ? '#dc2626' : '#16a34a'} /> },
    ] : []),
  ]

  const sizeOpts: { key: SizeTier | 'all'; label: string }[] = [
    { key: 'all', label: 'ทุกไซส์' }, { key: 'sachet', label: SIZE_LABEL.sachet }, { key: 'tube', label: SIZE_LABEL.tube },
  ]

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-table text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">📊 ตารางจัดอันดับสินค้า</h3>
        <div className="ml-auto inline-flex bg-[var(--bg-soft)] rounded-lg p-0.5 border border-[var(--border)]">
          {sizeOpts.map((o) => (
            <button key={o.key} onClick={() => setSizeFilter(o.key)}
              className={`px-2.5 py-1 text-[10.5px] font-semibold rounded-md transition-all ${sizeFilter === o.key ? 'bg-[var(--brand-500)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-white'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">
        คลิกหัวคอลัมน์เพื่อ sort · {numFmt(rows.length)} SKU
        {hasSeries ? ' · เทรนด์ = สแกนรายวัน · โต% = ครึ่งหลัง vs ครึ่งแรก' : ''}
      </div>

      {rows.length > 0 && (
        <>
          <ConcentrationStrip values={rows.map((r) => r.scans)} />
          {mixTotal > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10.5px] mb-1">
                <span className="font-semibold text-[var(--text-secondary)]">ซอง vs หลอด</span>
                <span className="text-[var(--text-muted)]">
                  <b style={{ color: SIZE_COLOR.sachet }}>ซอง {numFmt(sizeMix.sachet)} ({Math.round((sizeMix.sachet / mixTotal) * 100)}%)</b>
                  {' · '}
                  <b style={{ color: SIZE_COLOR.tube }}>หลอด {numFmt(sizeMix.tube)} ({Math.round((sizeMix.tube / mixTotal) * 100)}%)</b>
                </span>
              </div>
              <div className="flex w-full h-3 rounded-full overflow-hidden border border-[var(--border)]">
                <div style={{ width: `${(sizeMix.sachet / mixTotal) * 100}%`, background: SIZE_COLOR.sachet }} />
                <div style={{ width: `${(sizeMix.tube / mixTotal) * 100}%`, background: SIZE_COLOR.tube }} />
              </div>
            </div>
          )}
        </>
      )}
      {perDay.loading && !rows.length
        ? <div className="text-[12px] text-[var(--text-muted)] py-8 text-center">กำลังโหลด…</div>
        : <RankedTable columns={columns} rows={rows} rowKey={(r) => r.sku} initialSortKey="scans" topN={15} />}
    </div>
  )
}
