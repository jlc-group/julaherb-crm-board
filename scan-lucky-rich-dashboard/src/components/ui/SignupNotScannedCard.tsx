'use client'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

export default function SignupNotScannedCard() {
  const totalSignups = DAILY_ENTRIES.reduce((s, d) => s + d.newSignup, 0)
  const totalScanned = DAILY_ENTRIES.reduce((s, d) => s + d.newScanned, 0)
  const totalNotScanned = DAILY_ENTRIES.reduce((s, d) => s + d.signedNotScanned, 0)
  const dropoffPct = (totalNotScanned / totalSignups) * 100

  const dailyRates = DAILY_ENTRIES.map(d => ({
    date: d.date.split('-')[2] + ' พ.ค.',
    weekday: d.weekday,
    signup: d.newSignup,
    scanned: d.newScanned,
    notScanned: d.signedNotScanned,
    scanRate: (d.newScanned / d.newSignup) * 100,
  }))

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-user-question text-lg text-[var(--gold)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">สมัครแล้วยังไม่สแกน — Target group</h3>
        <span className="chip chip-yellow ml-auto">{numFmt(totalNotScanned)} คน</span>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-[var(--green-50)] rounded-lg p-2 border border-[var(--green-200)]">
          <div className="text-[9.5px] text-[var(--green-700)] uppercase font-bold">สมัครรวม (4 วัน)</div>
          <div className="text-[18px] num text-[var(--green-800)]">{numFmt(totalSignups)}</div>
        </div>
        <div className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)]">
          <div className="text-[9.5px] text-[var(--text-secondary)] uppercase font-bold">สแกนเลย</div>
          <div className="text-[18px] num text-[var(--dark)]">{numFmt(totalScanned)}</div>
          <div className="text-[9px] text-[var(--text-muted)]">{((totalScanned/totalSignups)*100).toFixed(1)}%</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2 border border-yellow-200">
          <div className="text-[9.5px] text-yellow-800 uppercase font-bold">⚠️ ยังไม่สแกน</div>
          <div className="text-[18px] num text-yellow-900">{numFmt(totalNotScanned)}</div>
          <div className="text-[9px] text-[var(--text-muted)]">{dropoffPct.toFixed(1)}% drop</div>
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-1.5">
        Breakdown รายวัน
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)]">
            <th className="text-left  py-1 px-2">วัน</th>
            <th className="text-right py-1 px-2">สมัคร</th>
            <th className="text-right py-1 px-2">สแกน</th>
            <th className="text-right py-1 px-2">ไม่สแกน</th>
            <th className="text-right py-1 px-2">% สแกน</th>
          </tr>
        </thead>
        <tbody>
          {dailyRates.map(d => (
            <tr key={d.date} className="border-t border-[var(--border-soft)]">
              <td className="py-1.5 px-2 font-bold text-[var(--dark)]">{d.date} <span className="text-[9px] text-[var(--text-muted)]">({d.weekday})</span></td>
              <td className="text-right py-1.5 px-2 num">{numFmt(d.signup)}</td>
              <td className="text-right py-1.5 px-2 num text-[var(--green-700)]">{numFmt(d.scanned)}</td>
              <td className="text-right py-1.5 px-2 num text-yellow-800 font-bold">{numFmt(d.notScanned)}</td>
              <td className="text-right py-1.5 px-2 num font-bold" style={{ color: d.scanRate >= 85 ? 'var(--green-700)' : '#ca8a04' }}>
                {d.scanRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 text-[10.5px] text-[var(--text-secondary)] italic border-l-2 border-[var(--gold)] pl-2">
        💡 <b>{numFmt(totalNotScanned)} คน</b> สมัครแล้วยังไม่สแกน → LINE push reminder ดึงให้ scan ครั้งแรก
      </div>
    </div>
  )
}
