'use client'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

const BUCKET_COLORS = ['#94a3b8', '#6366f1', '#4338ca', '#10b981']

interface Props {
  day: DailyEntry
  rangeLabel?: string
}

export default function EngagementDistribution({ day, rangeLabel }: Props) {
  const total = day.engagementBuckets.reduce((s, b) => s + b.users, 0)
  const oneShot = day.engagementBuckets[0]?.users || 0
  const heavyUsers = (day.engagementBuckets[2]?.users || 0) + (day.engagementBuckets[3]?.users || 0)
  const hasData = day.engagementBuckets.length > 0 && total > 0

  if (!hasData) {
    return (
      <ChartCard title="พฤติกรรมการสแกน — กี่ครั้งต่อคน" icon="ti-chart-histogram">
        <div className="text-[10.5px] text-[var(--text-muted)] mb-2">
          {rangeLabel ? `📅 ${rangeLabel}` : `📅 ${day.date.split('-')[2]} พ.ค.`}
        </div>
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
          <i className="ti ti-chart-bar-off text-2xl mr-2" />
          ยังไม่มีข้อมูล engagement สำหรับวันนี้ (รอ DB)
        </div>
      </ChartCard>
    )
  }

  return (
    <ChartCard title="พฤติกรรมการสแกน — กี่ครั้งต่อคน" icon="ti-chart-histogram">
      <div className="text-[10.5px] text-[var(--text-muted)] mb-2">
        {rangeLabel ? `📅 ${rangeLabel}` : `📅 ${day.date.split('-')[2]} พ.ค. (${day.weekday})`}
        {day.outage && <span className="ml-2 text-[var(--red)]"><i className="ti ti-alert-octagon" /> Outage</span>}
      </div>

      {/* Engagement KPIs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)]">
          <div className="text-[9.5px] text-[var(--text-secondary)] uppercase font-bold">Average</div>
          <div className="text-[18px] num text-[var(--brand-700)]">{day.avgScansPerUser.toFixed(2)}</div>
          <div className="text-[9px] text-[var(--text-muted)]">scan/คน</div>
        </div>
        <div className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)]">
          <div className="text-[9.5px] text-[var(--text-secondary)] uppercase font-bold">Median</div>
          <div className="text-[18px] num text-[var(--dark)]">{day.medianScansPerUser}</div>
          <div className="text-[9px] text-[var(--text-muted)]">scan/คน</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2 border border-red-100">
          <div className="text-[9.5px] text-[var(--red)] uppercase font-bold">Max</div>
          <div className="text-[18px] num text-[var(--red)]">{day.maxScansPerUser}</div>
          <div className="text-[9px] text-[var(--text-muted)]">scan/คน</div>
        </div>
      </div>

      {/* Distribution chart */}
      <div style={{ height: 200 }}>
        <Bar
          data={{
            labels: day.engagementBuckets.map(b => b.label),
            datasets: [{
              label: 'Users',
              data: day.engagementBuckets.map(b => b.users),
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
                  afterLabel: (ctx: any) => `${day.engagementBuckets[ctx.dataIndex].pct.toFixed(1)}%`,
                },
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                offset: 2,
                color: '#1e1b4b',
                font: { size: 11, weight: 'bold' },
                formatter: (v: number, ctx: any) => `${numFmt(v)}\n(${day.engagementBuckets[ctx.dataIndex].pct.toFixed(0)}%)`,
              },
            } as any,
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, suggestedMax: Math.max(...day.engagementBuckets.map(b => b.users)) * 1.18 },
            },
          }}
        />
      </div>

      <InsightInline
        html={`<b>${((oneShot / total) * 100).toFixed(1)}%</b> สแกนแค่ครั้งเดียว → <b>${numFmt(oneShot)} คน</b> มีโอกาส upsell • Heavy users (6+ ครั้ง) = <b>${numFmt(heavyUsers)} คน</b>`}
      />
    </ChartCard>
  )
}
