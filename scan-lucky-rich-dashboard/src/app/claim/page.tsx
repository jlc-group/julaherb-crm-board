'use client'

import { useState } from 'react'
import DocExampleModal, { type DocType } from '@/components/claim/DocExampleModal'
import ClaimPickupCalendar from '@/components/claim/ClaimPickupCalendar'
import MobileShell from '@/components/public/MobileShell'
import { pickupDateLabel, slotById } from '@/config/pickup'

const last9 = (phone: string) => phone.replace(/\D/g, '').slice(-9)
const apptKey = (phone: string) => `jh-appt-${last9(phone)}`
interface Appt { date: string; slotId: string }

interface Prize {
  round: number
  prizeLabel: string
  announce: string
  drawDate: string
}

const GREEN_BTN = 'linear-gradient(135deg,#16a34a,#15803d)'

export default function ClaimPage() {
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState<{ name: string; prizes: Prize[]; claimStatus: string | null } | null>(null)
  const [notWinner, setNotWinner] = useState(false)
  const [err, setErr] = useState('')
  const [pickupMode, setPickupMode] = useState<'self' | 'proxy'>('self')
  const [formNote, setFormNote] = useState(false)
  const [done, setDone] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  const [example, setExample] = useState<DocType | null>(null)
  const [appt, setAppt] = useState<Appt | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  async function check() {
    setErr('')
    setNotWinner(false)
    setVerified(null)
    setDone(false)
    setShowDocs(false)
    if (phone.replace(/\D/g, '').length < 9) {
      setErr('กรุณากรอกเบอร์โทรให้ครบ')
      return
    }
    setChecking(true)
    try {
      const r = await fetch('/api/claim/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const b = await r.json()
      if (!r.ok) {
        setErr(b.error ?? 'ตรวจสอบไม่สำเร็จ')
        return
      }
      if (!b.isWinner) {
        setNotWinner(true)
        return
      }
      setVerified({ name: b.name, prizes: b.prizes ?? [], claimStatus: b.claimStatus })
      // โหลดนัดหมายเดิมของเบอร์นี้ (ถ้าเคยจองไว้บนเครื่องนี้) เพื่อให้ลูกค้ากลับมาเช็คได้
      try {
        const raw = localStorage.getItem(apptKey(phone))
        const o = raw ? JSON.parse(raw) : null
        setAppt(o?.date && o?.slotId ? { date: o.date, slotId: o.slotId } : null)
      } catch {
        setAppt(null)
      }
    } catch (e: any) {
      setErr('เชื่อมต่อไม่สำเร็จ: ' + (e?.message ?? e))
    } finally {
      setChecking(false)
    }
  }

  function bookAppt(date: string, slotId: string) {
    const a = { date, slotId }
    try {
      localStorage.setItem(apptKey(phone), JSON.stringify({ ...a, savedAt: new Date().toISOString() }))
    } catch {}
    setAppt(a)
    setShowSuccess(true)
  }

  function resetAll() {
    setDone(false)
    setShowDocs(false)
    setVerified(null)
    setPhone('')
    setNotWinner(false)
    setErr('')
    setPickupMode('self')
    setFormNote(false)
    setAppt(null)
    setShowSuccess(false)
  }

  return (
    <MobileShell icon="🎁" backHref="/winners">
      {!verified ? (
        <div className="float-up">
          <div className="text-center mb-5 mt-1">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl text-[28px] mb-3"
              style={{ background: 'linear-gradient(135deg,#fef9c3,#fde68a)', boxShadow: '0 6px 18px rgba(217,119,6,0.18)' }}>
              🎁
            </span>
            <h1 className="text-[24px] font-extrabold text-[#14532d] leading-tight">ตรวจสอบสิทธิ์รับรางวัล</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2 leading-relaxed px-2">
              กรอกเบอร์โทรที่ใช้ลงทะเบียนสแกน เพื่อเช็กว่าคุณเป็นผู้โชคดีหรือไม่
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
            <label htmlFor="phone" className="text-[14px] font-bold text-[var(--text)]">
              เบอร์โทรที่ใช้ลงทะเบียนสแกน
            </label>
            <div className="relative mt-2.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] opacity-70">📱</span>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                inputMode="tel"
                placeholder="08X-XXX-XXXX"
                className="w-full pl-11 pr-3 py-3.5 rounded-xl border border-[var(--border)] text-[16px] tracking-wide outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
              />
            </div>
            {notWinner && (
              <div className="mt-3 text-[13px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2.5">
                ไม่พบรายชื่อผู้โชคดีของเบอร์นี้ ตรวจสอบเบอร์อีกครั้งหรือสอบถามทีมงาน
              </div>
            )}
            {err && (
              <div className="mt-3 text-[13px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3 py-2.5">{err}</div>
            )}
            <button
              onClick={check}
              disabled={checking}
              className="w-full mt-4 py-4 rounded-2xl text-white font-bold text-[15px] disabled:opacity-50 transition active:scale-[0.98] shadow-[0_4px_14px_rgba(22,163,74,0.3)]"
              style={{ background: GREEN_BTN }}
            >
              {checking ? 'กำลังตรวจสอบ…' : 'ตรวจสอบสิทธิ์'}
            </button>
            <p className="text-[11.5px] text-[var(--text-muted)] text-center mt-3">
              ระบบจะแสดงผลทันทีเมื่อพบเบอร์ในรายชื่อผู้โชคดี
            </p>
          </div>

          <a href="/winners" className="block text-center text-[12.5px] font-semibold text-[#15803d] mt-4 py-2">
            ← ดูรายชื่อผู้โชคดีทั้งหมด
          </a>
        </div>
      ) : (
        <div className="space-y-3 float-up">
            <div className="rounded-2xl p-4 border" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderColor: '#f5d58a' }}>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#b45309]">🎉 ยินดีด้วย คุณคือผู้โชคดี</div>
              <div className="text-[19px] font-extrabold text-[#14532d] mt-0.5">{verified.name || '(ผู้โชคดี)'}</div>
              <div className="mt-2.5 space-y-1.5">
                {verified.prizes.map((p, i) => (
                  <div key={i} className="bg-white/70 rounded-lg px-2.5 py-2 border border-[#fbe3a8]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-bold text-[#b45309]">🏆 {p.prizeLabel}</span>
                      <span className="text-[10.5px] text-[#a16207] font-semibold bg-[#fef3c7] rounded px-1.5 py-0.5 flex-shrink-0">รอบ {p.round}</span>
                    </div>
                    {p.announce && <div className="text-[12px] text-[#7c5e10] mt-0.5">{p.announce}</div>}
                  </div>
                ))}
              </div>
              {verified.claimStatus && (
                <div className="mt-2 text-[11.5px] text-[#15803d] bg-white/60 rounded px-2 py-1">
                  สถานะในระบบ: {verified.claimStatus}
                </div>
              )}
              <div className="mt-3 text-[11.5px] text-[#7c5e10] leading-relaxed flex gap-1.5">
                <span>📞</span>
                <span>พนักงานจะติดต่อกลับไปยังเบอร์ที่ลงทะเบียน ภายใน 3–5 วันทำการ — กดปุ่มด้านล่างเพื่อเตรียมเอกสารล่วงหน้า</span>
              </div>
            </div>

            {appt && (
              <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#15803d]">📅 นัดหมายรับรางวัลของคุณ</div>
                <div className="text-[14px] font-bold text-[#14532d] mt-1">{pickupDateLabel(appt.date)}</div>
                <div className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                  {slotById(appt.slotId)?.period} · {slotById(appt.slotId)?.time}
                </div>
                {!showDocs && (
                  <button onClick={() => setShowDocs(true)} className="mt-2 text-[12px] font-semibold text-[#15803d] underline">
                    เปลี่ยนนัดหมาย / ดูเอกสาร
                  </button>
                )}
              </div>
            )}

            {!showDocs ? (
              <button
                onClick={() => setShowDocs(true)}
                className="w-full py-4 rounded-2xl text-white font-bold text-[15px] transition active:scale-[0.98] shadow-[0_4px_14px_rgba(22,163,74,0.3)] flex items-center justify-center gap-2"
                style={{ background: GREEN_BTN }}
              >
                📋 อ่านข้อมูลเตรียมรับของรางวัล
              </button>
            ) : (
            <>
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#dcfce7] text-[15px]">📋</span>
                <div>
                  <div className="text-[15px] font-bold text-[#14532d]">เอกสารที่ต้องเตรียมมาในวันรับรางวัล</div>
                  <div className="text-[11.5px] text-[var(--text-secondary)]">เลือกวิธีรับรางวัลด้านล่าง · ไม่ต้องอัปโหลดผ่านหน้านี้</div>
                </div>
              </div>

              {/* แท็บเลือกวิธีรับ */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                {([['self', '🙋 มารับเอง'], ['proxy', '👥 มีผู้มารับแทน']] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => { setPickupMode(mode); setFormNote(false) }}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition ${pickupMode === mode ? 'text-white' : 'text-[var(--text-secondary)]'}`}
                    style={pickupMode === mode ? { background: GREEN_BTN } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {pickupMode === 'self' ? (
                <div className="space-y-3">
                  <DocChecklistItem step={1} title="บัตรประชาชนตัวจริงของผู้โชคดี" hint="นำมาแสดงต่อเจ้าหน้าที่เพื่อยืนยันตัวตน" />
                  <DocChecklistItem step={2} title="สำเนาบัตรประชาชนพร้อมเซ็นรับรอง" hint='เขียน "สำเนาถูกต้อง" และเซ็นชื่อจริงกำกับ' onShowExample={() => setExample('idCard')} />
                  <DocChecklistItem step={3} title="สินค้าจริงที่ใช้สแกน" hint="นำสินค้าหรือหลักฐานสินค้าที่สแกนมาแสดงในวันรับรางวัล" />
                </div>
              ) : (
                <div className="space-y-3">
                  <DocChecklistItem step={1} title="สำเนาบัตรประชาชน (ผู้โชคดี)" hint="1 ชุด · พร้อมเซ็นรับรองสำเนา · นำบัตรตัวจริงของผู้โชคดีมาด้วย" onShowExample={() => setExample('idCard')} />
                  <DocChecklistItem step={2} title="สำเนาบัตรประชาชน (ผู้รับแทน)" hint="1 ชุด · พร้อมเซ็นรับรองสำเนา · นำบัตรตัวจริงของผู้รับแทนมาด้วย" onShowExample={() => setExample('proxyId')} />
                  <DocChecklistItem step={3} title="หนังสือมอบอำนาจ" hint="1 ฉบับ · ติดอากรแสตมป์ 30 บาท" onShowExample={() => setExample('poa')} onDownload={() => setFormNote(true)} />
                  {formNote && (
                    <div className="text-[11.5px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-lg px-3 py-2 -mt-1">
                      📄 แบบฟอร์มหนังสือมอบอำนาจกำลังเตรียมไฟล์ — ระหว่างนี้ใช้แบบฟอร์มมาตรฐานทั่วไปได้ หรือสอบถามทีมงาน
                    </div>
                  )}
                  <DocChecklistItem step={4} title="สินค้าจริงที่ใช้สแกน" hint="นำสินค้าหรือหลักฐานสินค้าที่สแกนมาแสดงในวันรับรางวัล" />
                </div>
              )}

              <div className="text-[12px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2.5 flex gap-2">
                <span>📌</span>
                <span>เจ้าหน้าที่จะตรวจเอกสารตัวจริงที่จุดรับรางวัลเท่านั้น กรุณาเตรียมเอกสารให้ครบก่อนเดินทางมารับรางวัล</span>
              </div>

              {done && (
                <div className="text-[13px] text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-3 py-2.5">
                  รับทราบแล้ว กรุณานำเอกสารตัวจริงมาแสดงในวันรับรางวัล
                </div>
              )}

              <button
                onClick={() => setDone(true)}
                className="w-full py-4 rounded-2xl text-white font-bold text-[15px] transition active:scale-[0.98] shadow-[0_4px_14px_rgba(22,163,74,0.3)]"
                style={{ background: GREEN_BTN }}
              >
                รับทราบรายการเอกสาร
              </button>
            </div>

            <ClaimPickupCalendar initial={appt} onConfirm={bookAppt} />
            </>
            )}

            <button onClick={resetAll} className="w-full text-[12.5px] text-[var(--text-secondary)] py-2">
              ← ใช้เบอร์อื่น
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
          มีคำถามเรื่องการรับรางวัล? ติดต่อทีมงาน Jula&apos;s Herb
        </p>

      <DocExampleModal doc={example} onClose={() => setExample(null)} />
      {showSuccess && appt && (
        <AppointmentSuccessModal appt={appt} onClose={() => setShowSuccess(false)} />
      )}
    </MobileShell>
  )
}

function AppointmentSuccessModal({ appt, onClose }: { appt: Appt; onClose: () => void }) {
  const slot = slotById(appt.slotId)
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full text-[34px] mb-3"
          style={{ background: 'linear-gradient(135deg,#dcfce7,#86efac)' }}>✅</div>
        <div className="text-[18px] font-extrabold text-[#14532d]">บันทึกนัดหมายแล้ว</div>
        <div className="mt-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-3">
          <div className="text-[14px] font-bold text-[#15803d]">{pickupDateLabel(appt.date)}</div>
          <div className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">{slot?.period} · {slot?.time}</div>
        </div>
        <div className="text-[12px] text-[var(--text-secondary)] mt-3 leading-relaxed">
          ทีมงานจะติดต่อยืนยันนัดหมายอีกครั้งทางเบอร์ที่ลงทะเบียน<br />
          กลับมาเช็คนัดหมายได้ตลอด เพียงกรอกเบอร์เดิม
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-2xl text-white font-bold text-[14px]"
          style={{ background: GREEN_BTN }}>
          เรียบร้อย
        </button>
      </div>
    </div>
  )
}

function DocThumb() {
  // ภาพย่อตัวอย่างเอกสาร (กดเพื่อเปิดดูเต็ม)
  return (
    <svg viewBox="0 0 48 34" className="w-full h-full" aria-hidden="true">
      <rect x="1" y="1" width="46" height="32" rx="4" fill="#eff6ff" stroke="#bcd2ef" />
      <rect x="5" y="6" width="14" height="16" rx="2" fill="#dbe7f6" />
      <rect x="22" y="7" width="20" height="3" rx="1.5" fill="#c9d6e8" />
      <rect x="22" y="13" width="18" height="3" rx="1.5" fill="#dbe4f0" />
      <g transform="rotate(-6 30 26)">
        <text x="20" y="28" fontSize="6.5" fill="#dc2626" fontWeight="700" fontFamily="'Mali','Noto Sans Thai',sans-serif">สำเนาถูกต้อง</text>
      </g>
    </svg>
  )
}

function DocChecklistItem({
  step,
  title,
  hint,
  onShowExample,
  onDownload,
}: {
  step: number
  title: string
  hint: string
  onShowExample?: () => void
  onDownload?: () => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-bold flex-shrink-0">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</div>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-2.5 py-1.5"
            >
              ⬇ ดาวน์โหลดแบบฟอร์ม
            </button>
          )}
        </div>
        {onShowExample && (
          <button
            type="button"
            onClick={onShowExample}
            aria-label="ดูตัวอย่างเอกสาร"
            className="flex-shrink-0 w-14 flex flex-col items-center gap-1"
          >
            <span className="w-14 h-10 rounded-lg border border-[var(--border)] bg-white p-0.5 overflow-hidden"><DocThumb /></span>
            <span className="text-[10px] font-semibold text-[#15803d]">ดูตัวอย่าง</span>
          </button>
        )}
      </div>
    </div>
  )
}
