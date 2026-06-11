'use client'
import { useApi } from '@/lib/hooks/useApi'
import type { ProvincesResponse } from '@/lib/api/types'
import { numFmt } from '@/lib/utils'

interface Props {
  date: string
  limit?: number
}

export default function TopProvincesCard({ date, limit = 10 }: Props) {
  const { data, loading, error } = useApi<ProvincesResponse>(
    `/api/customers/provinces?date=${date}&limit=${limit}`
  )

  const provinces = data?.provinces ?? []
  const dayLabel = date.split('-')[2]

  if (loading) {
    return (
      <div className="card p-4">
        <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">📍 Top จังหวัด — {dayLabel}</h3>
        <div className="text-[11px] text-[var(--text-muted)] py-8 text-center">⏳ กำลังโหลด...</div>
      </div>
    )
  }

  if (error || provinces.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">📍 Top จังหวัด — {dayLabel}</h3>
        <div className="flex items-center justify-center py-12 text-[12px] text-[var(--text-muted)]">
          <i className="ti ti-map-off text-2xl mr-2" />
          {error ? `⚠️ ${error}` : 'ยังไม่มีข้อมูลจังหวัดสำหรับวันนี้'}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">
        📍 Top {provinces.length} จังหวัด — {dayLabel}
        <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-800 align-middle">🟢 API</span>
      </h3>
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
            {provinces.map(p => {
              const avg = p.avgPerUser
              const isAnomaly = avg > 5
              const isCritical = avg > 10
              const anomalyMsg = isCritical
                ? `🚨 ผิดปกติร้ายแรง — ${numFmt(p.users)} users สแกน ${numFmt(p.scans)} ครั้ง = ${avg.toFixed(1)} ครั้ง/คน\nสงสัย: cluster ผู้ค้าส่ง / multi-account / bot\nควร investigate ก่อนจ่ายของรางวัล`
                : isAnomaly
                  ? `⚠️ ผิดปกติ — ${numFmt(p.users)} users สแกน ${numFmt(p.scans)} ครั้ง = ${avg.toFixed(1)} ครั้ง/คน\nอาจเป็นจุดขายเดียวที่ขายเยอะ หรือผู้ค้าปลีก — ดู heavy users ในจังหวัดนี้`
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
