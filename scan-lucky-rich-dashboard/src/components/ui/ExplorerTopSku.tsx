'use client'
// 📦 Explorer — Top SKU ในตัวกรอง + Size mix (ซอง vs หลอด) + KPI
// client-side filter จาก /api/sku/per-day (normalizeSku merged แล้ว) ตามไซส์ + SKU ที่เลือก
import { useMemo } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { numFmt } from '@/lib/utils'
import { skuSize, SIZE_LABEL, SIZE_COLOR, type SizeTier } from '@/lib/sku-utils'
import type { SkuRow } from '@/lib/api/types'

interface Props { rows: SkuRow[]; loading: boolean; selectedSkus: string[]; sizeFilter: SizeTier | 'all' }

export default function ExplorerTopSku({ rows: allRows, loading, selectedSkus, sizeFilter }: Props) {

  // เลือก SKU ก่อน (ถ้าระบุ) → แล้วค่อยกรองไซส์สำหรับตาราง Top
  const skuScoped = useMemo(
    () => (selectedSkus.length ? allRows.filter((r) => selectedSkus.includes(r.sku)) : allRows),
    [allRows, selectedSkus],
  )
  const rows = useMemo(
    () => (sizeFilter === 'all' ? skuScoped : skuScoped.filter((r) => skuSize(r.sku) === sizeFilter)),
    [skuScoped, sizeFilter],
  )

  const totalScans = rows.reduce((s, r) => s + r.scans, 0)
  const top = [...rows].sort((a, b) => b.scans - a.scans).slice(0, 10)

  // size mix — จากชุดที่เลือก SKU (ไม่กรองไซส์) เพื่อให้เห็นสัดส่วน ซอง/หลอด
  const mix = useMemo(() => {
    const m: Record<SizeTier, number> = { sachet: 0, tube: 0 }
    for (const r of skuScoped) m[skuSize(r.sku)] += r.scans
    return m
  }, [skuScoped])
  const mixTotal = mix.sachet + mix.tube

  const hasData = allRows.length > 0

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-package text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">📦 Top SKU ในตัวกรอง</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">
        {selectedSkus.length ? `เจาะ ${selectedSkus.length} SKU` : 'ทุก SKU'} · ไซส์: {sizeFilter === 'all' ? 'ทุกไซส์' : SIZE_LABEL[sizeFilter]} · {numFmt(rows.length)} รายการ
      </div>

      {!hasData ? (
        <div className="text-[12px] text-[var(--text-muted)] py-8 text-center">{loading ? 'กำลังโหลด…' : 'ไม่มีข้อมูลในช่วงนี้'}</div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg px-2.5 py-2 bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="text-[9.5px] text-[var(--text-muted)] font-semibold">สแกนรวม</div>
              <div className="text-[18px] font-extrabold num text-[var(--dark)]">{numFmt(totalScans)}</div>
            </div>
            <div className="rounded-lg px-2.5 py-2 bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="text-[9.5px] text-[var(--text-muted)] font-semibold">จำนวน SKU</div>
              <div className="text-[18px] font-extrabold num text-[var(--dark)]">{numFmt(rows.length)}</div>
            </div>
            <div className="rounded-lg px-2.5 py-2 bg-[var(--bg-soft)] border border-[var(--border)]">
              <div className="text-[9.5px] text-[var(--text-muted)] font-semibold">อันดับ 1</div>
              <div className="text-[13px] font-bold text-[var(--dark)] truncate font-mono" title={top[0]?.displayName}>{top[0]?.sku ?? '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_180px] gap-4 items-center">
            {/* Top SKU bar */}
            <div style={{ height: Math.max(160, top.length * 26) }}>
              <Bar
                data={{
                  labels: top.map((r) => r.sku),
                  datasets: [{ label: 'สแกน', data: top.map((r) => r.scans), backgroundColor: top.map((r) => SIZE_COLOR[skuSize(r.sku)]), borderRadius: 4, barPercentage: 0.8 }],
                }}
                options={{
                  indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => {
                    const r = top[c.dataIndex]; return `${numFmt(Number(c.parsed.x))} สแกน · ${SIZE_LABEL[skuSize(r.sku)]} · ${r.displayName}`
                  } } } },
                  scales: { x: { grid: { color: '#f1f5f9' }, ticks: { callback: (v) => numFmt(Number(v)), font: { size: 9 } } }, y: { grid: { display: false }, ticks: { font: { size: 10 } } } },
                }}
              />
            </div>
            {/* Size mix donut */}
            <div>
              <div className="text-[10.5px] font-semibold text-[var(--text-secondary)] mb-1 text-center">ซอง vs หลอด</div>
              <div className="relative" style={{ height: 150 }}>
                <Doughnut
                  data={{ labels: [SIZE_LABEL.sachet, SIZE_LABEL.tube], datasets: [{ data: [mix.sachet, mix.tube], backgroundColor: [SIZE_COLOR.sachet, SIZE_COLOR.tube], borderWidth: 0 }] }}
                  options={{ responsive: true, maintainAspectRatio: false, cutout: '64%',
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.label}: ${numFmt(Number(c.parsed))} (${mixTotal ? ((Number(c.parsed) / mixTotal) * 100).toFixed(0) : 0}%)` } } } }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-[10px] text-[var(--text-muted)]">ซอง</div>
                  <div className="text-[15px] font-extrabold num" style={{ color: SIZE_COLOR.sachet }}>{mixTotal ? Math.round((mix.sachet / mixTotal) * 100) : 0}%</div>
                </div>
              </div>
              <div className="flex justify-center gap-3 mt-1 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SIZE_COLOR.sachet }} />ซอง {numFmt(mix.sachet)}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SIZE_COLOR.tube }} />หลอด {numFmt(mix.tube)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
