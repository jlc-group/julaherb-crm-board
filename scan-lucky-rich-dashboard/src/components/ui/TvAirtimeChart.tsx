'use client'
import { Line } from 'react-chartjs-2'
import type { Chart, ChartOptions } from 'chart.js'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { SCANS_PER_15MIN, TV_AD_SLOTS, TV_LIFT } from '@/lib/scan-behavior-data'

function minToHHMM(m: number): string {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export default function TvAirtimeChart() {
  // Custom plugin: draw vertical lines at TV ad slots
  const tvLinesPlugin = {
    id: 'tvLines',
    afterDraw: (chart: Chart) => {
      const { ctx, chartArea, scales } = chart
      if (!chartArea) return
      ctx.save()
      TV_AD_SLOTS.forEach(slot => {
        const x = scales.x.getPixelForValue(slot.startMinute)
        if (x < chartArea.left || x > chartArea.right) return
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(x, chartArea.top)
        ctx.lineTo(x, chartArea.bottom)
        ctx.stroke()
        // label
        ctx.setLineDash([])
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 9px "Noto Sans Thai"'
        ctx.textAlign = 'center'
        ctx.fillText('📺 ' + slot.label.replace(/[0-9:]+/g, '').trim(), x, chartArea.top + 10)
      })
      ctx.restore()
    },
  }

  const data = {
    labels: SCANS_PER_15MIN.map(s => s.minute),
    datasets: [{
      label: 'สแกน / 15 นาที',
      data: SCANS_PER_15MIN.map(s => ({ x: s.minute, y: s.scans })),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      fill: true,
      tension: 0.25,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
    }],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: items => minToHHMM(items[0].parsed.x ?? 0),
          label: c => `${c.parsed.y} สแกน`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        min: 0,
        max: 1439,
        ticks: {
          stepSize: 120,  // every 2 hours
          callback: (v) => minToHHMM(Number(v)),
          font: { size: 10 },
        },
        grid: { color: '#f1f5f9' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
      },
    },
  }

  // Best lift
  const bestLift = [...TV_LIFT].sort((a, b) => b.liftPct - a.liftPct)[0]

  return (
    <ChartCard title="TV Airtime × Scan Correlation" icon="ti-device-tv" full>
      <div style={{ height: 280 }}>
        <Line data={data} options={options} plugins={[tvLinesPlugin]} />
      </div>

      {/* Lift table */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">
              <th className="text-left py-1.5 px-2">TV slot</th>
              <th className="text-right py-1.5 px-2">Before (avg/15min)</th>
              <th className="text-right py-1.5 px-2">After</th>
              <th className="text-right py-1.5 px-2">Lift</th>
            </tr>
          </thead>
          <tbody>
            {TV_LIFT.map(s => (
              <tr key={s.label} className="border-t border-[var(--border-soft)]">
                <td className="py-1.5 px-2 font-medium text-[var(--dark)]">📺 {s.label}</td>
                <td className="py-1.5 px-2 text-right num text-[var(--text-secondary)]">{s.avgBefore}</td>
                <td className="py-1.5 px-2 text-right num text-[var(--dark)]">{s.avgAfter}</td>
                <td className={`py-1.5 px-2 text-right num font-bold ${s.liftPct > 50 ? 'text-[var(--primary)]' : s.liftPct > 0 ? 'text-[var(--green-700)]' : 'text-[var(--text-muted)]'}`}>
                  {s.liftPct > 0 ? '+' : ''}{s.liftPct.toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InsightInline
        html={`<b>${bestLift.label}</b> ดัน scan ขึ้น <b>+${bestLift.liftPct.toFixed(0)}%</b> ใน 30 นาทีหลังออกอากาศ — slot นี้คุ้มสุด ลองเพิ่ม budget`}
      />
    </ChartCard>
  )
}
