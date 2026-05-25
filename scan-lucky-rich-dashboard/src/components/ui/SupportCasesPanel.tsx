'use client'
import { DAILY_ENTRIES, TOTALS_4_DAY } from '@/lib/daily-update-data'

export default function SupportCasesPanel() {
  // Aggregate all support cases across 5 days by topic
  const topicMap = new Map<string, number>()
  for (const d of DAILY_ENTRIES) {
    for (const c of d.supportCases) {
      topicMap.set(c.topic, (topicMap.get(c.topic) || 0) + c.count)
    }
  }
  const topics = [...topicMap.entries()].sort((a, b) => b[1] - a[1])
  const totalCases = TOTALS_4_DAY.totalSupport
  // Total users across 5 days (approximate)
  const totalUsers = DAILY_ENTRIES.reduce((s, d) => s + d.uniqueUsers, 0)
  const complaintRate = (totalCases / totalUsers * 100).toFixed(2)
  const maxCount = Math.max(...topics.map(t => t[1]), 1)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-message-circle-question text-lg text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Support Cases (5 วัน)</h3>
        <span className="chip ml-auto">{complaintRate}% complain rate</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[var(--bg-soft)] rounded-lg p-2 border border-[var(--border-soft)]">
          <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold">Total cases</div>
          <div className="text-[20px] num text-[var(--dark)]">{totalCases}</div>
        </div>
        <div className="bg-[var(--green-50)] rounded-lg p-2 border border-[var(--green-200)]">
          <div className="text-[10px] text-[var(--green-700)] uppercase font-bold">Complaint rate</div>
          <div className="text-[20px] num text-[var(--green-800)]">{complaintRate}%</div>
        </div>
      </div>

      <div className="text-[10.5px] uppercase tracking-wide text-[var(--text-secondary)] font-bold mb-1.5">By topic</div>
      <div className="space-y-1.5">
        {topics.map(([topic, count]) => {
          const pct = (count / maxCount) * 100
          return (
            <div key={topic}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--text)]">{topic}</span>
                <span className="font-bold text-[var(--dark)] num">{count}</span>
              </div>
              <div className="progress" style={{ height: 5 }}>
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 text-[10.5px] text-[var(--text-secondary)] italic">
        💡 Complaint rate ต่ำ ({complaintRate}%) — UX โดยรวมราบรื่น
      </div>
    </div>
  )
}
