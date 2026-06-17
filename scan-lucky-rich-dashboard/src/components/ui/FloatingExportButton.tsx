'use client'
import { useState } from 'react'
import { defaultRange, type DateRangeV2 } from './UnifiedDateRange'

type Format = 'json' | 'csv' | 'xlsx'

const FORMAT_OPTIONS: { value: Format; label: string; icon: string; desc: string }[] = [
  { value: 'json', label: 'JSON',  icon: 'ti-code',          desc: 'ข้อมูลครบทุก field' },
  { value: 'xlsx', label: 'Excel', icon: 'ti-table',         desc: 'แยก sheet รายหมวด' },
  { value: 'csv',  label: 'CSV',   icon: 'ti-file-text',     desc: 'เปิดได้ทุก tool' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}
function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export default function FloatingExportButton() {
  const [open, setOpen]     = useState(false)
  const [from, setFrom]     = useState(yesterdayStr)
  const [to, setTo]         = useState(yesterdayStr)
  const [format, setFormat] = useState<Format>('xlsx')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const presets = [
    { label: 'เมื่อวาน', from: yesterdayStr(), to: yesterdayStr() },
    { label: '7 วันล่าสุด', from: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10) })(), to: yesterdayStr() },
    { label: '30 วันล่าสุด', from: (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10) })(), to: yesterdayStr() },
    { label: 'ทั้งแคมเปญ', from: '2026-05-16', to: todayStr() },
  ]

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/export?from=${from}&to=${to}&format=${format}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `dashboard-export-${from}-to-${to}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="ดาวน์โหลดข้อมูล"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[var(--dark)] text-white shadow-lg px-4 py-2.5 text-[13px] font-semibold hover:bg-[var(--mid)] active:scale-95 transition-all"
      >
        <i className="ti ti-download text-[16px]" />
        ดาวน์โหลดข้อมูล
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-[340px] rounded-2xl bg-white shadow-2xl border border-[var(--border)] overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--dark)] text-white">
              <div className="flex items-center gap-2">
                <i className="ti ti-download text-[16px]" />
                <span className="text-[13.5px] font-bold">ดาวน์โหลดข้อมูล</span>
              </div>
              <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
                <i className="ti ti-x text-[14px]" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Date range */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-2">ช่วงวันที่</div>
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {presets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => { setFrom(p.from); setTo(p.to) }}
                      className={`text-[11px] rounded-full px-2.5 py-1 border font-medium transition-colors ${
                        from === p.from && to === p.to
                          ? 'bg-[var(--dark)] text-white border-[var(--dark)]'
                          : 'bg-[var(--bg-soft)] text-[var(--dark)] border-[var(--border)] hover:border-[var(--dark)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {/* Custom range */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={from}
                    min="2026-05-16"
                    max={to}
                    onChange={e => setFrom(e.target.value)}
                    className="flex-1 text-[12px] border border-[var(--border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[var(--primary)]"
                  />
                  <span className="text-[11px] text-[var(--text-muted)]">–</span>
                  <input
                    type="date"
                    value={to}
                    min={from}
                    max={todayStr()}
                    onChange={e => setTo(e.target.value)}
                    className="flex-1 text-[12px] border border-[var(--border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Format */}
              <div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] mb-2">รูปแบบไฟล์</div>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormat(opt.value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-3 px-2 transition-all ${
                        format === opt.value
                          ? 'bg-[var(--light)] border-[var(--primary)] text-[var(--dark)]'
                          : 'bg-[var(--bg-soft)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--dark)]'
                      }`}
                    >
                      <i className={`ti ${opt.icon} text-[20px]`} />
                      <span className="text-[12px] font-bold">{opt.label}</span>
                      <span className="text-[9px] text-center leading-tight opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-[11px] text-[var(--danger)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-white py-2.5 text-[13px] font-bold hover:bg-[var(--dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <i className="ti ti-loader-2 animate-spin text-[15px]" />
                    กำลังเตรียมไฟล์…
                  </>
                ) : (
                  <>
                    <i className="ti ti-download text-[15px]" />
                    ดาวน์โหลด .{format}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
