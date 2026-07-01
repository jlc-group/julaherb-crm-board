'use client'
// 🎯 ConcentrationStrip — ดัชนีกระจุกตัวตลาด (Top-1/3/10 share + HHI) · reuse ได้ทุก entity
// HHI = Σ(share%)² (0–10000): ยิ่งสูง = ยิ่งพึ่งไม่กี่ตัว
import { numFmt } from '@/lib/utils'

export default function ConcentrationStrip({ values }: { values: number[] }) {
  const clean = values.filter((v) => v > 0)
  const total = clean.reduce((s, v) => s + v, 0)
  if (total <= 0) return null

  const sorted = [...clean].sort((a, b) => b - a)
  const shareOf = (n: number) => (sorted.slice(0, n).reduce((s, v) => s + v, 0) / total) * 100
  const top1 = shareOf(1), top3 = shareOf(3), top10 = shareOf(10)
  const hhi = Math.round(sorted.reduce((s, v) => s + ((v / total) * 100) ** 2, 0))

  const level = hhi >= 2500
    ? { label: 'ตลาดกระจุก', color: '#dc2626', bg: '#fef2f2', hint: 'พึ่งไม่กี่ตัว — เสี่ยงถ้าตัวนำสะดุด ยอดร่วง' }
    : hhi >= 1500
      ? { label: 'กระจุกปานกลาง', color: '#d97706', bg: '#fffbeb', hint: 'มีตัวนำชัด แต่ยังมีตัวรองรับ' }
      : { label: 'กระจายดี', color: '#16a34a', bg: '#f0fdf4', hint: 'ยอดเฉลี่ยทั่วหลายตัว — สุขภาพดี' }

  const Metric = ({ label, pct }: { label: string; pct: number }) => (
    <div className="min-w-[62px]">
      <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wide">{label}</div>
      <div className="text-[16px] font-extrabold num text-[var(--dark)] leading-tight">{pct.toFixed(1)}%</div>
    </div>
  )

  return (
    <div className="rounded-xl border p-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2" style={{ background: level.bg, borderColor: level.color + '33' }}>
      <div className="flex items-center gap-1.5">
        <i className="ti ti-chart-donut-4 text-[15px]" style={{ color: level.color }} />
        <span className="text-[11px] font-bold" style={{ color: level.color }}>ดัชนีกระจุกตัว</span>
      </div>
      <Metric label="Top 1" pct={top1} />
      <Metric label="Top 3" pct={top3} />
      <Metric label="Top 10" pct={top10} />
      <div className="min-w-[70px]">
        <div className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wide">HHI</div>
        <div className="text-[16px] font-extrabold num leading-tight" style={{ color: level.color }}>{numFmt(hhi)}</div>
      </div>
      <span className="px-2 py-1 rounded-lg text-[10.5px] font-bold whitespace-nowrap" style={{ background: level.color + '18', color: level.color }}>{level.label}</span>
      <div className="w-full text-[10px] text-[var(--text-secondary)] leading-snug">{level.hint}</div>
    </div>
  )
}
