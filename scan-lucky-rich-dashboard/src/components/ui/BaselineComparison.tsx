'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { BASELINE_3MO, BASELINE_TOTALS } from '@/lib/scan-behavior-data'
import { numFmt } from '@/lib/utils'

function pctDelta(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0
}

function DeltaCell({ pct }: { pct: number }) {
  const positive = pct >= 0
  const big = Math.abs(pct) >= 10
  const cls = positive
    ? big ? 'text-[var(--green-700)] font-bold' : 'text-[var(--primary)] font-semibold'
    : big ? 'text-[var(--red)] font-bold' : 'text-yellow-700 font-semibold'
  return (
    <span className={cls}>
      {positive ? '+' : ''}{pct.toFixed(1)}% {positive ? '✅' : '❌'}
    </span>
  )
}

export default function BaselineComparison() {
  const totMar = BASELINE_TOTALS.mar
  const totApr = BASELINE_TOTALS.apr
  const totMay = BASELINE_TOTALS.may
  const liftVsApr = pctDelta(totMay, totApr)
  const liftVsMar = pctDelta(totMay, totMar)
  const baselineGrowth = pctDelta(totApr, totMar) // เม.ย. vs มี.ค. (no campaign)

  return (
    <ChartCard title="Baseline Comparison — 16-18 ของ มี.ค./เม.ย./พ.ค." icon="ti-table" full>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[11px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-center py-2 px-3 font-bold rounded-l-md">วันที่</th>
              <th className="text-right py-2 px-3 font-bold">มี.ค.</th>
              <th className="text-right py-2 px-3 font-bold">เม.ย.</th>
              <th className="text-right py-2 px-3 font-bold text-[var(--green-700)]">
                พ.ค. 🎯
              </th>
              <th className="text-right py-2 px-3 font-bold">Δ vs เม.ย.</th>
              <th className="text-right py-2 px-3 font-bold rounded-r-md">Δ vs มี.ค.</th>
            </tr>
          </thead>
          <tbody>
            {BASELINE_3MO.map(r => {
              const dApr = pctDelta(r.may.scans, r.apr.scans)
              const dMar = pctDelta(r.may.scans, r.mar.scans)
              return (
                <tr key={r.day} className="border-b border-[var(--border-soft)] hover:bg-[var(--green-50)]/40 transition">
                  <td className="text-center py-2.5 px-3 num font-extrabold text-[var(--dark)] text-base">{r.day}</td>
                  <td className="text-right py-2.5 px-3">
                    <span className="num font-semibold text-[var(--text)]">{numFmt(r.mar.scans)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-1">({r.mar.weekday})</span>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <span className="num font-semibold text-[var(--text)]">{numFmt(r.apr.scans)}</span>
                    <span className="text-[10px] text-[var(--text-muted)] ml-1">({r.apr.weekday})</span>
                  </td>
                  <td className="text-right py-2.5 px-3 bg-[var(--green-50)]/50">
                    <span className="num font-bold text-[var(--green-800)]">{numFmt(r.may.scans)}</span>
                    <span className="text-[10px] text-[var(--green-700)] ml-1 font-semibold">({r.may.weekday})</span>
                  </td>
                  <td className="text-right py-2.5 px-3 num"><DeltaCell pct={dApr} /></td>
                  <td className="text-right py-2.5 px-3 num"><DeltaCell pct={dMar} /></td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--green-50)] border-t-2 border-[var(--green-200)] font-bold">
              <td className="text-center py-2.5 px-3 text-[var(--dark)] uppercase tracking-wider text-[11px]">รวม</td>
              <td className="text-right py-2.5 px-3 num text-[var(--dark)]">{numFmt(totMar)}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--dark)]">{numFmt(totApr)}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--green-800)] bg-[var(--green-100)]">{numFmt(totMay)}</td>
              <td className="text-right py-2.5 px-3 num">
                <span className={liftVsApr > 5 ? 'text-[var(--primary)] font-bold' : 'text-yellow-700 font-bold'}>
                  {liftVsApr > 0 ? '+' : ''}{liftVsApr.toFixed(1)}%
                </span>
              </td>
              <td className="text-right py-2.5 px-3 num text-[var(--primary)]">
                +{liftVsMar.toFixed(1)}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-[var(--text-muted)] flex items-center gap-1 justify-end">
        🎯 = เดือนที่มีแคมเปญ
      </div>

      <InsightInline
        severity="warn"
        html={`<b>พ.ค. โต +${liftVsApr.toFixed(1)}%</b> จากเม.ย. — แต่ baseline growth (เม.ย. vs มี.ค.) อยู่ที่ <b>+${baselineGrowth.toFixed(1)}%</b> โดยไม่มีแคมเปญ → แคมเปญดัน lift จริงแค่ <b>~${(liftVsApr - baselineGrowth).toFixed(1)} percentage point</b>`}
      />

      <InsightInline
        severity="danger"
        html={`⚠️ <b>วันในสัปดาห์ไม่ match กัน</b> — พ.ค. 16-17 = เสาร์-อาทิตย์ (weekend natural peak) แต่ มี.ค./เม.ย. 16-17 = วันธรรมดา → +22.1% ของวัน 17 อาจมาจาก <b>weekend effect</b> ไม่ใช่แคมเปญ`}
      />
    </ChartCard>
  )
}
