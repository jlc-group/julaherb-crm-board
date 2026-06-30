'use client'
// 📊 สแกน & สิทธิ์ รายเดือน (เทียบ % โต) — คำนวณจริงจาก /api/daily ทั้งแคมเปญ
// หมายเหตุ: ข้อมูลแคมเปญเริ่ม 16 พ.ค. → เดือนแรก/เดือนล่าสุดอาจเป็นเดือนไม่เต็ม (มีป้ายกำกับ)
import { useApi } from '@/lib/hooks/useApi'
import { numFmt, CAMPAIGN_START, getCampaignToday } from '@/lib/utils'
import type { DailyRow } from '@/lib/api/types'

const TH_MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

interface MonthAgg { ym: string; label: string; scans: number; rights: number; days: number; partial: boolean }

export default function MonthlyScanRightsCard() {
  const to = getCampaignToday().toISOString().slice(0, 10)
  const { data, loading } = useApi<DailyRow[]>(`/api/daily?from=${CAMPAIGN_START}&to=${to}`)
  const rows = (data ?? []).slice().sort((a, b) => a.date.localeCompare(b.date))

  const map = new Map<string, { scans: number; rights: number; days: number }>()
  for (const r of rows) {
    const ym = r.date.slice(0, 7)
    const cur = map.get(ym) ?? { scans: 0, rights: 0, days: 0 }
    cur.scans += r.success
    cur.rights += (r.expectedTickets ?? r.tickets ?? 0)
    cur.days += 1
    map.set(ym, cur)
  }
  const lastYm = rows.length ? rows[rows.length - 1].date.slice(0, 7) : ''
  const months: MonthAgg[] = Array.from(map.keys()).sort().map((ym) => {
    const v = map.get(ym)!
    const m = Number(ym.split('-')[1])
    const daysInMonth = new Date(Number(ym.split('-')[0]), m, 0).getDate()
    const partial = v.days < daysInMonth || ym === lastYm
    return { ym, label: TH_MO[m - 1], scans: v.scans, rights: v.rights, days: v.days, partial }
  })

  const pct = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : null)
  const fmtPct = (p: number | null) => (p == null ? '—' : `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`)
  const pctColor = (p: number | null) => (p == null ? 'var(--text-muted)' : p >= 0 ? 'var(--positive)' : '#dc2626')

  if (loading && !months.length) {
    return <div className="card p-4 text-[12px] text-[var(--text-muted)]">กำลังโหลดข้อมูลรายเดือน…</div>
  }

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-1">
        <i className="ti ti-calendar-stats text-base text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">📊 สแกน & สิทธิ์ รายเดือน (เทียบเดือนก่อนหน้า)</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">เฉพาะช่วงแคมเปญ (16 พ.ค.+) · <b>% โต เทียบ “เฉลี่ย/วัน”</b> (ยุติธรรม เพราะบางเดือนไม่เต็ม)</div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
              <th className="text-left py-1.5 px-2">เดือน</th>
              <th className="text-right py-1.5 px-2">สแกน/วัน</th>
              <th className="text-right py-1.5 px-2">% โต</th>
              <th className="text-right py-1.5 px-2">สิทธิ์/วัน</th>
              <th className="text-right py-1.5 px-2">% โต</th>
              <th className="text-right py-1.5 px-2">รวม</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => {
              const prev = months[i - 1]
              const aScan = m.scans / m.days
              const aRight = m.rights / m.days
              const scanPct = prev ? pct(aScan, prev.scans / prev.days) : null
              const rightPct = prev ? pct(aRight, prev.rights / prev.days) : null
              return (
                <tr key={m.ym} className="border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)]">
                  <td className="py-1.5 px-2 font-semibold text-[var(--dark)]">
                    {m.label}
                    {m.partial && <span className="ml-1.5 text-[9px] font-normal text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-0.5">บางส่วน</span>}
                  </td>
                  <td className="text-right py-1.5 px-2 num font-bold text-[var(--green-700)]">{numFmt(Math.round(aScan))}</td>
                  <td className="text-right py-1.5 px-2 num font-bold" style={{ color: pctColor(scanPct) }}>{fmtPct(scanPct)}</td>
                  <td className="text-right py-1.5 px-2 num font-bold text-[#b45309]">{numFmt(Math.round(aRight))}</td>
                  <td className="text-right py-1.5 px-2 num font-bold" style={{ color: pctColor(rightPct) }}>{fmtPct(rightPct)}</td>
                  <td className="text-right py-1.5 px-2 num text-[10.5px] text-[var(--text-muted)]">{numFmt(m.scans)}<span className="opacity-60"> · {m.days}ว.</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {months.length < 2 && (
        <div className="text-[10.5px] text-[var(--text-secondary)] mt-2.5 bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg px-3 py-2">
          ℹ️ มีข้อมูลแคมเปญเดือนเดียว — ตัวเลข % เทียบเดือนจะแสดงเมื่อมีอย่างน้อย 2 เดือน
        </div>
      )}
    </div>
  )
}
