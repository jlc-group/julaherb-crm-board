'use client'
import { useMemo } from 'react'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'
import { CROSS_SIZE_GROUPS, type CrossSizeRow } from '@/lib/real-data'
import { numFmt, getCampaignToday } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { SkuPerDayResponse } from '@/lib/api/types'

function extractSizeFromSku(sku: string): string {
  const m = sku.match(/(\d+G)$/i)
  return m ? m[1].toUpperCase() : ''
}

function extractBaseProduct(displayName: string): string {
  return displayName
    .replace(/\s*\(.*\)\s*$/, '')
    .replace(/\s+\d+[Gg]$/, '')
    .trim()
}

function buildCrossSizeFromApi(rows: SkuPerDayResponse['rows']): CrossSizeRow[] {
  const map = new Map<string, { sku: string; size: string; tier: string; rights: number; users: number }[]>()
  for (const r of rows) {
    if (r.scans === 0) continue
    const base = extractBaseProduct(r.displayName)
    const size = extractSizeFromSku(r.sku)
    if (!base || !size) continue
    const tier = r.sku.includes('-40G') || r.sku.includes('-30G') || r.sku.includes('-90G') ? 'หลอด' : 'ซอง'
    const list = map.get(base) ?? []
    list.push({ sku: r.sku, size, tier, rights: r.specTickets, users: 0 })
    map.set(base, list)
  }
  const groups: CrossSizeRow[] = []
  for (const [grp, variants] of Array.from(map.entries())) {
    if (variants.length < 2) continue
    variants.sort((a, b) => b.rights - a.rights)
    const ratio = variants[0].rights / Math.max(1, variants[variants.length - 1].rights)
    groups.push({
      productGroup: grp,
      variants,
      dominantSize: variants[0].size,
      ratio,
    })
  }
  return groups.sort((a, b) => b.variants[0].rights - a.variants[0].rights)
}

export default function CrossSizeMatrix() {
  const api = useApi<SkuPerDayResponse>(`/api/sku/per-day?from=2026-05-16&to=${getCampaignToday()}`)

  const groups = useMemo(() => {
    if (api.data?.rows?.length) return buildCrossSizeFromApi(api.data.rows)
    return CROSS_SIZE_GROUPS
  }, [api.data])

  if (groups.length === 0) return null

  const top = groups[0]
  const topRatio = top ? top.ratio.toFixed(1) : '0'

  return (
    <ChartCard title="Same-Product Cross-Size Comparison" icon="ti-arrows-shuffle" full>
      <div className="mb-1">
        <ApiSourceBadge endpoint="/api/sku/per-day" params="group by product family" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-[11px]">
              <th className="text-left py-2 px-2">Product</th>
              <th className="text-left py-2 px-2">Variants</th>
              <th className="text-right py-2 px-2">สิทธิ์รวม</th>
              <th className="text-right py-2 px-2">Dominant</th>
              <th className="text-right py-2 px-2">Ratio (max/min)</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const totalRights = g.variants.reduce((s, v) => s + v.rights, 0)
              return (
                <tr key={g.productGroup} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2.5 px-2 font-semibold text-[var(--dark)]">{g.productGroup}</td>
                  <td className="py-2.5 px-2">
                    <div className="flex flex-wrap gap-1">
                      {g.variants.map(v => (
                        <span key={v.sku}
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                v.size === g.dominantSize
                                  ? 'bg-[var(--primary)] text-white font-bold'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                          {v.tier} {v.size}: {numFmt(v.rights)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold">{numFmt(totalRights)}</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="text-[var(--gold)] font-bold">{g.dominantSize}</span>
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className={`font-bold ${g.ratio > 5 ? 'text-[var(--danger)]' : 'text-[var(--dark)]'}`}>
                      {g.ratio.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {top && (
        <InsightInline html={`<b>${top.productGroup}</b>: ${top.dominantSize} ครอง — ratio <b>${topRatio}x</b> vs ไซส์ที่เหลือ`} />
      )}
    </ChartCard>
  )
}
