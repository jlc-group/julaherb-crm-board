'use client'
// 📈 Explorer — เทรนด์รายวันของ SKU ที่เลือก (จาก /api/sku/[sku]/timeseries)
import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'
import type { SkuTimeseriesResponse } from '@/lib/api/types'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899', '#06b6d4']

interface Props { from: string; to: string; skus: string[]; isDefault: boolean }

export default function ExplorerSkuTrend({ from, to, skus, isDefault }: Props) {
  const [tsBySku, setTsBySku] = useState<Record<string, SkuTimeseriesResponse>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!from || !to || skus.length === 0) { setTsBySku({}); return }
    let cancelled = false
    setLoading(true)
    Promise.all(
      skus.map(async (sku) => {
        const r = await fetch(`/api/sku/${encodeURIComponent(sku)}/timeseries?from=${from}&to=${to}`)
        if (!r.ok) throw new Error(`${sku}: ${r.status}`)
        return { sku, data: (await r.json()) as SkuTimeseriesResponse }
      }),
    ).then((res) => {
      if (cancelled) return
      const m: Record<string, SkuTimeseriesResponse> = {}
      for (const { sku, data } of res) m[sku] = data
      setTsBySku(m)
    }).catch(() => { if (!cancelled) setTsBySku({}) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [from, to, skus.join('|')])

  const days = useMemo(() => {
    for (const sku of skus) { const pts = tsBySku[sku]?.points; if (pts?.length) return pts.map((p) => p.date) }
    return [] as string[]
  }, [tsBySku, skus])

  const { labels, datasets } = useMemo(() => {
    if (!days.length) return { labels: [] as string[], datasets: [] as any[] }
    const labels = days.map((d) => `${d.split('-')[2]}/${d.split('-')[1]}`)
    const datasets = skus.map((sku, idx) => {
      const color = COLORS[idx % COLORS.length]
      const ts = tsBySku[sku]
      return {
        label: sku,
        data: days.map((d) => ts?.points.find((p) => p.date === d)?.scans ?? 0),
        borderColor: color, backgroundColor: color + '15', tension: 0.3,
        pointRadius: 2.5, pointHoverRadius: 5, borderWidth: 2.5, fill: false,
      }
    })
    return { labels, datasets }
  }, [days, skus, tsBySku])

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-chart-line text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">📈 เทรนด์รายวัน — SKU ที่เลือก</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">
        {isDefault ? 'ค่าเริ่มต้น: top SKU — เลือก SKU ในตัวกรองด้านบนเพื่อเจาะ' : `${skus.length} SKU`} · {loading ? 'กำลังโหลด…' : `${days.length} วัน`}
      </div>
      <div style={{ height: 280 }}>
        {datasets.length === 0 || days.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[12px] text-[var(--text-muted)]">{loading ? 'กำลังโหลด…' : 'ไม่มีข้อมูล'}</div>
        ) : (
          <Line
            key={`${skus.length}-${days.length}`}
            data={{ labels, datasets }}
            options={{
              responsive: true, maintainAspectRatio: false, interaction: { mode: 'index' as const, intersect: false },
              plugins: { legend: { display: true, position: 'bottom' as const, labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
                tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8, callbacks: { label: (c: any) => `  ${c.dataset.label}: ${numFmt(c.parsed.y ?? 0)}` } } },
              scales: { x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 9 } } } },
            }}
          />
        )}
      </div>
    </div>
  )
}
