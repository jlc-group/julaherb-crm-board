'use client'
import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import DataTable from '@/components/ui/DataTable'
import { numFmt, maskPhone } from '@/lib/utils'
import { PRODUCTS } from '@/config/products'
import { PRIZES } from '@/config/campaign'
import * as mock from '@/lib/mock-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6c757d'

const TIER_COLORS: Record<string, string> = {
  'ซอง': '#1D9E75',
  'หลอด': '#0F6E56',
  'เซ็ต': '#EF9F27',
}

export default function ProductsTab() {
  // ── Computed data ──
  const sortedProducts = useMemo(() => [...PRODUCTS].sort((a, b) => b.scans - a.scans), [])
  const top15 = sortedProducts.slice(0, 15)
  const deadSKUs = PRODUCTS.filter(p => p.scans === 0)

  // Tier summaries
  const tiers = useMemo(() => {
    const result: Record<string, { count: number; totalScans: number; totalRights: number }> = {}
    for (const p of PRODUCTS) {
      if (!result[p.tier]) result[p.tier] = { count: 0, totalScans: 0, totalRights: 0 }
      result[p.tier].count++
      result[p.tier].totalScans += p.scans
      result[p.tier].totalRights += p.scans * p.rightsPerScan
    }
    return result
  }, [])

  const tierOrder: ('ซอง' | 'หลอด' | 'เซ็ต')[] = ['ซอง', 'หลอด', 'เซ็ต']

  const totalScans = PRODUCTS.reduce((s, p) => s + p.scans, 0)
  const songScans = tiers['ซอง']?.totalScans || 0
  const tubeScans = tiers['หลอด']?.totalScans || 0
  const setScans = tiers['เซ็ต']?.totalScans || 0

  const songRights = tiers['ซอง']?.totalRights || 0
  const tubeRights = tiers['หลอด']?.totalRights || 0
  const setRights = tiers['เซ็ต']?.totalRights || 0

  const songPct = totalScans ? ((songScans / totalScans) * 100).toFixed(1) : '0'
  const tubePct = totalScans ? ((tubeScans / totalScans) * 100).toFixed(1) : '0'
  const setPct = totalScans ? ((setScans / totalScans) * 100).toFixed(1) : '0'

  const maxTopScans = top15[0]?.scans || 1

  return (
    <div className="space-y-5">
      {/* ── Top 15 SKUs — Horizontal Bar ── */}
      <ChartCard title="Top 15 SKUs" icon="ti-chart-bar" full>
        <div style={{ height: 420 }}>
          <Bar
            data={{
              labels: top15.map(p => p.name.length > 30 ? p.name.slice(0, 30) + '...' : p.name),
              datasets: [{
                label: 'สแกน',
                data: top15.map(p => p.scans),
                backgroundColor: top15.map(p => TIER_COLORS[p.tier] || '#ccc'),
                borderRadius: 4,
                barPercentage: .6,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => {
                      const p = top15[ctx.dataIndex]
                      return `${numFmt(p.scans)} สแกน (${p.tier})`
                    },
                  },
                },
              },
              scales: {
                x: { beginAtZero: true, grid: { color: '#f1f1f1' } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } },
              },
            }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-[10px]">
          {tierOrder.map(t => (
            <span key={t} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: TIER_COLORS[t] }} />
              {t}
            </span>
          ))}
        </div>
        <InsightInline html="#1 <b>กันแดด SPF50 30g</b> 512 สแกน — หลอด sweet spot | ซองติด top 5 ถึง 3 SKU แสดงว่า trial pack ดึงสแกนได้ดี" />
      </ChartCard>

      {/* ── Tier Summary KPIs ── */}
      <div className="grid grid-cols-3 gap-3">
        {tierOrder.map(t => {
          const d = tiers[t] || { count: 0, totalScans: 0, totalRights: 0 }
          const avgRights = d.totalScans > 0 ? (d.totalRights / d.totalScans).toFixed(1) : '0'
          return (
            <KpiCard
              key={t}
              label={`Tier: ${t}`}
              value={`${d.count} SKU`}
              sub={`${numFmt(d.totalScans)} สแกน | เฉลี่ย ${avgRights} สิทธิ์/สแกน`}
              gold={t === 'เซ็ต'}
            />
          )
        })}
      </div>

      <InsightInline html={`ซอง <b>${songPct}%</b> สแกน แต่สร้าง rights แค่ ${songRights > 0 ? ((songRights / (songRights + tubeRights + setRights)) * 100).toFixed(1) : '0'}% | เซ็ตสแกนน้อยแต่ rights/สแกนสูงสุด`} />

      {/* ── Chart Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier Upgrade Funnel — HTML visual */}
        <ChartCard title="Tier Upgrade Funnel" icon="ti-arrow-big-up-lines">
          <div className="flex flex-col items-center gap-3 py-4">
            {[
              { tier: 'ซอง', count: songScans, pct: 100, width: '90%' },
              { tier: 'หลอด', count: tubeScans, pct: totalScans ? Math.round((tubeScans / songScans) * 100) : 0, width: '65%' },
              { tier: 'เซ็ต', count: setScans, pct: totalScans ? Math.round((setScans / tubeScans) * 100) : 0, width: '40%' },
            ].map((item, i) => (
              <div key={item.tier} className="w-full flex flex-col items-center">
                {i > 0 && (
                  <div className="text-[10px] text-gray-400 mb-1">
                    ↓ {item.pct}% upgrade
                  </div>
                )}
                <div
                  className="rounded-lg py-3 text-center text-white font-semibold text-[12px]"
                  style={{ width: item.width, backgroundColor: TIER_COLORS[item.tier] }}
                >
                  {item.tier} — {numFmt(item.count)} สแกน
                </div>
              </div>
            ))}
          </div>
          <InsightInline html="Conversion ซอง→หลอด ยังต่ำ — ต้อง push <b>bundle promotion</b> ซอง+หลอดในราคาพิเศษ" />
        </ChartCard>

        {/* สิทธิ์ตาม Tier — Doughnut */}
        <ChartCard title="สิทธิ์ตาม Tier" icon="ti-chart-donut-3">
          <div style={{ height: 240 }} className="flex items-center justify-center">
            <div style={{ width: 200, height: 200 }}>
              <Doughnut
                data={{
                  labels: ['ซอง', 'หลอด', 'เซ็ต'],
                  datasets: [{
                    data: [songRights, tubeRights, setRights],
                    backgroundColor: ['#1D9E75', '#0F6E56', '#EF9F27'],
                    borderWidth: 0,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '55%',
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
                }}
              />
            </div>
          </div>
          <InsightInline html="หลอดสร้างสิทธิ์มากสุดเพราะ <b>rights/scan สูง + volume ดี</b> — sweet spot ของแคมเปญ" />
        </ChartCard>

        {/* SKU Mix Shift — Line */}
        <ChartCard title="SKU Mix Shift (% หลอด+เซ็ต)" icon="ti-trending-up">
          <div style={{ height: 240 }}>
            <Line
              data={{
                labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
                datasets: [{
                  label: '% หลอด+เซ็ต',
                  data: [45, 52, 58, 62, 67, 71, 68, 73],
                  borderColor: '#1D9E75',
                  backgroundColor: 'rgba(29,158,117,.1)',
                  fill: true,
                  tension: .35,
                  borderWidth: 2,
                  pointRadius: 3,
                  pointBackgroundColor: '#1D9E75',
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true, max: 100, grid: { color: '#f1f1f1' }, ticks: { callback: v => `${v}%` } },
                },
              }}
            />
          </div>
          <InsightInline html="Mix shift เพิ่มจาก <b>45% → 73%</b> ใน 8 สัปดาห์ — ลูกค้า upgrade จากซองเป็นหลอด/เซ็ตมากขึ้น" />
        </ChartCard>

        {/* Win-rate by Tier — Bar */}
        <ChartCard title="Win-rate by Tier" icon="ti-award">
          <div style={{ height: 240 }}>
            <Bar
              data={{
                labels: ['ซอง', 'หลอด', 'เซ็ต'],
                datasets: [{
                  label: 'Win-rate %',
                  data: [0.8, 2.1, 4.5],
                  backgroundColor: ['#1D9E75', '#0F6E56', '#EF9F27'],
                  borderRadius: 6,
                  barPercentage: .4,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true, grid: { color: '#f1f1f1' }, ticks: { callback: v => `${v}%` } },
                },
              }}
            />
          </div>
          <InsightInline html="เซ็ต win-rate <b>4.5%</b> สูงกว่าซอง 5.6x — ต้องทำ content สื่อสารให้ลูกค้าเห็นโอกาสชนะ" />
        </ChartCard>
      </div>

      {/* ── Dead SKU Alert ── */}
      {deadSKUs.length > 0 && (
        <ChartCard title={`Dead SKU Alert (${deadSKUs.length} SKUs)`} icon="ti-alert-circle" full>
          <div className="flex flex-wrap gap-2">
            {deadSKUs.map(p => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-red-50 text-[var(--danger)] border border-red-200"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                {p.sku} — {p.name.length > 25 ? p.name.slice(0, 25) + '...' : p.name}
              </span>
            ))}
          </div>
          <InsightInline severity="danger" html={`<b>${deadSKUs.length} SKUs</b> ยังไม่มีสแกนเลย — พิจารณาทำ flash sale หรือ bundle กับ SKU ยอดนิยม`} />
        </ChartCard>
      )}

      {/* ── Actions ── */}
      <InsightCard html={`
        <b>1. Bundle promotion:</b> จับคู่ซอง+หลอด ให้สิทธิ์ x2 — ดัน conversion ซอง→หลอด<br/>
        <b>2. Dead SKU flash sale:</b> ${deadSKUs.length} SKUs ไม่มีสแกน — ทำ flash sale ลด 30% + สิทธิ์ลุ้นพิเศษ<br/>
        <b>3. Content เซ็ต win-rate:</b> เซ็ต win-rate 4.5% สูงสุด — ทำ content "ซื้อเซ็ตลุ้นได้มากกว่า"<br/>
        <b>4. Monitor avg price:</b> ติดตาม avg price/scan ว่า shift ไปทาง premium tier หรือไม่
      `} />
    </div>
  )
}
