'use client'
import { Doughnut } from 'react-chartjs-2'
import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

interface Props { day: DailyEntry }

export default function CustomerProfileCard({ day }: Props) {
  const newSignup = day.memberNew ?? day.newSignup
  const newScanned = day.newScanned
  const newNotScanned = day.signedNotScanned
  const newActivationRate = (newScanned / newSignup) * 100

  const firstTime = Math.round(day.uniqueUsers * day.firstTimePct / 100)
  const returning = day.uniqueUsers - firstTime

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 8, font: { size: 10 }, padding: 8 } },
    },
  }

  return (
    <div className="card p-4">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-[14px] font-bold text-[var(--dark)]">👥 โปรไฟล์ลูกค้าวันนี้</h3>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{day.date.split('-')[2]} พ.ค.</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT: New signup activation */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 text-center">
            🆕 สมาชิกใหม่ ({numFmt(newSignup)} คน)
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mb-2 text-center">
            สแกนภายในวัน <b className="text-[var(--brand-700)]">{newActivationRate.toFixed(1)}%</b>
          </div>
          <div style={{ width: 150, height: 150 }}>
            <Doughnut
              data={{
                labels: ['สแกนเลย', 'ยังไม่สแกน'],
                datasets: [{
                  data: [newScanned, newNotScanned],
                  backgroundColor: ['#6366f1', '#e2e8f0'],
                  borderWidth: 0,
                }],
              }}
              options={baseOpts as any}
            />
          </div>
        </div>

        {/* RIGHT: First-time vs Returning */}
        <div className="flex flex-col items-center">
          <div className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1 text-center">
            🔁 ผู้สแกน ({numFmt(day.uniqueUsers)} คน)
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mb-2 text-center">
            กลับมาซ้ำ <b className="text-[var(--brand-700)]">{day.returningPct.toFixed(1)}%</b>
          </div>
          <div style={{ width: 150, height: 150 }}>
            <Doughnut
              data={{
                labels: [`ครั้งแรก (${day.firstTimePct.toFixed(1)}%)`, `Returning (${day.returningPct.toFixed(1)}%)`],
                datasets: [{
                  data: [firstTime, returning],
                  backgroundColor: ['#a78bfa', '#10b981'],
                  borderWidth: 0,
                }],
              }}
              options={baseOpts as any}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
