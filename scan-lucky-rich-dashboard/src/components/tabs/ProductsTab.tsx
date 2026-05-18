'use client'
import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import ProductMasterTable from '@/components/ui/ProductMasterTable'
import { numFmt } from '@/lib/utils'
import { buildSkuTable, getTierBuckets } from '@/lib/sku-redemption'
import { REAL_CAMPAIGN } from '@/lib/real-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)
ChartJS.defaults.font.family = "'Noto Sans Thai', sans-serif"
ChartJS.defaults.font.size = 11
ChartJS.defaults.color = '#6b7280'

const TIER_COLORS: Record<string, string> = {
  '1':     '#22c55e',  // green-500 — สิทธิ์น้อย / ซองเล็ก
  '2':     '#16a34a',  // green-600 — กลาง
  '3plus': '#facc15',  // yellow — premium / set
}

export default function ProductsTab() {
  const allRows = useMemo(() => buildSkuTable(), [])
  const tiers = useMemo(() => getTierBuckets(allRows), [allRows])

  const totalRightsClaimed = allRows.reduce((s, r) => s + r.rightsRedeemed, 0)
  const totalSku  = allRows.length
  const heroCount = allRows.filter(r => r.status === 'hero').length
  const deadCount = allRows.filter(r => r.status === 'dead').length

  return (
    <div className="space-y-5">
      {/* ── Top KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard
          label="SKU ทั้งหมด"
          value={String(totalSku)}
          sub={`Active ${totalSku - deadCount} • Dead ${deadCount}`}
        />
        <KpiCard
          label="สิทธิ์ที่แลกแล้ว"
          value={numFmt(totalRightsClaimed)}
          sub={`จาก ${numFmt(REAL_CAMPAIGN.uniqueUsers)} users`}
          gold
        />
        {tiers.map(t => (
          <KpiCard
            key={t.key}
            label={`Tier: ${t.label}`}
            value={`${t.skuCount} SKU`}
            sub={`${numFmt(t.rightsClaimed)} สิทธิ์ • ${t.sharePct.toFixed(1)}%`}
          />
        ))}
      </div>

      <InsightInline html={`<b>${tiers[0]?.skuCount || 0} SKU</b> ระดับ <b>1 สิทธิ์</b> (ซอง) สร้างสิทธิ์ <b>${tiers[0]?.sharePct.toFixed(0) || 0}%</b> ของแคมเปญ — sachet-driven ชัดเจน`} />

      {/* ── Charts row: Funnel + Donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier Funnel by rights-bucket */}
        <ChartCard title="Tier Funnel (สิทธิ์ที่แลกตาม Tier)" icon="ti-arrow-big-down-lines">
          <div className="flex flex-col items-center gap-3 py-4">
            {tiers.map((t, i) => {
              const maxRights = Math.max(...tiers.map(x => x.rightsClaimed)) || 1
              const widthPct = Math.max(28, (t.rightsClaimed / maxRights) * 90)
              const conv = i > 0 && tiers[0].rightsClaimed > 0
                ? Math.round((t.rightsClaimed / tiers[0].rightsClaimed) * 100)
                : null
              return (
                <div key={t.key} className="w-full flex flex-col items-center">
                  {i > 0 && conv !== null && (
                    <div className="text-[10px] text-[var(--text-muted)] mb-1">↓ {conv}% ของ tier 1</div>
                  )}
                  <div
                    className="rounded-lg py-3 px-4 text-center text-white font-semibold text-[12px] shadow-sm"
                    style={{ width: `${widthPct}%`, background: TIER_COLORS[t.key] }}
                  >
                    <div className="text-[10px] uppercase tracking-wider opacity-90">{t.label}</div>
                    <div className="num text-[15px] leading-tight mt-0.5">{numFmt(t.rightsClaimed)}</div>
                    <div className="text-[10px] opacity-90">{t.skuCount} SKU</div>
                  </div>
                </div>
              )
            })}
          </div>
          <InsightInline html="สิทธิ์กระจุกที่ <b>tier 1 สิทธิ์</b> (ซองเล็ก) — แคมเปญพึ่ง trial pack เป็นหลัก" />
        </ChartCard>

        {/* Tier Share Donut */}
        <ChartCard title="สัดส่วนสิทธิ์ตาม Tier" icon="ti-chart-donut-3">
          <div style={{ height: 240 }} className="flex items-center justify-center">
            <div style={{ width: 220, height: 220 }}>
              <Doughnut
                data={{
                  labels: tiers.map(t => t.label),
                  datasets: [{
                    data: tiers.map(t => t.rightsClaimed),
                    backgroundColor: tiers.map(t => TIER_COLORS[t.key]),
                    borderWidth: 0,
                  }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '60%',
                  plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const t = tiers[ctx.dataIndex]
                          return `${t.label}: ${numFmt(t.rightsClaimed)} (${t.sharePct.toFixed(1)}%)`
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
          <InsightInline html={`<b>Tier 1 สิทธิ์</b> ครอง <b>${tiers[0]?.sharePct.toFixed(0) || 0}%</b> — โอกาส grow premium tier ผ่าน bundling`} />
        </ChartCard>
      </div>

      {/* ── 97 SKU Master Table ── */}
      <ProductMasterTable />

      {/* ── Actions ── */}
      <InsightCard html={`
        <b>1. Bundle promotion:</b> จับคู่ tier 1 + tier 2 ให้สิทธิ์ x2 — push customers ขึ้น tier<br/>
        <b>2. Dead SKU (${deadCount}):</b> ทำ flash sale ลด 30% + สิทธิ์ลุ้นพิเศษ ดึงให้ขึ้น Active<br/>
        <b>3. Premium tier focus:</b> tier 3+ ให้สิทธิ์เยอะแต่ส่วนแบ่งน้อย — ทำ content "ซื้อเซ็ตลุ้นได้มากกว่า"<br/>
        <b>4. Hero SKU protection:</b> ${heroCount} SKU hero สร้าง impact สูงสุด — monitor stock + POSM ทุกวัน
      `} />
    </div>
  )
}
