'use client'
import { useState, useMemo } from 'react'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import DateRangeFilter, { computeRange, type DateRange } from '@/components/ui/DateRangeFilter'
import { DAILY_STATS, RANK_MOVEMENT, DEAD_SKUS_3DAY, HIGH_VELOCITY, type DailyStat } from '@/lib/daily-sku-data'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

const CAMPAIGN_START = '2026-05-16'
const CAMPAIGN_END   = '2026-05-18'

// Match a single-day date to a DailyStat. If range spans multiple days → return null (caller shows fallback)
function pickDay(from: string, to: string): DailyStat | null {
  if (from !== to) return null
  return DAILY_STATS.find(d => d.date === from) || null
}

const DEFAULT_RANGE: DateRange = (() => {
  // Default to Day 1 (16 พ.ค.) for the day-specific Top 15 view
  return { preset: 'custom', from: '2026-05-16', to: '2026-05-16' }
})()

const TREND_ICON: Record<string, { icon: string; color: string; label: string }> = {
  up:    { icon: 'ti-trending-up',   color: 'var(--primary)',     label: '↑'  },
  down:  { icon: 'ti-trending-down', color: 'var(--red)',         label: '↓'  },
  flat:  { icon: 'ti-minus',         color: 'var(--text-muted)',  label: '—'  },
  mixed: { icon: 'ti-arrows-shuffle', color: '#ca8a04',           label: '↕'  },
}

export default function DailyCampaignBreakdown() {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE)
  const day = useMemo(() => pickDay(dateRange.from, dateRange.to), [dateRange.from, dateRange.to])
  const total3day = DAILY_STATS.reduce((s, d) => s + d.totalRights, 0)
  const totalUsers3day = DAILY_STATS.reduce((s, d) => s + d.uniqueUsers, 0)

  return (
    <ChartCard title="Daily Campaign Breakdown — 16-18 พ.ค." icon="ti-calendar-stats" full>
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

      {/* ── Date selector (same UX as Overview) ── */}
      <div className="mt-4 mb-3">
        <div className="text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1.5">
          <i className="ti ti-calendar text-sm text-[var(--primary)] mr-1" />
          เลือกวันที่ดู Top 15 SKU
        </div>
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          minDate={CAMPAIGN_START}
          maxDate={CAMPAIGN_END}
        />
      </div>

      {/* ── Top 15 SKU of selected day ── */}
      {!day && (
        <div className="bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg p-6 text-center text-[12px] text-[var(--text-secondary)]">
          <i className="ti ti-info-circle text-2xl text-[var(--primary)] block mb-1" />
          เลือก <b>"กำหนดเอง"</b> แล้วเลือกวันเดียว (16 / 17 / 18 พ.ค.) เพื่อดู Top 15 SKU ของวันนั้น
          <div className="text-[10.5px] mt-1 text-[var(--text-muted)]">ถ้าเลือกหลายวัน → ดู KPI summary ด้านบนเท่านั้น</div>
        </div>
      )}
      {day && <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10.5px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-center py-2 px-2 w-10">#</th>
              <th className="text-left   py-2 px-2 w-24">SKU</th>
              <th className="text-left   py-2 px-2">ชื่อ</th>
              <th className="text-right  py-2 px-2 w-20">สิทธิ์</th>
              <th className="text-right  py-2 px-2 w-16">Users</th>
              <th className="text-right  py-2 px-2 w-16">/คน</th>
              <th className="text-right  py-2 px-2 w-20">% วัน</th>
              <th className="text-left   py-2 px-2 w-28">share</th>
            </tr>
          </thead>
          <tbody>
            {day.top.map(r => (
              <tr key={r.sku} className="border-b border-[var(--border-soft)] hover:bg-[var(--green-50)]/40">
                <td className="text-center py-1.5 px-2">
                  {r.rank <= 3
                    ? <span className={`rank ${r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : 'rank-3'}`} style={{ width: 22, height: 22, fontSize: 10 }}>{r.rank}</span>
                    : <span className="num text-[var(--text-muted)] text-[11px]">{r.rank}</span>
                  }
                </td>
                <td className="py-1.5 px-2 font-mono text-[10.5px] text-[var(--green-700)] font-semibold">{r.sku}</td>
                <td className="py-1.5 px-2 truncate text-[var(--dark)] font-medium max-w-[280px]" title={r.name}>{r.name}</td>
                <td className="text-right py-1.5 px-2 num font-bold text-[var(--dark)]">{numFmt(r.rights)}</td>
                <td className="text-right py-1.5 px-2 num text-[var(--text)]">{numFmt(r.users)}</td>
                <td className="text-right py-1.5 px-2 num text-[var(--text-secondary)]">{r.rightsPerUser.toFixed(2)}</td>
                <td className="text-right py-1.5 px-2 num text-[var(--green-700)] font-bold">{r.pctOfDay.toFixed(1)}%</td>
                <td className="py-1.5 px-2">
                  <div className="progress" style={{ height: 5 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, r.pctOfDay * 2.5)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {day && <InsightInline
        html={`Top 15 ของ <b>${day.date.split('-')[2]} พ.ค.</b> รวมส่วนแบ่ง <b>${day.top.reduce((s, r) => s + r.pctOfDay, 0).toFixed(1)}%</b> ของวัน — L3-8G ครอง <b>${day.top[0].pctOfDay.toFixed(1)}%</b>`}
      />}

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
