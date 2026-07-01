'use client'
// 📈 Sparkline — เทรนด์จิ๋วในแถวตาราง (SVG polyline เบา ไม่ใช้ ChartJS ต่อแถว → รองรับหลายสิบแถวลื่นๆ)
interface Props {
  series: number[]
  width?: number
  height?: number
  color?: string
}

export default function Sparkline({ series, width = 76, height = 22, color = '#6366f1' }: Props) {
  const pts = series.filter((n) => Number.isFinite(n))
  if (pts.length < 2) return <svg width={width} height={height} aria-hidden="true" />

  const max = Math.max(...pts)
  const min = Math.min(...pts)
  const span = max - min || 1
  const stepX = width / (pts.length - 1)
  const y = (v: number) => height - ((v - min) / span) * (height - 3) - 1.5
  const points = pts.map((v, i) => `${(i * stepX).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const lastX = (pts.length - 1) * stepX
  const lastY = y(pts[pts.length - 1])

  return (
    <svg width={width} height={height} className="overflow-visible align-middle" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2} fill={color} />
    </svg>
  )
}
