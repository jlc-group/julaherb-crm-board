'use client'
/**
 * 🖨️ PrintListTab — สลิปจับฉลาก (1 สิทธิ์ = 1 ใบ)
 *
 * Data: GET /api/print-slips → ds.getPrintSlips
 *   - DATA_SOURCE=api: เรียก backend rollup endpoint (เมื่อ saversureV2 ship แล้ว)
 *   - ระหว่างรอ backend: route fallback เป็น mock preview อัตโนมัติ (rule-safe)
 *   - 🔴 กฎ: ห้าม page scan_history ดิบจาก dashboard (HOT write-table) — ดู obsidian/18
 *
 * Logic จับฉลาก: ลูกค้าสแกนสินค้าที่ได้ N สิทธิ์ → มีชื่อในกล่อง N ใบ (เหมือนกันเป๊ะ)
 * การ์ด: 8 × 3 ซม. · 4 บรรทัด (ชื่อ / เบอร์ / รหัสสแกน / ชื่อสินค้า) · ชิดกัน (gap 0) · ข้อความ center เผื่อระยะตัด
 * Phone: mask 4 ตัวท้าย — "081-123-xxxx"
 */
import { useMemo, useState } from 'react'
import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { numFmt, getCampaignToday, maskPhone6 } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { PrintSlipsResponse, ScansTotalsResponse } from '@/lib/api/types'
import { EMPLOYEE_EXCLUDE_NAMES } from '@/config/employee-exclude'
import TabHeader from '@/components/ui/TabHeader'
import UnifiedDateRange, { defaultRange, type DateRangeV2 } from '@/components/ui/UnifiedDateRange'

