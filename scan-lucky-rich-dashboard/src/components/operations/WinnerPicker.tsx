'use client'

import { useMemo, useState } from 'react'
import { prizeAnnounce } from '@/config/draw-rounds'
import type { PrizeSlot, DrawWinner } from '@/config/draw-rounds'
import { findPrevWins, type PoolCustomer } from './draw-utils'

interface Props {
  slot: PrizeSlot
  roundDateLabel: string
  winners: DrawWinner[]
  pool: PoolCustomer[]
  poolLoading: boolean
  poolCapped: boolean
  existing?: DrawWinner
  onClose: () => void
  onSaved: () => void
}

interface Picked {
  name: string
  phone: string
  scanCode: string
  productName?: string // สินค้าของรหัสที่เลือก (ใบที่จับได้)
  productSku?: string
  address: string // ที่อยู่ลูกค้า — กรอก/วางเองได้ (auto-fill เมื่อ backend เปิด endpoint)
  rights?: number // จำนวนสิทธิ์ที่ส่งเข้าลุ้น (จากพูล) — undefined ถ้ากรอกเอง
  codes: string[] // รหัสทั้งหมดของคนนี้ (ให้เลือก) — ว่างถ้ากรอกเอง
  products?: Record<string, { name: string; sku: string }> // map รหัส→สินค้า (จากพูล)
}

