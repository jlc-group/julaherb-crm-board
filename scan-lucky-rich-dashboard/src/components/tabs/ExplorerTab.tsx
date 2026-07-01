'use client'
// 🔍 Explorer — มุมลูกค้า/CRM (พฤติกรรม · พื้นที่ · เวลา) · มิติรายคนรอ backend (docs/explorer-api-spec.md)
// มุมสินค้า/SKU ย้ายไปหน้า Products แล้ว (ตารางจัดอันดับ + เทรนด์ + คู่สแกน)
import { useState } from 'react'
import TabHeader from '@/components/ui/TabHeader'
import UnifiedDateRange, { defaultRange, type DateRangeV2 } from '@/components/ui/UnifiedDateRange'
import ZoneTitle from '@/components/ui/ZoneTitle'
import ScanHeatmapLive from '@/components/ui/ScanHeatmapLive'
import HeavyUsersCard from '@/components/ui/HeavyUsersCard'
import TopProvincesCard from '@/components/ui/TopProvincesCard'
import ApiSourceBadge from '@/components/ui/ApiSourceBadge'
import { getCampaignToday } from '@/lib/utils'

// มิติ CRM รายคนที่ยังต้องรอ backend (ตาม docs/explorer-api-spec.md)
const LOCKED = [
  { icon: '🎂', t: 'อายุ 18-25 สแกนอะไร', d: 'dob มีใน DB · API ยังไม่ส่ง' },
  { icon: '🚻', t: 'แยกเพศ ชาย/หญิง', d: 'DB ยังไม่มี field gender' },
  { icon: '🧩', t: '7 เซกเมนต์ CRM', d: 'แชมเปี้ยน/ภักดี/เสี่ยงหลุด/…' },
  { icon: '💨', t: 'One-shot → กลับมาไหม', d: 'cohort สแกนครั้งเดียวแล้วหาย' },
  { icon: '🔁', t: 'L3-8G → L3-40G funnel', d: 'อัปไซส์ upsell' },
  { icon: '🔗', t: 'สแกนคู่ (รายคน)', d: 'co-scan ระดับลูกค้า' },
  { icon: '📍', t: 'จังหวัด × อายุ × SKU', d: 'cross หลายมิติ' },
  { icon: '👑', t: 'ใครคือ Royalty', d: 'drill-down รายคน' },
]

export default function ExplorerTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: getCampaignToday() }))

  return (
    <div className="space-y-4">
      {/* sticky header */}
      <div className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3"
           style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}>
        <TabHeader icon="🔍" title="Explorer — ลูกค้า/CRM"
          subtitle="เจาะพฤติกรรม · พื้นที่ · เวลา — มิติลูกค้ารายคน (อายุ/เพศ/เซกเมนต์/funnel) รอ backend" />
        <UnifiedDateRange value={range} onChange={setRange} today={getCampaignToday()} />
      </div>

      {/* ป้ายบอกขอบเขต — กันสับสนกับหน้า Products */}
      <div className="card p-3 text-[11.5px] text-[var(--text-secondary)] flex items-start gap-2" style={{ borderLeft: '4px solid var(--brand-500)' }}>
        <span>🧭</span>
        <span>หน้านี้โฟกัส <b>ลูกค้า/CRM</b> — ใคร · ที่ไหน · เมื่อไหร่ · เจาะ <b>สินค้า/SKU</b> (ตารางจัดอันดับ · เทรนด์ · คู่สแกน) ได้ที่หน้า <b>Products</b></span>
      </div>

      {/* A — เวลาที่สแกน */}
      <ZoneTitle num="A" title="เวลาที่สแกน (วัน × ชั่วโมง)" />
      <ScanHeatmapLive from={range.from} to={range.to} />

      {/* B — พื้นที่ + ลูกค้าตัวท็อป */}
      <ZoneTitle num="B" title="พื้นที่ + ลูกค้าที่สแกนเยอะ" dayTag={`snapshot ${range.to.split('-')[2]}`} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/provinces" params="date&limit" /></div>
          <TopProvincesCard date={range.to} limit={12} />
        </div>
        <div>
          <div className="mb-1"><ApiSourceBadge endpoint="/api/customers/heavy-users" params="date&limit" /></div>
          <HeavyUsersCard date={range.to} limit={20} />
        </div>
      </div>

      {/* C — locked (CRM รายคน รอ backend) */}
      <ZoneTitle num="C" title="เจาะลึกรายคน / CRM — รอ backend" />
      <div className="card p-4" style={{ borderLeft: '4px solid #cbd5e1', background: 'repeating-linear-gradient(45deg, #fff, #fff 10px, #fafbfc 10px, #fafbfc 20px)' }}>
        <div className="flex items-center gap-2 mb-2">
          <i className="ti ti-lock text-base text-slate-400" />
          <h3 className="text-[14px] font-bold text-slate-500">มิติที่รอ API (บริหารลูกค้ารายคน)</h3>
          <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">📋 docs/explorer-api-spec.md</span>
        </div>
        <div className="text-[11px] text-[var(--text-secondary)] mb-3">
          filter cross มิติ + ดึงลูกค้ารายคน ต้องรอ backend เปิด <code className="bg-white px-1 rounded border">/dashboard/explore</code> + <code className="bg-white px-1 rounded border">/explore/customers</code>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {LOCKED.map((x) => (
            <div key={x.t} className="rounded-lg p-2.5 bg-white/70 border border-slate-200">
              <div className="text-[15px] mb-0.5 grayscale opacity-70">{x.icon}</div>
              <div className="text-[11px] font-semibold text-slate-500 leading-snug">{x.t}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">{x.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
