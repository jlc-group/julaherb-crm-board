'use client'
// 🔗 Explorer — สแกนคู่กับอะไร (co-scan) · กรองคู่ที่มี SKU ที่เลือก
import { useMemo } from 'react'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'
import { baseSku } from '@/lib/sku-utils'

interface CoScanPair { rank: number; productA: string; productB: string; skuA: string; skuB: string; bothScanned: number }

interface Props { selectedSkus: string[] }

export default function ExplorerCoScan({ selectedSkus }: Props) {
  const { data, loading } = useApi<{ pairs: CoScanPair[] }>(`/api/sku/co-scan?limit=50`)
  const pairs = data?.pairs ?? []
  const sel = new Set(selectedSkus)

  // ถ้าเลือก SKU → แสดงคู่ที่มี SKU นั้น + ไฮไลต์ "พาร์ทเนอร์" อีกตัว
  const view = useMemo(() => {
    if (!sel.size) return pairs.slice(0, 12).map((p) => ({ ...p, partner: `${baseSku(p.skuB)} · ${p.productB}`, anchor: `${baseSku(p.skuA)} · ${p.productA}` }))
    return pairs
      .filter((p) => sel.has(baseSku(p.skuA)) || sel.has(baseSku(p.skuB)))
      .map((p) => {
        const aSel = sel.has(baseSku(p.skuA))
        return { ...p, anchor: aSel ? `${baseSku(p.skuA)} · ${p.productA}` : `${baseSku(p.skuB)} · ${p.productB}`,
          partner: aSel ? `${baseSku(p.skuB)} · ${p.productB}` : `${baseSku(p.skuA)} · ${p.productA}` }
      })
      .slice(0, 12)
  }, [pairs, selectedSkus])

  const maxBoth = Math.max(1, ...view.map((v) => v.bothScanned))

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-link text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">🔗 สแกนคู่กับอะไร</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">
        {sel.size ? `คู่ที่มี SKU ที่เลือก (${selectedSkus.join(', ')})` : 'คู่ที่ถูกสแกนด้วยกันบ่อยสุด (ทั้งแคมเปญ)'}
      </div>

      {!view.length ? (
        <div className="text-[12px] text-[var(--text-muted)] py-8 text-center">{loading ? 'กำลังโหลด…' : sel.size ? 'ยังไม่มีคู่ co-scan ของ SKU ที่เลือก' : 'ไม่มีข้อมูล'}</div>
      ) : (
        <div className="space-y-1.5">
          {view.map((v, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-soft)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] w-5 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11.5px]">
                  {sel.size ? (
                    <><span className="font-mono text-[var(--brand-700)] font-semibold truncate max-w-[140px]" title={v.partner}>{v.partner}</span></>
                  ) : (
                    <span className="truncate" title={`${v.anchor} ↔ ${v.partner}`}>
                      <span className="font-mono text-[var(--brand-700)]">{v.anchor.split(' · ')[0]}</span>
                      <span className="text-[var(--text-muted)] mx-1">↔</span>
                      <span className="font-mono text-[var(--brand-700)]">{v.partner.split(' · ')[0]}</span>
                    </span>
                  )}
                </div>
                <div className="progress mt-1" style={{ height: 4 }}>
                  <div className="progress-fill" style={{ width: `${(v.bothScanned / maxBoth) * 100}%`, background: 'var(--brand-500)' }} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold num text-[var(--dark)]">{numFmt(v.bothScanned)}</div>
                <div className="text-[8.5px] text-[var(--text-muted)]">คนสแกนทั้งคู่</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
