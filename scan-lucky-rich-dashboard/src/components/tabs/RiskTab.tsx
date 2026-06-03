'use client'
import { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import KpiCard from '@/components/ui/KpiCard'
import ChartCard from '@/components/ui/ChartCard'
import InsightInline from '@/components/ui/InsightInline'
import InsightCard from '@/components/ui/InsightCard'
import DataTable from '@/components/ui/DataTable'
import VerificationPanel from '@/components/ui/VerificationPanel'
import HeavyUsersPanel from '@/components/ui/HeavyUsersPanel'
import SupportCasesPanel from '@/components/ui/SupportCasesPanel'
import DemoBanner from '@/components/ui/DemoBanner'
import { numFmt } from '@/lib/utils'
import * as mock from '@/lib/mock-data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler)

// ── Multi-Account Suspects ──
const MULTI_ACCOUNT_DATA = [
  { name: 'สมชาย ใจดี', uid: 'U-a1b2c3d4', accounts: 4, status: 'flagged' },
  { name: 'ณัฐ มีทรัพย์', uid: 'U-e5f6g7h8', accounts: 3, status: 'watching' },
  { name: 'ธนา พงษ์พาณิช', uid: 'D-iOS-9k2m', accounts: 3, status: 'flagged' },
  { name: 'มานะ ทองดี', uid: 'U-p4q5r6s7', accounts: 2, status: 'watching' },
  { name: 'ศิริ วงษ์วาน', uid: 'D-And-t8u9', accounts: 2, status: 'cleared' },
]

// ── Geo Mismatch ──
const GEO_MISMATCH_DATA = [
  { name: 'สมชาย ใจดี', regProvince: 'กรุงเทพฯ', scanProvince: 'เชียงใหม่', freq: 12 },
  { name: 'พิมพ์ เจริญ', regProvince: 'เชียงใหม่', scanProvince: 'กรุงเทพฯ', freq: 8 },
  { name: 'ธนา พงษ์พาณิช', regProvince: 'เชียงราย', scanProvince: 'ขอนแก่น', freq: 7 },
  { name: 'อนุชา ศรีสุข', regProvince: 'ชลบุรี', scanProvince: 'นครราชสีมา', freq: 6 },
  { name: 'จิตรา วงษ์วาน', regProvince: 'ขอนแก่น', scanProvince: 'กรุงเทพฯ', freq: 5 },
  { name: 'กัญญา ทองดี', regProvince: 'สุราษฎร์ธานี', scanProvince: 'ภูเก็ต', freq: 4 },
  { name: 'รัชนี ใจดี', regProvince: 'สมุทรปราการ', scanProvince: 'ระยอง', freq: 3 },
  { name: 'บุญมี รักดี', regProvince: 'ราชบุรี', scanProvince: 'นครปฐม', freq: 2 },
]

// ── Flag Growth Trend (14 days) ──
const FLAG_TREND = [1, 0, 2, 1, 3, 2, 1, 0, 1, 2, 3, 1, 2, 3]
const TREND_LABELS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(2026, 4, 2 + i)
  return `${d.getDate()}/${d.getMonth() + 1}`
})

