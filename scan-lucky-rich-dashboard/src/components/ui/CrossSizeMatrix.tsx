'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { CROSS_SIZE_GROUPS } from '@/lib/real-data'
import { numFmt } from '@/lib/utils'

export default function CrossSizeMatrix() {
  if (CROSS_SIZE_GROUPS.length === 0) return null
  return (
    <ChartCard title="Same-Product Cross-Size Comparison" icon="ti-arrows-shuffle" full>
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
            {CROSS_SIZE_GROUPS.map(g => {
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
      <InsightInline html="<b>ดีดีครีมแตงโม</b>: ซอง 8G ขายดีกว่าหลอด 40G ~<b>10.8x</b> — ราคา/ขนาดเล็ก = entry barrier ต่ำ ช่วยขับ scan แต่ margin ต่ำ" />
    </ChartCard>
  )
}
