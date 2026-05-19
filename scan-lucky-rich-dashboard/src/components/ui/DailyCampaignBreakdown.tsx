'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { DAILY_STATS, RANK_MOVEMENT, DEAD_SKUS_3DAY, HIGH_VELOCITY } from '@/lib/daily-sku-data'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

const TREND_ICON: Record<string, { icon: string; color: string; label: string }> = {
  up:    { icon: 'ti-trending-up',   color: 'var(--primary)',     label: '↑'  },
  down:  { icon: 'ti-trending-down', color: 'var(--red)',         label: '↓'  },
  flat:  { icon: 'ti-minus',         color: 'var(--text-muted)',  label: '—'  },
  mixed: { icon: 'ti-arrows-shuffle', color: '#ca8a04',           label: '↕'  },
}

export default function DailyCampaignBreakdown() {
  const total3day = DAILY_STATS.reduce((s, d) => s + d.totalRights, 0)
  const totalUsers3day = DAILY_STATS.reduce((s, d) => s + d.uniqueUsers, 0)

  return (
    <ChartCard title="3-Day Summary + Movement & Dead SKU" icon="ti-calendar-stats" full>
      {/* ── KPI Comparison Table (4 col: D1 / D2 / D3 / รวม) ── */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[11px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-left py-2 px-3 font-bold rounded-l-md">รายการ</th>
              {DAILY_STATS.map(d => (
                <th key={d.date} className="text-right py-2 px-3 font-bold">
                  {d.date.split('-')[2]} พ.ค. <span className="text-[10px] opacity-70">({d.weekday})</span>
                </th>
              ))}
              <th className="text-right py-2 px-3 font-bold text-[var(--green-700)] rounded-r-md">รวม 3 วัน</th>
            </tr>
          </thead>
          <tbody>
            <Row label="สิทธิ์"            values={DAILY_STATS.map(d => d.totalRights)}  total={total3day}    fmt={numFmt} highlight />
            <Row label="Unique users"      values={DAILY_STATS.map(d => d.uniqueUsers)}  total={totalUsers3day} fmt={numFmt} />
            <Row label="SKU มียอด"         values={DAILY_STATS.map(d => d.skuActive)}    total={REAL_CAMPAIGN.activeSkus} fmt={String} suffix={(v) => ` / 93`} />
            <Row label="สิทธิ์/คน"         values={DAILY_STATS.map(d => d.rightsPerUser)} total={total3day / totalUsers3day} fmt={(v) => v.toFixed(2)} />
          </tbody>
        </table>
      </div>

      <InsightInline
        html={`<b>17 พ.ค. (อาทิตย์) peak</b> ที่ ${numFmt(DAILY_STATS[1].totalRights)} สิทธิ์ — โต <b>+${REAL_CAMPAIGN.growthPct}%</b> จาก D1, แล้วลด <b>${REAL_CAMPAIGN.d2d3Pct}%</b> ใน D3 (จันทร์) — เป็น weekend pattern ชัดเจน`}
      />

      {/* ── 2-col: Rank Movement + Dead SKU ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
        {/* Rank Movement */}
        <div className="bg-[var(--bg-soft)] rounded-lg p-3 border border-[var(--border-soft)]">
          <h4 className="text-[12px] font-bold text-[var(--dark)] mb-2 flex items-center gap-1.5">
            <i className="ti ti-arrows-vertical text-[var(--primary)]" />
            Rank Movement — Top 10 ตลอด 3 วัน
          </h4>
          <table className="w-full text-[11px]">
            <thead className="text-[var(--text-muted)] text-[10px] uppercase">
              <tr>
                <th className="text-left py-1">SKU</th>
                <th className="text-center py-1 w-10">16</th>
                <th className="text-center py-1 w-10">17</th>
                <th className="text-center py-1 w-10">18</th>
                <th className="text-center py-1 w-10">Trend</th>
              </tr>
            </thead>
            <tbody>
              {RANK_MOVEMENT.map(m => {
                const t = TREND_ICON[m.trend]
                return (
                  <tr key={m.sku} className="border-t border-[var(--border-soft)]">
                    <td className="py-1.5 truncate max-w-[140px]" title={m.name}>
                      <span className="font-mono text-[10px] text-[var(--green-700)] mr-1">{m.sku}</span>
                    </td>
                    <td className="text-center num text-[var(--text)]">{m.rank16}</td>
                    <td className="text-center num text-[var(--text)]">{m.rank17}</td>
                    <td className="text-center num text-[var(--text)]">{m.rank18}</td>
                    <td className="text-center">
                      <i className={`ti ${t.icon} text-base`} style={{ color: t.color }} title={m.trend} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Dead SKU 3-day */}
        <div className="bg-red-50/40 rounded-lg p-3 border border-red-100">
          <h4 className="text-[12px] font-bold text-[var(--red)] mb-2 flex items-center gap-1.5">
            <i className="ti ti-skull" />
            Dead SKU 3 วันติด ({DEAD_SKUS_3DAY.length} ตัว)
          </h4>
          <p className="text-[10.5px] text-[var(--text-secondary)] mb-2">
            ไม่มีคนสแกนเลยทั้ง 16-17-18 พ.ค. — ตรวจ distribute / QR ติดถูกไหม
          </p>
          <div className="flex flex-wrap gap-1 max-h-[180px] overflow-y-auto">
            {DEAD_SKUS_3DAY.map(d => (
              <span
                key={d.sku}
                className="inline-flex items-center gap-1 bg-white border border-red-200 rounded px-1.5 py-0.5 text-[10px]"
                title={d.name}
              >
                <span className="font-mono text-[var(--red)] font-semibold">{d.sku}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── High velocity SKU ── */}
      <div className="bg-yellow-50/50 border border-yellow-200 rounded-lg p-3 mt-3">
        <h4 className="text-[12px] font-bold text-yellow-800 mb-2 flex items-center gap-1.5">
          <i className="ti ti-flame text-yellow-700" />
          High Velocity Watch — สิทธิ์/คน สูงผิดปกติ
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {HIGH_VELOCITY.map(h => (
            <div key={h.sku + h.day} className="bg-white rounded-md p-2 border border-yellow-100">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-[var(--green-700)] font-semibold">{h.sku}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{h.day}</span>
              </div>
              <div className="text-[11.5px] font-medium text-[var(--dark)] truncate">{h.name}</div>
              <div className="flex justify-between text-[10.5px] mt-0.5">
                <span className="text-[var(--text-secondary)]">{h.users} users</span>
                <span className="num font-bold text-yellow-800">{h.rightsPerUser.toFixed(2)} /คน</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <InsightInline
        html={`Top 10 SKU <b>เหมือนกันเป๊ะทั้ง 3 วัน</b> (แค่สลับ #3↔#4 ใน D3) → portfolio mix นิ่ง ไม่มี seasonality รายวัน | L3-8G ครองอันดับ 1 ทุกวัน ~33% ของยอด`}
      />
    </ChartCard>
  )
}

function Row({ label, values, total, fmt, highlight, suffix }: {
  label: string
  values: number[]
  total: number
  fmt: (v: number) => string
  highlight?: boolean
  suffix?: (v: number) => string
}) {
  return (
    <tr className="border-b border-[var(--border-soft)]">
      <td className="py-2 px-3 font-semibold text-[var(--dark)]">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="text-right py-2 px-3 num text-[var(--text)]">
          {fmt(v)}{suffix?.(v) || ''}
        </td>
      ))}
      <td className={`text-right py-2 px-3 num font-bold ${highlight ? 'text-[var(--green-800)] bg-[var(--green-50)]' : 'text-[var(--dark)]'}`}>
        {fmt(total)}{suffix?.(total) || ''}
      </td>
    </tr>
  )
}
