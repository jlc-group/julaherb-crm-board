'use client'
import { useState } from 'react'
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
import RetentionCohort from '@/components/ui/RetentionCohort'
import ScanFunnel from '@/components/ui/ScanFunnel'
import { numFmt, maskPhone } from '@/lib/utils'
import { PRODUCTS } from '@/config/products'
import { PRIZES } from '@/config/campaign'
import * as mock from '@/lib/mock-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6c757d'

// ── Gauge center text plugin ──
const gaugeTextPlugin = {
  id: 'gaugeText',
  afterDraw(chart: any) {
    const { ctx, width, height } = chart
    const meta = chart.getDatasetMeta(0)
    if (!meta || !meta.data[0]) return
    ctx.save()
    ctx.font = 'bold 28px "Noto Sans Thai", sans-serif'
    ctx.fillStyle = '#085041'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText('38.2%', width / 2, height - 16)
    ctx.restore()
  },
}

export default function CustomersTab() {
  const top20 = [...mock.MOCK_USERS].sort((a, b) => b.scans - a.scans).slice(0, 20)

  // Province aggregation
  const provMap = new Map<string, number>()
  mock.MOCK_USERS.forEach(u => provMap.set(u.province, (provMap.get(u.province) || 0) + u.scans))
  const topProvinces = [...provMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxProvScans = topProvinces[0]?.[1] || 1

  return (
    <div className="space-y-5">
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Repeat Rate" value="38.2%" badge="+2.1%" />
        <KpiCard label="Heavy Scanners" value="24" sub="≥20 สแกน/คน" />
        <KpiCard label="สิทธิ์เฉลี่ย/สแกน" value="3.8" />
        <KpiCard label="สิทธิ์สูงสุด" value="87" gold sub="1 คน (Heavy)" />
      </div>

      <InsightInline html="Repeat <b>38.2%</b> ดีกว่า industry avg 25-30% | Heavy <b>24 คน</b> (5.5%) สร้างสิทธิ์ ~33% | โอกาสใหญ่สุด = ดัน Light <b>324 คน</b> → Medium" />

      {/* ── Chart Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RFM Segmentation */}
        <ChartCard title="RFM Segmentation" icon="ti-chart-pie">
          <div style={{height: 260}} className="flex items-center justify-center">
            <div style={{width: 220, height: 220}}>
              <Doughnut
                data={{
                  labels: ['Heavy','Medium','Light'],
                  datasets: [{
                    data: [24, 87, 324],
                    backgroundColor: ['#085041','#1D9E75','#E1F5EE'],
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
          <InsightInline html="Heavy 24 คน (5.5%) แต่สร้างสิทธิ์ ~33% — ควรมี <b>VIP program</b> รักษากลุ่มนี้" />
        </ChartCard>

        {/* RetentionCohort (moved from Overview) */}
        <RetentionCohort />

        {/* ScanFunnel (moved from Overview) */}
        <ScanFunnel />

        {/* Cohort Retention */}
        <ChartCard title="Cohort Retention" icon="ti-table">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[var(--light)]">
                  <th className="p-2 text-left font-semibold text-[var(--dark)]">Cohort</th>
                  <th className="p-2 text-center font-semibold text-[var(--dark)]">Week 0</th>
                  <th className="p-2 text-center font-semibold text-[var(--dark)]">Week 1</th>
                  <th className="p-2 text-center font-semibold text-[var(--dark)]">Week 2</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100">
                  <td className="p-2 font-medium">ก.ค. 2569</td>
                  <td className="p-2 text-center"><span className="inline-block px-2 py-0.5 rounded bg-[var(--primary)] text-white font-semibold">100%</span></td>
                  <td className="p-2 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-semibold">42%</span></td>
                  <td className="p-2 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">28%</span></td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="p-2 font-medium">ส.ค. 2569</td>
                  <td className="p-2 text-center"><span className="inline-block px-2 py-0.5 rounded bg-[var(--primary)] text-white font-semibold">100%</span></td>
                  <td className="p-2 text-center"><span className="inline-block px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-semibold">38%</span></td>
                  <td className="p-2 text-center text-gray-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <InsightInline html="ก.ค. cohort เหลือ <b>28%</b> ใน Week 2 — ต้องมี win-back campaign สำหรับ drop-off" />
        </ChartCard>
      </div>

      {/* ── Top 20 Scanners ── */}
      <ChartCard title="Top 20 Scanners" icon="ti-trophy" full>
        <DataTable headers={['#','ชื่อ','จังหวัด','สแกน','สิทธิ์','สแกนล่าสุด']}>
          {top20.map((u, i) => (
            <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50">
              <td className="p-2 font-semibold text-[var(--primary)]">{i + 1}</td>
              <td className="p-2 font-medium">{u.name}</td>
              <td className="p-2 text-gray-500">{u.province}</td>
              <td className="p-2 font-semibold">{numFmt(u.scans)}</td>
              <td className="p-2">{numFmt(u.rights)}</td>
              <td className="p-2 text-gray-400 text-[10px]">{new Date(u.lastScan).toLocaleDateString('th-TH')}</td>
            </tr>
          ))}
        </DataTable>
        <InsightInline html="Top 1 สแกนมากกว่าค่าเฉลี่ย <b>~10x</b> — ควรตรวจสอบพฤติกรรมซ้ำผ่าน Risk tab" />
      </ChartCard>

      {/* ── Province Heatmap (Top 10 as horizontal bars) ── */}
      <ChartCard title="Top 10 จังหวัด" icon="ti-map-pin" full>
        <div className="space-y-2">
          {topProvinces.map(([name, scans], i) => (
            <div key={name} className="flex items-center gap-2 text-[11px]">
              <span className="w-5 text-right font-semibold text-[var(--primary)]">{i + 1}</span>
              <span className="w-24 truncate font-medium">{name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{ width: `${(scans / maxProvScans) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right text-gray-500">{numFmt(scans)}</span>
            </div>
          ))}
        </div>
        <InsightInline html="กรุงเทพฯ ยังเป็นฐาน scan หลัก — ต้อง push <b>ต่างจังหวัด</b> ผ่าน ตัวแทนจำหน่าย + LINE" />
      </ChartCard>

      {/* ── Engagement Decay ── */}
      <ChartCard title="Engagement Decay" icon="ti-chart-bar" full>
        <div className="space-y-3">
          {[
            { label: '0-7 วัน', count: 187, pct: 43, color: '#1D9E75' },
            { label: '8-14 วัน', count: 112, pct: 26, color: '#0F6E56' },
            { label: '15-30 วัน', count: 89, pct: 20, color: '#EF9F27' },
            { label: '30+ วัน', count: 48, pct: 11, color: '#e74c3c' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 text-[11px]">
              <span className="w-16 font-medium">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center pl-2 text-white text-[10px] font-semibold transition-all"
                  style={{ width: `${item.pct}%`, backgroundColor: item.color, minWidth: 40 }}
                >
                  {item.count} คน
                </div>
              </div>
              <span className="w-10 text-right text-gray-500 font-semibold">{item.pct}%</span>
            </div>
          ))}
        </div>
        <InsightInline severity="warn" html="<b>30+ วัน 48 คน (11%)</b> — กลุ่มนี้ใกล้หลุด ต้องทำ win-back campaign ด่วน" />
      </ChartCard>

      {/* ── Actions ── */}
      <InsightCard html={`
        <b>1. LINE broadcast →</b> Light 324 คน ส่งคูปอง "สแกนครบ 5 ครั้ง ได้สิทธิ์ x2"<br/>
        <b>2. VIP program →</b> Heavy 24 คน — early access รางวัลพิเศษ<br/>
        <b>3. Win-back →</b> 30+ วัน 48 คน — ส่ง LINE push "กลับมาลุ้นต่อ ยังมีรางวัลเหลือ"<br/>
        <b>4. ต่างจังหวัด:</b> เพิ่ม awareness ผ่าน TikTok + ตัวแทนจำหน่าย
      `} />
    </div>
  )
}
