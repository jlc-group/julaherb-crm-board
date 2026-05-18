'use client'
import { Bar } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { RIGHTS_PER_USER_DIST, REAL_CAMPAIGN } from '@/lib/real-data'

export default function RightsPerUserHistogram() {
  const avg = REAL_CAMPAIGN.totalRights / REAL_CAMPAIGN.uniqueUsers
  return (
    <ChartCard title="Rights per User Distribution" icon="ti-chart-histogram">
      <div style={{ height: 260 }}>
        <Bar
          data={{
            labels: RIGHTS_PER_USER_DIST.map(d => d.bucket),
            datasets: [
              {
                label: 'Users',
                data: RIGHTS_PER_USER_DIST.map(d => d.users),
                backgroundColor: RIGHTS_PER_USER_DIST.map((d, i) =>
                  i === 0 ? '#94a3b8'
                : i <= 2  ? '#1D9E75'
                : i <= 4  ? '#EF9F27'
                          : '#e74c3c'
                ),
                borderRadius: 4,
                barPercentage: 0.8,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  afterLabel: (ctx) => {
                    const d = RIGHTS_PER_USER_DIST[ctx.dataIndex]
                    return `${d.pct.toFixed(1)}% ของผู้สแกน`
                  },
                },
              },
            },
            scales: {
              x: { grid: { display: false }, title: { display: true, text: 'สิทธิ์/คน', font: { size: 10 } } },
              y: { beginAtZero: true, grid: { color: '#f1f1f1' } },
            },
          }}
        />
      </div>
      <InsightInline
        html={`เฉลี่ย <b>${avg.toFixed(2)} สิทธิ์/คน</b> แต่ <b>40.8%</b> สแกนแค่ 1 ครั้ง — มีโอกาส upsell ผ่าน LINE push "สแกนอีก 1 = สิทธิ์ x2"`}
      />
    </ChartCard>
  )
}
