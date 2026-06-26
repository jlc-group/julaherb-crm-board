'use client'

import { useState, useRef } from 'react'
import { toBlob } from 'html-to-image'
import ClaimPickupCalendar from '@/components/claim/ClaimPickupCalendar'
import MobileShell from '@/components/public/MobileShell'
import { pickupDateLabel, slotById } from '@/config/pickup'
import { getRound } from '@/config/draw-rounds'

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

const BRAND = '#15803d'
const BRAND_BG = 'var(--brand-grad)' // ไล่สีแบรนด์ (เขียวเข้ม→อ่อน) สำหรับปุ่มหลัก
const CARD_GRAD = 'linear-gradient(160deg,#08461f 0%,#137d38 46%,#54bf3c 100%)' // การ์ดผล/สรุปแบบ grand (เขียวเข้ม→อ่อน ชัด)
const GOLD = 'linear-gradient(135deg,#fde08a,#f1ad24)' // ทอง — เหรียญ/ป้ายรางวัล/ปุ่ม

// เอกสารที่ต้องเตรียม แยกตามวิธีรับ — ใช้ร่วมกันระหว่าง checklist และหน้าสรุป
const DOC_LIST: Record<'self' | 'proxy', string[]> = {
  self: [
    'บัตรประชาชนตัวจริงของผู้โชคดี',
    'สินค้าจริงที่ใช้สแกน',
  ],
  proxy: [
    'สำเนาบัตรประชาชนของผู้โชคดี (ลงนามรับรองสำเนา)',
    'บัตรประชาชนตัวจริงของผู้รับมอบอำนาจ',
    'หนังสือมอบอำนาจ',
    'สินค้าจริงที่ใช้สแกน',
  ],
}

// ภาษีหัก ณ ที่จ่าย 5% ของมูลค่ารางวัล (รางวัล ≥ 1,000 บาท ตามกติกา/ทป.101/2544)
const taxOf = (prizeLabel: string) => Math.round((parseInt(prizeLabel.replace(/\D/g, ''), 10) || 0) * 0.05)
const baht = (n: number) => n.toLocaleString('th-TH')

