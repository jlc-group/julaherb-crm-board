'use client'
import { Bar } from 'react-chartjs-2'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { paretoData, TOP_SKUS, REAL_CAMPAIGN } from '@/lib/real-data'

export default function ParetoChart() {
  const data = paretoData(TOP_SKUS, REAL_CAMPAIGN.totalRights)

  return (
    <ChartCard title="Pareto — SKU Concentration (80/20)" icon="ti-chart-bar" full>
      <div style={{ height: 320 }}>
        <Bar
          data={{
            labels: data.map(d => d.sku),
            datasets: [
              {
                type: 'bar' as const,
                label: '% สิทธิ์ของ SKU',
                data: data.map(d => d.pct),
                backgroundColor: data.map((d, i) =>
                  i === 0 ? '#EF9F27' : i < 3 ? '#1D9E75' : 'rgba(29,158,117,.5)'
                ),
                borderRadius: 4,
                barPercentage: 0.7,
                yAxisID: 'y',
                order: 2,
              },
              {
                type: 'line' as const,
                label: 'Cumulative %',
                data: data.map(d => d.cumulativePct),
                borderColor: '#085041',
                backgroundColor: 'transparent',
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: '#085041',
                tension: 0.25,
                yAxisID: 'y1',
                order: 1,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
              tooltip: {
                callbacks: {
                  afterLabel: (ctx) => {
                    const d = data[ctx.dataIndex]
                    return `${d.name}\nสิทธิ์: ${d.rights.toLocaleString()}`
                  },
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 9 } } },
              y:  {
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: '% สิทธิ์ต่อ SKU', font: { size: 10 } },
                grid: { color: '#f1f1f1' },
              },
              y1: {
                position: 'right',
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Cumulative %', font: { size: 10 } },
                grid: { display: false },
                ticks: { callback: (v) => `${v}%` },
              },
            },
          }}
        />
      </div>
      <InsightInline
        html={`<b>Top 1</b> SKU = <b>${data[0].pct.toFixed(1)}%</b> | <b>Top 3</b> = <b>${data[2].cumulativePct.toFixed(1)}%</b> | <b>Top 10</b> = <b>${data[9].cumulativePct.toFixed(1)}%</b> — Pareto ชัดเจน: ลงทุน 10% ของ SKU ได้ผลตอบแทน ~76%`}
      />
    </ChartCard>
  )
}
