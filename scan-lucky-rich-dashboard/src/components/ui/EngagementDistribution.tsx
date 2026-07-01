'use client'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { numFmt } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { EngagementResponse } from '@/lib/api/types'

const BUCKET_COLORS = ['#94a3b8', '#6366f1', '#4338ca', '#10b981']

interface Props {
  /** Date range from parent tab */
  from: string
  to: string
  rangeLabel?: string
}

export default function EngagementDistribution({ from, to, rangeLabel }: Props) {
  const { data, loading, error } = useApi<EngagementResponse>(
    `/api/customers/engagement?from=${from}&to=${to}`
  )

  if (loading) {
    return (
      <ChartCard title="พฤติกรรมการสแกน — กี่ครั้งต่อคน" icon="ti-chart-histogram">
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">⏳ กำลังโหลด...</div>
      </ChartCard>
    )
  }

  if (error || !data) {
    return (
      <ChartCard title="พฤติกรรมการสแกน — กี่ครั้งต่อคน" icon="ti-chart-histogram">
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
          <i className="ti ti-chart-bar-off text-2xl mr-2" />
          ⚠️ {error ?? 'ไม่มีข้อมูล'}
        </div>
      </ChartCard>
    )
  }

  const buckets = data.buckets || []
  const total = data.totalUsers
  const oneShot = buckets[0]?.users || 0
  const heavyUsers = (buckets[2]?.users || 0) + (buckets[3]?.users || 0)

  if (total === 0) {
    return (
      <ChartCard title="พฤติกรรมการสแกน — กี่ครั้งต่อคน" icon="ti-chart-histogram">
        <div className="text-[10.5px] text-[var(--text-muted)] mb-2">{rangeLabel ?? `📅 ${from} – ${to}`}</div>
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
          <i className="ti ti-chart-bar-off text-2xl mr-2" />
          ยังไม่มีข้อมูล engagement สำหรับช่วงนี้
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="พฤติกรรมการสแกน — กี่ครั้งต่อคน" icon="ti-chart-histogram">
      <div className="text-[10.5px] text-[var(--text-muted)] mb-2 flex items-center gap-2">
        <span>{rangeLabel ? `📅 ${rangeLabel}` : `📅 ${from} – ${to}`}</span>
        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800">🟢 API</span>
        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800" title="ยังเป็นข้อมูลทั้งระบบ saversure ไม่ใช่เฉพาะแคมเปญ">🌐 ทั้งระบบ</span>
      </div>
      <div className="text-[10px] text-amber-700 mb-2">⚠️ ใช้ดูแนวโน้ม engagement ชั่วคราว — backend ยังไม่ได้จำกัด scope เฉพาะแคมเปญ</div>

      {/* Engagement KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)]">
          <div className="text-[9.5px] text-[var(--text-secondary)] uppercase font-bold">Average</div>
          <div className="text-[18px] num text-[var(--brand-700)]">{data.avgScansPerUser.toFixed(2)}</div>
          <div className="text-[9px] text-[var(--text-muted)]">scan/คน</div>
        </div>
        <div className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)]">
          <div className="text-[9.5px] text-[var(--text-secondary)] uppercase font-bold">Median</div>
          <div className="text-[18px] num text-[var(--dark)]">{data.medianScansPerUser}</div>
          <div className="text-[9px] text-[var(--text-muted)]">scan/คน</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 border border-red-100">
          <div className="text-[9.5px] text-[var(--red)] uppercase font-bold">Max</div>
          <div className="text-[18px] num text-[var(--red)]">{data.maxScansPerUser}</div>
          <div className="text-[9px] text-[var(--text-muted)]">scan/คน</div>
        </div>
      </div>

      {/* Distribution chart */}
      <div style={{ height: 200 }}>
        <Bar
          data={{
            labels: buckets.map(b => b.label),
            datasets: [{
              label: 'Users',
              data: buckets.map(b => b.users),
              backgroundColor: BUCKET_COLORS,
              borderRadius: 4,
            }],
          }}
          plugins={[ChartDataLabels as any]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  afterLabel: (ctx: any) => `${buckets[ctx.dataIndex].pct.toFixed(1)}%`,
                },
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                offset: 2,
                color: '#1e1b4b',
                font: { size: 11, weight: 'bold' },
                formatter: (v: number, ctx: any) => `${numFmt(v)}\n(${buckets[ctx.dataIndex].pct.toFixed(0)}%)`,
              },
            } as any,
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, suggestedMax: Math.max(...buckets.map(b => b.users), 1) * 1.18 },
            },
          }}
        />
      </div>

      <InsightInline
        html={`<b>${total > 0 ? ((oneShot / total) * 100).toFixed(1) : 0}%</b> สแกนแค่ครั้งเดียว → <b>${numFmt(oneShot)} คน</b> มีโอกาส upsell • Heavy users (6+ ครั้ง) = <b>${numFmt(heavyUsers)} คน</b>`}
      />
    </ChartCard>
  )
}
