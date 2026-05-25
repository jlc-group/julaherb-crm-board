'use client'
import { Doughnut } from 'react-chartjs-2'
import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

const RFM_SEGMENTS = [
  { key: 'champion', label: 'Champion', count: 1388, pct: 16.6, color: '#10b981', note: 'สแกนล่าสุด + ถี่' },
  { key: 'loyal',    label: 'Loyal',    count: 1322, pct: 15.8, color: '#6366f1', note: 'ปานกลาง' },
  { key: 'atrisk',   label: 'At Risk',  count: 1959, pct: 23.4, color: '#d97706', note: 'ถี่แต่หายไป' },
  { key: 'lost',     label: 'Lost',     count: 1383, pct: 16.6, color: '#dc2626', note: 'หายไปนาน' },
  { key: 'other',    label: 'Other',    count: 2303, pct: 27.6, color: '#94a3b8', note: 'ใหม่ / ไม่แอคทีฟ' },
]

interface Props { day: DailyEntry }

export default function SegmentMixCard({ day }: Props) {
  const newSignup = day.memberNew ?? day.newSignup
  const newScanned = day.newScanned
  const newNotScanned = day.signedNotScanned
  const activationRate = (newScanned / newSignup) * 100

  const firstTime = Math.round(day.uniqueUsers * day.firstTimePct / 100)
  const returning = day.uniqueUsers - firstTime

  const baseOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 8, font: { size: 9 }, padding: 6 } } },
  }

  return (
    <div className="card p-4">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-[14px] font-bold text-[var(--dark)]">👥 Mix + Segmentation</h3>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{day.date.split('-')[2]} พ.ค.</span>
      </div>

      {/* 3 donuts side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* DONUT 1: First-time vs Returning */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 text-center">
            🔁 First-time vs Returning
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mb-2 text-center">
            กลับมาซ้ำ <b className="text-[var(--brand-700)]">{day.returningPct.toFixed(1)}%</b>
          </div>
          <div style={{ width: 130, height: 130 }}>
            <Doughnut
              data={{
                labels: [`ใหม่ ${day.firstTimePct.toFixed(0)}%`, `เก่า ${day.returningPct.toFixed(0)}%`],
                datasets: [{ data: [firstTime, returning], backgroundColor: ['#a5b4fc', '#10b981'], borderWidth: 0 }],
              }}
              options={baseOpts as any}
            />
          </div>
        </div>

        {/* DONUT 2: RFM Segmentation (aggregate, all-time) */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 text-center">
            🎯 RFM Segmentation
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mb-2 text-center">
            VIP <b className="text-[var(--brand-700)]">32%</b> (Champion+Loyal)
          </div>
          <div style={{ width: 130, height: 130 }}>
            <Doughnut
              data={{
                labels: RFM_SEGMENTS.map(s => `${s.label} ${s.pct.toFixed(0)}%`),
                datasets: [{
                  data: RFM_SEGMENTS.map(s => s.count),
                  backgroundColor: RFM_SEGMENTS.map(s => s.color),
                  borderWidth: 0,
                }],
              }}
              options={{ ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: false } } } as any}
            />
          </div>
        </div>

        {/* DONUT 3: New signup activation */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 text-center">
            🆕 Signup Activation
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mb-2 text-center">
            สแกนเลย <b className="text-[var(--brand-700)]">{activationRate.toFixed(1)}%</b>
          </div>
          <div style={{ width: 130, height: 130 }}>
            <Doughnut
              data={{
                labels: ['สแกนเลย', 'ยังไม่สแกน'],
                datasets: [{ data: [newScanned, newNotScanned], backgroundColor: ['#6366f1', '#e2e8f0'], borderWidth: 0 }],
              }}
              options={baseOpts as any}
            />
          </div>
        </div>
      </div>

      {/* RFM 4 mini-blocks */}
      <div className="mt-4 pt-3 border-t border-[var(--border-soft)]">
        <div className="text-[10.5px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>RFM Detail</span>
          <span className="text-[9px] normal-case text-[var(--text-muted)] font-normal italic" title="ตัวเลข RFM Segmentation เป็น customer base ทั้งระบบ ไม่เปลี่ยนตาม date range">
            • ลูกค้าสะสมทั้งระบบ (ไม่เปลี่ยนตามวันที่)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {RFM_SEGMENTS.slice(0, 4).map(s => (
            <div key={s.key}
                 className="rounded-lg p-2.5 border"
                 style={{ background: s.color + '10', borderColor: s.color + '30' }}
                 title={`${s.label} — ${s.note}\n${numFmt(s.count)} คน (${s.pct.toFixed(1)}% ของลูกค้าสะสม 8,355 คน)`}>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[10px] font-bold uppercase" style={{ color: s.color }}>{s.label}</span>
                <span className="text-[9px] text-[var(--text-muted)]">{s.pct.toFixed(1)}%</span>
              </div>
              <div className="text-[18px] font-bold num text-[var(--dark)]">{numFmt(s.count)}</div>
              <div className="text-[9.5px] text-[var(--text-muted)]">{s.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
