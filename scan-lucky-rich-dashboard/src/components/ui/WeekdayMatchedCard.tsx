'use client'
import { numFmt } from '@/lib/utils'

interface Row {
  dow: string
  mar: { date: string; scans: number } | null
  apr: { date: string; scans: number } | null
  may: { date: string; scans: number } | null
}

// Apples-to-apples DoW comparison (มี.ค./เม.ย./พ.ค. — เทียบเฉพาะวันที่ตรง weekday กัน)
const ROWS: Row[] = [
  { dow: 'จันทร์',  mar: { date: '16 มี.ค.', scans: 6851 }, apr: { date: '20 เม.ย.', scans: 7740 }, may: { date: '18 พ.ค.', scans: 6459 } },
  { dow: 'อังคาร',  mar: { date: '17 มี.ค.', scans: 7492 }, apr: null,                              may: { date: '19 พ.ค.', scans: 5707 } },
  { dow: 'พุธ',     mar: { date: '18 มี.ค.', scans: 7112 }, apr: null,                              may: { date: '20 พ.ค.', scans: 7666 } },
  { dow: 'พฤหัส',   mar: { date: '19 มี.ค.', scans: 6634 }, apr: { date: '16 เม.ย.', scans: 6726 }, may: { date: '21 พ.ค.', scans: 6590 } },
  { dow: 'ศุกร์',   mar: { date: '20 มี.ค.', scans: 6769 }, apr: { date: '17 เม.ย.', scans: 7208 }, may: { date: '22 พ.ค.', scans: 6147 } },
  { dow: 'เสาร์',   mar: null,                              apr: { date: '18 เม.ย.', scans: 8567 }, may: { date: '23 พ.ค.', scans: 7147 } },
  { dow: 'อาทิตย์', mar: null,                              apr: { date: '19 เม.ย.', scans: 9254 }, may: { date: '24 พ.ค.', scans: 8168 } },
]

function pct(a: number, b: number): number {
  return ((a - b) / b) * 100
}

export default function WeekdayMatchedCard() {
  return (
    <div className="card p-4">
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="text-[14px] font-bold text-[var(--dark)]">🎯 Apples-to-Apples — เทียบ DoW (วันในสัปดาห์)</h3>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">success scans (points &gt; 0)</span>
      </div>
      <p className="text-[11.5px] text-[var(--text-muted)] mb-3">
        เทียบ "วันเดียวกัน" (เช่น อังคาร พ.ค. vs อังคาร มี.ค.) เพื่อตัด weekday bias ออก
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)] border-b-2 border-[var(--border)]">
              <th className="text-left  py-2 px-2 font-bold w-16">DoW</th>
              <th className="text-right py-2 px-2 font-bold">มี.ค.</th>
              <th className="text-right py-2 px-2 font-bold">เม.ย.</th>
              <th className="text-right py-2 px-2 font-bold bg-[var(--brand-50)]">พ.ค. 🎯</th>
              <th className="text-right py-2 px-2 font-bold">Δ vs มี.ค.</th>
              <th className="text-right py-2 px-2 font-bold">Δ vs เม.ย.</th>
              <th className="text-left  py-2 px-2 font-bold">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(r => {
              const mar = r.mar?.scans
              const apr = r.apr?.scans
              const may = r.may?.scans
              const dMar = may && mar ? pct(may, mar) : null
              const dApr = may && apr ? pct(may, apr) : null
              const isOutage = r.may?.date === '19 พ.ค.'
              const significantDrop = (dMar !== null && dMar < -20) || (dApr !== null && dApr < -20)
              return (
                <tr key={r.dow} className={`border-b border-[var(--border-soft)] ${significantDrop ? 'bg-red-50/40' : isOutage ? 'bg-yellow-50/30' : 'hover:bg-[var(--bg-soft)]'}`}>
                  <td className="py-2 px-2 font-bold text-[var(--dark)]">{r.dow}</td>
                  <td className="text-right py-2 px-2 num">
                    {mar ? (
                      <>
                        <b>{numFmt(mar)}</b>
                        <span className="text-[9px] text-[var(--text-muted)] ml-1">({r.mar!.date})</span>
                      </>
                    ) : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="text-right py-2 px-2 num">
                    {apr ? (
                      <>
                        <b>{numFmt(apr)}</b>
                        <span className="text-[9px] text-[var(--text-muted)] ml-1">({r.apr!.date})</span>
                      </>
                    ) : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className="text-right py-2 px-2 num bg-[var(--brand-50)]/40">
                    {may ? (
                      <>
                        <b className="text-[var(--brand-700)]">{numFmt(may)}</b>
                        <span className="text-[9px] text-[var(--text-muted)] ml-1">({r.may!.date})</span>
                      </>
                    ) : <span className="text-[var(--text-muted)]">—</span>}
                  </td>
                  <td className={`text-right py-2 px-2 num font-bold ${dMar === null ? 'text-[var(--text-muted)]' : dMar >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}`}>
                    {dMar !== null ? `${dMar >= 0 ? '+' : ''}${dMar.toFixed(1)}%` : '—'}
                  </td>
                  <td className={`text-right py-2 px-2 num font-bold ${dApr === null ? 'text-[var(--text-muted)]' : dApr >= 0 ? 'text-[var(--positive)]' : 'text-[var(--danger)]'}`}>
                    {dApr !== null ? `${dApr >= 0 ? '+' : ''}${dApr.toFixed(1)}%` : '—'}
                  </td>
                  <td className="py-2 px-2 text-[10.5px] text-[var(--text-secondary)]">
                    {isOutage && '🚨 outage 6 ชม.'}
                    {!isOutage && significantDrop && '⚠ drop > 20%'}
                    {!isOutage && !significantDrop && dMar !== null && dMar >= 5 && '✅ growth'}
                    {!isOutage && !significantDrop && dMar !== null && dMar < 5 && dMar > -5 && '⚖️ flat'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 p-3 rounded-lg" style={{ background: '#fffbeb', borderLeft: '3px solid #d97706' }}>
        <div className="text-[11.5px] font-bold text-[#713f12] mb-1">💡 Key insight</div>
        <div className="text-[10.5px] text-[var(--text)] leading-relaxed">
          • <b>อังคาร พ.ค. drop −23.8% vs อังคาร มี.ค.</b> — สาเหตุหลักจาก outage 6 ชม. (Day 19) ไม่ใช่ campaign performance<br/>
          • <b>เสาร์/อาทิตย์ พ.ค. − vs เม.ย.</b> เพราะ เม.ย. มีสงกรานต์-postpone → ลูกค้า peak weekend หลังสงกรานต์<br/>
          • <b>พุธ พ.ค. +7.8% vs มี.ค.</b> และ <b>จันทร์</b> ยังไม่ชัด — apples-to-apples แท้ๆ ต้องเก็บ data อีก 2 สัปดาห์
        </div>
      </div>
    </div>
  )
}