export default function ClaimPage() {
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState<{ name: string; prizes: Prize[]; claimStatus: string | null } | null>(null)
  const [notWinner, setNotWinner] = useState(false)
  const [err, setErr] = useState('')
  const [pickupMode, setPickupMode] = useState<'self' | 'proxy'>('self')
  const [booking, setBooking] = useState(false) // ซีน ③ หน้าจอง (แยกหน้า)
  const [modeChosen, setModeChosen] = useState(false) // เลือกวิธีรับแล้วหรือยัง
  const [selDate, setSelDate] = useState<string | null>(null)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const [appt, setAppt] = useState<Appt | null>(null)
  const [justBooked, setJustBooked] = useState(false) // เพิ่งจอง → โชว์แถบ "บันทึกแล้ว" ในหน้า (ไม่มี popup)

  async function check() {
    setErr('')
    setNotWinner(false)
    setVerified(null)
    setBooking(false)
    setModeChosen(false)
    setJustBooked(false)
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
      // โหลดนัดหมายเดิมของเบอร์นี้ (ถ้าเคยจองบนเครื่องนี้) → ซีน ② แสดงสรุปเต็มในหน้า
      try {
        const raw = localStorage.getItem(apptKey(phone))
        const o = raw ? JSON.parse(raw) : null
        if (o?.date && o?.slotId) {
          setAppt({ date: o.date, slotId: o.slotId })
          if (o.pickupMode === 'self' || o.pickupMode === 'proxy') {
            setPickupMode(o.pickupMode)
            setModeChosen(true)
          }
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
      localStorage.setItem(apptKey(phone), JSON.stringify({ ...a, pickupMode, savedAt: new Date().toISOString() }))
    } catch {}
    // บันทึกเข้า server เพื่อให้แอดมินเห็นหน้า "ตรวจเอกสารหน้างาน" (best-effort)
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
    setBooking(false) // กลับซีน ② → โชว์สรุปในหน้า (ไม่มี popup)
    setJustBooked(true)
  }

  function openBooking() {
    setSelDate(appt?.date ?? null)
    setSelSlot(appt?.slotId ?? null)
    setModeChosen(false)
    setJustBooked(false)
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
    setAppt(null)
    setJustBooked(false)
  }

  // เดือนที่ผู้โชคดีคนนี้จองได้ = เดือนรับรางวัลของรอบที่ได้ (รอบไหน → เดือนนั้น)
  const allowedMonths = Array.from(
    new Set((verified?.prizes ?? []).map((p) => getRound(p.round)?.prizeMonthISO).filter(Boolean) as string[]),
  )

  return (
    <MobileShell icon="🎁" backHref="/winners">
      {!verified ? (
        /* ─────────── ซีน ① ตรวจสิทธิ์ ─────────── */
        <div className="float-up">
          <div className="text-center mb-5 mt-2">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full text-[28px] mb-3" style={{ background: '#dcfce7' }}>
              🎁
            </span>
            <h1 className="text-[22px] font-bold text-[var(--dark)] leading-tight">ตรวจสอบสิทธิ์รับรางวัล</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1.5">กรอกเบอร์ที่ใช้ลงทะเบียนสแกน</p>
          </div>

          <div className="bg-white rounded-2xl border border-[var(--border)] p-5">
            <label htmlFor="phone" className="text-[13px] font-semibold text-[var(--text)]">เบอร์โทรที่ใช้ลงทะเบียนสแกน</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && check()}
              inputMode="tel"
              placeholder="08X-XXX-XXXX"
              className="w-full mt-2 px-4 py-3.5 rounded-xl border border-[var(--border)] text-[16px] tracking-wide outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
            />
            {notWinner && (
              <div className="mt-3 text-[13px] text-[var(--text-secondary)] bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5">
                ไม่พบรายชื่อผู้โชคดีของเบอร์นี้ ตรวจสอบเบอร์อีกครั้งหรือสอบถามทีมงาน
              </div>
            )}
            {err && <div className="mt-3 text-[13px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3 py-2.5">{err}</div>}
            <button
              onClick={check}
              disabled={checking}
              className="w-full mt-4 py-3.5 rounded-xl text-white font-bold text-[15px] disabled:opacity-50 transition active:scale-[0.98]"
              style={{ background: BRAND_BG }}
            >
              {checking ? 'กำลังตรวจสอบ…' : 'ตรวจสอบสิทธิ์'}
            </button>
            <p className="text-[11.5px] text-[var(--text-muted)] text-center mt-3">ระบบจะแสดงผลทันทีเมื่อพบเบอร์ในรายชื่อผู้โชคดี</p>
          </div>

          <a href="/winners" className="block text-center text-[12.5px] font-semibold text-[#15803d] mt-4 py-2">ดูรายชื่อผู้โชคดีทั้งหมด</a>
        </div>
      ) : (
        <div className="space-y-3 float-up">
          {!booking ? (
            /* ─────────── ซีน ② ผู้โชคดี / สรุปนัดหมาย ─────────── */
            <>
              {appt ? (
                <AppointmentSummary appt={appt} name={verified.name} prizes={verified.prizes} mode={pickupMode} justBooked={justBooked} onChangeAppt={openBooking} onUseOther={resetAll} />
              ) : (
                <>
                  <div className="rounded-3xl overflow-hidden text-center text-white px-5 pt-7 pb-6" style={{ background: CARD_GRAD, boxShadow: '0 10px 30px rgba(12,90,44,0.28)' }}>
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-full text-[34px]" style={{ background: GOLD, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
                      🏆
                    </span>
                    <div className="text-[12.5px] text-[#ffe9a8] mt-3 tracking-wide">ยินดีด้วย คุณคือผู้โชคดี</div>
                    <div className="text-[27px] font-extrabold leading-tight mt-1">{verified.name || '(ผู้โชคดี)'}</div>
                    <div className="mt-4 space-y-3">
                      {verified.prizes.map((p, i) => (
                        <div key={i}>
                          <div className="inline-flex items-center px-5 py-1.5 rounded-full font-bold text-[15px] text-[#5a3a00]" style={{ background: GOLD }}>
                            {p.prizeLabel}
                          </div>
                          {p.announce && (
                            <div className="mt-3">
                              <span className="inline-block px-4 py-2 rounded-xl font-extrabold text-[17px] leading-snug" style={{ background: 'rgba(255,224,138,0.2)', border: '1px solid rgba(255,224,138,0.6)', color: '#ffe08a' }}>
                                {p.announce}
                              </span>
                            </div>
                          )}
                          {(p.productName || p.scanCode) && (
                            <div className="text-left mt-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)' }}>
                              {p.productName && (
                                <>
                                  <div className="text-[11px] text-white/70">สินค้าที่ต้องนำมาแสดง</div>
                                  <div className="text-[12.5px] font-semibold">{p.productName}{p.productSku ? ` (${p.productSku})` : ''}</div>
                                </>
                              )}
                              {p.scanCode && (
                                <>
                                  <div className="text-[11px] text-white/70 mt-2">รหัสการสแกน</div>
                                  <div className="text-[13px] font-semibold tracking-wider">{p.scanCode}</div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={openBooking}
                    className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-[#5a3a00] transition active:scale-[0.98]"
                    style={{ background: GOLD }}
                  >
                    <i className="ti ti-calendar-plus mr-1.5" aria-hidden="true" />นัดหมายเข้ารับรางวัล
                  </button>
                  <button onClick={resetAll} className="w-full text-[12.5px] text-[var(--text-secondary)] py-2">ใช้เบอร์อื่น</button>
                </>
              )}
            </>
          ) : (
            /* ─────────── ซีน ③ หน้าจอง ─────────── */
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setBooking(false)} className="w-9 h-9 flex items-center justify-center rounded-full border border-[var(--border)] bg-white text-[#15803d] active:scale-95 transition">
                  <i className="ti ti-chevron-left text-[18px]" aria-hidden="true" />
                </button>
                <div className="text-[17px] font-bold text-[var(--dark)]">นัดหมายเข้ารับรางวัล</div>
              </div>

              <ClaimPickupCalendar initial={appt} onChange={(d, s) => { setSelDate(d); setSelSlot(s) }} allowedMonths={allowedMonths} />

              <div className="bg-white rounded-2xl border border-[var(--border)] p-4 space-y-3">
                <div className="text-[14px] font-bold text-[var(--dark)]">วิธีรับ & เอกสารที่ต้องเตรียม</div>

                <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--bg-soft)] border border-[var(--border)]">
                  {([['self', 'รับด้วยตนเอง'], ['proxy', 'มอบอำนาจให้ผู้อื่นรับ']] as const).map(([mode, label]) => {
                    const active = modeChosen && pickupMode === mode
                    return (
                      <button
                        key={mode}
                        onClick={() => { setPickupMode(mode); setModeChosen(true) }}
                        className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition ${active ? 'text-white' : 'text-[var(--text-secondary)]'}`}
                        style={active ? { background: BRAND } : undefined}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>

                {!modeChosen ? (
                  <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-center">
                    เลือกวิธีรับด้านบนเพื่อดูเอกสารที่ต้องเตรียม
                  </div>
                ) : (
                  <>
                    <div className="text-[11.5px] text-[var(--text-secondary)] font-semibold">
                      เอกสารที่ต้องเตรียม {DOC_LIST[pickupMode].length} รายการ
                    </div>
                    <div className="space-y-2.5">
                      {DOC_LIST[pickupMode].map((d, i) => (
                        <DocItem key={i} step={i + 1} title={d} />
                      ))}
                    </div>
                    <div className="text-[11.5px] text-[var(--text-secondary)] flex gap-2 pt-1">
                      <i className="ti ti-info-circle mt-0.5" aria-hidden="true" />
                      <span>เจ้าหน้าที่ตรวจเอกสารตัวจริงที่จุดรับรางวัล กรุณาเตรียมให้ครบก่อนเดินทาง</span>
                    </div>
                  </>
                )}
              </div>

              {/* เงื่อนไขการรับรางวัล — การ์ดเด่น โชว์เสมอ (อยู่ใต้การ์ดวิธีรับ/เอกสาร) */}
              <div className="rounded-2xl p-4" style={{ background: '#fffbeb', border: '1.5px solid #f59e0b' }}>
                <div className="text-[13.5px] font-extrabold text-[#b45309] flex items-center gap-1.5 mb-2.5">
                  <span>⚠️</span> เงื่อนไขการรับรางวัล (สำคัญ)
                </div>
                <ul className="space-y-2.5 text-[12px] text-[#7a4e00] leading-relaxed">
                  {verified.prizes.map((p, i) => {
                    const v = parseInt(p.prizeLabel.replace(/\D/g, ''), 10) || 0
                    return (
                      <li key={i} className="flex gap-2">
                        <span className="flex-shrink-0">💰</span>
                        <span>สำหรับรางวัลทอง มูลค่า <b>{baht(v)} บาท</b> ต้องเตรียม<b>เงินสด</b>จ่ายภาษีหัก ณ ที่จ่าย <b>5%</b> ของมูลค่ารางวัล ก่อนรับรางวัล = <b className="text-[#b45309]">{baht(taxOf(p.prizeLabel))} บาท</b></span>
                      </li>
                    )
                  })}
                  <li className="flex gap-2">
                    <span className="flex-shrink-0">🪪</span>
                    <span>แสดง<b>บัตรประชาชนตัวจริง</b> (ชื่อต้องตรงกับผู้โชคดี)
                      <span className="block text-[11px] text-[#92600a] mt-0.5">หมายเหตุ: กรณีมอบอำนาจให้ผู้อื่นมารับแทน ถือเป็นความรับผิดชอบของผู้โชคดีในฐานะผู้มอบอำนาจ ทั้งนี้ บริษัทขอสงวนสิทธิ์ไม่รับผิดชอบต่อความเสียหายอันเกิดจากการมอบอำนาจดังกล่าว</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="flex-shrink-0">📍</span>
                    <span>สถานที่รับรางวัล: <b>บริษัท เจแอลซี กรุ๊ป จำกัด (สำนักงานใหญ่)</b><br />62 ซ.นาคนิวาส 6 ถ.นาคนิวาส แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพมหานคร 10230</span>
                  </li>
                </ul>
              </div>

              <div className="h-24" />
            </>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">มีคำถามเรื่องการรับรางวัล? ติดต่อทีมงาน Jula&apos;s Herb</p>

      {/* ── ปุ่มลอยยืนยันนัดหมาย (ซีน ③) — กดได้เมื่อเลือกครบ 3 อย่าง ── */}
      {verified && booking && (() => {
        const ready = !!selDate && !!selSlot && modeChosen
        return (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4 pt-5 pb-[max(0.9rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent">
            {!ready && (
              <div className="text-center text-[11px] text-[var(--text-secondary)] mb-1.5">
                เลือก{!selDate ? ' • วันที่' : ''}{!selSlot ? ' • รอบเช้า/บ่าย' : ''}{!modeChosen ? ' • วิธีรับ' : ''} ให้ครบก่อนยืนยัน
              </div>
            )}
            <button
              onClick={() => { if (ready) bookAppt(selDate!, selSlot!) }}
              disabled={!ready}
              className="w-full py-4 rounded-2xl text-white font-bold text-[15px] disabled:opacity-40 transition active:scale-[0.98]"
              style={{ background: BRAND_BG }}
            >
              {appt ? 'เปลี่ยนนัดหมาย' : 'ยืนยันนัดหมาย'}
            </button>
          </div>
        )
      })()}
    </MobileShell>
  )
}

// รายการเอกสาร (ไม่มีตัวอย่าง/ดาวน์โหลด) — เลขลำดับ + ชื่อ
function DocItem({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold flex-shrink-0" style={{ background: '#dcfce7', color: BRAND }}>{step}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-[var(--text)]">{title}</div>
      </div>
    </div>
  )
}

// สรุปนัดหมาย — ฝังในหน้า (ทั้งหลังจอง justBooked=true และเช็คย้อนหลัง=false) · ไม่มี popup แล้ว
function AppointmentSummary({
  appt, name, prizes, mode, justBooked, onChangeAppt, onUseOther,
}: { appt: Appt; name: string; prizes: Prize[]; mode: 'self' | 'proxy'; justBooked: boolean; onChangeAppt: () => void; onUseOther: () => void }) {
  const slot = slotById(appt.slotId)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imgSaved, setImgSaved] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const docs = DOC_LIST[mode]
  const modeLabel = mode === 'self' ? 'รับด้วยตนเอง' : 'มอบอำนาจให้ผู้อื่นรับ'
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
      /* คัดลอกไม่ได้ — จดเองได้ */
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
      /* บันทึกรูปไม่ได้ — ใช้คัดลอกแทน */
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ── การ์ดสรุป (จับเป็นรูปทั้งใบ) — การ์ดเขียว grand ── */}
      <div ref={cardRef} className="rounded-3xl overflow-hidden text-white" style={{ background: CARD_GRAD, boxShadow: '0 10px 30px rgba(8,70,31,0.3)' }}>
        <div className="px-5 pt-6 pb-5">
          {/* หัว */}
          <div className="flex items-center gap-3 mb-4">
            <span className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-[26px]" style={{ background: GOLD, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
              {justBooked ? '✅' : '📋'}
            </span>
            <div className="min-w-0">
              <div className="text-[18px] font-extrabold">{justBooked ? 'บันทึกนัดหมายแล้ว' : 'นัดหมายของคุณ'}</div>
              <div className="text-[11px] text-white/85 truncate">จุฬาเฮิร์บ สานฝันคนไทย · สแกนลุ้นรวย สวยลุ้นล้าน</div>
            </div>
          </div>

          {/* วันนัด */}
          <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)' }}>
            <div className="text-[11.5px] text-white/75">นัดหมายเข้ารับรางวัล</div>
            <div className="text-[16px] font-bold mt-0.5">{pickupDateLabel(appt.date)}</div>
            <div className="text-[12.5px] text-white/85">{slot?.period} · {slot?.time}</div>
            <div className="text-[12px] text-white/90 mt-1">ผู้โชคดี: <span className="font-semibold">{name || '-'}</span></div>
          </div>

          {/* รางวัล */}
          <div className="text-[12px] font-semibold text-[#ffe9a8] mb-1.5">รางวัลที่ได้ ({prizes.length})</div>
          <div className="space-y-1.5">
            {prizes.map((p, i) => (
              <div key={i} className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)' }}>
                <div className="inline-flex items-center px-3.5 py-1 rounded-full font-bold text-[13px] text-[#5a3a00]" style={{ background: GOLD }}>{p.prizeLabel}</div>
                {p.announce && <div className="text-[11.5px] text-white/80 mt-1.5">{p.announce}</div>}
                {p.productName && <div className="text-[11.5px] text-white/90 mt-1">สินค้าที่ต้องนำมาแสดง*: <span className="font-semibold">{p.productName}</span>{p.productSku ? ` (${p.productSku})` : ''}</div>}
                {p.scanCode && <div className="text-[11.5px] text-white/80 mt-0.5">รหัสการสแกน: {p.scanCode}</div>}
              </div>
            ))}
          </div>
          {items.length > 0 && <div className="text-[10.5px] text-white/65 mt-1.5">* นำสินค้าจริงที่สแกนมาแสดงต่อเจ้าหน้าที่ในวันรับรางวัล</div>}

          {/* เอกสาร */}
          <div className="rounded-xl p-3 mt-3" style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.22)' }}>
            <div className="text-[12.5px] font-semibold">วิธีรับ: {modeLabel}</div>
            <div className="text-[11.5px] text-white/75 mt-1.5 mb-1">เอกสารที่ต้องเตรียม</div>
            <ol className="space-y-1">
              {docs.map((d, i) => (
                <li key={i} className="text-[12px] text-white/95 flex gap-1.5">
                  <span className="font-bold text-[#ffe08a]">{i + 1}.</span>
                  <span>{d}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ── ปุ่ม (นอกส่วนจับรูป) ── */}
      <div className="pt-3">
        <div className="flex gap-2">
          <button onClick={saveImage} disabled={saving} className={`flex-1 py-3 rounded-xl font-semibold text-[13px] border transition disabled:opacity-60 ${imgSaved ? 'border-[#15803d] text-[#15803d] bg-[#f0fdf4]' : 'border-[var(--border)] text-[var(--text)]'}`}>
            <i className="ti ti-photo mr-1.5" aria-hidden="true" />{saving ? 'กำลังบันทึก…' : imgSaved ? 'บันทึกรูปแล้ว' : 'บันทึกเป็นรูป'}
          </button>
          <button onClick={copy} className={`flex-1 py-3 rounded-xl font-semibold text-[13px] border transition ${copied ? 'border-[#15803d] text-[#15803d] bg-[#f0fdf4]' : 'border-[var(--border)] text-[var(--text)]'}`}>
            <i className="ti ti-copy mr-1.5" aria-hidden="true" />{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
        </div>
        <div className="flex items-center justify-center gap-3 mt-2.5 text-[13px] text-[var(--text-secondary)]">
          <button onClick={onChangeAppt} className="py-1">เปลี่ยนนัดหมาย</button>
          <span className="text-[var(--border)]">|</span>
          <button onClick={onUseOther} className="py-1">ใช้เบอร์อื่น</button>
        </div>
      </div>
    </div>
  )
}
