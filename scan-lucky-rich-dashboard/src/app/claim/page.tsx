'use client'

import { useState } from 'react'
import DocExampleModal, { type DocType } from '@/components/claim/DocExampleModal'

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
  const [hasProxy, setHasProxy] = useState(false)
  const [done, setDone] = useState(false)
  const [example, setExample] = useState<DocType | null>(null)

  async function check() {
    setErr('')
    setNotWinner(false)
    setVerified(null)
    setDone(false)
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
    } catch (e: any) {
      setErr('เชื่อมต่อไม่สำเร็จ: ' + (e?.message ?? e))
    } finally {
      setChecking(false)
    }
  }

  function resetAll() {
    setDone(false)
    setVerified(null)
    setPhone('')
    setNotWinner(false)
    setErr('')
    setHasProxy(false)
  }

  const step = verified ? 2 : 1

  return (
    <main
      className="min-h-screen px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center"
      style={{ background: 'linear-gradient(180deg,#f0fdf4 0%,#ffffff 45%,#f7fee7 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg,#fef9c3,#fde68a)', boxShadow: '0 6px 18px rgba(217,119,6,0.18)' }}
          >
            <span className="text-[30px]">🎁</span>
          </div>
          <div className="text-[11px] font-bold tracking-wide text-[#15803d] uppercase">สแกนลุ้นรวย สวยลุ้นล้าน</div>
          <div className="text-[10.5px] text-[var(--text-muted)] mb-1">Jula&apos;s Herb x ไทยรัฐ</div>
          <h1 className="text-[22px] font-extrabold text-[#14532d]">ตรวจสิทธิ์และเตรียมเอกสารรับรางวัล</h1>
          <p className="text-[12.5px] text-[var(--text-secondary)] mt-2 leading-relaxed">
            หน้านี้ใช้ตรวจสอบสิทธิ์และดูรายการเอกสารที่ต้องนำมาเท่านั้น ลูกค้าต้องนำเอกสารตัวจริงมาแสดงตอนรับรางวัล
          </p>
        </div>

        <Steps step={step} />

        {!verified ? (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm float-up">
            <label htmlFor="phone" className="text-[13.5px] font-semibold text-[var(--text)]">
              เบอร์โทรที่ใช้ลงทะเบียนสแกน
            </label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] opacity-70">📱</span>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && check()}
                inputMode="tel"
                placeholder="08X-XXX-XXXX"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-[var(--border)] text-[16px] outline-none transition focus:border-[#16a34a] focus:ring-2 focus:ring-[#bbf7d0]"
              />
            </div>
            {notWinner && (
              <div className="mt-2.5 text-[13px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2.5">
                ไม่พบรายชื่อผู้โชคดีของเบอร์นี้ ตรวจสอบเบอร์อีกครั้งหรือสอบถามทีมงาน
              </div>
            )}
            {err && (
              <div className="mt-2.5 text-[13px] text-[#b91c1c] bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3 py-2.5">{err}</div>
            )}
            <button
              onClick={check}
              disabled={checking}
              className="w-full mt-3 py-3 rounded-xl text-white font-semibold disabled:opacity-50 transition active:scale-[0.99]"
              style={{ background: GREEN_BTN }}
            >
              {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสิทธิ์ →'}
            </button>
            <p className="text-[11px] text-[var(--text-muted)] text-center mt-2.5">
              ระบบจะแสดงรางวัลและรายการเอกสารเมื่อพบเบอร์ในรายชื่อผู้โชคดี
            </p>
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
            </div>

            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#dcfce7] text-[15px]">📋</span>
                <div>
                  <div className="text-[15px] font-bold text-[#14532d]">เอกสารที่ต้องเตรียมมาในวันรับรางวัล</div>
                  <div className="text-[11.5px] text-[var(--text-secondary)]">ไม่ต้องอัปโหลดไฟล์ผ่านหน้านี้</div>
                </div>
              </div>

              <DocChecklistItem
                step={1}
                title="บัตรประชาชนตัวจริงของผู้โชคดี"
                hint="นำมาแสดงต่อเจ้าหน้าที่เพื่อยืนยันตัวตน"
              />
              <DocChecklistItem
                step={2}
                title="สำเนาบัตรประชาชนพร้อมเซ็นรับรอง"
                hint='เขียน "สำเนาถูกต้อง" และเซ็นชื่อจริงกำกับ'
                onShowExample={() => setExample('idCard')}
              />
              <DocChecklistItem
                step={3}
                title="สินค้าจริงที่ใช้สแกน"
                hint="นำสินค้าหรือหลักฐานสินค้าที่สแกนมาแสดงในวันรับรางวัล"
              />

              <button
                type="button"
                onClick={() => setHasProxy((v) => !v)}
                className={`w-full flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  hasProxy ? 'border-[#16a34a] bg-[#f0fdf4]' : 'border-[var(--border)] hover:bg-[var(--bg-soft)]'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-white text-[12px] ${
                    hasProxy ? '' : 'border border-[var(--border)] bg-white'
                  }`}
                  style={hasProxy ? { background: GREEN_BTN } : {}}
                >
                  {hasProxy && '✓'}
                </span>
                <span className="text-[13px] font-semibold text-[var(--text)]">
                  มีคนอื่นมารับรางวัลแทน <span className="font-normal text-[var(--text-secondary)]">(ต้องเตรียมเอกสารมอบอำนาจเพิ่ม)</span>
                </span>
              </button>

              {hasProxy && (
                <div className="space-y-3 pl-3 border-l-2 border-[#bbf7d0]">
                  <DocChecklistItem
                    step={4}
                    title="หนังสือมอบอำนาจ"
                    hint="ระบุผู้มอบและผู้รับมอบอำนาจ พร้อมลายเซ็นครบถ้วน"
                    onShowExample={() => setExample('poa')}
                  />
                  <DocChecklistItem
                    step={5}
                    title="บัตรประชาชนตัวจริงและสำเนาของผู้รับมอบอำนาจ"
                    hint='สำเนาต้องเขียน "สำเนาถูกต้อง" และเซ็นชื่อกำกับ'
                    onShowExample={() => setExample('proxyId')}
                  />
                </div>
              )}

              <div className="text-[12px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2.5 flex gap-2">
                <span>📌</span>
                <span>
                  เจ้าหน้าที่จะตรวจเอกสารตัวจริงที่จุดรับรางวัลเท่านั้น กรุณาเตรียมเอกสารให้ครบก่อนเดินทางมารับรางวัล
                </span>
              </div>

              {done && (
                <div className="text-[13px] text-[#15803d] bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-3 py-2.5">
                  รับทราบแล้ว กรุณานำเอกสารตัวจริงมาแสดงในวันรับรางวัล
                </div>
              )}

              <button
                onClick={() => setDone(true)}
                className="w-full py-3 rounded-xl text-white font-bold transition active:scale-[0.99]"
                style={{ background: GREEN_BTN }}
              >
                รับทราบรายการเอกสาร
              </button>
              <button onClick={resetAll} className="w-full text-[12px] text-[var(--text-secondary)] py-1">
                ← ใช้เบอร์อื่น
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
          มีคำถามเรื่องการรับรางวัล? ติดต่อทีมงาน Jula&apos;s Herb
        </p>
      </div>

      <DocExampleModal doc={example} onClose={() => setExample(null)} />
    </main>
  )
}

function Steps({ step }: { step: number }) {
  const items = ['ตรวจสอบสิทธิ์', 'เตรียมเอกสาร']
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {items.map((label, i) => {
        const n = i + 1
        const active = step >= n
        return (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                active ? 'text-white' : 'text-[var(--text-muted)] bg-[var(--border-soft)]'
              }`}
              style={active ? { background: GREEN_BTN } : {}}
            >
              {step > n ? '✓' : n}
            </span>
            <span className={`text-[11px] font-semibold ${active ? 'text-[#15803d]' : 'text-[var(--text-muted)]'}`}>{label}</span>
            {i < items.length - 1 && <span className="w-4 h-px bg-[var(--border)]" />}
          </div>
        )
      })}
    </div>
  )
}

function DocChecklistItem({
  step,
  title,
  hint,
  onShowExample,
}: {
  step: number
  title: string
  hint: string
  onShowExample?: () => void
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2.5">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-bold flex-shrink-0">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[var(--text)]">{title}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</div>
        </div>
        {onShowExample && (
          <button
            type="button"
            onClick={onShowExample}
            className="text-[11.5px] font-semibold text-[#15803d] flex-shrink-0 hover:underline"
          >
            ดูตัวอย่าง
          </button>
        )}
      </div>
    </div>
  )
}
