'use client'
import { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import ProgressBar from '@/components/ui/ProgressBar'
import DemoBanner from '@/components/ui/DemoBanner'
import { numFmt, maskPhone, statusColor, statusLabel } from '@/lib/utils'
import { PRIZES } from '@/config/campaign'
import type { Winner } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

// ── Mock Winners ──
const MOCK_WINNERS: Winner[] = [
  { id: 1, userId: 1, name: 'สมชาย ใจดี', phone: '0891234567', province: 'กรุงเทพฯ', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-07-01', products: [] },
  { id: 2, userId: 5, name: 'พิมพ์ เจริญ', phone: '0654321987', province: 'เชียงใหม่', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-07-03', products: [] },
  { id: 3, userId: 12, name: 'อนุชา ศรีสุข', phone: '0912345678', province: 'ชลบุรี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'pending', date: '2026-07-05', products: [] },
  { id: 4, userId: 8, name: 'จิตรา วงษ์วาน', phone: '0823456789', province: 'ขอนแก่น', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-07-10', products: [] },
  { id: 5, userId: 3, name: 'วิภา รักดี', phone: '0934567890', province: 'นนทบุรี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'forfeited', date: '2026-07-12', products: [] },
  { id: 6, userId: 15, name: 'สุภาพ ทองดี', phone: '0845678901', province: 'สงขลา', tier: '100K', prizeLabel: 'ทองคำ 100,000', status: 'confirmed', date: '2026-07-15', products: [] },
  { id: 7, userId: 20, name: 'ชัยวัฒน์ ทองดี', phone: '0956789012', province: 'ภูเก็ต', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-07-18', products: [] },
  { id: 8, userId: 2, name: 'สมหญิง สุขสม', phone: '0867890123', province: 'ปทุมธานี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'pending', date: '2026-07-20', products: [] },
  { id: 9, userId: 9, name: 'ปวีณ์ แก้วมา', phone: '0678901234', province: 'นครราชสีมา', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-07-22', products: [] },
  { id: 10, userId: 14, name: 'มานะ ทองดี', phone: '0989012345', province: 'ลำปาง', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'unannounced', date: '2026-07-25', products: [] },
  // August
  { id: 11, userId: 4, name: 'ณัฐ มีทรัพย์', phone: '0890123456', province: 'ชลบุรี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-08-01', products: [] },
  { id: 12, userId: 7, name: 'ธนา พงษ์พาณิช', phone: '0801234567', province: 'เชียงราย', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-08-05', products: [] },
  { id: 13, userId: 11, name: 'ศิริ วงษ์วาน', phone: '0612345678', province: 'พิษณุโลก', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'pending', date: '2026-08-08', products: [] },
  { id: 14, userId: 16, name: 'รัชนี ใจดี', phone: '0923456789', province: 'สมุทรปราการ', tier: '100K', prizeLabel: 'ทองคำ 100,000', status: 'confirmed', date: '2026-08-15', products: [] },
  { id: 15, userId: 18, name: 'บุญมี รักดี', phone: '0834567890', province: 'ราชบุรี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-08-18', products: [] },
  { id: 16, userId: 10, name: 'กัญญา ทองดี', phone: '0745678901', province: 'สุราษฎร์ธานี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'forfeited', date: '2026-08-20', products: [] },
  { id: 17, userId: 6, name: 'อรุณ พงษ์พาณิช', phone: '0856789012', province: 'เชียงใหม่', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-08-25', products: [] },
  // September
  { id: 18, userId: 13, name: 'ดวงใจ แก้วมา', phone: '0967890123', province: 'นครราชสีมา', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-09-02', products: [] },
  { id: 19, userId: 19, name: 'วรรณา ลพบุรี', phone: '0878901234', province: 'ลพบุรี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'pending', date: '2026-09-10', products: [] },
  { id: 20, userId: 17, name: 'ประเสริฐ ศรีสุข', phone: '0689012345', province: 'ระยอง', tier: '100K', prizeLabel: 'ทองคำ 100,000', status: 'confirmed', date: '2026-09-15', products: [] },
  // October
  { id: 21, userId: 1, name: 'สมชาย ใจดี', phone: '0891234567', province: 'กรุงเทพฯ', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-10-01', products: [] },
  { id: 22, userId: 5, name: 'พิมพ์ เจริญ', phone: '0654321987', province: 'เชียงใหม่', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-10-08', products: [] },
  { id: 23, userId: 8, name: 'จิตรา วงษ์วาน', phone: '0823456789', province: 'ขอนแก่น', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'pending', date: '2026-10-12', products: [] },
  { id: 24, userId: 15, name: 'สุภาพ ทองดี', phone: '0845678901', province: 'สงขลา', tier: '100K', prizeLabel: 'ทองคำ 100,000', status: 'pending', date: '2026-10-15', products: [] },
  // November
  { id: 25, userId: 20, name: 'ชัยวัฒน์ ทองดี', phone: '0956789012', province: 'ภูเก็ต', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'confirmed', date: '2026-11-01', products: [] },
  { id: 26, userId: 2, name: 'สมหญิง สุขสม', phone: '0867890123', province: 'ปทุมธานี', tier: '10K', prizeLabel: 'ทองคำ 10,000', status: 'unannounced', date: '2026-11-05', products: [] },
  { id: 27, userId: 9, name: 'ปวีณ์ แก้วมา', phone: '0678901234', province: 'นครราชสีมา', tier: '100K', prizeLabel: 'ทองคำ 100,000', status: 'unannounced', date: '2026-11-15', products: [] },
]

// ── Helpers ──
const MONTH_NAMES: Record<string, string> = { '07': 'ก.ค.', '08': 'ส.ค.', '09': 'ก.ย.', '10': 'ต.ค.', '11': 'พ.ย.', '12': 'ธ.ค.' }

function groupByMonth(winners: Winner[]): Record<string, Winner[]> {
  const groups: Record<string, Winner[]> = {}
  for (const w of winners) {
    const month = w.date.slice(5, 7)
    if (!groups[month]) groups[month] = []
    groups[month].push(w)
  }
  return groups
}

// ── Prize burn overrides (for display) ──
const PRIZE_BURN: Record<string, { used: number; total: number }> = {
  'gold-10k': { used: 45, total: 167 },
  'gold-100k': { used: 10, total: 30 },
  'gold-1m': { used: 0, total: 1 },
}

export default function OperationsTab() {
  const [selectedTier, setSelectedTier] = useState<number>(10000)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(['07']))
  const [winnerName, setWinnerName] = useState('')
  const [drawDate, setDrawDate] = useState('')

  const grouped = groupByMonth(MOCK_WINNERS)
  const monthKeys = Object.keys(grouped).sort()

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  }

  const confirmedCount = MOCK_WINNERS.filter(w => w.status === 'confirmed').length
  const pendingCount = MOCK_WINNERS.filter(w => w.status === 'pending').length
  const forfeitedCount = MOCK_WINNERS.filter(w => w.status === 'forfeited').length

  return (
    <div>
      <DemoBanner reason="OperationsTab ยังไม่มี API endpoint (ต้องการ /api/winners CRUD + /api/prize-allocations + /api/scan-log/export) — รอ backend ทำ endpoint เพิ่ม" />
      {/* ── Gold KPI Card ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="การจับรางวัลวันนี้"
          value="ทองคำ 10,000"
          sub="สถานะ: พร้อมจับ"
          gold
        />
      </div>

      <InsightInline html={`<b>Burn rate:</b> ทองคำ 10K ใช้ไป 45/167 (${(45/167*100).toFixed(1)}%) — pace สอดคล้องกับระยะเวลาแคมเปญ | ทองคำ 100K ใช้ไป 10/30 — on track`} />

      {/* ── Winner Form ── */}
      <ChartCard title="เพิ่มผู้โชคดี" icon="ti-trophy" className="mb-4">
        {/* Tier Buttons */}
        <div className="flex gap-2 mb-3">
          {[10000, 100000, 1000000].map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTier === tier
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'bg-[var(--light)] text-[var(--dark)] hover:bg-[var(--primary)] hover:text-white'
              }`}
            >
              {numFmt(tier)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">วันที่จับรางวัล</label>
            <input
              type="date"
              value={drawDate}
              onChange={e => setDrawDate(e.target.value)}
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">ชื่อผู้โชคดี</label>
            <input
              type="text"
              value={winnerName}
              onChange={e => setWinnerName(e.target.value)}
              placeholder="พิมพ์ชื่อเพื่อค้นหา..."
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Phone (readonly) */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">เบอร์โทร</label>
            <input
              type="text"
              readOnly
              value="xxx-xxx-XXXX"
              className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-gray-50 text-[var(--text-secondary)]"
            />
          </div>

          {/* Submit */}
          <div className="flex items-end">
            {/* TODO: Connect to POST /api/winners */}
            <button
              disabled
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-400 cursor-not-allowed"
              title="TODO: เชื่อมต่อ API"
            >
              เพิ่มผู้โชคดี
            </button>
          </div>
        </div>
      </ChartCard>

      {/* ── Winners List (Grouped by Month) ── */}
      <ChartCard title="รายชื่อผู้โชคดี" icon="ti-list" full className="mb-4">
        {monthKeys.map(month => {
          const winners = grouped[month]
          const isExpanded = expandedMonths.has(month)
          return (
            <div key={month} className="mb-2">
              <button
                onClick={() => toggleMonth(month)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[var(--light)] rounded-lg text-sm font-semibold text-[var(--dark)] hover:bg-[#d4efe4] transition-colors"
              >
                <span>
                  <i className={`ti ${isExpanded ? 'ti-chevron-down' : 'ti-chevron-right'} text-xs mr-1.5`} />
                  {MONTH_NAMES[month] || month} 2569 ({winners.length} คน)
                </span>
              </button>
              {isExpanded && (
                <div className="overflow-x-auto mt-1">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">ชื่อ</th>
                        <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">เบอร์โทร</th>
                        <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">รางวัล</th>
                        <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map(w => (
                        <tr key={w.id} className="border-b border-[var(--border)] hover:bg-gray-50">
                          <td className="p-2">{w.name}</td>
                          <td className="p-2">{maskPhone(w.phone)}</td>
                          <td className="p-2">{w.prizeLabel}</td>
                          <td className="p-2">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                              style={{ background: statusColor(w.status) }}
                            >
                              {statusLabel(w.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </ChartCard>

      <InsightInline html={`<b>สรุป:</b> ยืนยันแล้ว ${confirmedCount} | รอยืนยัน ${pendingCount} | สละสิทธิ์ ${forfeitedCount} — อัตราสละสิทธิ์ ${(forfeitedCount / MOCK_WINNERS.length * 100).toFixed(1)}%`} />

      {/* ── Prize Burn Rate ── */}
      <ChartCard title="Prize Burn Rate" icon="ti-flame" className="mb-4">
        {PRIZES.map(p => {
          const burn = PRIZE_BURN[p.id] || { used: p.used, total: p.totalCount }
          return (
            <ProgressBar
              key={p.id}
              label={p.tierLabel}
              current={burn.used}
              total={burn.total}
            />
          )
        })}
      </ChartCard>

      {/* ── Prize Depletion Forecast ── */}
      <ChartCard title="Prize Depletion Forecast" icon="ti-calendar-stats" className="mb-4">
        <div className="text-sm text-[var(--text)] leading-relaxed py-2">
          <i className="ti ti-alert-circle text-[var(--gold)] mr-1" />
          ตามอัตราปัจจุบัน รางวัลทั้งหมดจะหมดประมาณ <b>15 ธ.ค. 2569</b>
        </div>
      </ChartCard>

      <InsightInline html="<b>Burn rate analysis:</b> ทองคำ 10K = 26.9% used (45/167) ในเดือนที่ 4/7 → pace ดี | ทองคำ 100K = 33.3% used (10/30) → เร็วกว่าแผนเล็กน้อย monitor" severity="warn" />

      {/* ── Actions ── */}
      <InsightCard html={`
        1. ผู้โชคดี <b>รอยืนยัน เกิน 7 วัน</b> → ทีม CS โทรติดตามทันที<br/>
        2. <b>สละสิทธิ์ &gt; 10%</b> → ปรับขั้นตอนให้ง่ายขึ้น<br/>
        3. ประกาศเรื่องจริงของผู้ได้รางวัลผ่าน content — <b>build trust</b><br/>
        4. Prize burn: ตามแผน — <b>maintain pace</b>
      `} />
    </div>
  )
}
