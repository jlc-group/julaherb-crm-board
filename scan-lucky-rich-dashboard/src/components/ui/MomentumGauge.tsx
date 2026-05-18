'use client'
import { REAL_CAMPAIGN } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

export default function MomentumGauge() {
  const { day1, day2, growthPct } = REAL_CAMPAIGN
  const status = growthPct > 15 ? 'accelerating' : growthPct > 0 ? 'steady' : 'decelerating'
  const statusColor = status === 'accelerating' ? '#1D9E75' : status === 'steady' ? '#EF9F27' : '#e74c3c'
  const statusLabel = status === 'accelerating' ? '🚀 Accelerating' : status === 'steady' ? '⚖️ Steady' : '⚠️ Decelerating'

  // Projection: simple compounding ที่ growth ปัจจุบัน — แค่ informative
  const projectedTotal = Math.round(day2.rights * Math.pow(1 + growthPct / 100, 30)) // 30 days ที่ rate นี้
  const conservative   = Math.round((day1.rights + day2.rights) / 2 * 217)  // 7 เดือน flat

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-rocket text-lg text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Daily Momentum</h3>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: statusColor + '22', color: statusColor }}>
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] text-gray-500">Day 1 (16/5)</div>
          <div className="text-lg font-bold text-[var(--dark)]">{numFmt(day1.rights)}</div>
          <div className="text-[10px] text-gray-400">สิทธิ์</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: statusColor + '15' }}>
          <div className="text-[10px] text-gray-500">Day 2 (17/5)</div>
          <div className="text-lg font-bold" style={{ color: statusColor }}>{numFmt(day2.rights)}</div>
          <div className="text-[10px] font-bold" style={{ color: statusColor }}>▲ +{growthPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Mini gauge bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>-20%</span><span>0</span><span>+20%</span><span>+40%</span>
        </div>
        <div className="relative h-2 bg-gradient-to-r from-red-200 via-amber-200 to-green-300 rounded-full">
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--dark)] border-2 border-white shadow"
               style={{ left: `${Math.min(100, Math.max(0, ((growthPct + 20) / 60) * 100))}%`, transform: 'translate(-50%, -50%)' }} />
        </div>
      </div>

      <div className="mt-3 text-[10.5px] bg-amber-50 rounded p-2 leading-relaxed">
        <b>📈 Projection:</b><br/>
        • Conservative (flat avg): <b>{numFmt(conservative)}</b> สิทธิ์ตลอดแคมเปญ<br/>
        • ถ้า +21% ต่อ: ไม่ยั่งยืน — momentum จะ plateau ภายใน 2-3 wk
      </div>
    </div>
  )
}
