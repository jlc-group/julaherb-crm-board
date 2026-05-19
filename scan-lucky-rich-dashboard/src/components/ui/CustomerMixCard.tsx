'use client'
import { Doughnut } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { CUSTOMER_MIX } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

export default function CustomerMixCard() {
  const total = CUSTOMER_MIX.reduce(
    (acc, d) => ({
      newSignup: acc.newSignup + d.newSignup,
      existing:  acc.existing  + d.existingUsers,
    }),
    { newSignup: 0, existing: 0 }
  )
  const sum = total.newSignup + total.existing
  const newPct = (total.newSignup / sum) * 100
  const avgProfileCompletion = CUSTOMER_MIX.reduce((s, d) => s + d.profileCompletionPct, 0) / CUSTOMER_MIX.length

  // Trend of new signup rate
  const newRates = CUSTOMER_MIX.map(d => ({
    date: d.date.split('-')[2] + ' พ.ค.',
    pct: (d.newSignup / (d.newSignup + d.existingUsers)) * 100,
  }))

  return (
    <ChartCard title="Customer Mix — New vs Existing" icon="ti-user-plus">
      <div className="grid grid-cols-2 gap-4">
        {/* Donut */}
        <div style={{ height: 200 }} className="flex items-center justify-center">
          <div style={{ width: 180, height: 180 }}>
            <Doughnut
              data={{
                labels: ['New signup', 'Existing'],
                datasets: [{
                  data: [total.newSignup, total.existing],
                  backgroundColor: ['#16a34a','#facc15'],
                  borderWidth: 0,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } },
                  tooltip: { callbacks: { label: c => `${c.label}: ${numFmt(c.parsed)} (${((c.parsed / sum) * 100).toFixed(1)}%)` } },
                },
              }}
            />
          </div>
        </div>

        {/* Stats column */}
        <div className="space-y-2">
          <div className="bg-[var(--green-50)] border border-[var(--green-200)] rounded-lg p-2.5">
            <div className="text-[10px] text-[var(--green-700)] uppercase tracking-wide font-bold">New signup รวม</div>
            <div className="text-[20px] num text-[var(--green-800)]">{numFmt(total.newSignup)}</div>
            <div className="text-[10px] text-[var(--text-secondary)]">{newPct.toFixed(1)}% ของผู้สแกน</div>
          </div>

          <div className="bg-[var(--bg-soft)] border border-[var(--border-soft)] rounded-lg p-2.5">
            <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide font-bold">Existing users</div>
            <div className="text-[20px] num text-[var(--dark)]">{numFmt(total.existing)}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{(100 - newPct).toFixed(1)}%</div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
            <div className="text-[10px] text-yellow-800 uppercase tracking-wide font-bold">Profile completion</div>
            <div className="text-[20px] num text-yellow-900">{avgProfileCompletion.toFixed(1)}%</div>
            <div className="text-[10px] text-[var(--text-muted)]">avg 3 วัน</div>
          </div>
        </div>
      </div>

      {/* Daily trend mini */}
      <div className="mt-3 pt-3 border-t border-[var(--border-soft)]">
        <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-1.5">
          <i className="ti ti-trending-up text-[var(--primary)]" /> New signup rate รายวัน
        </div>
        <div className="flex gap-2">
          {newRates.map(r => (
            <div key={r.date} className="flex-1 bg-[var(--bg-soft)] rounded-md p-2 border border-[var(--border-soft)]">
              <div className="text-[10px] text-[var(--text-muted)]">{r.date}</div>
              <div className="text-[14px] num text-[var(--green-700)] font-bold">{r.pct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      <InsightInline
        html={`New signup rate <b>${newRates[0].pct.toFixed(1)}% → ${newRates[newRates.length-1].pct.toFixed(1)}%</b> — กระแสยังกระจายต่อ แม้ยอดรวมลด`}
      />
    </ChartCard>
  )
}