export default function PrintListTab() {
  const [range, setRange] = useState<DateRangeV2>(() => defaultRange({ preset: 'campaign', today: getCampaignToday() }))
  const { from, to } = range

  // ผู้ใช้สั่ง: "ถ้าเป็น mock ห้ามเอามาโชว์" → default ซ่อนสลิป mock, เปิดดูได้เฉพาะเช็ค layout
  const [showMockPreview, setShowMockPreview] = useState(false)
  const [showExcluded, setShowExcluded] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfMsg, setPdfMsg] = useState('')

  // ดาวน์โหลด PDF ครบทั้งช่วง (สร้างฝั่ง server · ตัดพนักงานแล้ว · ไม่ติด cap 5,000)
  // วันที่สลิปเยอะ server จะแบ่งเป็นหลายไฟล์ (part) — โหลดทีละส่วนเรียงกัน
  async function downloadPdf() {
    setPdfLoading(true)
    setPdfMsg('')
    try {
      let part = 1
      let totalParts = 1
      do {
        setPdfMsg(totalParts > 1 ? `กำลังสร้างส่วน ${part}/${totalParts}…` : 'กำลังสร้าง PDF…')
        const res = await fetch(`/api/print-slips-pdf?from=${from}&to=${to}&part=${part}`)
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          alert('สร้าง PDF ไม่สำเร็จ: ' + (e.error || `HTTP ${res.status}`) + '\n(ลองเลือกช่วงวันที่แคบลง เช่น รายวัน)')
          return
        }
        totalParts = Number(res.headers.get('X-Total-Parts') || 1)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download =
          totalParts > 1
            ? `สลิปจับฉลาก_${from}_ถึง_${to}_ส่วน${part}-จาก${totalParts}.pdf`
            : `สลิปจับฉลาก_${from}_ถึง_${to}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        part++
      } while (part <= totalParts)
    } catch (err: any) {
      alert('ดาวน์โหลดไม่สำเร็จ: ' + (err?.message ?? err))
    } finally {
      setPdfLoading(false)
      setPdfMsg('')
    }
  }

  const slipsApi = useApi<PrintSlipsResponse>(`/api/print-slips?from=${from}&to=${to}`)
  const totalsApi = useApi<ScansTotalsResponse>(`/api/scans/totals?from=${from}&to=${to}`)

  // ⚠️ กัน browser ค้าง: เมื่อ backend คืนสลิปจริง (อาจ 255k+ ใบ) การ render DOM ทั้งหมด
  //    รอบเดียวจะหนัก/ค้าง + print path พัง. react-window ใช้ไม่ได้ (window.print ต้องมีทุก node
  //    ใน DOM พร้อมกัน) → soft cap + แนะนำให้ narrow ช่วงวันที่ / ใช้ PDF export ฝั่ง backend
  const MAX_RENDER = 8000
  const allSlips = slipsApi.data?.slips ?? []
  const slips = allSlips.length > MAX_RENDER ? allSlips.slice(0, MAX_RENDER) : allSlips
  const truncated = allSlips.length > MAX_RENDER
  const isMock = (slipsApi.data?.meta?.source ?? 'mock') !== 'api'
  // แยกสาเหตุที่ตกเป็น mock ให้สื่อสารตรงกับความจริง:
  //   auth/timeout = หลุดชั่วคราว (refresh แล้วหาย ไม่ใช่ปัญหา backend) · missing = endpoint หายจริง (งานของ saversureV2)
  const mockNote = slipsApi.data?.meta?.note ?? ''
  const mockReason: 'auth' | 'missing' | 'timeout' | 'other' =
    /401|403|unauthor|forbidden|token/i.test(mockNote) ? 'auth'
    : /404|not found/i.test(mockNote) ? 'missing'
    : /timeout/i.test(mockNote) ? 'timeout'
    : 'other'
  const mockBanner = {
    auth:    { tone: 'amber' as const, icon: '🟠', title: 'เชื่อมต่อ backend หลุดชั่วคราว (token หมดอายุ)', body: <>ระบบกำลังต่อ token ใหม่ให้อัตโนมัติ — <b>กด refresh หน้านี้อีกครั้งสักครู่</b> ข้อมูลจริงจะกลับมา (ไม่ใช่ปัญหาฝั่ง backend)</> },
    timeout: { tone: 'amber' as const, icon: '🟠', title: 'backend ตอบช้า (timeout)', body: <>ลองแคบช่วงวันที่ลง (เช่น รายวัน) แล้วลองใหม่</> },
    missing: { tone: 'red'   as const, icon: '🔴', title: 'ยังไม่มี endpoint จริงจาก backend', body: <>ต้องรอ saversureV2 ทำ endpoint <code className="font-mono">/dashboard/print-slips</code> (อ่านจาก rollup ปลอดภัย · กฎห้าม dashboard ดึง scan_history ดิบ)</> },
    other:   { tone: 'amber' as const, icon: '🟠', title: 'ดึงข้อมูลจริงไม่สำเร็จชั่วคราว', body: <>ลอง refresh หน้านี้อีกครั้ง — ถ้ายังไม่หาย แจ้งทีมดูแลระบบ</> },
  }[mockReason]
  const realData = !isMock && slips.length > 0
  // โชว์การ์ดเมื่อ: เป็นข้อมูลจริง — หรือ mock ที่ผู้ใช้กดเปิดดู layout เอง
  const renderCards = realData || (isMock && showMockPreview)

  // 🚫 พนักงานที่ถูกตัดออก: excludedFound = พบในช่วงนี้จริง · EMPLOYEE_EXCLUDE_NAMES = ลิสต์ทั้งหมด
  const excludedFound = slipsApi.data?.excludedNames ?? []
  const excludedFoundSet = new Set(excludedFound)

  // ── สรุปช่วง (chip) — ใช้ live /api/scans/totals, fallback DAILY_ENTRIES ──
  const summary = useMemo(() => {
    const days = DAILY_ENTRIES.filter(d => d.date >= from && d.date <= to)
    const fbScans = days.reduce((s, d) => s + d.success, 0)
    const fbRights = days.reduce((s, d) => s + (d.expectedTickets ?? d.tickets), 0)
    const t = totalsApi.data
    return {
      days: days.length,
      scans: t?.success ?? fbScans,
      rights: t?.expectedTickets ?? fbRights,        // = จำนวนใบสลิปจริง
      users: t?.distinctUsers ?? t?.uniqueUsers,
    }
  }, [from, to, totalsApi.data])

  // การ์ด 8×3 ซม. → A4 landscape 3 คอลัมน์ (3×8=24ซม. พอดี A4 แนวนอน 29.7ซม.)
  const COLS = 3
  const ROWS_PER_PAGE = 6                             // 3×6 = 18 ใบ/หน้า (A4 แนวนอน · 80×30mm · 6×30=180mm พอดี 200mm)
  const PER_PAGE = COLS * ROWS_PER_PAGE
  const previewPages = Math.ceil(slips.length / PER_PAGE)
  const realPages = Math.ceil((summary.rights ?? 0) / PER_PAGE)

  return (
    <div className="space-y-4">
      {/* ── STICKY HEADER ── */}
      <div
        className="sticky top-0 z-30 -mx-6 px-6 pt-6 pb-3 space-y-3 print:hidden"
        style={{ background: 'var(--bg)', boxShadow: '0 4px 12px -8px rgba(15,23,42,0.15)' }}
      >
        <TabHeader icon="🖨️" title="Print List" subtitle="สลิปจับฉลาก • 1 สิทธิ์ = 1 ใบ • การ์ด 8×3 ซม." />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[400px]">
            <UnifiedDateRange value={range} onChange={setRange} today={getCampaignToday()} />
          </div>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            title="สร้าง PDF ครบทั้งช่วง (ตัดพนักงานแล้ว) ฝั่ง server — โหลดได้เลย"
            className="px-4 py-2 rounded-md text-white font-semibold text-[13px] hover:opacity-90 transition whitespace-nowrap disabled:opacity-50 disabled:cursor-wait"
            style={{ background: 'var(--brand-700, #14532d)' }}
          >
            <i className="ti ti-file-download mr-1.5" />
            {pdfLoading ? (pdfMsg || 'กำลังสร้าง PDF…') : 'ดาวน์โหลด PDF (ตัดพนักงานแล้ว)'}
          </button>
          <button
            onClick={() => window.print()}
            disabled={isMock || slips.length === 0}
            title={isMock ? 'พิมพ์ไม่ได้ — ยังเป็น mock ไม่ใช่สิทธิ์จริงของลูกค้า' : 'พิมพ์จากหน้าจอ (จำกัด ~5,000 ใบ) — แนะนำใช้ปุ่มดาวน์โหลด PDF สำหรับครบทั้งวัน'}
            className="px-3 py-2 rounded-md font-semibold text-[13px] hover:opacity-90 transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed border"
            style={{ borderColor: 'var(--brand-700, #14532d)', color: 'var(--brand-700, #14532d)' }}
          >
            <i className="ti ti-printer mr-1.5" />
            {isMock ? 'พิมพ์ไม่ได้ (mock)' : `พิมพ์จอ (${numFmt(slips.length)})`}
          </button>
        </div>
      </div>

      <div className="print:hidden">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] font-semibold">
            📅 {from} → {to} ({summary.days} วัน)
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
            🧾 สแกนสำเร็จ {numFmt(summary.scans)} ครั้ง
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold">
            🎟️ สิทธิ์ทั้งหมด {numFmt(summary.rights)} ใบ
            {realPages > 0 && <span className="opacity-60 font-normal ml-1">(~{numFmt(realPages)} หน้า A4)</span>}
          </span>
          {summary.users != null && (
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-semibold">
              👤 ผู้สแกน {numFmt(summary.users)} คน
            </span>
          )}
        </div>

        {/* Status banner */}
        {slipsApi.loading && slips.length === 0 ? (
          <div className="mt-2 text-[11px] text-[var(--text-muted)]">⏳ กำลังโหลดสลิป…</div>
        ) : isMock ? (
          <div
            className={
              'mt-2 px-3 py-2 rounded-md border text-[11px] leading-relaxed ' +
              (mockBanner.tone === 'red'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800')
            }
          >
            {mockBanner.icon} <b>{mockBanner.title}</b> — {mockBanner.body}
            <br />สิทธิ์ที่ต้องพิมพ์จริง = <b>{numFmt(summary.rights)} ใบ</b> (เลขนี้จริงจาก live API)
            <button
              onClick={() => setShowMockPreview(v => !v)}
              className="ml-2 underline font-semibold hover:opacity-70"
            >
              {showMockPreview ? 'ซ่อนตัวอย่าง layout' : 'ดูตัวอย่าง layout (mock · ไม่ใช่ข้อมูลจริง)'}
            </button>
            {mockNote && (
              <div className="mt-1 opacity-60 font-mono text-[10px] break-all">debug: {mockNote}</div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
            🟢 ข้อมูลจริงจาก saversureV2 · {numFmt(slips.length)} ใบ
          </div>
        )}

        {isMock && showMockPreview && (
          <div className="mt-2 px-3 py-1.5 rounded bg-yellow-100 text-yellow-900 text-[11px] font-semibold">
            ⚠️ ด้านล่างเป็น <b>ตัวอย่าง layout (mock)</b> — ชื่อ/เบอร์/รหัสปลอม ใช้ตรวจหน้าตาเท่านั้น · ห้ามใช้พิมพ์จับฉลากจริง
          </div>
        )}

        {truncated && (
          <div className="mt-2 px-3 py-2 rounded-md bg-orange-50 border border-orange-200 text-[11px] text-orange-800 leading-relaxed">
            ⚠️ <b>ชุดข้อมูลใหญ่มาก</b> — แสดง/ปริ้นได้ <b>{numFmt(MAX_RENDER)} ใบแรก</b> จาก {numFmt(allSlips.length)} ใบ (กัน browser ค้าง)
            <br />ปริ้นครบทุกชุด: narrow ช่วงวันที่ให้แคบลง (เช่น รายวัน) แล้วปริ้นทีละช่วง · หรือใช้ PDF export ฝั่ง server (backend)
          </div>
        )}

        {/* 🚫 รายชื่อพนักงานที่ถูกตัดออก (ทีมจุฬาเฮิร์บ — ไม่มีสิทธิ์เข้าร่วม) */}
        <div className="mt-2 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
            <span className="font-semibold">🚫 ตัดพนักงานออก {EMPLOYEE_EXCLUDE_NAMES.length} คน</span>
            <span className="opacity-60">(ทีมจุฬาเฮิร์บ — ไม่มีสิทธิ์เข้าร่วม)</span>
            {excludedFound.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                ✂️ พบ &amp; ตัดในช่วงนี้ {excludedFound.length} คน
              </span>
            )}
            <button
              onClick={() => setShowExcluded(v => !v)}
              className="underline font-semibold hover:opacity-70"
            >
              {showExcluded ? 'ซ่อนรายชื่อ' : 'ดูรายชื่อทั้งหมด'}
            </button>
          </div>
          {showExcluded && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-0.5 text-[10.5px]">
              {EMPLOYEE_EXCLUDE_NAMES.map((n, i) => {
                const found = excludedFoundSet.has(n)
                return (
                  <div key={i} className={found ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                    {i + 1}. {n}{found ? ' ✂️' : ''}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-1 text-[11px] text-[var(--text-muted)] italic">
          💡 กดปริ้นเพื่อดู A4 จริง (แนวนอน · 3 คอลัมน์ · การ์ด 8×3 ซม.) · เบอร์โทรแสดง mask <code className="font-mono">081-123-xxxx</code>
        </div>
      </div>

      {/* ─── Print area (visible on screen + paper) ─── */}
      <div className="print-area">
        {!renderCards ? (
          !slipsApi.loading && (
            <div className="text-center py-20 text-[var(--text-muted)] text-[13px] print:hidden">
              {isMock
                ? '🔒 ซ่อนข้อมูล mock อยู่ (ตามที่สั่ง) — กด “ดูตัวอย่าง layout” ด้านบนเพื่อเช็คหน้าตา · ข้อมูลจริงจะแสดงเมื่อ backend พร้อม'
                : 'ไม่มีข้อมูลในช่วงวันที่เลือก'}
            </div>
          )
        ) : (
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${COLS}, 80mm)`, justifyContent: 'center', gap: '0' }}
        >
          {slips.map((s, i) => (
            <div
              key={i}
              className="slip-card"
              style={{
                width: '80mm',
                height: '30mm',
                boxSizing: 'border-box',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                background: 'white',
                padding: '2mm 4mm',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',   // ข้อความชิดบน · ความสูงที่เพิ่มไปอยู่ด้านล่าง (เผื่อระยะตัด)
                textAlign: 'center',
                gap: '0.8mm',
                overflow: 'hidden',
                fontFamily: "'Sarabun', sans-serif",
                color: '#000000',
              }}
            >
              {/* 1. ชื่อ-นามสกุล (ใหญ่กว่าเพื่อน) */}
              <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.name}
              </div>
              {/* 2. เบอร์โทรศัพท์ */}
              <div style={{ fontSize: '12px', lineHeight: 1.5 }}>{maskPhone6(s.phone)}</div>
              {/* 3. รหัสการสแกน */}
              <div style={{ fontSize: '12px', lineHeight: 1.5, letterSpacing: '0.5px' }}>{s.scanCode}</div>
              {/* 4. ชื่อสินค้า (ใช้ภายใน) */}
              <div
                style={{ fontSize: '11.5px', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={s.productName}
              >
                {s.productName}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}