export default function WinnerPicker({
  slot,
  roundDateLabel,
  winners,
  pool,
  poolLoading,
  poolCapped,
  existing,
  onClose,
  onSaved,
}: Props) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Picked | null>(
    existing ? { name: existing.name, phone: existing.phone, scanCode: existing.scanCode ?? '', productName: existing.productName, productSku: existing.productSku, address: existing.address ?? '', rights: existing.rightsCount, codes: [] } : null,
  )
  const [manual, setManual] = useState(false)
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const [mCode, setMCode] = useState('')
  const [mAddress, setMAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const [err, setErr] = useState('')

  // ดึงที่อยู่จัดส่งค่าเริ่มต้นจาก API (ตามเบอร์) แล้ว auto-fill — เติมเฉพาะถ้าช่องยังว่าง
  async function lookupAddress(phone: string) {
    const digits = (phone || '').replace(/\D/g, '')
    if (digits.length < 4) return
    setAddrLoading(true)
    try {
      const r = await fetch('/api/customers/address?phone=' + encodeURIComponent(digits))
      const b = await r.json()
      if (b.address) {
        setPicked((p) => (p && !p.address.trim() ? { ...p, address: String(b.address) } : p))
      }
    } catch {
      /* ดึงที่อยู่ไม่สำเร็จ — กรอกเองได้ */
    } finally {
      setAddrLoading(false)
    }
  }

  // ค้นจากพูล: ชื่อ / เบอร์ / รหัสสแกน (ช่องเดียว)
  const results = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (ql.length < 1) return []
    const digits = ql.replace(/\D/g, '')
    const out: { c: PoolCustomer; matchedCode?: string }[] = []
    for (const c of pool) {
      if (c.name && c.name.toLowerCase().includes(ql)) out.push({ c })
      else if (digits.length >= 3 && c.phone.replace(/\D/g, '').includes(digits)) out.push({ c })
      else {
        const mc = c.codes.find((cd) => cd.toLowerCase().includes(ql))
        if (mc) out.push({ c, matchedCode: mc })
      }
      if (out.length >= 50) break
    }
    return out
  }, [q, pool])

  const prevWins = picked ? findPrevWins(winners, picked.phone, slot.round) : []

  async function save() {
    const data = picked
    if (!data || !data.name.trim() || !data.phone.trim()) {
      setErr('ยังไม่ได้เลือกผู้ได้รางวัล')
      return
    }
    setSaving(true)
    setErr('')
    try {
      const r = await fetch('/api/draw/winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          round: slot.round,
          slotId: slot.slotId,
          tier: slot.tier,
          prizeLabel: slot.tierLabel,
          name: data.name.trim(),
          phone: data.phone.trim(),
          scanCode: data.scanCode.trim() || undefined,
          productName: data.productName || undefined,
          productSku: data.productSku || undefined,
          address: data.address.trim() || undefined,
          rightsCount: data.rights,
        }),
      })
      const b = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErr(b.error ?? `บันทึกไม่สำเร็จ (HTTP ${r.status})`)
        return
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setErr('บันทึกไม่สำเร็จ: ' + (e?.message ?? e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">รอบ {slot.round} · จับฉลาก {roundDateLabel}</div>
            <div className="text-[16px] font-bold text-[var(--dark)] mt-0.5">{prizeAnnounce(slot.round, slot.tier, slot.indexInTier)}</div>
            <div className="text-[13px] font-semibold text-[#b45309] mt-0.5">🏆 {slot.tierLabel}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text)] text-xl leading-none px-2">✕</button>
        </div>

        {picked ? (
          /* ── สรุปคนที่เลือก + ปุ่มลบ ────────────────────────── */
          <div>
            <div className="rounded-md border border-[var(--primary)] bg-[var(--positive-soft)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-[var(--text-secondary)]">ผู้ได้รางวัล</div>
                  <div className="font-bold text-[16px] text-[var(--dark)] truncate">{picked.name || '(ไม่มีชื่อ)'}</div>
                  <div className="text-[13px] text-[var(--text-secondary)] num">{picked.phone || '(ไม่มีเบอร์)'}</div>
                  {typeof picked.rights === 'number' && (
                    <div className="text-[12px] text-[var(--primary)] font-semibold mt-0.5">🎟️ ส่งเข้าลุ้น {picked.rights.toLocaleString()} สิทธิ์</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPicked(null)
                    setQ('')
                  }}
                  className="flex-shrink-0 text-[12px] text-red-600 font-semibold border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                >
                  ✕ ลบ / เลือกใหม่
                </button>
              </div>

              {/* เลือกรหัสสแกน (ถ้ามีหลายรหัส) */}
              {picked.codes.length > 0 && (
                <div className="mt-2">
                  <div className="text-[11px] text-[var(--text-secondary)] mb-1">รหัสสแกน (เลือกใบที่จับได้ · ไม่บังคับ)</div>
                  <div className="flex flex-wrap gap-1">
                    {picked.codes.map((cd) => {
                      const on = picked.scanCode === cd
                      const prod = on ? undefined : picked.products?.[cd]
                      return (
                        <button
                          key={cd}
                          onClick={() => setPicked({ ...picked, scanCode: on ? '' : cd, productName: on ? undefined : prod?.name, productSku: on ? undefined : prod?.sku })}
                          className={`text-[11px] px-2 py-0.5 rounded border ${on ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)]'}`}
                        >
                          {cd}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {picked.codes.length === 0 && picked.scanCode && (
                <div className="mt-1 text-[12px] text-[var(--text-secondary)]">รหัส: {picked.scanCode}</div>
              )}
              {picked.productName && (
                <div className="mt-1 text-[12px] text-[var(--dark)]">📦 สินค้า: <span className="font-semibold">{picked.productName}</span>{picked.productSku ? <span className="text-[var(--text-secondary)]"> ({picked.productSku})</span> : null}</div>
              )}

              {/* ที่อยู่ลูกค้า — ดึงจาก API อัตโนมัติ · แก้ได้ (สำหรับทีมโทร + ส่งรางวัลถึงบ้าน) */}
              <div className="mt-2">
                <div className="text-[11px] text-[var(--text-secondary)] mb-1 flex items-center gap-1.5">
                  ที่อยู่ลูกค้า (สำหรับติดต่อ/ส่งรางวัล)
                  {addrLoading && <span className="text-[var(--primary)]">⏳ กำลังดึงที่อยู่…</span>}
                  {!addrLoading && (
                    <button onClick={() => lookupAddress(picked.phone)} className="text-[var(--primary)] font-semibold underline">ดึงที่อยู่จากระบบ</button>
                  )}
                </div>
                <textarea
                  value={picked.address}
                  onChange={(e) => setPicked({ ...picked, address: e.target.value })}
                  placeholder="บ้านเลขที่ / ถนน / ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์"
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm resize-y"
                />
              </div>
            </div>

            {prevWins.length > 0 && (
              <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                ⚠️ เบอร์นี้เคยได้รางวัลแล้ว: {prevWins.map((w) => `รอบ ${w.round} (${w.prizeLabel})`).join(' · ')}
              </div>
            )}
            {err && <div className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">{err}</div>}

            <div className="flex gap-2 mt-3">
              <button onClick={save} disabled={saving} className="flex-1 px-4 py-2 rounded-md text-white font-semibold text-sm disabled:opacity-50" style={{ background: 'var(--primary)' }}>
                {saving ? 'กำลังบันทึก…' : existing ? 'อัปเดต' : 'บันทึกผู้ได้รางวัล'}
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-md border border-[var(--border)] text-sm font-semibold">ยกเลิก</button>
            </div>
          </div>
        ) : manual ? (
          /* ── กรอกเอง (กรณีค้นไม่เจอ) ────────────────────────── */
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-semibold text-[var(--text-secondary)]">กรอกเองจากกระดาษ</div>
              <button onClick={() => setManual(false)} className="text-[12px] text-[var(--primary)] font-semibold">← กลับไปค้นหา</button>
            </div>
            <div className="space-y-2">
              <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="ชื่อ-นามสกุล *" className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm" autoFocus />
              <input value={mPhone} onChange={(e) => setMPhone(e.target.value)} placeholder="เบอร์โทร *" className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm" />
              <input value={mCode} onChange={(e) => setMCode(e.target.value)} placeholder="รหัสสแกน (ไม่บังคับ)" className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm" />
              <textarea value={mAddress} onChange={(e) => setMAddress(e.target.value)} placeholder="ที่อยู่ (ไม่บังคับ)" rows={2} className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm resize-y" />
            </div>
            <button
              onClick={() => {
                if (!mName.trim() || !mPhone.trim()) {
                  setErr('ต้องมีชื่อ + เบอร์')
                  return
                }
                setErr('')
                setPicked({ name: mName, phone: mPhone, scanCode: mCode, address: mAddress, codes: [] })
                setManual(false)
                if (!mAddress.trim()) lookupAddress(mPhone) // ลองดึงที่อยู่จากระบบมาเติม
              }}
              className="w-full mt-3 px-4 py-2 rounded-md text-white font-semibold text-sm"
              style={{ background: 'var(--primary)' }}
            >
              ยืนยันรายชื่อ →
            </button>
            {err && <div className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">{err}</div>}
          </div>
        ) : (
          /* ── ค้นหา (ช่องเดียว) ─────────────────────────────── */
          <div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหา ชื่อ / นามสกุล / เบอร์ / รหัสสแกน…"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm"
              autoFocus
            />
            {poolCapped && !poolLoading && <div className="text-[11px] text-amber-700 mt-1">พูลใหญ่ ค้นได้บางส่วน — ถ้าไม่เจอกด “กรอกเอง” ด้านล่าง</div>}

            <div className="mt-2 border border-[var(--border)] rounded-md divide-y max-h-64 overflow-y-auto">
              {poolLoading ? (
                <div className="px-3 py-6 text-center text-[13px] text-[var(--text-secondary)]">
                  ⏳ กำลังโหลดรายชื่อผู้มีสิทธิ์…
                  <div className="text-[11px] mt-1 opacity-80">รอสักครู่ (~5 วิ) แล้วพิมพ์ค้นได้เลย</div>
                </div>
              ) : !q.trim() ? (
                <div className="px-3 py-5 text-center text-[12px] text-[var(--text-secondary)]">
                  พิมพ์ ชื่อ / นามสกุล / เบอร์ / รหัส เพื่อค้นหา
                  <div className="text-[11px] mt-0.5 opacity-80">มีรายชื่อในพูล {pool.length.toLocaleString()} คน</div>
                </div>
              ) : results.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-[var(--text-secondary)] text-center">ไม่พบในพูล — ลองคำอื่น หรือ “กรอกเอง”</div>
              ) : (
                results.map(({ c, matchedCode }, idx) => {
                const pw = findPrevWins(winners, c.phone, slot.round)
                return (
                  <button
                    key={(c.phone || c.name) + idx}
                    onClick={() => {
                      const code = matchedCode ?? (c.codes.length === 1 ? c.codes[0] : '')
                      const prod = c.products?.[code]
                      setPicked({ name: c.name, phone: c.phone, scanCode: code, productName: prod?.name, productSku: prod?.sku, address: c.address ?? '', rights: c.rights, codes: c.codes, products: c.products })
                      if (!c.address) lookupAddress(c.phone) // ดึงที่อยู่จาก API มาเติมอัตโนมัติ
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--bg-soft)] flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-sm">{c.name || '(ไม่มีชื่อ)'}</span>{' '}
                      <span className="text-[12px] text-[var(--text-secondary)] num">{c.phone}</span>
                      {matchedCode && <span className="text-[11px] text-[var(--primary)]"> · {matchedCode}</span>}
                    </span>
                    {pw.length > 0 && <span className="chip chip-yellow flex-shrink-0">เคยได้รอบ {pw.map((w) => w.round).join(',')}</span>}
                  </button>
                )
              })
              )}
            </div>

            <button onClick={() => setManual(true)} className="w-full mt-3 px-4 py-2 rounded-md border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)]">
              ✎ กรอกเอง (ไม่เจอในระบบ)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
