'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { numFmt } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { BaselineCompareResponse } from '@/lib/api/types'

interface Props {
  /** ส่งช่วงจาก parent (Overview range) */
  from: string
  to: string
}

function pctDelta(after: number, before: number): number {
  return before > 0 ? ((after - before) / before) * 100 : 0
}

const TH_MONTH: Record<string, string> = {
  '01': 'ม.ค.', '02': 'ก.พ.', '03': 'มี.ค.', '04': 'เม.ย.',
  '05': 'พ.ค.', '06': 'มิ.ย.', '07': 'ก.ค.', '08': 'ส.ค.',
  '09': 'ก.ย.', '10': 'ต.ค.', '11': 'พ.ย.', '12': 'ธ.ค.',
}

function thMonth(date: string): string {
  return TH_MONTH[date.split('-')[1]] ?? ''
}

export default function BaselineComparison({ from, to }: Props) {
  const { data, loading, error } = useApi<BaselineCompareResponse>(
    `/api/baseline/compare?from=${from}&to=${to}`
  )

  if (loading) {
    return (
      <ChartCard title="เทียบรายวัน — มี.ค. / เม.ย. / พ.ค." icon="ti-target" full>
        <div className="text-center py-8 text-[var(--text-muted)] text-[12px]">⏳ กำลังโหลดข้อมูล...</div>
      </ChartCard>
    )
  }

  if (error || !data) {
    return (
      <ChartCard title="เทียบรายวัน — มี.ค. / เม.ย. / พ.ค." icon="ti-target" full>
        <InsightInline severity="warn" html={`⚠️ ไม่สามารถโหลด baseline ได้: ${error ?? 'no data'}`} />
      </ChartCard>
    )
  }

  const rows = data.rows
  const hasHistorical = data.totals.marScans > 0 || data.totals.aprScans > 0
  const lastDay = rows[rows.length - 1]
  const monthLabel = thMonth(to)

  return (
    <ChartCard title={`เทียบรายวัน — มี.ค. / เม.ย. / ${monthLabel} (${rows.length} วัน)`} icon="ti-target" full>
      <div className="text-[11.5px] text-[var(--text-secondary)] mb-3">
        <b className="text-[var(--dark)]">มี.ค.</b> = ไม่มีแคมเปญ (baseline) •
        <b className="text-[var(--dark)] ml-2">เม.ย.</b> = ช่วงสงกรานต์ •
        <b className="text-[var(--green-700)] ml-2">{monthLabel} 🎯</b> = แคมเปญสแกนลุ้นรวย
      </div>

      {!hasHistorical && (
        <InsightInline
          severity="info"
          html="⚠️ saversureV2 ยังไม่มีข้อมูล baseline เดือน มี.ค./เม.ย. (แคมเปญเริ่ม 16 พ.ค. 2569 — ไม่มีข้อมูลก่อนหน้านี้)"
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10.5px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-center py-2 px-3 font-bold">วัน</th>
              <th className="text-right  py-2 px-3 font-bold">มี.ค. <span className="opacity-60 text-[9px]">no campaign</span></th>
              <th className="text-right  py-2 px-3 font-bold">เม.ย. <span className="opacity-60 text-[9px]">สงกรานต์</span></th>
              <th className="text-right  py-2 px-3 font-bold text-[var(--green-700)]">{monthLabel} 🎯</th>
              <th className="text-right  py-2 px-3 font-bold">Δ vs เม.ย.</th>
              <th className="text-right  py-2 px-3 font-bold">Δ vs มี.ค.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const deltaApr = pctDelta(r.mayScans, r.aprScans)
              const deltaMar = pctDelta(r.mayScans, r.marScans)
              const aprPos = deltaApr >= 0
              const marPos = deltaMar >= 0
              return (
                <tr key={r.date} className="border-b border-[var(--border-soft)] hover:bg-[var(--green-50)]/40 transition">
                  <td className="text-center py-2.5 px-3">
                    <div className="num text-[15px] font-extrabold text-[var(--green-700)]">{r.date.split('-')[2]}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{r.weekday}</div>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <div className="num font-semibold text-[var(--text)]">{r.marScans > 0 ? numFmt(r.marScans) : <span className="text-[var(--text-muted)]">—</span>}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{r.marWeekday || ''}</div>
                  </td>
                  <td className="text-right py-2.5 px-3">
                    <div className="num font-semibold text-[var(--text)]">{r.aprScans > 0 ? numFmt(r.aprScans) : <span className="text-[var(--text-muted)]">—</span>}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{r.aprWeekday || ''}</div>
                  </td>
                  <td className="text-right py-2.5 px-3 bg-[var(--green-50)]/40">
                    <div className="num font-bold text-[var(--green-800)]">{numFmt(r.mayScans)}</div>
                    <div className="text-[9px] text-[var(--text-secondary)] font-semibold">({r.weekday})</div>
                  </td>
                  <td className={`text-right py-2.5 px-3 num font-bold ${r.aprScans > 0 ? (aprPos ? 'text-[var(--green-700)]' : 'text-[var(--red)]') : 'text-[var(--text-muted)]'}`}>
                    {r.aprScans > 0 ? `${aprPos ? '+' : ''}${deltaApr.toFixed(1)}%` : '—'}
                  </td>
                  <td className={`text-right py-2.5 px-3 num font-bold ${r.marScans > 0 ? (marPos ? 'text-[var(--green-700)]' : 'text-[var(--red)]') : 'text-[var(--text-muted)]'}`}>
                    {r.marScans > 0 ? `${marPos ? '+' : ''}${deltaMar.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--green-50)] border-t-2 border-[var(--green-200)] font-bold">
              <td className="text-center py-2.5 px-3 text-[var(--dark)] uppercase tracking-wider text-[11px]">รวม</td>
              <td className="text-right py-2.5 px-3 num text-[var(--dark)]">{data.totals.marScans > 0 ? numFmt(data.totals.marScans) : '—'}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--dark)]">{data.totals.aprScans > 0 ? numFmt(data.totals.aprScans) : '—'}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--green-800)] bg-[var(--green-100)]">{numFmt(data.totals.mayScans)}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--text-muted)]">{data.totals.aprScans > 0 ? `${data.totals.deltaApr >= 0 ? '+' : ''}${data.totals.deltaApr.toFixed(1)}%` : '—'}</td>
              <td className="text-right py-2.5 px-3 num text-[var(--text-muted)]">{data.totals.marScans > 0 ? `${data.totals.deltaMar >= 0 ? '+' : ''}${data.totals.deltaMar.toFixed(1)}%` : '—'}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {lastDay && (
        <InsightInline
          severity="info"
          html={`📊 อัปเดตถึง: <b>${lastDay.date.split('-')[2]} ${monthLabel} (${lastDay.weekday})</b> • ยอดสแกนรวม <b>${numFmt(data.totals.mayScans)}</b> ใน ${rows.length} วัน`}
        />
      )}
    </ChartCard>
  )
}
