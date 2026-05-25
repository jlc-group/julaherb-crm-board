'use client'
import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { PRODUCTS_MASTER } from '@/config/products-real'
import { PER_SKU_DAILY, type DayKey } from '@/lib/per-sku-daily'
import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

// Top SKUs from 5-day data (default selection)
const DEFAULT_SKUS = ['L3-8G', 'L4-8G', 'L6-8G', 'L10-7G', 'L7-6G']

// Color palette for line series
const LINE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#06b6d4']

type Metric = 'scans' | 'tickets' | 'users'

interface Props {
  days: DailyEntry[]      // selected days from top date range
  rangeLabel?: string
}

export default function SkuTrendLineChart({ days, rangeLabel }: Props) {
  const [selectedSkus, setSelectedSkus] = useState<string[]>(DEFAULT_SKUS)
  const [metric, setMetric] = useState<Metric>('tickets')
  const [search, setSearch] = useState('')
  const [showPicker, setShowPicker] = useState(false)

  // Build SKU lookup with name + perScan
  const skuLookup = useMemo(() => {
    const map = new Map<string, { name: string; perScan: number; totalScans: number }>()
    for (const p of PRODUCTS_MASTER) {
      const totalScans = Object.values(PER_SKU_DAILY[p.sku] || {})
        .reduce((s, v: any) => s + (v?.r ?? 0), 0)
      map.set(p.sku, {
        name: p.displayName.replace(/\s*\([^)]+\)$/, ''),
        perScan: p.rightsPerScan,
        totalScans,
      })
    }
    return map
  }, [])

  // Sort SKUs by total scans (top performers first)
  const sortedSkus = useMemo(() => {
    return PRODUCTS_MASTER
      .map(p => ({
        sku: p.sku,
        name: p.displayName.replace(/\s*\([^)]+\)$/, ''),
        perScan: p.rightsPerScan,
        totalScans: skuLookup.get(p.sku)?.totalScans ?? 0,
      }))
      .sort((a, b) => b.totalScans - a.totalScans)
  }, [skuLookup])

  const filteredForPicker = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedSkus
    return sortedSkus.filter(s =>
      s.sku.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    )
  }, [sortedSkus, search])

  function toggleSku(sku: string) {
    setSelectedSkus(prev =>
      prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku].slice(0, 8)
    )
  }

  // Build chart data
  const { labels, datasets, totals } = useMemo(() => {
    if (days.length === 0 || selectedSkus.length === 0) {
      return { labels: [], datasets: [], totals: {} as Record<string, number> }
    }

    const labels = days.map(d => `${d.date.split('-')[2]}/${d.date.split('-')[1]}`)
    const datasets = selectedSkus.map((sku, idx) => {
      const color = LINE_COLORS[idx % LINE_COLORS.length]
      const info = skuLookup.get(sku)
      const data = days.map(d => {
        const dk = d.date.split('-')[2] as DayKey
        const scans = PER_SKU_DAILY[sku]?.[dk]?.r ?? 0
        const users = PER_SKU_DAILY[sku]?.[dk]?.u ?? 0
        switch (metric) {
          case 'scans':   return scans
          case 'tickets': return scans * (info?.perScan ?? 1)
          case 'users':   return users
        }
      })
      return {
        label: `${sku} ${info?.name?.slice(0, 14) || ''}${info && info.perScan > 1 ? ` (×${info.perScan})` : ''}`,
        data,
        borderColor: color,
        backgroundColor: color + '15',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#fff',
        pointBorderColor: color,
        pointBorderWidth: 2,
        borderWidth: 2.5,
        fill: false,
      }
    })

    const totals: Record<string, number> = {}
    selectedSkus.forEach((sku, i) => {
      totals[sku] = (datasets[i].data as number[]).reduce((s, v) => s + v, 0)
    })

    return { labels, datasets, totals }
  }, [days, selectedSkus, metric, skuLookup])

  const metricLabel: Record<Metric, string> = {
    scans:   '📱 จำนวนสแกน',
    tickets: '🎟️ สิทธิ์ตามสเปก',
    users:   '👥 Users (per day)',
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-[14px] font-bold text-[var(--dark)] mb-0.5">📈 SKU Trend — เลือก SKU เพื่อดูแนวโน้ม</h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            {rangeLabel ? `${rangeLabel} • ` : ''}{days.length} จุดข้อมูล • เลือกได้สูงสุด 8 SKU
          </p>
        </div>

        {/* Metric toggle */}
        <div className="inline-flex bg-[var(--bg-soft)] rounded-lg p-1 border border-[var(--border)]">
          {(['scans', 'tickets', 'users'] as Metric[]).map(m => (
            <button key={m}
                    onClick={() => setMetric(m)}
                    className={`px-3 py-1.5 text-[11.5px] font-semibold rounded-md transition-all ${
                      metric === m
                        ? 'bg-[var(--brand-500)] text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-white'
                    }`}>
              {metricLabel[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Selected SKU chips */}
      <div className="flex flex-wrap gap-1.5 mb-2 items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">เลือก:</span>
        {selectedSkus.map((sku, idx) => {
          const color = LINE_COLORS[idx % LINE_COLORS.length]
          const info = skuLookup.get(sku)
          return (
            <button key={sku}
                    onClick={() => toggleSku(sku)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                    style={{ background: color + '15', color, border: `1px solid ${color}40` }}
                    title={`คลิกเพื่อลบ • ${info?.name || sku}`}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="font-mono">{sku}</span>
              <span className="text-[9px] opacity-60">×</span>
            </button>
          )
        })}
        <button onClick={() => setShowPicker(!showPicker)}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--brand-500)] hover:text-[var(--brand-700)]">
          <i className="ti ti-plus text-[10px] mr-0.5" /> เพิ่ม SKU
        </button>
      </div>

      {/* SKU picker dropdown */}
      {showPicker && (
        <div className="mb-3 p-3 bg-[var(--bg-soft)] rounded-lg border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <i className="ti ti-search text-[var(--text-muted)]" />
            <input type="text"
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                   placeholder="ค้นหา SKU / ชื่อสินค้า..."
                   className="flex-1 px-2 py-1 text-[11.5px] border border-[var(--border)] rounded bg-white focus:outline-none focus:border-[var(--brand-500)]" />
            <button onClick={() => { setSelectedSkus([]); setShowPicker(false) }}
                    className="text-[10px] text-[var(--danger)] font-semibold px-2 py-1 hover:bg-red-50 rounded">
              ล้างทั้งหมด
            </button>
            <button onClick={() => setShowPicker(false)}
                    className="text-[10px] text-[var(--text-muted)] font-semibold px-2 py-1 hover:bg-white rounded">
              ✕ ปิด
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
            {filteredForPicker.slice(0, 60).map(s => {
              const active = selectedSkus.includes(s.sku)
              return (
                <button key={s.sku}
                        onClick={() => toggleSku(s.sku)}
                        className={`text-left text-[10.5px] px-2 py-1.5 rounded border transition-all ${
                          active
                            ? 'bg-[var(--brand-50)] border-[var(--brand-500)] text-[var(--brand-700)] font-semibold'
                            : 'bg-white border-[var(--border)] text-[var(--text)] hover:border-[var(--brand-200)]'
                        }`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono">{s.sku}</span>
                    {active && <i className="ti ti-check text-[var(--brand-700)]" />}
                    {!active && s.perScan > 1 && <span className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded">×{s.perScan}</span>}
                  </div>
                  <div className="truncate text-[9px] text-[var(--text-muted)] mt-0.5">{s.name}</div>
                  <div className="text-[9px] text-[var(--text-muted)] mt-0.5">รวม {numFmt(s.totalScans)} scans</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: 320 }}>
        {datasets.length === 0 || days.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-[var(--text-muted)]">
            {days.length === 0
              ? 'ไม่มีข้อมูลในช่วงเวลาที่เลือก'
              : 'ยังไม่ได้เลือก SKU — คลิก "เพิ่ม SKU" ด้านบน'}
          </div>
        ) : (
          <Line
            key={`${metric}-${selectedSkus.length}-${days.length}`}
            data={{ labels, datasets }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index' as const, intersect: false },
              plugins: {
                legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
                tooltip: {
                  backgroundColor: '#1e293b',
                  padding: 10,
                  cornerRadius: 8,
                  callbacks: { label: (ctx: any) => `  ${ctx.dataset.label}: ${numFmt(ctx.parsed.y ?? 0)}` },
                },
              },
              scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } },
                y: {
                  beginAtZero: true,
                  grid: { color: '#f1f5f9' },
                  ticks: { color: '#94a3b8', font: { size: 9 } },
                },
              },
            }}
          />
        )}
      </div>

      {/* Totals per SKU in range */}
      {selectedSkus.length > 0 && days.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
            รวม {metricLabel[metric]} ({days.length} วัน)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {selectedSkus.map((sku, idx) => {
              const color = LINE_COLORS[idx % LINE_COLORS.length]
              return (
                <div key={sku} className="rounded-lg p-2 border" style={{ background: color + '08', borderColor: color + '20' }}>
                  <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color }}>
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="font-mono">{sku}</span>
                  </div>
                  <div className="text-[16px] font-bold num text-[var(--dark)] mt-0.5">
                    {numFmt(totals[sku] || 0)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
