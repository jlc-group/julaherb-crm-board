'use client'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { HEATMAP_DATA, DAYS_TH, HEATMAP_INSIGHTS } from '@/lib/scan-behavior-data'

export default function ScanHeatmap() {
  const max = Math.max(...HEATMAP_DATA.map(c => c.scans))
  // Build 7x24 matrix
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  HEATMAP_DATA.forEach(c => { matrix[c.day][c.hour] = c.scans })

  function colorFor(v: number): string {
    const t = max > 0 ? v / max : 0
    if (t === 0) return 'rgb(243, 244, 246)'  // gray-100
    // green-50 → green-600 gradient
    const r = Math.round(240 - t * 224)
    const g = Math.round(253 - t * 90)
    const b = Math.round(244 - t * 170)
    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <ChartCard title="Scan Heatmap (วัน × ชั่วโมง)" icon="ti-flame" full>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour header */}
          <div className="flex items-center text-[9px] text-[var(--text-muted)] mb-1 ml-8">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="w-6 text-center">
                {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
              </div>
            ))}
          </div>
          {/* Rows */}
          {matrix.map((row, di) => (
            <div key={di} className="flex items-center mb-0.5">
              <div className="w-8 text-[10px] font-bold text-[var(--text-secondary)]">{DAYS_TH[di]}</div>
              {row.map((v, hi) => (
                <div
                  key={hi}
                  className="w-6 h-6 mx-px rounded-sm relative group cursor-pointer transition-transform hover:scale-110"
                  style={{ background: colorFor(v) }}
                  title={`${DAYS_TH[di]} ${String(hi).padStart(2, '0')}:00 — ${v.toLocaleString()} สแกน`}
                >
                  {v > max * 0.7 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                      {Math.round(v / 100)}h
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--text-muted)] ml-8">
            <span>น้อย</span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(t => (
              <div key={t} className="w-6 h-3 rounded-sm" style={{ background: colorFor(max * t) }} />
            ))}
            <span>มาก</span>
          </div>
        </div>
      </div>
      <InsightInline
        html={`Peak: <b>${HEATMAP_INSIGHTS.peakDay} ${String(HEATMAP_INSIGHTS.peakHour).padStart(2,'0')}:00</b> — <b>${HEATMAP_INSIGHTS.peakScans.toLocaleString()}</b> สแกน | วันที่สแกนเยอะสุด: <b>${HEATMAP_INSIGHTS.bestDay}</b> (${HEATMAP_INSIGHTS.bestDayScans.toLocaleString()} ครั้ง) — ลง ads ก่อน peak 30 นาที`}
      />
    </ChartCard>
  )
}
