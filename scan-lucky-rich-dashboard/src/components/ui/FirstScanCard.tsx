'use client'
import { FIRST_SCAN_SKUS } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

export default function FirstScanCard() {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-door-enter text-lg text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Entry Product</h3>
        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider ml-auto">First Scan</span>
      </div>

      <div className="space-y-2.5">
        {FIRST_SCAN_SKUS.map((s, i) => (
          <div key={s.sku} className="flex items-center gap-2.5">
            <span className={`rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11.5px] mb-1">
                <span className="truncate text-[var(--dark)] font-semibold">{s.name}</span>
                <span className="font-extrabold text-[var(--primary)] ml-2 num">{s.pct.toFixed(1)}%</span>
              </div>
              <div className="progress" style={{ height: 6 }}>
                <div className="progress-fill" style={{ width: `${s.pct}%` }} />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{numFmt(s.newUsers)} new users</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
        <i className="ti ti-key mt-0.5 text-[var(--primary)]" />
        <span><b className="text-[var(--dark)]">L3-8G</b> เป็น entry ของ <b className="text-[var(--primary)]">42%</b> ของ new users — keystone SKU</span>
      </div>
    </div>
  )
}
