'use client'
import { REAL_CAMPAIGN, DEAD_SKUS_SAMPLE } from '@/lib/real-data'

export default function DeadSkuPanel() {
  return (
    <div className="bg-white rounded-xl border-l-4 border-l-[var(--danger)] border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="ti ti-skull text-lg text-[var(--danger)]" />
        <h3 className="text-[13px] font-bold text-[var(--dark)]">Dead SKU Alert</h3>
        <span className="ml-auto text-[11px] bg-red-50 text-[var(--danger)] px-2 py-0.5 rounded-full font-bold">
          {REAL_CAMPAIGN.deadSkus} SKUs
        </span>
      </div>
      <div className="text-[11px] text-gray-600 mb-3">
        <b>{REAL_CAMPAIGN.deadSkus}</b> SKUs จาก {REAL_CAMPAIGN.totalSkus} <b>ยังไม่ถูกสแกนเลย</b>ใน 2 วันแรก
        — ตรวจสอบ:
        <span className="block ml-3 mt-1 text-[10.5px]">
          • POSM มี QR ติดทั่วทุกร้านไหม?<br/>
          • ของลง shelf ครบไหม / stock-out?<br/>
          • SKU registered เข้าระบบแคมเปญหรือยัง?
        </span>
      </div>
      <div className="space-y-1.5">
        {DEAD_SKUS_SAMPLE.slice(0, 3).map(s => (
          <div key={s.sku} className="flex items-center gap-2 bg-red-50/40 rounded px-2 py-1.5">
            <span className="text-[10px] bg-white border border-red-200 text-[var(--danger)] px-1.5 py-0.5 rounded font-mono">{s.sku}</span>
            <span className="text-[11px] text-[var(--dark)] flex-1 truncate">{s.name}</span>
            <span className="text-[10px] text-gray-400">{s.tier}</span>
            <span className="text-[10px] text-[var(--danger)] font-bold">{s.daysIdle}d idle</span>
          </div>
        ))}
        <div className="text-[10px] text-gray-400 italic text-center pt-1">
          + อีก {REAL_CAMPAIGN.deadSkus - 3} SKU (ดูทั้งหมดใน Products tab)
        </div>
      </div>
    </div>
  )
}