export default function RiskTab() {
  // ── Velocity Alerts from MOCK_USERS sorted by scans desc ──
  const velocityUsers = [...mock.MOCK_USERS]
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10)
    .map((u, i) => ({
      ...u,
      rate: u.scans * 3 + ((i * 7) % 21),
    }))

  // ── Risk Score Ranking (Top 10) ──
  const riskTop10 = [...mock.MOCK_USERS]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 10)

  return (
    <div>
      <DemoBanner reason="RiskTab ยังไม่มี API endpoint dedicated (ต้องการ /api/customers/risk?date= สำหรับ fraud scoring + velocity alerts) — บางส่วนใช้ /api/customers/heavy-users ได้ในอนาคต" />
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="Flagged Users Today" value="3" valueStyle={{ color: 'var(--danger)' }} />
        <KpiCard label="Velocity Alerts" value="2" valueStyle={{ color: 'var(--gold)' }} />
        <KpiCard label="Geo Mismatches" value="5" valueStyle={{ color: 'var(--gold)' }} />
        <KpiCard label="Total Flagged All-time" value="18" />
      </div>

      <InsightInline
        html="<b>ระดับ: ปานกลาง</b> — Flagged 3 คนวันนี้ ต้อง monitor | อัตรา flag รวม 18% สูงกว่า benchmark"
        severity="warn"
      />

      {/* ── Velocity Alerts Table ── */}
      <ChartCard title="Velocity Alerts" icon="ti-bolt" full className="mb-4">
        <DataTable headers={['#', 'ชื่อ', 'สแกน/ชม.', 'จังหวัด', 'สถานะ']}>
          {velocityUsers.map((u, i) => (
            <tr key={u.id} className="border-b border-[var(--border)] hover:bg-gray-50">
              <td className="p-2 text-xs">{i + 1}</td>
              <td className="p-2 text-xs font-medium">{u.name}</td>
              <td className="p-2 text-xs">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                  style={{ background: u.rate > 60 ? 'var(--danger)' : 'var(--gold)' }}
                >
                  {u.rate} {u.rate > 60 ? 'สูง' : 'ปานกลาง'}
                </span>
              </td>
              <td className="p-2 text-xs">{u.province}</td>
              <td className="p-2 text-xs">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                  style={{ background: u.rate > 60 ? '#e74c3c' : '#EF9F27' }}
                >
                  {u.rate > 60 ? 'สูง' : 'ปานกลาง'}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      </ChartCard>

      {/* ── Multi-Account Suspects ── */}
      <ChartCard title="Multi-Account Suspects" icon="ti-users" full className="mb-4">
        <DataTable headers={['#', 'ชื่อ', 'Line UID / Device', 'จำนวนบัญชี', 'สถานะ']}>
          {MULTI_ACCOUNT_DATA.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] hover:bg-gray-50">
              <td className="p-2 text-xs">{i + 1}</td>
              <td className="p-2 text-xs font-medium">{row.name}</td>
              <td className="p-2 text-xs font-mono text-[var(--text-secondary)]">{row.uid}</td>
              <td className="p-2 text-xs text-center">{row.accounts}</td>
              <td className="p-2 text-xs">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                  style={{
                    background: row.status === 'flagged' ? '#e74c3c' : row.status === 'watching' ? '#EF9F27' : '#1D9E75',
                  }}
                >
                  {row.status === 'flagged' ? 'Flagged' : row.status === 'watching' ? 'Watching' : 'Cleared'}
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      </ChartCard>

      {/* ── Geo Mismatch ── */}
      <ChartCard title="Geo Mismatch" icon="ti-map-pin" full className="mb-4">
        <DataTable headers={['#', 'ชื่อ', 'จังหวัดลงทะเบียน', 'จังหวัดสแกน', 'ความถี่']}>
          {GEO_MISMATCH_DATA.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border)] hover:bg-gray-50">
              <td className="p-2 text-xs">{i + 1}</td>
              <td className="p-2 text-xs font-medium">{row.name}</td>
              <td className="p-2 text-xs">{row.regProvince}</td>
              <td className="p-2 text-xs">{row.scanProvince}</td>
              <td className="p-2 text-xs text-center font-semibold" style={{ color: row.freq > 5 ? 'var(--danger)' : 'var(--text)' }}>
                {row.freq}
              </td>
            </tr>
          ))}
        </DataTable>
      </ChartCard>

      {/* ── Chart Grid ── */}
      {/* Verification Panel (moved from Overview) */}
      <VerificationPanel />

      {/* ── Heavy Users + Support Cases (from Daily Update data) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <HeavyUsersPanel />
        <SupportCasesPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Risk Score Ranking (Top 10) */}
        <ChartCard title="Risk Score Ranking (Top 10)" icon="ti-shield-exclamation">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">#</th>
                  <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">ชื่อ</th>
                  <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">จังหวัด</th>
                  <th className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {riskTop10.map((u, i) => (
                  <tr key={u.id} className="border-b border-[var(--border)] hover:bg-gray-50">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2 font-medium">{u.name}</td>
                    <td className="p-2">{u.province}</td>
                    <td className="p-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{
                          background: u.riskScore > 70 ? '#e74c3c' : u.riskScore > 40 ? '#EF9F27' : '#1D9E75',
                        }}
                      >
                        {u.riskScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* ── Actions ── */}
      <InsightCard html={`
        1. <b>Velocity &gt; 50/hr:</b> ส่งรายชื่อให้ทีม Risk review วันนี้<br/>
        2. <b>Multi-account:</b> 1 device มี 3+ accounts → freeze สิทธิ์<br/>
        3. <b>Geo mismatch:</b> tag watch list ถ้า &gt; 5 ครั้ง ค่อย flag<br/>
        4. <b>Weekly:</b> ส่ง risk summary ให้ management ทุกจันทร์
      `} severity="warn" />
    </div>
  )
}
