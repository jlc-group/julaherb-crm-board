'use client'
import { useApi } from '@/lib/hooks/useApi'
import type { BaselineCompareResponse } from '@/lib/api/types'
import { numFmt } from '@/lib/utils'

interface Props {
  from: string
  to: string
}

function pct(a: number, b: number): number {
  return b > 0 ? ((a - b) / b) * 100 : 0
}

// จับ rows ตาม weekday แล้วเลือก row ล่าสุดของแต่ละวัน
function groupByWeekday(rows: BaselineCompareResponse['rows']) {
  const map = new Map<string, BaselineCompareResponse['rows'][0]>()
  for (const r of rows) {
    map.set(r.weekday, r)  // overwrite — เก็บ row ล่าสุดของ weekday นั้น
  }
  const order = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']
  return order
    .filter(w => map.has(w))
    .map(w => map.get(w)!)
}

export default function WeekdayMatchedCard({ from, to }: Props) {
  const { data, loading, error } = useApi<BaselineCompareResponse>(
    `/api/baseline/compare?from=${from}&to=${to}`
  )

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">🎯 Apples-to-Apples — เทียบ DoW</h3>
        <div className="text-[11px] text-[var(--text-muted)] py-8 text-center">⏳ กำลังโหลด...</div>
      </div>
    )
  }

  if (error || !data || data.rows.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">🎯 Apples-to-Apples — เทียบ DoW</h3>
        <div className="text-[11px] text-[var(--text-muted)] py-8 text-center">⚠️ {error ?? 'ไม่มีข้อมูล'}</div>
      </div>
    )
  }

  const rows = groupByWeekday(data.rows)
  const hasHistorical = data.totals.marScans > 0 || data.totals.aprScans > 0

  return (
    <div className="card p-4">
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="text-[14px] font-bold text-[var(--dark)]">
          🎯 Apples-to-Apples — เทียบ DoW (วันในสัปดาห์)
          <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 align-middle">🟢 API</span>
        </h3>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">success scans</span>
      </div>
      <p className="text-[11.5px] text-[var(--text-muted)] mb-3">
        เทียบ &quot;วันเดียวกัน&quot; (เช่น อังคาร พ.ค. vs อังคาร มี.ค.) เพื่อตัด weekday bias ออก
      </p>

      {!hasHistorical && (
        <div className="card p-2.5 mb-3 text-[11px]" style={{ background: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1 }}>
          ⚠️ <b>ไม่มีข้อมูล baseline ก่อนแคมเปญ</b> (มี.ค./เม.ย.) — saversureV2 เก็บข้อมูลตั้งแต่ 16 พ.ค. 2569 เป็นต้นไป
          <br/>→ ตาราง Δ vs มี.ค./เม.ย. จะแสดงเป็น — (ไม่สามารถคำนวณได้)
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
              <th className="text-left  py-2 px-2 font-bold w-16">DoW</th>
              <th className="text-right py-2 px-2 font-bold">มี.ค.</th>
              <th className="text-right py-2 px-2 font-bold">เม.ย.</th>
              <th className="text-right py-2 px-2 font-bold bg-[var(--brand-50)]">ปัจจุบัน 🎯</th>
              <th className="text-right py-2 px-2 font-bold">Δ vs มี.ค.</th>
              <th className="text-right py-2 px-2 font-bold">Δ vs เม.ย.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const deltaMar = pct(r.mayScans, r.marScans)
              const deltaApr = pct(r.mayScans, r.aprScans)
              return (
                <tr key={r.weekday} className="border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)]">
                  <td className="py-2 px-2 font-bold text-[var(--dark)]">{r.weekday}</td>
                  <td className="text-right py-2 px-2 num text-[var(--text-muted)]">
                    {r.marScans > 0 ? numFmt(r.marScans) : '—'}
                  </td>
                  <td className="text-right py-2 px-2 num text-[var(--text-muted)]">
                    {r.aprScans > 0 ? numFmt(r.aprScans) : '—'}
                  </td>
                  <td className="text-right py-2 px-2 num font-bold text-[var(--green-800)] bg-[var(--brand-50)]/40">
                    {numFmt(r.mayScans)}
                  </td>
                  <td className={`text-right py-2 px-2 num font-bold ${r.marScans > 0 ? (deltaMar >= 0 ? 'text-[var(--green-700)]' : 'text-[var(--red)]') : 'text-[var(--text-muted)]'}`}>
                    {r.marScans > 0 ? `${deltaMar >= 0 ? '+' : ''}${deltaMar.toFixed(1)}%` : '—'}
                  </td>
                  <td className={`text-right py-2 px-2 num font-bold ${r.aprScans > 0 ? (deltaApr >= 0 ? 'text-[var(--green-700)]' : 'text-[var(--red)]') : 'text-[var(--text-muted)]'}`}>
                    {r.aprScans > 0 ? `${deltaApr >= 0 ? '+' : ''}${deltaApr.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
