'use client'

import { useState } from 'react'

interface Props {
  reason?: string
}

export default function DemoBanner({ reason }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="card p-3 flex items-start gap-3 text-[12px] mb-3"
         style={{ background: '#fef3c7', borderColor: '#f59e0b', borderWidth: 1.5 }}>
      <span className="text-[20px] flex-shrink-0">🟡</span>
      <div className="flex-1">
        <div className="font-bold text-yellow-800 mb-0.5">Demo Mode — ข้อมูลยังเป็น mock</div>
        <div className="text-[11px] text-[var(--text)] leading-relaxed">
          {reason ?? 'Tab นี้ยังไม่มี API endpoint รองรับใน /api/* — รอ backend ทำ endpoint เพิ่ม แล้ว wire ผ่าน adapter ตามรูปแบบเดียวกับ Overview/Customers/Products'}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="ปิดแบนเนอร์"
        className="flex-shrink-0 text-yellow-800 hover:text-yellow-900 font-bold text-[16px] leading-none px-1"
      >
        ✕
      </button>
    </div>
  )
}
