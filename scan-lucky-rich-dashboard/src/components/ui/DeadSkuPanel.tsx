'use client'
import { REAL_CAMPAIGN, DEAD_SKUS_SAMPLE } from '@/lib/real-data'

export default function DeadSkuPanel() {
  return (
    <div className="card card-accent-top is-red p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-skull text-lg text-[var(--red)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Dead SKU Alert</h3>
        <span className="chip chip-red ml-auto">☠ {REAL_CAMPAIGN.deadSkus} SKUs</span>
      </div>

      <div className="text-[11.5px] text-[var(--text-secondary)] mb-3 leading-relaxed">
        <b className="text-[var(--red)]">{REAL_CAMPAIGN.deadSkus}</b> SKUs จาก {REAL_CAMPAIGN.totalSkus}
        <b className="text-[var(--dark)]"> ยังไม่ถูกสแกนเลย</b>
        <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">ตรวจ: POSM • Stock • SKU registered</div>
      </div>

      <div className="space-y-1.5">
        {DEAD_SKUS_SAMPLE.slice(0, 3).map(s => (
          <div key={s.sku} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-[var(--red-soft)] border border-red-100">
            <span className="text-[10px] font-mono bg-white border border-red-200 text-[var(--red)] px-1.5 py-0.5 rounded">{s.sku}</span>
            <span className="text-[11.5px] text-[var(--dark)] flex-1 truncate font-medium">{s.name}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{s.tier}</span>
            <span className="text-[10px] text-[var(--red)] font-bold">{s.daysIdle}d 💤</span>
          </div>
        ))}
        <div className="text-[10.5px] text-[var(--text-muted)] italic text-center pt-1">
          + อีก {REAL_CAMPAIGN.deadSkus - 3} SKU ใน Products tab
        </div>
      </div>
    </div>
  )
}
