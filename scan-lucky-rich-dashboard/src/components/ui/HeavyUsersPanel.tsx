'use client'
import { useState } from 'react'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

export default function HeavyUsersPanel() {
  const [idx, setIdx] = useState(0)
  const day = DAILY_ENTRIES[idx]
  const users = day.heavyUsers

  if (!users || users.length === 0) {
    return (
      <div className="card p-4 text-[11px] text-[var(--text-muted)]">
        ไม่มี Top Scanners สำหรับวันที่ {day.date.split('-')[2]} พ.ค.
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <i className="ti ti-flame text-lg text-[var(--red)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Top Scanners รายวัน</h3>
        <span className="chip chip-red ml-auto">{users.length} คน</span>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {DAILY_ENTRIES.map((d, i) => (
          <button
            key={d.date}
            onClick={() => setIdx(i)}
            className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all flex items-center gap-1 ${
              idx === i
                ? 'bg-[var(--red)] text-white shadow-sm'
                : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-[var(--red)] border border-[var(--border)]'
            }`}
          >
            {d.date.split('-')[2]} พ.ค. <span className="opacity-70">({d.weekday})</span>
            {d.outage && <i className="ti ti-alert-octagon" />}
          </button>
        ))}
      </div>

      <div className="text-[10.5px] text-[var(--text-secondary)] mb-2 italic">
        ⚠️ คน scan เยอะ + SKU diversity ต่ำ = sales / ร้าน / multi-account
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)]">
              <th className="text-center py-1.5 px-2 w-7">#</th>
              <th className="text-left  py-1.5 px-2">User</th>
              <th className="text-left  py-1.5 px-2">จังหวัด</th>
              <th className="text-right py-1.5 px-2 w-12">Scans</th>
              <th className="text-right py-1.5 px-2 w-12">SKUs</th>
              <th className="text-right py-1.5 px-2 w-10">อายุ</th>
              <th className="text-center py-1.5 px-2 w-14">Flag</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const suspicious = u.skuDiversity <= 2
              return (
                <tr key={u.userHash} className="border-t border-[var(--border-soft)]">
                  <td className="text-center py-1.5 px-2">
                    {u.rank <= 3
                      ? <span className={`rank ${u.rank === 1 ? 'rank-1' : u.rank === 2 ? 'rank-2' : 'rank-3'}`} style={{ width: 18, height: 18, fontSize: 9 }}>{u.rank}</span>
                      : <span className="text-[var(--text-muted)]">{u.rank}</span>}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-[var(--green-700)]">{u.userHash}</td>
                  <td className="py-1.5 px-2 text-[var(--text)] text-[10.5px]">{u.province}</td>
                  <td className="text-right py-1.5 px-2 num font-bold text-[var(--red)]">{u.scans}</td>
                  <td className="text-right py-1.5 px-2 num">{u.skuDiversity}</td>
                  <td className="text-right py-1.5 px-2 num text-[var(--text-muted)]">{u.age ?? '—'}</td>
                  <td className="text-center py-1.5 px-2">
                    {suspicious ? <span className="chip chip-red text-[9px]">⚠️ SUSPECT</span>
                                : <span className="chip text-[9px]">OK</span>}
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
