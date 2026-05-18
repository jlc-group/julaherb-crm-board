'use client'
import { FIRST_SCAN_SKUS } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

export default function FirstScanCard() {
  const total = FIRST_SCAN_SKUS.reduce((s, x) => s + x.newUsers, 0)
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-door-enter text-lg text-[var(--primary)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Entry Product (First Scan)</h3>
        <span className="ml-auto text-[10px] text-gray-400">ลูกค้าใหม่เริ่มที่ SKU ไหน</span>
      </div>
      <div className="space-y-2">
        {FIRST_SCAN_SKUS.map((s, i) => (
          <div key={s.sku} className="flex items-center gap-2">
            <span className={`text-[10px] font-bold w-5 text-center ${
              i === 0 ? 'text-[var(--gold)]' : 'text-gray-400'
            }`}>#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="truncate text-[var(--dark)] font-medium">{s.name}</span>
                <span className="font-bold text-[var(--primary)] ml-2">{s.pct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded overflow-hidden">
                <div className={`h-full ${i === 0 ? 'bg-[var(--gold)]' : 'bg-[var(--primary)]'}`}
                     style={{ width: `${s.pct}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{numFmt(s.newUsers)} new users</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10.5px] text-gray-500 italic border-l-2 border-[var(--gold)] pl-2">
        ⚠️ <b>L3-8G</b> เป็น entry สำหรับ <b>42%</b> ของลูกค้าใหม่ — ถ้าของหมด acquisition จะตกทันที
      </div>
    </div>
  )
}
