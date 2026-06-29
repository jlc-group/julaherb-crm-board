'use client'
// 📈 ภาพรวมการสแกนทั้งปี (สไลด์ 2) — All Scan รายเดือน + forecast + scenarios
// ⚠️ ข้อมูล hardcode จากสไลด์ (ยังไม่มี API) — ดู src/config/campaign-monthly.ts (TODO ต่อ API)
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend,
} from 'chart.js'
import { numFmt } from '@/lib/utils'
import {
  MONTHLY_ALL_SCAN, YEAR_OVERVIEW_META as M, JUNE_CLOSE_SCENARIOS,
} from '@/config/campaign-monthly'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const COLOR: Record<string, string> = {
  actual: '#1D9E75',   // เขียว
  partial: '#cbd5e1',  // เทา (เดือนยังไม่จบ)
  forecast: '#EF9F27', // ทอง (คาดการณ์)
}

export default function YearOverviewCard() {
  const labels = MONTHLY_ALL_SCAN.map((m) => m.month)
  const values = MONTHLY_ALL_SCAN.map((m) => m.value)
  const colors = MONTHLY_ALL_SCAN.map((m) => COLOR[m.kind])

  return (
    <div className="card p-4 float-up">
      {/* หัวข้อ + ป้ายแหล่งข้อมูล */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-chart-bar text-base text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">📈 ภาพรวมการสแกนทั้งปี — All Scan รายเดือน</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-amber-100 text-amber-800 align-middle"
              title="ข้อมูลจริงจากทีม นำมาจากสไลด์ Campaign Update — รอต่อ API รายเดือน">
          📊 ข้อมูลสไลด์ · รอต่อ API
        </span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">ม.ค. – มิ.ย. 2026 (ระดับแพลตฟอร์ม) · พร้อม Forecast ปิดเดือน มิ.ย.</div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="kpi-accent kpi-mint" title="สแกนเดือนนี้ (ยังไม่จบเดือน)">
          <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">มิ.ย. ปัจจุบัน ({M.daysElapsed}/{M.daysTotal} วัน)</div>
          <div className="text-[24px] font-bold leading-tight">{numFmt(M.currentScans)}</div>
          <div className="text-[10.5px] text-[var(--text-muted)] mt-1">{numFmt(M.currentRatePerDay)} สแกน/วัน · สูงกว่าเฉลี่ย <b className="text-[var(--positive)]">+{M.liftVsAvgPct}%</b></div>
        </div>
        <div className="kpi-accent kpi-lavender" title="คาดการณ์ปิดเดือน (Base case)">
          <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">Forecast ปิดเดือน</div>
          <div className="text-[24px] font-bold leading-tight" style={{ color: '#b45309' }}>{numFmt(M.forecastClose)}</div>
          <div className="text-[10.5px] text-[var(--text-muted)] mt-1"><b className="text-[var(--positive)]">+{M.forecastMoMPct}%</b> vs พ.ค.</div>
        </div>
        <div className="kpi-accent kpi-coral" title="เทียบ All-Time High เดิม (ม.ค.)">
          <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">vs สูงสุดเดิม ({M.prevAthMonth})</div>
          <div className="text-[24px] font-bold leading-tight">+{M.forecastVsAthPct}%</div>
          <div className="text-[10.5px] text-[var(--text-muted)] mt-1">ทุบสถิติ {numFmt(M.prevAth)} 🏆</div>
        </div>
        <div className="kpi-accent kpi-pink" title="ที่เหลือเพื่อถึง forecast">
          <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">เหลือ {M.daysLeft} วัน</div>
          <div className="text-[24px] font-bold leading-tight">{numFmt(M.scansNeeded)}</div>
          <div className="text-[10.5px] text-[var(--text-muted)] mt-1">ต้องทำอีกเพื่อถึงเป้า</div>
        </div>
      </div>

      {/* กราฟแท่งรายเดือน */}
      <div style={{ height: 260 }}>
        <Bar
          data={{
            labels,
            datasets: [{
              label: 'All Scan',
              data: values,
              backgroundColor: colors,
              borderRadius: 5,
              borderColor: MONTHLY_ALL_SCAN.map((m) => (m.kind === 'forecast' ? '#b45309' : 'transparent')),
              borderWidth: MONTHLY_ALL_SCAN.map((m) => (m.kind === 'forecast' ? 1.5 : 0)),
              barPercentage: 0.72,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (c) => {
                    const m = MONTHLY_ALL_SCAN[c.dataIndex]
                    const mom = m.momPct != null ? ` (${m.momPct > 0 ? '+' : ''}${m.momPct}% MoM)` : ''
                    return `${numFmt(Number(c.parsed.y))} สแกน${mom}`
                  },
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 9.5 } } },
              y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => numFmt(Number(v)) } },
            },
          }}
        />
      </div>

      {/* legend สี */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: COLOR.actual }} /> Actual</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: COLOR.partial }} /> เดือนยังไม่จบ</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-[#b45309]" style={{ background: COLOR.forecast }} /> Forecast</span>
      </div>

      {/* 3 Scenarios ปิดเดือน */}
      <div className="mt-4 pt-3 border-t border-[var(--border-soft)]">
        <div className="text-[11px] font-bold text-[var(--dark)] mb-2">🎯 Scenarios ปิดเดือน มิ.ย.</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {JUNE_CLOSE_SCENARIOS.map((s) => {
            const isBase = s.key === 'base'
            return (
              <div key={s.key} className="rounded-xl p-3 border"
                   style={isBase
                     ? { background: '#f0fdf4', borderColor: '#16a34a', borderWidth: 1.5 }
                     : { background: 'var(--bg-soft)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--dark)]">
                  <span>{s.emoji}</span> {s.label}
                  <span className="ml-auto text-[9.5px] font-semibold text-[var(--text-muted)]">{s.likelyPct}% likely</span>
                </div>
                <div className="text-[20px] font-bold leading-tight mt-1" style={{ color: isBase ? '#15803d' : 'var(--text)' }}>{numFmt(s.value)}</div>
                <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5"><b className="text-[var(--positive)]">+{s.momPct}%</b> MoM · {s.note}</div>
              </div>
            )
          })}
        </div>
        <div className="text-[10.5px] text-[var(--text-secondary)] mt-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2">
          💡 <b>Base case = New All-Time High</b> — สูงกว่าเดือน ม.ค. ({numFmt(M.prevAth)}) เดิม
        </div>
      </div>
    </div>
  )
}
