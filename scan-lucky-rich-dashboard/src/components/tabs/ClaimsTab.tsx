'use client'

import { useEffect, useState } from 'react'
import TabHeader from '@/components/ui/TabHeader'
import PickupScheduleAdmin from '@/components/claim/PickupScheduleAdmin'

export default function ClaimsTab({ focusPhone = null }: { focusPhone?: string | null }) {
  const [claimUrl, setClaimUrl] = useState('/claim')
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') setClaimUrl(window.location.origin + '/claim')
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(claimUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 1800)
    } catch {
      /* คัดลอกไม่ได้ — ผู้ใช้กดเปิดลิงก์เองได้ */
    }
  }

  return (
    <div className="space-y-4">
      <TabHeader icon="🏅" title="รับรางวัล — ตรวจเอกสารหน้างาน" subtitle="ดูตามวันที่ลูกค้าจองเข้ามารับ · แยกช่วงเช้า/บ่าย · กดอัปเดตสถานะเมื่อรับของเรียบร้อย" />

      {/* ลิงก์ให้ลูกค้าตรวจสิทธิ์ + จองวันเข้ารับรางวัล */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[18px]">🔗</span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-[var(--dark)]">ลิงก์ตรวจสิทธิ์ + จองวันเข้ารับรางวัล</div>
            <div className="text-[11px] text-[var(--text-secondary)] truncate">{claimUrl}</div>
          </div>
        </div>
        <a
          href="/claim"
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-md text-white text-[12.5px] font-semibold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
        >
          เปิดหน้าตรวจสิทธิ์ ↗
        </a>
        <button onClick={copyLink} className="px-3 py-1.5 rounded-md border border-[var(--border)] text-[12.5px] font-semibold flex-shrink-0 hover:bg-[var(--bg-soft)]">
          {linkCopied ? '✓ คัดลอกแล้ว' : '📋 คัดลอกลิงก์'}
        </button>
      </div>

      {/* ตารางวันรับรางวัล + check-in หน้างาน (powered ด้วยข้อมูลการจองจริง) */}
      <PickupScheduleAdmin focusPhone={focusPhone} />
    </div>
  )
}
