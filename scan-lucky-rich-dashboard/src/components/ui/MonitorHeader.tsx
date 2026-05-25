'use client'
import { TOTALS_4_DAY, DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt } from '@/lib/utils'

export default function MonitorHeader() {
  const firstDay = DAILY_ENTRIES[0].date.split('-')[2]
  const lastDay = DAILY_ENTRIES[DAILY_ENTRIES.length - 1].date.split('-')[2]

  return (
    <div className="zone-header">
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold tracking-widest opacity-85 uppercase mb-1">
            JULA&apos;S HERB · CRM DASHBOARD
          </div>
          <div className="text-[22px] font-bold mb-1">
            🎰 สแกนลุ้นรวย สวยลุ้นล้าน
          </div>
          <div className="text-[13px] opacity-90">
            รายงานแคมเปญ {DAILY_ENTRIES.length} วันแรก · {firstDay}–{lastDay} พ.ค. 2026
          </div>
        </div>
        <div className="flex gap-6 flex-wrap items-end">
          <Stat label="รวม Scans"     value={numFmt(TOTALS_4_DAY.success)} />
          <Stat label="รวม Tickets"   value={numFmt(TOTALS_4_DAY.tickets)} />
          <Stat label="New Signups"   value={numFmt(TOTALS_4_DAY.newSignup)} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[11px] opacity-75 tracking-wider uppercase">{label}</span>
      <span className="text-[18px] font-bold leading-tight num">{value}</span>
    </div>
  )
}
