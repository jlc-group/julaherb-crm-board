'use client'

import { useState, useRef } from 'react'
import { toBlob } from 'html-to-image'
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
  productName?: string
  productSku?: string
  scanCode?: string
}

const GREEN_BTN = 'linear-gradient(135deg,#16a34a,#15803d)'

// เอกสารที่ต้องเตรียม แยกตามวิธีรับ — ใช้ร่วมกันระหว่าง checklist และหน้าสรุป
const DOC_LIST: Record<'self' | 'proxy', string[]> = {
  self: [
    'บัตรประชาชนตัวจริงของผู้โชคดี',
    'สำเนาบัตรประชาชน (ลงนามรับรองสำเนา)',
    'สินค้าจริงที่ใช้สแกน',
  ],
  proxy: [
    'สำเนาบัตรประชาชนของผู้โชคดี (ลงนามรับรองสำเนา)',
    'สำเนาบัตรประชาชนของผู้รับมอบอำนาจ (ลงนามรับรองสำเนา) พร้อมบัตรตัวจริง',
    'หนังสือมอบอำนาจ',
    'สินค้าจริงที่ใช้สแกน',
  ],
}

export default function ClaimPage() {
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState<{ name: string; prizes: Prize[]; claimStatus: string | null } | null>(null)
  const [notWinner, setNotWinner] = useState(false)
  const [err, setErr] = useState('')
  const [pickupMode, setPickupMode] = useState<'self' | 'proxy'>('self')
  const [formNote, setFormNote] = useState(false)
  const [booking, setBooking] = useState(false) // ซีน ③ หน้าจอง (แยกหน้า)
  const [modeChosen, setModeChosen] = useState(false) // ลูกค้ากดเลือกวิธีรับแล้วหรือยัง
  const [selDate, setSelDate] = useState<string | null>(null) // วันที่เลือกในปฏิทิน
  const [selSlot, setSelSlot] = useState<string | null>(null) // รอบที่เลือก (เช้า/บ่าย)
  const [example, setExample] = useState<DocType | null>(null)
  const [appt, setAppt] = useState<Appt | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [justBooked, setJustBooked] = useState(false) // เพิ่งจอง (vs เช็คย้อนหลัง) — ปรับหัว popup

  async function check() {
    setErr('')
    setNotWinner(false)
    setVerified(null)
    setBooking(false)
    setShowSuccess(false)
    setModeChosen(false)
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
      // โหลดนัดหมายเดิมของเบอร์นี้ (ถ้าเคยจองไว้บนเครื่องนี้) → ถ้ามี เด้ง popup สรุปทันที
      try {
        const raw = localStorage.getItem(apptKey(phone))
        const o = raw ? JSON.parse(raw) : null
        if (o?.date && o?.slotId) {
          setAppt({ date: o.date, slotId: o.slotId })
          if (o.pickupMode === 'self' || o.pickupMode === 'proxy') {
            setPickupMode(o.pickupMode)
            setModeChosen(true)
          }
          // มีนัดหมายแล้ว → ซีน ② จะแสดงสรุปเต็มในหน้าเอง (ไม่เด้ง popup)
        } else {
          setAppt(null)
        }
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
      // เก็บวิธีรับ (pickupMode) ไว้ด้วย เพื่อให้เช็คย้อนหลังรู้ว่าเลือกแบบไหน
      localStorage.setItem(apptKey(phone), JSON.stringify({ ...a, pickupMode, savedAt: new Date().toISOString() }))
    } catch {}
    // บันทึกการจองเข้า server ด้วย เพื่อให้แอดมินเห็นในหน้า "ตรวจเอกสารหน้างาน" (best-effort)
    fetch('/api/draw/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        name: verified?.name ?? '',
        date,
        slotId,
        pickupMode,
        prizes: (verified?.prizes ?? []).map((p) => p.prizeLabel),
        rounds: Array.from(new Set((verified?.prizes ?? []).map((p) => p.round))),
      }),
    }).catch(() => {})
    setAppt(a)
    setBooking(false) // กลับมาซีน ② (โชว์นัดหมาย)
    setJustBooked(true)
    setShowSuccess(true) // เด้ง popup สรุป ④
  }

  // เข้าซีน ③ จอง — รีเซ็ตให้เลือกใหม่ครบ 3 อย่าง (prefill วัน/รอบถ้าเคยจอง)
  function openBooking() {
    setSelDate(appt?.date ?? null)
    setSelSlot(appt?.slotId ?? null)
    setModeChosen(false)
    setBooking(true)
  }

  function resetAll() {
    setBooking(false)
    setModeChosen(false)
    setSelDate(null)
    setSelSlot(null)
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
            {!booking ? (
            /* ─────────── ซีน ② ผู้โชคดี (มินิมอล) ─────────── */
            <>
            {appt ? (
              /* มีนัดหมายแล้ว → แสดงสรุปเต็มในหน้า (ไม่ใช่ป๊อปอัพ) */
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
                <AppointmentSummary appt={appt} name={verified.name} prizes={verified.prizes} mode={pickupMode} justBooked={false} onChangeAppt={openBooking} />
              </div>
            ) : (
              /* ยังไม่จอง → การ์ดรางวัล + ปุ่มนัดหมาย */
              <>
                <div className="rounded-2xl p-4 border" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderColor: '#f5d58a' }}>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#b45309]">🎉 ยินดีด้วย คุณคือผู้โชคดี</div>
                  <div className="text-[20px] font-extrabold text-[#14532d] mt-0.5">{verified.name || '(ผู้โชคดี)'}</div>
                  <div className="mt-2.5 space-y-1.5">
                    {verified.prizes.map((p, i) => (
                      <div key={i} className="bg-white/70 rounded-lg px-3 py-2.5 border border-[#fbe3a8]">
                        <div className="text-[14px] font-bold text-[#b45309]">🏆 {p.prizeLabel}</div>
                        {p.announce && <div className="text-[12px] text-[#7c5e10] mt-0.5">📅 {p.announce}</div>}
                        {p.productName && (
                          <div className="text-[11.5px] text-[#15803d] mt-1">📦 สินค้า: <span className="font-semibold">{p.productName}</span>{p.productSku ? ` (${p.productSku})` : ''}</div>
                        )}
                        {p.scanCode && (
                          <div className="text-[11.5px] text-[#7c5e10] mt-0.5">🔖 รหัสการสแกน: <span className="font-semibold">{p.scanCode}</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={openBooking}
                  className="w-full py-4 rounded-2xl text-white font-bold text-[15px] transition active:scale-[0.98] shadow-[0_4px_14px_rgba(22,163,74,0.3)]"
                  style={{ background: GREEN_BTN }}
                >
                  📅 นัดหมายเข้ารับรางวัล
                </button>
              </>
            )}

            <button onClick={resetAll} className="w-full text-[12.5px] text-[var(--text-secondary)] py-2">
              ← ใช้เบอร์อื่น
            </button>
            </>
            ) : (
            /* ─────────── ซีน ③ หน้าจอง (แยกหน้า) ─────────── */
            <>
            <div className="flex items-center gap-2">
              <button onClick={() => setBooking(false)} className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#15803d] text-[18px] leading-none active:scale-95 transition">‹</button>
              <div className="text-[17px] font-extrabold text-[#14532d]">นัดหมายเข้ารับรางวัล</div>
            </div>

            {/* ปฏิทินเลือกวัน — ส่งค่าขึ้นมาให้ปุ่มลอยล่าง */}
            <ClaimPickupCalendar initial={appt} onChange={(d, s) => { setSelDate(d); setSelSlot(s) }} />

            {/* วิธีรับ + เอกสาร — รวมในการ์ดเดียว (เลือกวิธีรับ → เห็นเอกสารที่ต้องใช้ทันที) */}
            <div className="bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm space-y-3">
              <div className="text-[14px] font-bold text-[#14532d]">📋 วิธีรับ & เอกสารที่ต้องเตรียม</div>

              {/* toggle วิธีรับ */}
              <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                {([['self', '🙋 รับด้วยตนเอง'], ['proxy', '👥 มอบอำนาจให้ผู้อื่นรับ']] as const).map(([mode, label]) => {
                  const active = modeChosen && pickupMode === mode
                  return (
                  <button
                    key={mode}
                    onClick={() => { setPickupMode(mode); setModeChosen(true); setFormNote(false) }}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition ${active ? 'text-white' : 'text-[var(--text-secondary)]'}`}
                    style={active ? { background: GREEN_BTN } : undefined}
                  >
                    {label}
                  </button>
                  )
                })}
              </div>

              {!modeChosen ? (
                <div className="text-[12px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2.5 text-center">
                  👆 เลือกวิธีรับด้านบนเพื่อดูเอกสารที่ต้องเตรียม
                </div>
              ) : (
              <>
              {/* เอกสารตามวิธีรับที่เลือก */}
              <div className="text-[11.5px] text-[var(--text-secondary)] font-semibold">
                {pickupMode === 'self' ? 'รับด้วยตนเอง — เอกสารที่ต้องเตรียม' : 'มอบอำนาจให้ผู้อื่นรับ — เอกสารที่ต้องเตรียม'} {DOC_LIST[pickupMode].length} รายการ
              </div>
              <div className="space-y-3">
                {pickupMode === 'self' ? (
                  <>
                    <DocChecklistItem step={1} title="บัตรประชาชนตัวจริงของผู้โชคดี" hint="แสดงต่อเจ้าหน้าที่เพื่อยืนยันตัวตน" />
                    <DocChecklistItem step={2} title="สำเนาบัตรประชาชน" hint="1 ชุด · ลงนามรับรองสำเนา" onShowExample={() => setExample('idCard')} />
                    <DocChecklistItem step={3} title="สินค้าจริงที่ใช้สแกน" hint="นำมาแสดงในวันรับรางวัล" />
                  </>
                ) : (
                  <>
                    <DocChecklistItem step={1} title="สำเนาบัตรประชาชนของผู้โชคดี" hint="1 ชุด · ลงนามรับรองสำเนา" onShowExample={() => setExample('idCard')} />
                    <DocChecklistItem step={2} title="สำเนาบัตรประชาชนของผู้รับมอบอำนาจ" hint="1 ชุด · ลงนามรับรองสำเนา · พร้อมบัตรตัวจริง" onShowExample={() => setExample('proxyId')} />
                    <DocChecklistItem step={3} title="หนังสือมอบอำนาจ" hint="1 ฉบับ" onShowExample={() => setExample('poa')} onDownload={() => setFormNote(true)} />
                    {formNote && (
                      <div className="text-[11.5px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-lg px-3 py-2 -mt-1">
                        📄 แบบฟอร์มหนังสือมอบอำนาจกำลังเตรียมไฟล์ — ระหว่างนี้ใช้แบบฟอร์มมาตรฐานทั่วไปได้ หรือสอบถามทีมงาน
                      </div>
                    )}
                    <DocChecklistItem step={4} title="สินค้าจริงที่ใช้สแกน" hint="สำหรับแสดงต่อเจ้าหน้าที่ในวันรับรางวัล" />
                  </>
                )}
              </div>

              <div className="text-[11.5px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2 flex gap-2">
                <span>📌</span>
                <span>เจ้าหน้าที่ตรวจเอกสารตัวจริงที่จุดรับรางวัล กรุณาเตรียมให้ครบก่อนเดินทาง</span>
              </div>
              </>
              )}
            </div>

            {/* เว้นที่ให้ปุ่มลอยล่าง */}
            <div className="h-24" />
            </>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
          มีคำถามเรื่องการรับรางวัล? ติดต่อทีมงาน Jula&apos;s Herb
        </p>

      <DocExampleModal doc={example} onClose={() => setExample(null)} />
      {showSuccess && appt && verified && (
        <AppointmentSuccessModal
          appt={appt}
          name={verified.name}
          prizes={verified.prizes}
          mode={pickupMode}
          justBooked={justBooked}
          onChangeAppt={() => { setShowSuccess(false); openBooking() }}
          onClose={() => setShowSuccess(false)}
        />
      )}

      {/* ── ปุ่มลอยยืนยันนัดหมาย (ซีน ③) — กดได้เมื่อเลือกครบ 3 อย่าง ── */}
      {verified && booking && (() => {
        const ready = !!selDate && !!selSlot && modeChosen
        return (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4 pt-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent">
            {!ready && (
              <div className="text-center text-[11px] text-[#92400e] mb-1.5">
                เลือก{!selDate ? ' • วันที่' : ''}{!selSlot ? ' • รอบเช้า/บ่าย' : ''}{!modeChosen ? ' • วิธีรับ' : ''} ให้ครบก่อนยืนยัน
              </div>
            )}
            <button
              onClick={() => { if (ready) bookAppt(selDate!, selSlot!) }}
              disabled={!ready}
              className="w-full py-4 rounded-2xl text-white font-bold text-[15px] disabled:opacity-40 transition active:scale-[0.98] shadow-[0_6px_20px_rgba(22,163,74,0.4)]"
              style={{ background: GREEN_BTN }}
            >
              {appt ? 'เปลี่ยนนัดหมาย' : 'ยืนยันนัดหมาย'}
            </button>
          </div>
        )
      })()}
    </MobileShell>
  )
}

// สรุปนัดหมาย — ใช้ทั้งแบบฝังในหน้า (re-check) และในป๊อปอัพ (หลังจอง/เปลี่ยน)
// onClose มี = โหมดป๊อปอัพ (โชว์ปุ่ม "เรียบร้อย") · ไม่มี = ฝังในหน้า
function AppointmentSummary({
  appt, name, prizes, mode, justBooked, onChangeAppt, onClose,
}: { appt: Appt; name: string; prizes: Prize[]; mode: 'self' | 'proxy'; justBooked: boolean; onChangeAppt: () => void; onClose?: () => void }) {
  const slot = slotById(appt.slotId)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgSaved, setImgSaved] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const docs = DOC_LIST[mode]
  const modeLabel = mode === 'self' ? 'รับด้วยตนเอง' : 'มอบอำนาจให้ผู้อื่นรับ'
  // สินค้าที่ต้องเอามา — ต่อรางวัล (ไม่ dedup → ครบทุกชิ้นตามจำนวนรางวัล)
  const items = prizes.filter((p) => p.productName)

  function buildText(): string {
    const lines: string[] = []
    lines.push('สรุปนัดหมายรับรางวัล — สแกนลุ้นรวย สวยลุ้นล้าน')
    lines.push('────────────────────')
    lines.push('ผู้โชคดี: ' + (name || '-'))
    lines.push('วันนัด: ' + pickupDateLabel(appt.date))
    lines.push('ช่วงเวลา: ' + (slot ? slot.period + ' ' + slot.time : '-'))
    lines.push('')
    lines.push('รางวัลที่ได้:')
    prizes.forEach((p) => {
      lines.push('• ' + p.prizeLabel + (p.announce ? ' (' + p.announce + ')' : ''))
      if (p.productName) lines.push('  สินค้าที่สแกน: ' + p.productName + (p.productSku ? ' (' + p.productSku + ')' : ''))
      if (p.scanCode) lines.push('  รหัสการสแกน: ' + p.scanCode)
    })
    lines.push('')
    lines.push('วิธีรับ: ' + modeLabel)
    lines.push('เอกสารที่ต้องเตรียม:')
    docs.forEach((d, i) => lines.push((i + 1) + '. ' + d))
    lines.push('')
    lines.push('* เจ้าหน้าที่ตรวจเอกสารตัวจริงที่จุดรับรางวัล กรุณาเตรียมให้ครบก่อนเดินทาง')
    return lines.join('\n')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* คัดลอกไม่ได้ — ลูกค้าจดเองได้ */
    }
  }

  async function saveImage() {
    if (!cardRef.current || saving) return
    setSaving(true)
    try {
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true })
      if (!blob) throw new Error('no blob')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `นัดหมายรับรางวัล-${appt.date}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 4000)
      setImgSaved(true)
      setTimeout(() => setImgSaved(false), 2200)
    } catch {
      /* บันทึกรูปไม่ได้ — ใช้ปุ่มคัดลอกแทนได้ */
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
        {/* ── ส่วนที่จับเป็นรูป (ref) ── */}
        <div ref={cardRef} className="bg-white">
          {/* หัว */}
          <div className="text-center px-6 pt-6 pb-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full text-[30px] mb-2"
              style={{ background: 'linear-gradient(135deg,#dcfce7,#86efac)' }}>{justBooked ? '✅' : '📋'}</div>
            <div className="text-[18px] font-extrabold text-[#14532d]">{justBooked ? 'บันทึกนัดหมายแล้ว' : 'นัดหมายของคุณ'}</div>
            <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">สแกนลุ้นรวย สวยลุ้นล้าน · Jula&apos;s Herb × ไทยรัฐ</div>
          </div>

          <div className="px-5 pb-3 space-y-3 text-left">
            {/* ผู้โชคดี + วันนัด */}
            <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-3">
              <div className="text-[11px] text-[#15803d] font-bold">📅 นัดหมายเข้ารับรางวัล</div>
              <div className="text-[15px] font-extrabold text-[#14532d] mt-0.5">{pickupDateLabel(appt.date)}</div>
              <div className="text-[12.5px] text-[var(--text-secondary)]">{slot?.period} · {slot?.time}</div>
              <div className="text-[12px] text-[var(--text)] mt-1">ผู้โชคดี: <span className="font-semibold">{name || '-'}</span></div>
            </div>

            {/* รางวัล + สินค้า (ต่อรางวัล) */}
            <div>
              <div className="text-[12px] font-bold text-[#b45309] mb-1">🏆 รางวัลที่ได้ ({prizes.length} รางวัล)</div>
              <div className="space-y-1.5">
                {prizes.map((p, i) => (
                  <div key={i} className="rounded-lg bg-[#fffbeb] border border-[#fde68a] px-2.5 py-2">
                    <div className="text-[13px] font-bold text-[#b45309]">{i + 1}. {p.prizeLabel}</div>
                    {p.announce && <div className="text-[11.5px] text-[#7c5e10]">📅 {p.announce}</div>}
                    {p.productName && <div className="text-[11.5px] text-[#15803d] mt-0.5">📦 สินค้าที่ต้องนำมาแสดง*: <span className="font-semibold">{p.productName}</span>{p.productSku ? ` (${p.productSku})` : ''}</div>}
                    {p.scanCode && <div className="text-[11.5px] text-[#7c5e10] mt-0.5">🔖 รหัสการสแกน: {p.scanCode}</div>}
                  </div>
                ))}
              </div>
              {items.length > 0 && (
                <div className="text-[10.5px] text-[#92400e] mt-1.5">* นำสินค้าจริงที่สแกนมาแสดงต่อเจ้าหน้าที่ในวันรับรางวัล</div>
              )}
            </div>

            {/* วิธีรับ + เอกสาร */}
            <div className="rounded-xl border border-[var(--border)] p-3">
              <div className="text-[12px] font-bold text-[#14532d]">{mode === 'self' ? '🙋' : '👥'} วิธีรับ: {modeLabel}</div>
              <div className="text-[11.5px] text-[var(--text-secondary)] mt-1.5 mb-1 font-semibold">📋 เอกสารที่ต้องเตรียม</div>
              <ol className="space-y-1">
                {docs.map((d, i) => (
                  <li key={i} className="text-[12px] text-[var(--text)] flex gap-1.5">
                    <span className="font-bold text-[#15803d]">{i + 1}.</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* ── ปุ่ม (นอกส่วนจับรูป) ── */}
        <div className="px-5 pb-5 pt-2 space-y-2 bg-white">
          {/* เปลี่ยนนัดหมาย — ใต้กล่องวิธีรับ */}
          <button onClick={onChangeAppt} className="w-full py-2.5 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d] font-bold text-[13px] active:scale-[0.99] transition">
            🔄 เปลี่ยนนัดหมาย (เลือกวัน/รอบใหม่)
          </button>
          <div className="flex gap-2">
            <button onClick={saveImage} disabled={saving} className={`flex-1 py-3 rounded-2xl font-bold text-[13.5px] border-2 transition disabled:opacity-60 ${imgSaved ? 'border-[#15803d] text-[#15803d] bg-[#f0fdf4]' : 'border-[var(--border)] text-[var(--text)]'}`}>
              {saving ? 'กำลังบันทึก…' : imgSaved ? '✓ บันทึกรูปแล้ว' : '🖼️ บันทึกเป็นรูป'}
            </button>
            <button onClick={copy} className={`flex-1 py-3 rounded-2xl font-bold text-[13.5px] border-2 transition ${copied ? 'border-[#15803d] text-[#15803d] bg-[#f0fdf4]' : 'border-[var(--border)] text-[var(--text)]'}`}>
              {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก'}
            </button>
          </div>
          {onClose && (
            <button onClick={onClose} className="w-full py-3 rounded-2xl text-white font-bold text-[14px]" style={{ background: GREEN_BTN }}>
              เรียบร้อย
            </button>
          )}
        </div>
    </>
  )
}

// ป๊อปอัพสรุป (หลังจอง/เปลี่ยนนัดหมาย)
function AppointmentSuccessModal(props: { appt: Appt; name: string; prizes: Prize[]; mode: 'self' | 'proxy'; justBooked: boolean; onChangeAppt: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4" onClick={props.onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <AppointmentSummary {...props} />
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
