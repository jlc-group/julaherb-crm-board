'use client'
// 🎯 New vs Returning รายเดือน (สไลด์ 7) — ลูกค้าใหม่ vs เก่า เทียบเดือน · /api/members/daily
import { useApi } from '@/lib/hooks/useApi'
import { numFmt, CAMPAIGN_START, getCampaignToday } from '@/lib/utils'
import type { MembersDailyResponse } from '@/lib/api/types'

const TH_MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

interface MonthAgg { ym: string; label: string; neo: number; old: number; total: number; newPct: number }

export default function NewVsReturningCard() {
  const to = getCampaignToday().toISOString().slice(0, 10)
  const { data, loading } = useApi<MembersDailyResponse>(`/api/members/daily?from=${CAMPAIGN_START}&to=${to}`)
  const rows = data?.rows ?? []

  const map = new Map<string, { neo: number; old: number }>()
  for (const r of rows) {
    const ym = r.date.slice(0, 7)
    const cur = map.get(ym) ?? { neo: 0, old: 0 }
    cur.neo += r.memberNew
    cur.old += r.memberOld
    map.set(ym, cur)
  }
  const months: MonthAgg[] = Array.from(map.keys()).sort().map((ym) => {
    const v = map.get(ym)!
    const total = v.neo + v.old
    return { ym, label: TH_MO[Number(ym.split('-')[1]) - 1], neo: v.neo, old: v.old, total, newPct: total > 0 ? (v.neo / total) * 100 : 0 }
  })

  const pct = (c: number, p: number) => (p > 0 ? ((c - p) / p) * 100 : null)
  const fmtPct = (p: number | null) => (p == null ? '—' : `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`)
  const col = (p: number | null) => (p == null ? 'var(--text-muted)' : p >= 0 ? 'var(--positive)' : '#dc2626')
  const maxTotal = Math.max(1, ...months.map((m) => m.total))

  if (loading && !months.length) return <div className="card p-4 text-[12px] text-[var(--text-muted)]">กำลังโหลด New vs Returning…</div>

  const latest = months[months.length - 1]
  const prev = months[months.length - 2]

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-1">
        <i className="ti ti-user-plus text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">🎯 New vs Returning — ลูกค้าใหม่ vs เก่า (รายเดือน)</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">เฉพาะช่วงแคมเปญ (16 พ.ค. เป็นต้นไป)</div>

      {/* KPI เดือนล่าสุด vs ก่อนหน้า */}
      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="kpi-accent kpi-pink">
            <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">🟢 ลูกค้าใหม่ ({latest.label})</div>
            <div className="text-[22px] font-bold leading-tight">{numFmt(latest.neo)}</div>
            {prev && <div className="text-[10.5px] mt-1" style={{ color: col(pct(latest.neo, prev.neo)) }}>{fmtPct(pct(latest.neo, prev.neo))} vs {prev.label}</div>}
          </div>
          <div className="kpi-accent kpi-lavender">
            <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">🔵 ลูกค้าเก่า ({latest.label})</div>
            <div className="text-[22px] font-bold leading-tight">{numFmt(latest.old)}</div>
            {prev && <div className="text-[10.5px] mt-1" style={{ color: col(pct(latest.old, prev.old)) }}>{fmtPct(pct(latest.old, prev.old))} vs {prev.label}</div>}
          </div>
          <div className="kpi-accent kpi-mint">
            <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">📊 รวม ({latest.label})</div>
            <div className="text-[22px] font-bold leading-tight">{numFmt(latest.total)}</div>
            {prev && <div className="text-[10.5px] mt-1" style={{ color: col(pct(latest.total, prev.total)) }}>{fmtPct(pct(latest.total, prev.total))} vs {prev.label}</div>}
          </div>
          <div className="kpi-accent kpi-coral">
            <div className="text-[10.5px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mb-1">⚖️ % ลูกค้าใหม่</div>
            <div className="text-[22px] font-bold leading-tight">{latest.newPct.toFixed(1)}%</div>
            {prev && <div className="text-[10.5px] text-[var(--text-muted)] mt-1">{prev.label} = {prev.newPct.toFixed(1)}%</div>}
          </div>
        </div>
      )}

      {/* แท่งเทียบเดือน (stacked ใหม่+เก่า) */}
      <div className="space-y-2 mb-3">
        {months.map((m) => (
          <div key={m.ym} className="flex items-center gap-2">
            <span className="w-10 text-[11px] font-semibold text-[var(--dark)]">{m.label}</span>
            <div className="flex-1 flex h-6 rounded-md overflow-hidden border border-[var(--border)]" title={`ใหม่ ${numFmt(m.neo)} + เก่า ${numFmt(m.old)}`}>
              <div className="flex items-center justify-end pr-1.5 text-[9.5px] font-bold text-white" style={{ background: '#16a34a', width: `${(m.neo / maxTotal) * 100}%` }}>{m.neo > 0 && numFmt(m.neo)}</div>
              <div className="flex items-center justify-end pr-1.5 text-[9.5px] font-bold text-[#5a3a00]" style={{ background: '#facc15', width: `${(m.old / maxTotal) * 100}%` }}>{m.old > 0 && numFmt(m.old)}</div>
            </div>
            <span className="w-16 text-right text-[11px] font-bold num text-[var(--brand-700)]">{numFmt(m.total)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-[var(--text-secondary)] mb-1">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#16a34a' }} /> ลูกค้าใหม่</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#facc15' }} /> ลูกค้าเก่า</span>
      </div>

      {months.length < 2 && (
        <div className="text-[10.5px] text-[var(--text-secondary)] mt-2 bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg px-3 py-2">
          ℹ️ มีข้อมูลเดือนเดียว — % เทียบเดือนจะแสดงเมื่อมี ≥ 2 เดือน
        </div>
      )}
    </div>
  )
}
