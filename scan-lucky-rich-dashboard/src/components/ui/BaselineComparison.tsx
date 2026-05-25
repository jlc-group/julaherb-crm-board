'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

function pctDelta(after: number, before: number): number {
  return before > 0 ? ((after - before) / before) * 100 : 0
}

export default function BaselineComparison() {
  const rows = DAILY_ENTRIES.map(d => ({
    day: d.date.split('-')[2],
    weekday: d.weekday,
    outage: d.outage,
    mar: d.baselineMar,
    apr: d.baselineApr,
    may: { scans: d.success, users: d.uniqueUsers, weekday: d.weekday },
    deltaApr: pctDelta(d.success, d.baselineApr.scans),
    deltaMar: pctDelta(d.success, d.baselineMar.scans),
  }))

  const totalMar = rows.reduce((s, r) => s + r.mar.scans, 0)
  const totalApr = rows.reduce((s, r) => s + r.apr.scans, 0)
  const totalMay = rows.reduce((s, r) => s + r.may.scans, 0)
  const totalDeltaApr = pctDelta(totalMay, totalApr)
  const totalDeltaMar = pctDelta(totalMay, totalMar)

  const lastDay = rows[rows.length - 1]
  const lastDate = `${lastDay.day} พ.ค.`

  return (
    <ChartCard title={`เทียบรายวัน — มี.ค. / เม.ย. / พ.ค. (ครบ ${rows.length} วัน)`} icon="ti-target" full>
      <div className="text-[11.5px] text-[var(--text-secondary)] mb-3">
        <b className="text-[var(--dark)]">มี.ค.</b> = ไม่มีแคมเปญ (baseline) •
        <b className="text-[var(--dark)] ml-2">เม.ย.</b> = ช่วงสงกรานต์ •
        <b className="text-[var(--green-700)] ml-2">พ.ค. 🎯</b> = แคมเปญสแกนลุ้นรวย
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10.5px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-center py-2 px-3 font-bold">วัน</th>
              <th className="text-right  py-2 px-3 font-bold">มี.ค. <span className="opacity-60 text-[9px]">no campaign</span></th>
              <th className="text-right  py-2 px-3 font-bold">เม.ย. <span className="opacity-60 text-[9px]">สงกรานต์</span></th>
              <th className="text-right  py-2 px-3 font-bold text-[var(--green-700)]">พ.ค. 🎯</th>
              <th className="text-right  py-2 px-3 font-bold">Δ vs เม.ย.</th>
              <th className="text-right  py-2 px-3 font-bold">Δ vs มี.ค. <span className="text-[var(--gold)] text-[9px]">⭐ true</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const aprPos = r.deltaApr >= 0
              const marPos = r.deltaMar >= 0
              return (
                <tr key={r.day} className={`border-b border-[var(--border-soft)] hover:bg-[var(--green-50)]/40 transition ${r.outage ? 'bg-red-50/30' : ''}`}>
                  <td className="text-center py-2.5 px-3">
                    <div className="num text-[15px] font-extrabold text-[var(--green-700)]">{r.day}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{r.weekday}</div>
                    {r.outage && <div className="text-[8.5px] text-[var(--red)] font-bold">🚨 outage</div>}
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <div className="num font-semibold text-[var(--text)]">{numFmt(r.mar.scans)}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">({r.mar.weekday})</div>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <div className="num font-semibold text-[var(--text)]">{numFmt(r.apr.scans)}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">({r.apr.weekday})</div>
                  </td>
                  <td className="text-right py-2.5 px-3 bg-[var(--green-50)]/40">
                    <div className="num font-bold text-[var(--green-800)]">{numFmt(r.may.scans)}</div>
                    <div className="text-[9px] text-[var(--text-secondary)] font-semibold">({r.weekday})</div>
                  </td>
                  <td className={`text-right py-2.5 px-3 num font-bold ${aprPos ? 'text-[var(--green-700)]' : 'text-[var(--red)]'}`}>
                    {aprPos ? '+' : ''}{r.deltaApr.toFixed(1)}% {aprPos ? '✅' : '❌'}
                  </td>
                  <td className={`text-right py-2.5 px-3 num font-bold ${marPos ? 'text-[var(--green-700)]' : 'text-[var(--red)]'}`}>
                    {marPos ? '+' : ''}{r.deltaMar.toFixed(1)}% {marPos ? '✅' : '❌'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--green-50)] border-t-2 border-[var(--green-200)] font-bold">
              <td className="text-center py-2.5 px-3 text-[var(--dark)] uppercase tracking-wider text-[11px]">รวม</td>
              <td className="text-right py-2.5 px-3 num text-[var(--dark)]">{numFmt(totalMar)}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--dark)]">{numFmt(totalApr)}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--green-800)] bg-[var(--green-100)]">{numFmt(totalMay)}</td>
              <td className={`text-right py-2.5 px-3 num ${totalDeltaApr >= 0 ? 'text-[var(--green-700)]' : 'text-[var(--red)]'}`}>
                {totalDeltaApr >= 0 ? '+' : ''}{totalDeltaApr.toFixed(1)}%
              </td>
              <td className={`text-right py-2.5 px-3 num ${totalDeltaMar >= 0 ? 'text-[var(--green-700)]' : 'text-[var(--red)]'}`}>
                {totalDeltaMar >= 0 ? '+' : ''}{totalDeltaMar.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <InsightInline
        severity={totalDeltaMar >= 0 ? 'info' : 'warn'}
        html={`<b>True lift = ${totalDeltaMar >= 0 ? '+' : ''}${totalDeltaMar.toFixed(1)}%</b> เทียบ มี.ค. (baseline สะอาด) • <b>vs เม.ย. = ${totalDeltaApr >= 0 ? '+' : ''}${totalDeltaApr.toFixed(1)}%</b> (เม.ย. มีสงกรานต์) • อัปเดตล่าสุด: <b>${lastDate} (${lastDay.weekday})</b>`}
      />

      {rows.some(r => r.outage) && (
        <InsightInline
          severity="danger"
          html={`⚠️ วันที่ <b>${rows.find(r => r.outage)?.day} พ.ค.</b> มี outage 6 ชม. → ตัวเลขนั้นไม่ apples-to-apples`}
        />
      )}
    </ChartCard>
  )
}
