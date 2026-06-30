'use client'
// 🧩 Value Segments (RFM) — /api/customers/rfm + /api/customers/segments
// ⚠️ ข้อมูลระดับ "ทั้งระบบ saversure" (ไม่ใช่เฉพาะแคมเปญ) — ใช้ดูสัดส่วน/แนวทาง ไม่ใช่ยอดแคมเปญ
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'
import InsightInline from '@/components/ui/InsightInline'
import type { RfmDistributionResponse, SegmentsResponse } from '@/lib/api/types'

// เรียง + สี + ป้ายไทย ของ riskLevel (ค่าดี → เสี่ยง)
const ORDER: Record<string, { label: string; color: string; rank: number; action?: string }> = {
  champion:    { label: 'แชมเปี้ยน', color: '#15803d', rank: 0, action: 'VIP' },
  loyal:       { label: 'ภักดี',     color: '#16a34a', rank: 1, action: 'VIP' },
  potential:   { label: 'มีแวว',     color: '#22c55e', rank: 2 },
  normal:      { label: 'ปกติ',      color: '#94a3b8', rank: 3 },
  at_risk:     { label: 'เสี่ยงหลุด', color: '#f59e0b', rank: 4, action: 'ดึงกลับ' },
  hibernating: { label: 'หลับ',      color: '#fb923c', rank: 5, action: 'ดึงกลับ' },
  lost:        { label: 'หายไป',     color: '#ef4444', rank: 6 },
}

export default function SegmentRfmCard() {
  const rfm = useApi<RfmDistributionResponse>(`/api/customers/rfm?from=2026-05-16&to=2026-06-30`)
  const segs = useApi<SegmentsResponse>(`/api/customers/segments`)

  const rows = (rfm.data?.data ?? [])
    .map((d) => ({ ...d, meta: ORDER[d.riskLevel] ?? { label: d.riskLevel, color: '#cbd5e1', rank: 9 } }))
    .sort((a, b) => a.meta.rank - b.meta.rank)
  const total = rows.reduce((s, r) => s + r.count, 0)
  const hasData = total > 0
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0)
  const get = (k: string) => rows.find((r) => r.riskLevel === k)?.count ?? 0
  const winback = get('at_risk') + get('hibernating')
  const vip = get('champion') + get('loyal')

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-users-group text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">🧩 Value Segments (RFM)</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-blue-100 text-blue-800"
              title="ข้อมูลระดับทั้งระบบ saversure ไม่ใช่เฉพาะแคมเปญนี้">🌐 ทั้งระบบ saversure</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">สัดส่วนกลุ่มลูกค้าตาม RFM · <b>ไม่ใช่ยอดเฉพาะแคมเปญ</b> — ใช้ดูแนวทางทำ CRM</div>

      {!hasData ? (
        <div className="text-[12px] text-[var(--text-muted)] py-6 text-center">กำลังโหลด Segments…</div>
      ) : (
        <>
          {/* แถบสัดส่วนรวม */}
          <div className="flex w-full h-7 rounded-lg overflow-hidden border border-[var(--border)] mb-3">
            {rows.map((r) => (
              <div key={r.riskLevel} className="flex items-center justify-center text-[9px] font-bold text-white" style={{ background: r.meta.color, width: `${pct(r.count)}%` }}
                   title={`${r.meta.label}: ${numFmt(r.count)} (${pct(r.count).toFixed(1)}%)`}>
                {pct(r.count) >= 10 && `${pct(r.count).toFixed(0)}%`}
              </div>
            ))}
          </div>
          {/* รายการต่อกลุ่ม */}
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.riskLevel} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-[var(--bg-soft)]">
                <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: r.meta.color }} />
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-[var(--dark)]">{r.meta.label}</span>
                  {r.meta.action && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: r.meta.action === 'VIP' ? '#dcfce7' : '#fef3c7', color: r.meta.action === 'VIP' ? '#15803d' : '#92600a' }}>{r.meta.action}</span>}
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-bold num text-[var(--dark)]">{numFmt(r.count)}</span>
                  <span className="text-[10.5px] text-[var(--text-muted)] ml-1.5">{pct(r.count).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
          <InsightInline html={`🎯 <b>VIP</b> (แชมเปี้ยน+ภักดี) <b>${numFmt(vip)}</b> → สิทธิพิเศษ/LINE OA · <b>ดึงกลับ</b> (เสี่ยงหลุด+หลับ) <b>${numFmt(winback)}</b> → broadcast กระตุ้นสแกน`} />
          {segs.data?.segments?.length ? (
            <div className="mt-2 text-[10.5px] text-[var(--text-muted)]">
              Segments saversure: {segs.data.segments.map((s) => `${s.name} ${numFmt(s.count)}`).join(' · ')}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
