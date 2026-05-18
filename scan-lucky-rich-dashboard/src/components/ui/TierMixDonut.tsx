'use client'
import { Doughnut } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { TIER_MIX } from '@/lib/real-data'

const COLORS: Record<string, string> = {
  'ซอง': '#1D9E75',
  'หลอด': '#EF9F27',
  'เซ็ต': '#085041',
}

export default function TierMixDonut() {
  const sachetPct = TIER_MIX.find(t => t.tier === 'ซอง')?.pct || 0
  return (
    <ChartCard title="Tier Mix (ซอง / หลอด / เซ็ต)" icon="ti-chart-donut">
      <div style={{ height: 260 }} className="flex items-center justify-center">
        <div style={{ width: 220, height: 220 }}>
          <Doughnut
            data={{
              labels: TIER_MIX.map(t => `${t.tier} ${t.pct.toFixed(0)}%`),
              datasets: [{
                data: TIER_MIX.map(t => t.rights),
                backgroundColor: TIER_MIX.map(t => COLORS[t.tier]),
                borderWidth: 0,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '65%',
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
            }}
          />
        </div>
      </div>
      <InsightInline html={`<b>ซอง</b> ครอง <b>${sachetPct.toFixed(0)}%</b> ของ Top 10 — sachet-driven campaign | ระวัง stock ซองสำคัญที่สุด`} />
    </ChartCard>
  )
}
