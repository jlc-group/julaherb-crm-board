'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { WEEKDAY_MATCHED } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

function pctDelta(after: number, before: number): number {
  return before > 0 ? ((after - before) / before) * 100 : 0
}

export default function AppleToAppleComparison() {
  const rows = WEEKDAY_MATCHED.map(r => ({
    ...r,
    delta: r.campaign.scans - r.baseline.scans,
    pct: pctDelta(r.campaign.scans, r.baseline.scans),
  }))

  const avgPct = rows.reduce((s, r) => s + r.pct, 0) / rows.length
  const allNegative = rows.every(r => r.pct < 0)

  return (
    <ChartCard title="Apples-to-Apples — เทียบวันเดียวกันในสัปดาห์" icon="ti-scale" full>
      <div className="text-[11px] text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
        <i className="ti ti-info-circle text-[var(--primary)]" />
        เทียบเฉพาะคู่ที่เป็น <b>วันในสัปดาห์เดียวกัน</b> เท่านั้น — ตัด weekend effect ออก
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[11px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-left   py-2 px-3 font-bold rounded-l-md">วัน</th>
              <th className="text-right  py-2 px-3 font-bold">ก่อนแคมเปญ</th>
              <th className="text-center py-2 px-3 font-bold w-12">→</th>
              <th className="text-right  py-2 px-3 font-bold text-[var(--green-700)]">แคมเปญ (พ.ค.)</th>
              <th className="text-right  py-2 px-3 font-bold">Δ จำนวน</th>
              <th className="text-right  py-2 px-3 font-bold rounded-r-md">Δ %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const negative = r.pct < 0
              return (
                <tr key={r.weekday} className="border-b border-[var(--border-soft)] hover:bg-[var(--green-50)]/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-extrabold text-[var(--dark)] text-base">{r.weekday}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">weekday match</div>
                  </td>
                  <td className="text-right py-3 px-3">
                    <div className="num font-semibold text-[var(--text)]">{numFmt(r.baseline.scans)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{r.baseline.date} ({r.baseline.label})</div>
                  </td>
                  <td className="text-center py-3 px-3 text-[var(--text-muted)]">
                    <i className="ti ti-arrow-right text-lg" />
                  </td>
                  <td className="text-right py-3 px-3 bg-[var(--green-50)]/50">
                    <div className="num font-bold text-[var(--green-800)]">{numFmt(r.campaign.scans)}</div>
                    <div className="text-[10px] text-[var(--green-700)] font-semibold">{r.campaign.date} ({r.campaign.label})</div>
                  </td>
                  <td className={`text-right py-3 px-3 num font-bold ${negative ? 'text-[var(--red)]' : 'text-[var(--primary)]'}`}>
                    {negative ? '' : '+'}{numFmt(r.delta)}
                  </td>
                  <td className={`text-right py-3 px-3 num font-extrabold text-base ${negative ? 'text-[var(--red)]' : 'text-[var(--primary)]'}`}>
                    {negative ? '' : '+'}{r.pct.toFixed(1)}% {negative ? '❌' : '✅'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--green-50)] border-t-2 border-[var(--green-200)]">
              <td colSpan={5} className="text-right py-2.5 px-3 font-bold text-[var(--dark)] uppercase tracking-wider text-[11px]">
                เฉลี่ย apples-to-apples lift
              </td>
              <td className={`text-right py-2.5 px-3 num font-extrabold text-base ${avgPct < 0 ? 'text-[var(--red)]' : 'text-[var(--primary)]'}`}>
                {avgPct < 0 ? '' : '+'}{avgPct.toFixed(1)}% {avgPct < 0 ? '❌' : '✅'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <InsightInline
        severity={allNegative ? 'danger' : 'warn'}
        html={
          allNegative
            ? `⚠️ <b>ทั้ง 2 คู่ที่เทียบได้ทุกตัวลดลง</b> — Mon ${rows[0].pct.toFixed(1)}%, Sat ${rows[1].pct.toFixed(1)}% → เมื่อตัด weekend effect ออก <b>แคมเปญไม่ดันยอดเลย กลับลดลงเฉลี่ย ${avgPct.toFixed(1)}%</b>`
            : `เฉลี่ยเทียบวันเดียวกัน: <b>${avgPct >= 0 ? '+' : ''}${avgPct.toFixed(1)}%</b>`
        }
      />

      <div className="mt-3 text-[10.5px] text-[var(--text-muted)] italic bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-start gap-1.5">
        <i className="ti ti-alert-triangle mt-0.5 text-yellow-700" />
        <span>
          <b>Limitation:</b> ใน dataset 16-17-18 มี.ค./เม.ย./พ.ค. มีคู่ที่ weekday ตรงกันแค่ <b>2 คู่</b> (จันทร์, เสาร์)
          — ถ้าต้องการ statistical significance ต้องดึง data ของวันอื่นใน 3 เดือนนั้นมาเทียบเพิ่ม
        </span>
      </div>
    </ChartCard>
  )
}
