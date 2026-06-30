'use client'
// 🔥 Scan Heatmap (วัน × ชั่วโมง) — ข้อมูลจริงจาก /api/scans/day-hour
// รวม scans ทุกวันของแต่ละ weekday → matrix[weekday 0-6][hour 0-23]
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'

interface DayHourRow { date: string; hour: number; scans: number }
interface DayHourResp { from: string; to: string; data: DayHourRow[] }

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] // ตรงกับ Date.getDay() 0=อาทิตย์

export default function ScanHeatmapLive({ from, to }: { from: string; to: string }) {
  const { data, loading } = useApi<DayHourResp>(`/api/scans/day-hour?from=${from}&to=${to}`)
  const rows = data?.data ?? []

  // matrix[weekday][hour] = ผลรวม scans
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const r of rows) {
    const wd = new Date(`${r.date}T00:00:00`).getDay()
    if (r.hour >= 0 && r.hour < 24) matrix[wd][r.hour] += r.scans
  }
  const max = Math.max(1, ...matrix.flat())

  function colorFor(v: number): string {
    const t = max > 0 ? v / max : 0
    if (t === 0) return 'rgb(243, 244, 246)'
    const r = Math.round(240 - t * 224)
    const g = Math.round(253 - t * 90)
    const b = Math.round(244 - t * 170)
    return `rgb(${r}, ${g}, ${b})`
  }

  // insight: peak cell + วันแน่นสุด + ชั่วโมงแน่นสุด
  let peak = { wd: 0, hr: 0, v: 0 }
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
    if (matrix[d][h] > peak.v) peak = { wd: d, hr: h, v: matrix[d][h] }
  }
  const dayTotals = matrix.map((row) => row.reduce((s, v) => s + v, 0))
  const bestDay = dayTotals.indexOf(Math.max(...dayTotals))
  const hourTotals = Array.from({ length: 24 }, (_, h) => matrix.reduce((s, row) => s + row[h], 0))
  const bestHour = hourTotals.indexOf(Math.max(...hourTotals))

  const hasData = rows.length > 0

  return (
    <ChartCard title="Scan Heatmap (วัน × ชั่วโมง)" icon="ti-flame" full>
      <div className="flex items-center gap-2 -mt-2 mb-2">
        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
        <span className="text-[10.5px] text-[var(--text-muted)]">รวมสแกนทุกวันตามวัน×ชั่วโมง (ช่วงที่เลือก)</span>
      </div>

      {loading && !hasData ? (
        <div className="text-[12px] text-[var(--text-muted)] py-6 text-center">กำลังโหลด Heatmap…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Hour header */}
              <div className="flex items-center text-[9px] text-[var(--text-muted)] mb-1 ml-8">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="w-6 text-center">{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</div>
                ))}
              </div>
              {/* Rows */}
              {matrix.map((row, di) => (
                <div key={di} className="flex items-center mb-0.5">
                  <div className="w-8 text-[10px] font-bold text-[var(--text-secondary)]">{DAYS_TH[di]}</div>
                  {row.map((v, hi) => (
                    <div
                      key={hi}
                      className="w-6 h-6 mx-px rounded-sm cursor-pointer transition-transform hover:scale-110"
                      style={{ background: colorFor(v) }}
                      title={`${DAYS_TH[di]} ${String(hi).padStart(2, '0')}:00 — ${numFmt(v)} สแกน`}
                    />
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--text-muted)] ml-8">
                <span>น้อย</span>
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => (
                  <div key={t} className="w-6 h-3 rounded-sm" style={{ background: colorFor(max * t) }} />
                ))}
                <span>มาก</span>
              </div>
            </div>
          </div>
          {hasData && (
            <InsightInline
              html={`พีค: <b>${DAYS_TH[peak.wd]} ${String(peak.hr).padStart(2, '0')}:00</b> (${numFmt(peak.v)} สแกน) · วันแน่นสุด <b>${DAYS_TH[bestDay]}</b> · ชั่วโมงแน่นสุด <b>${String(bestHour).padStart(2, '0')}:00</b> — ลง ads/ดัน LINE ก่อนพีค 30 นาที`}
            />
          )}
        </>
      )}
    </ChartCard>
  )
}
