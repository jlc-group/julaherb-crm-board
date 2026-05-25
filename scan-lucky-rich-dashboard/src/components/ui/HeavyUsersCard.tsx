'use client'
import type { DailyEntry } from '@/lib/daily-update-data'

export default function HeavyUsersCard({ day }: { day: DailyEntry }) {
  const users = day.heavyUsers
  return (
    <div className="card p-4">
      <h3 className="text-[14px] font-bold text-[var(--dark)] mb-1">🚩 Top {users.length} Heavy Users — {day.date.split('-')[2]} พ.ค.</h3>
      <p className="text-[11.5px] text-[var(--text-muted)] mb-3">สแกนหลายครั้ง / SKU น้อย = สงสัยผู้ค้าปลีกหรือ fraud</p>
      {users.length === 0 ? (
        <div className="text-[11px] text-[var(--text-muted)] py-4 text-center">ไม่มีข้อมูล Heavy Users สำหรับวันนี้</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)]">
                <th className="text-center py-1.5 px-2 w-7">#</th>
                <th className="text-left  py-1.5 px-2">User</th>
                <th className="text-left  py-1.5 px-2">จังหวัด</th>
                <th className="text-right py-1.5 px-2 w-12">Scans</th>
                <th className="text-right py-1.5 px-2 w-12">SKUs</th>
                <th className="text-right py-1.5 px-2 w-10">อายุ</th>
                <th className="text-center py-1.5 px-2 w-16">Flag</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const suspect = u.skuDiversity <= 2
                return (
                  <tr key={u.userHash} className={`border-t border-[var(--border-soft)] ${suspect ? 'bg-red-50/40' : ''}`}>
                    <td className="text-center py-1.5 px-2">
                      {u.rank <= 3
                        ? <span className={`rank ${u.rank === 1 ? 'rank-1' : u.rank === 2 ? 'rank-2' : 'rank-3'}`} style={{ width: 18, height: 18, fontSize: 9 }}>{u.rank}</span>
                        : <span className="text-[var(--text-muted)]">{u.rank}</span>}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-[var(--brand-700)]">{u.userHash}</td>
                    <td className="py-1.5 px-2 text-[var(--text)]">{u.province}</td>
                    <td className="text-right py-1.5 px-2 num font-bold text-[var(--red)]">{u.scans}</td>
                    <td className="text-right py-1.5 px-2 num">{u.skuDiversity}</td>
                    <td className="text-right py-1.5 px-2 num text-[var(--text-muted)]">{u.age ?? '—'}</td>
                    <td className="text-center py-1.5 px-2">
                      {suspect ? <span className="chip chip-red text-[9px]">⚠️ SUSPECT</span>
                               : <span className="chip text-[9px]">OK</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
