'use client'
import { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import { numFmt } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

// ── Channel Summary Data ──
const CHANNEL_DATA = [
  { name: '7-Eleven', scans: 12450, pct: 25.7 },
  { name: 'Watson', scans: 8920, pct: 18.4 },
  { name: 'Shopee', scans: 7680, pct: 15.9 },
  { name: 'Lazada', scans: 6340, pct: 13.1 },
  { name: 'TikTok Shop', scans: 5890, pct: 12.2 },
  { name: 'ตัวแทนจำหน่าย', scans: 7090, pct: 14.7 },
]

// ── Channel Trend (Top 4, 14 days) ──
const TREND_LABELS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 4, 2 + i)
  return `${d.getDate()}/${d.getMonth() + 1}`
})

// Deterministic pseudo-random so SSR and client match
let _trendSeed = 12345
function pseudoRand(): number {
  _trendSeed = (_trendSeed * 9301 + 49297) % 233280
  return _trendSeed / 233280
}
function genTrend(base: number, variance: number): number[] {
  return Array.from({ length: 14 }, () => base + Math.floor(pseudoRand() * variance))
}

const CHANNEL_TREND_DATA = {
  labels: TREND_LABELS,
  seven: genTrend(700, 300),
  watson: genTrend(500, 250),
  shopee: genTrend(400, 200),
  agent: genTrend(350, 250),
}

// ── Heatmap Data ──
const HOURS = Array.from({ length: 17 }, (_, i) => (7 + i).toString().padStart(2, '0'))
const HEATMAP_DATA = CHANNEL_DATA.map(ch => ({
  name: ch.name,
  values: HOURS.map(() => Math.floor(pseudoRand() * 121)),
}))

export default function ChannelsTab() {
  const barColors = ['#085041', '#0F6E56', '#1D9E75', '#3DB890', '#7DD3B8', '#EF9F27']
  const sorted = [...CHANNEL_DATA].sort((a, b) => b.scans - a.scans)

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {CHANNEL_DATA.map(ch => (
          <KpiCard
            key={ch.name}
            label={ch.name}
            value={numFmt(ch.scans)}
            sub={`${ch.pct}% ของทั้งหมด`}
          />
        ))}
      </div>

      <InsightInline html="<b>Top:</b> 7-Eleven ครอง 25.7% — offline ยังเป็นฐานหลัก | Online 41.2% vs Offline 58.8% — สอดคล้อง FMCG ไทย" />

      {/* ── Chart Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Horizontal Bar — Scan Count by Channel */}
        <ChartCard title="Scan Count by Channel" icon="ti-chart-bar">
          <div style={{ height: 280 }}>
            <Bar
              data={{
                labels: sorted.map(c => c.name),
                datasets: [{
                  label: 'Scans',
                  data: sorted.map(c => c.scans),
                  backgroundColor: barColors,
                  borderRadius: 4,
                }],
              }}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
                  y: { grid: { display: false }, ticks: { font: { size: 11 } } },
                },
              }}
            />
          </div>
        </ChartCard>

        {/* Line — Channel Trend (Top 4 Daily) */}
        <ChartCard title="Channel Trend (Top 4 Daily)" icon="ti-chart-line">
          <div style={{ height: 280 }}>
            <Line
              data={{
                labels: CHANNEL_TREND_DATA.labels,
                datasets: [
                  { label: '7-Eleven', data: CHANNEL_TREND_DATA.seven, borderColor: '#085041', backgroundColor: 'rgba(8,80,65,0.08)', tension: 0.3, fill: false, pointRadius: 2 },
                  { label: 'Watson', data: CHANNEL_TREND_DATA.watson, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.08)', tension: 0.3, fill: false, pointRadius: 2 },
                  { label: 'Shopee', data: CHANNEL_TREND_DATA.shopee, borderColor: '#EF9F27', backgroundColor: 'rgba(239,159,39,0.08)', tension: 0.3, fill: false, pointRadius: 2 },
                  { label: 'ตัวแทน', data: CHANNEL_TREND_DATA.agent, borderColor: '#7DD3B8', backgroundColor: 'rgba(125,211,184,0.08)', tension: 0.3, fill: false, pointRadius: 2 },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' } } },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                  y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 11 } } },
                },
              }}
            />
          </div>
        </ChartCard>
      </div>

      <InsightInline html="TikTok Shop 12.2% — emerging channel | Shopee 15.9% vs TikTok 12.2%" />

      {/* ── Channel × Hour Heatmap ── */}
      <ChartCard title="Channel × Hour Heatmap" icon="ti-flame" full>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-1.5 sticky left-0 z-10 min-w-[110px]">Channel</th>
                {HOURS.map(h => (
                  <th key={h} className="bg-[var(--light)] text-[var(--dark)] font-semibold text-center p-1.5 min-w-[36px]">{h}:00</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEATMAP_DATA.map((row, ri) => (
                <tr key={ri}>
                  <td className="p-1.5 font-medium whitespace-nowrap sticky left-0 bg-white z-10 border-b border-[var(--border)]">{row.name}</td>
                  {row.values.map((v, ci) => {
                    const alpha = Math.min(v / 120, 1) * 0.85 + 0.05
                    return (
                      <td
                        key={ci}
                        className="p-1.5 text-center border-b border-[var(--border)]"
                        style={{ background: `rgba(29,158,117,${alpha.toFixed(2)})`, color: alpha > 0.5 ? '#fff' : 'var(--text)' }}
                      >
                        {v}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <InsightInline html="<b>Offline</b> peak 12:00-14:00 + 17:00-19:00 | <b>Online</b> peak 20:00-22:00" />

      {/* ── Actions ── */}
      <InsightCard html={`
        1. <b>7-Eleven:</b> เพิ่ม shelf talker<br/>
        2. <b>TikTok Shop:</b> ทำ LIVE ช่วง 20:00-21:00<br/>
        3. <b>Ads schedule:</b> Facebook/IG → 11:30-13:30 | TikTok → 19:00-22:00<br/>
        4. <b>Channel diversification:</b> กระจายดีแล้ว maintain strategy
      `} />
    </div>
  )
}
