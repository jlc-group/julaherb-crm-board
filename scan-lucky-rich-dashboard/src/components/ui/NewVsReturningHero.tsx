'use client'
// 🎯 HERO: ลูกค้าใหม่ vs เก่า (distinct) — เด่นบนสุดหน้า Customers
// distinct = /api/scans/totals · ใหม่ = Σ memberNew (/api/members/daily) · เก่า = distinct − ใหม่
import { Doughnut, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'
import type { ScansTotalsResponse, MembersDailyResponse } from '@/lib/api/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const NEW = '#16a34a', OLD = '#3b82f6'

export default function NewVsReturningHero({ from, to }: { from: string; to: string }) {
  const totals = useApi<ScansTotalsResponse>(`/api/scans/totals?from=${from}&to=${to}`)
  const members = useApi<MembersDailyResponse>(`/api/members/daily?from=${from}&to=${to}`)

  const distinct = totals.data?.distinctUsers ?? totals.data?.uniqueUsers ?? 0
  const rows = members.data?.rows ?? []
  const newCount = members.data?.totals?.memberNew ?? rows.reduce((s, r) => s + r.memberNew, 0)
  const returning = Math.max(0, distinct - newCount)
  const total = distinct || (newCount + returning)
  const newPct = total > 0 ? (newCount / total) * 100 : 0
  const oldPct = total > 0 ? (returning / total) * 100 : 0
  const hasData = total > 0

  const dd = (iso: string) => iso.split('-')[2]

  return (
    <div className="card p-4 float-up" style={{ borderLeft: '4px solid var(--brand-500)' }}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className="text-[18px]">🎯</span>
        <h3 className="text-[15px] font-extrabold text-[var(--dark)]">ลูกค้าใหม่ vs เก่า — เข้ามาแล้วกี่คน</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">นับ “คนไม่ซ้ำ” (distinct) ตลอดช่วงที่เลือก · เก่า = ทั้งหมด − ใหม่</div>

      {!hasData ? (
        <div className="text-[12px] text-[var(--text-muted)] py-6 text-center">กำลังโหลดข้อมูลลูกค้า…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-center">
          {/* ซ้าย: donut + KPI */}
          <div>
            <div className="relative" style={{ height: 170 }}>
              <Doughnut
                data={{ labels: ['ลูกค้าใหม่', 'ลูกค้าเก่า'], datasets: [{ data: [newCount, returning], backgroundColor: [NEW, OLD], borderWidth: 0 }] }}
                options={{ responsive: true, maintainAspectRatio: false, cutout: '68%',
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.label}: ${numFmt(Number(c.parsed))} (${(Number(c.parsed) / total * 100).toFixed(1)}%)` } } } }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[22px] font-extrabold text-[var(--dark)] leading-none">{numFmt(total)}</div>
                <div className="text-[10px] text-[var(--text-muted)]">ลูกค้าทั้งหมด</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-lg px-2.5 py-2" style={{ background: '#f0faf3', border: '1px solid #16a34a22' }}>
                <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: NEW }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: NEW }} /> ใหม่</div>
                <div className="text-[18px] font-extrabold num" style={{ color: NEW }}>{numFmt(newCount)}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{newPct.toFixed(1)}%</div>
              </div>
              <div className="rounded-lg px-2.5 py-2" style={{ background: '#eff6ff', border: '1px solid #3b82f622' }}>
                <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: OLD }}><span className="w-2.5 h-2.5 rounded-full" style={{ background: OLD }} /> เก่า</div>
                <div className="text-[18px] font-extrabold num" style={{ color: OLD }}>{numFmt(returning)}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{oldPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* ขวา: เทรนด์รายวัน (ใหม่/เก่า ต่อวัน) */}
          <div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1">เข้ามาต่อวัน — ใหม่ (สมัคร) vs เก่า (กลับมา)</div>
            <div style={{ height: 150 }}>
              <Bar
                data={{
                  labels: rows.map((r) => dd(r.date)),
                  datasets: [
                    { label: 'ใหม่', data: rows.map((r) => r.memberNew), backgroundColor: NEW, stack: 's', borderRadius: 2 },
                    { label: 'เก่า', data: rows.map((r) => r.memberOld), backgroundColor: OLD, stack: 's', borderRadius: 2 },
                  ],
                }}
                options={{ responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } }, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${numFmt(Number(c.parsed.y))}` } } },
                  scales: { x: { stacked: true, grid: { display: false }, ticks: { font: { size: 8 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 16 } }, y: { stacked: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => numFmt(Number(v)), font: { size: 9 } } } } }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
