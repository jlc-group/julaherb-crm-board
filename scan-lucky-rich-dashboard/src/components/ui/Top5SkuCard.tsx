'use client'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import type { DailyEntry } from '@/lib/daily-update-data'
import type { SkuRow } from '@/lib/sku-redemption'
import { numFmt } from '@/lib/utils'

interface Props {
  day: DailyEntry
  /** Optional aggregated rows from range — when provided, takes precedence over day.topSku */
  rows?: SkuRow[]
  rangeLabel?: string
}

export default function Top5SkuCard({ day, rows, rangeLabel }: Props) {
  // Derive top 5 from rows if provided, else fall back to day.topSku
  let items: { sku: string; name: string; tickets: number; pct: number }[]
  let header: string
  let subhead: string

  if (rows && rows.length > 0) {
    const sorted = [...rows].filter(r => r.rightsRedeemed > 0).sort((a, b) => b.rightsRedeemed - a.rightsRedeemed)
    const total = rows.reduce((s, r) => s + r.rightsRedeemed, 0) || 1
    items = sorted.slice(0, 5).map(r => ({
      sku: r.sku,
      name: r.displayName.replace(/\s*\([^)]+\)$/, ''),
      tickets: r.rightsRedeemed,
      pct: (r.rightsRedeemed / total) * 100,
    }))
    header = `🏆 Top 5 SKU`
    subhead = `${rangeLabel || 'ในช่วง'} • ${items[0] ? `${items[0].sku} ครอง ${items[0].pct.toFixed(1)}%` : ''}`
  } else {
    items = day.topSku.map(s => ({ sku: s.sku, name: s.name, tickets: s.tickets, pct: s.pct }))
    header = `🏆 Top SKU ของวัน ${day.date.split('-')[2]} พ.ค.`
    subhead = `${items[0]?.sku || ''} ครอง ${items[0]?.pct.toFixed(1) || 0}% ของวัน`
  }

  return (
    <div className="card p-4">
      <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">{header}</h3>
      <p className="text-[11.5px] text-[var(--text-muted)] mb-3">{subhead}</p>
      <div style={{ height: 280 }}>
        <Bar
          data={{
            labels: items.map(s => `${s.sku} ${s.name.slice(0, 14)}`),
            datasets: [{
              label: 'Tickets',
              data: items.map(s => s.tickets),
              backgroundColor: ['#6366f1','#818cf8','#a5b4fc','#c7d2fe','#e0e7ff'],
              borderRadius: 4,
            }],
          }}
          plugins={[ChartDataLabels as any]}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { afterLabel: (ctx: any) => `${items[ctx.dataIndex].pct.toFixed(1)}% share` } },
              datalabels: {
                anchor: 'end',
                align: 'end',
                offset: 4,
                color: '#1e1b4b',
                font: { size: 11, weight: 'bold' },
                formatter: (v: number, ctx: any) => `${numFmt(v)}  (${items[ctx.dataIndex].pct.toFixed(1)}%)`,
              },
            } as any,
            scales: {
              x: { beginAtZero: true, grid: { color: '#f1f5f9' }, suggestedMax: Math.max(...items.map(i => i.tickets)) * 1.3 },
              y: { grid: { display: false } },
            },
          }}
        />
      </div>
    </div>
  )
}
