'use client'
import ChartCard from '@/components/ui/ChartCard'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'
import { CROSS_SCAN_PAIRS } from '@/lib/cross-scan-data'
import { numFmt } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'

interface CoScanPair {
  rank: number
  productA: string
  productB: string
  skuA: string
  skuB: string
  bothScanned: number
}

export default function CrossScanPairsCard() {
  const api = useApi<{ pairs: CoScanPair[] }>('/api/sku/co-scan?limit=10')

  const pairs: { rank: number; productA: string; productB: string; sizeLabel: string; bothScanned: number }[] =
    api.data?.pairs?.length
      ? api.data.pairs.map(p => ({
          rank: p.rank,
          productA: p.productA,
          productB: p.productB,
          sizeLabel: `${p.skuA} × ${p.skuB}`,
          bothScanned: p.bothScanned,
        }))
      : CROSS_SCAN_PAIRS

  if (pairs.length === 0) return null
  return (
    <ChartCard title="Top 10 SKU สินค้าที่สแกนคู่กัน" icon="ti-arrows-shuffle" full>
      <div className="mb-1">
        <ApiSourceBadge endpoint="/api/sku/co-scan" params="limit=10" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-[11px]">
              <th className="text-center py-2 px-2 w-12">อันดับ</th>
              <th className="text-left py-2 px-2">คู่สินค้า</th>
              <th className="text-left py-2 px-2">ไซส์ + รหัส</th>
              <th className="text-right py-2 px-2">คนสแกนทั้งคู่</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(p => (
              <tr key={p.rank} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2.5 px-2 text-center">
                  <span className={`rank ${p.rank <= 3 ? `rank-${p.rank}` : ''}`}>{p.rank}</span>
                </td>
                <td className="py-2.5 px-2 font-semibold text-[var(--dark)]">
                  {p.productA} <span className="text-gray-400 font-normal">×</span> {p.productB}
                </td>
                <td className="py-2.5 px-2 text-[var(--text-secondary)]">{p.sizeLabel}</td>
                <td className="py-2.5 px-2 text-right font-bold num text-[var(--primary)]">{numFmt(p.bothScanned)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}
