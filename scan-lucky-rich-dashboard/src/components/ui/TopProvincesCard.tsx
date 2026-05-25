'use client'
import type { DailyEntry } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

export default function TopProvincesCard({ day }: { day: DailyEntry }) {
  if (!day.topProvinces || day.topProvinces.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">📍 Top 10 จังหวัด — {day.date.split('-')[2]} พ.ค.</h3>
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
          <i className="ti ti-map-off text-2xl mr-2" />
          ยังไม่มีข้อมูลจังหวัดสำหรับวันนี้ (รอ DB)
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">📍 Top 10 จังหวัด — {day.date.split('-')[2]} พ.ค.</h3>
      <p className="text-[11.5px] text-[var(--text-muted)] mb-3">เน้นจังหวัดที่มี avg/user ผิดปกติ (&gt; 5)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10.5px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-left  py-1.5 px-2 w-8">#</th>
              <th className="text-left  py-1.5 px-2">จังหวัด</th>
              <th className="text-right py-1.5 px-2 w-20">Scans</th>
              <th className="text-right py-1.5 px-2 w-20">Users</th>
              <th className="text-right py-1.5 px-2 w-24">Avg/user</th>
            </tr>
          </thead>
          <tbody>
            {day.topProvinces.map(p => {
              const avg = p.scans / p.users
              const isAnomaly = avg > 5
              const isCritical = avg > 10
              const anomalyMsg = isCritical
                ? `🚨 ผิดปกติร้ายแรง — ${numFmt(p.users)} users สแกน ${numFmt(p.scans)} ครั้ง = ${avg.toFixed(1)} ครั้ง/คน (avg แคมเปญ ~2.9)\nสงสัย: cluster ผู้ค้าส่ง / multi-account / bot\nควร investigate ก่อนจ่ายของรางวัล`
                : isAnomaly
                  ? `⚠️ ผิดปกติ — ${numFmt(p.users)} users สแกน ${numFmt(p.scans)} ครั้ง = ${avg.toFixed(1)} ครั้ง/คน (เทียบ avg ~2.9 ครั้ง/คน)\nอาจเป็นจุดขายเดียวที่ขายเยอะ หรือผู้ค้าปลีก — ดู heavy users ในจังหวัดนี้`
                  : `${numFmt(p.users)} users • ${avg.toFixed(2)} ครั้ง/คน (ปกติ)`
              return (
                <tr key={p.name}
                    className={`border-b border-[var(--border-soft)] ${isCritical ? 'bg-red-50/60' : isAnomaly ? 'bg-yellow-50/50' : ''} ${isAnomaly ? 'cursor-help' : ''}`}
                    title={anomalyMsg}>
                  <td className="py-1.5 px-2 text-[var(--text-muted)]">{p.rank}</td>
                  <td className={`py-1.5 px-2 font-medium ${isCritical ? 'text-red-700' : 'text-[var(--dark)]'}`}>
                    {p.name}{isCritical && ' 🚨'}
                  </td>
                  <td className="text-right py-1.5 px-2 num">{numFmt(p.scans)}</td>
                  <td className="text-right py-1.5 px-2 num">{numFmt(p.users)}</td>
                  <td className={`text-right py-1.5 px-2 num font-bold ${isCritical ? 'text-red-700' : isAnomaly ? 'text-yellow-700' : 'text-[var(--text)]'}`}>
                    {avg.toFixed(1)}{isCritical ? ' 🚨' : isAnomaly ? ' ⚠️' : ''}
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
