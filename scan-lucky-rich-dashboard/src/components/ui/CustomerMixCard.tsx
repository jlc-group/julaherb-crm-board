'use client'
import { Doughnut } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

export default function CustomerMixCard() {
  // 4-day aggregates from real daily data
  const totalNewScanned = DAILY_ENTRIES.reduce((s, d) => s + d.newScanned, 0)
  const totalOldScanned = DAILY_ENTRIES.reduce((s, d) => s + d.oldScanned, 0)
  const totalSignups    = DAILY_ENTRIES.reduce((s, d) => s + d.newSignup, 0)
  const totalUsers      = totalNewScanned + totalOldScanned
  const newPct = (totalNewScanned / totalUsers) * 100

  // Daily new-signup rate trend (new scanned / total active that day)
  const dailyRates = DAILY_ENTRIES.map(d => ({
    date: d.date.split('-')[2] + ' พ.ค.',
    pct: (d.newScanned / d.uniqueUsers) * 100,
    outage: !!d.outage,
  }))

  return (
    <ChartCard title="Customer Mix — สมาชิกใหม่ vs เก่า (4 วัน)" icon="ti-user-plus">
      <div className="grid grid-cols-2 gap-4">
        {/* Donut */}
        <div style={{ height: 180 }} className="flex items-center justify-center">
          <div style={{ width: 160, height: 160 }}>
            <Doughnut
              data={{
                labels: ['สมาชิกใหม่ (สแกนวันแรก)', 'สมาชิกเก่า'],
                datasets: [{
                  data: [totalNewScanned, totalOldScanned],
                  backgroundColor: ['#16a34a', '#facc15'],
                  borderWidth: 0,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } },
                  tooltip: { callbacks: { label: c => `${c.label}: ${numFmt(c.parsed)} (${((c.parsed / totalUsers) * 100).toFixed(1)}%)` } },
                },
              }}
            />
          </div>
        </div>

        {/* Stats column */}
        <div className="space-y-1.5">
          <div className="bg-[var(--green-50)] border border-[var(--green-200)] rounded-lg p-2">
            <div className="text-[9.5px] text-[var(--green-700)] uppercase tracking-wide font-bold">สมาชิกใหม่ — สแกน</div>
            <div className="text-[18px] num text-[var(--green-800)]">{numFmt(totalNewScanned)}</div>
            <div className="text-[9.5px] text-[var(--text-secondary)]">{newPct.toFixed(1)}%</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <div className="text-[9.5px] text-yellow-800 uppercase tracking-wide font-bold">สมาชิกเก่า — สแกน</div>
            <div className="text-[18px] num text-yellow-900">{numFmt(totalOldScanned)}</div>
            <div className="text-[9.5px] text-[var(--text-secondary)]">{(100 - newPct).toFixed(1)}%</div>
          </div>
          <div className="bg-[var(--bg-soft)] border border-[var(--border-soft)] rounded-lg p-2">
            <div className="text-[9.5px] text-[var(--text-secondary)] uppercase tracking-wide font-bold">สมัครรวม (4 วัน)</div>
            <div className="text-[18px] num text-[var(--dark)]">{numFmt(totalSignups)}</div>
            <div className="text-[9.5px] text-[var(--text-muted)]">รวมที่ยังไม่ scan</div>
          </div>
        </div>
      </div>

      {/* Daily trend mini */}
      <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
        <div className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-1.5">
          <i className="ti ti-trending-up text-[var(--primary)]" /> % สมาชิกใหม่ ใน scanner รายวัน
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {dailyRates.map(r => (
            <div key={r.date} className={`rounded-md p-1.5 border ${r.outage ? 'border-red-200 bg-red-50/40' : 'border-[var(--border-soft)] bg-[var(--bg-soft)]'}`}>
              <div className="text-[9px] text-[var(--text-muted)] flex items-center gap-0.5">
                {r.date} {r.outage && <i className="ti ti-alert-octagon text-[var(--red)]" />}
              </div>
              <div className="text-[13px] num text-[var(--green-700)] font-bold">{r.pct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      <InsightInline
        html={`สมาชิกใหม่ <b>${numFmt(totalNewScanned)}</b> (${newPct.toFixed(1)}%) + สมาชิกเก่า <b>${numFmt(totalOldScanned)}</b> (${(100-newPct).toFixed(1)}%) — สมาชิกเก่า dominate, retention ดี`}
      />
    </ChartCard>
  )
}
