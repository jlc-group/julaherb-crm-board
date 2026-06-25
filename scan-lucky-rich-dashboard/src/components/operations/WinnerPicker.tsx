'use client'

import { useEffect, useMemo, useState } from 'react'
import { prizeAnnounce } from '@/config/draw-rounds'
import type { PrizeSlot, DrawWinner } from '@/config/draw-rounds'
import { findPrevWins, type PoolCustomer } from './draw-utils'

// เบอร์ 9 หลักท้าย (ใช้ dedup ผลค้นฐานข้อมูลกับพูล)
const last9 = (p: string) => {
  const d = (p || '').replace(/\D/g, '')
  return d.length >= 9 ? d.slice(-9) : d
}

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
  province?: string // จังหวัด (fallback เมื่อไม่มีที่อยู่เต็ม)
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
  existing,
  onClose,
  onSaved,
}: Props) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Picked | null>(
    existing ? { name: existing.name, phone: existing.phone, scanCode: existing.scanCode ?? '', productName: existing.productName, productSku: existing.productSku, address: existing.address ?? '', province: existing.province ?? '', rights: existing.rightsCount, codes: [] } : null,
  )
  const [manual, setManual] = useState(false)
  const [mName, setMName] = useState('')
  const [mPhone, setMPhone] = useState('')
  const [mCode, setMCode] = useState('')
  const [mAddress, setMAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const [err, setErr] = useState('')
  // ผลค้นจากฐานข้อมูลทั้งหมด (route /api/customers/search) — ไม่ติด cap พูล
  const [srv, setSrv] = useState<{ name: string; phone: string; address?: string }[]>([])
  const [srvLoading, setSrvLoading] = useState(false)
  // ช่องค้นด้วยรหัสสแกน (จากใบจับ) → ดึงลูกค้า+เบอร์เต็มมาให้
  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  // ดึงที่อยู่จัดส่งค่าเริ่มต้นจาก API (ตามเบอร์) แล้ว auto-fill — เติมเฉพาะถ้าช่องยังว่าง
  async function lookupAddress(phone: string) {
    const digits = (phone || '').replace(/\D/g, '')
    if (digits.length < 4) return
    setAddrLoading(true)
    try {
      const r = await fetch('/api/customers/address?phone=' + encodeURIComponent(digits))
      const b = await r.json()
      setPicked((p) => {
        if (!p) return p
        const next = { ...p }
        if (b.address && !p.address.trim()) next.address = String(b.address)
        if (b.province && !(p.province ?? '').trim()) next.province = String(b.province)
        return next
      })
    } catch {
      /* ดึงที่อยู่ไม่สำเร็จ — กรอกเองได้ */
    } finally {
      setAddrLoading(false)
    }
  }

  // ดัชนีรหัส→ลูกค้า จากพูลที่โหลดไว้ (ค้นทันทีฝั่ง client ก่อนยิง server)
  const poolCodeMap = useMemo(() => {
    const m = new Map<string, PoolCustomer>()
    for (const c of pool) for (const cd of c.codes) {
      const k = cd.toUpperCase()
      if (!m.has(k)) m.set(k, c)
    }
    return m
  }, [pool])

  // รหัสสแกน → ดึงลูกค้า (ชื่อ+เบอร์เต็ม+สินค้า) มาเติมให้เลย (unique เป๊ะสุด)
  async function resolveByCode(raw: string) {
    const c = (raw || '').trim().toUpperCase()
    if (c.length < 4) {
      setErr('พิมพ์รหัสสแกนให้ครบก่อน')
      return
    }
    setErr('')
    // 1) เจอในพูลที่โหลดไว้ → เติมทันที ไม่ต้องยิง server
    const hit = poolCodeMap.get(c)
    if (hit) {
      const prod = hit.products?.[c]
      setPicked({ name: hit.name, phone: hit.phone, scanCode: c, productName: prod?.name, productSku: prod?.sku, address: hit.address ?? '', rights: hit.rights, codes: hit.codes, products: hit.products })
      if (!hit.address) lookupAddress(hit.phone)
      return
    }
    // 2) ไม่อยู่ในพูล → ยิง server (ดัชนี print-slips · ครั้งแรกอาจช้า ~1-2 นาที แล้วเร็ว)
    setCodeLoading(true)
    try {
      const r = await fetch(`/api/draw/resolve-code?round=${slot.round}&code=${encodeURIComponent(c)}`)
      const b = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErr(b.error ?? `ดึงรหัสไม่สำเร็จ (HTTP ${r.status})`)
        return
      }
      if (b.error) {
        setErr('ดึงรหัสไม่สำเร็จ: ' + b.error)
        return
      }
      if (!b.found) {
        setErr(`ไม่พบรหัส ${c} ในระบบ — ลองค้นด้วยชื่อ หรือกรอกเอง`)
        return
      }
      setPicked({
        name: String(b.name ?? ''),
        phone: String(b.phone ?? ''),
        scanCode: String(b.scanCode ?? c),
        productName: b.productName || undefined,
        productSku: b.productSku || undefined,
        address: '',
        rights: typeof b.rights === 'number' ? b.rights : undefined,
        codes: Array.isArray(b.codes) ? b.codes : [],
        products: b.products ?? undefined,
      })
      lookupAddress(String(b.phone ?? '')) // ดึงที่อยู่มาเติมอัตโนมัติ
    } catch (e: any) {
      setErr('ดึงรหัสไม่สำเร็จ: ' + (e?.message ?? e))
    } finally {
      setCodeLoading(false)
    }
  }

  // เลือกจากชื่อ/เบอร์ → ตั้งค่าพื้นฐาน แล้วเติมรหัส/สินค้า/สิทธิ์ จากดัชนีรายรอบ (ตามเบอร์)
  function pickName(name: string, phone: string, address?: string) {
    setErr('')
    setPicked({ name, phone, scanCode: '', address: address ?? '', codes: [] })
    if (!address) lookupAddress(phone)
    fetch(`/api/draw/resolve-code?round=${slot.round}&phone=${encodeURIComponent(phone)}`)
      .then((r) => r.json())
      .then((b) => {
        if (!b || !b.found) return
        setPicked((p) =>
          p && p.phone === phone
            ? {
                ...p,
                scanCode: p.scanCode || String(b.scanCode ?? ''),
                productName: p.productName || b.productName || undefined,
                productSku: p.productSku || b.productSku || undefined,
                rights: typeof p.rights === 'number' ? p.rights : typeof b.rights === 'number' ? b.rights : undefined,
                codes: p.codes && p.codes.length ? p.codes : Array.isArray(b.codes) ? b.codes : [],
                products: p.products ?? b.products ?? undefined,
              }
            : p,
        )
      })
      .catch(() => {})
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

  // ค้นจากฐานข้อมูลทั้งหมด (debounce) — เติมเบอร์เต็มให้คนที่อยู่นอก cap พูล
  useEffect(() => {
    const ql = q.trim()
    if (ql.length < 2) {
      setSrv([])
      setSrvLoading(false)
      return
    }
    let cancelled = false
    setSrvLoading(true)
    const t = setTimeout(async () => {
      try {
        const fetchRows = async (query: string): Promise<{ name?: string; phone?: string; address?: string }[]> => {
          const r = await fetch('/api/customers/search?q=' + encodeURIComponent(query))
          const b = await r.json().catch(() => ({}))
          return (b.results ?? []) as { name?: string; phone?: string; address?: string }[]
        }
        let raw = await fetchRows(ql)
        // ชื่อเก็บแบบ first/last แยก → ค้นทั้งก้อนอาจไม่เจอ → ลองด้วยชื่อต้น
        if (raw.length === 0 && /\s/.test(ql)) raw = await fetchRows(ql.split(/\s+/)[0])
        if (cancelled) return
        const seen = new Set(pool.map((c) => last9(c.phone))) // กันซ้ำกับผลพูล
        const rows = raw
          .filter((x) => x?.phone && !seen.has(last9(x.phone!)))
          .slice(0, 30)
          .map((x) => ({
            name: String(x.name ?? ''),
            phone: String(x.phone ?? ''),
            address: x.address ? String(x.address) : undefined,
          }))
        setSrv(rows)
      } catch {
        if (!cancelled) setSrv([])
      } finally {
        if (!cancelled) setSrvLoading(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q, pool])

  const prevWins = picked ? findPrevWins(winners, picked.phone, slot.round) : []

  async function save() {
    const data = picked
    if (!data || !data.name.trim() || !data.phone.trim()) {
      setErr('ยังไม่ได้เลือกผู้ได้รางวัล (ต้องมีเบอร์โทร — ค้นด้วยรหัส/ชื่อให้ระบบเติมให้)')
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
          province: data.province?.trim() || undefined,
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
              {picked.codes.length === 0 && (
                <div className="mt-2">
                  <div className="text-[11px] text-[var(--text-secondary)] mb-1">รหัสสแกน (พิมพ์จากกระดาษ · ไม่บังคับ)</div>
                  <input
                    value={picked.scanCode}
                    onChange={(e) => setPicked({ ...picked, scanCode: e.target.value.toUpperCase() })}
                    placeholder="เช่น A6MHPX12"
                    className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] text-sm num"
                  />
                </div>
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
                {!picked.address.trim() && (picked.province ?? '').trim() && (
                  <div className="text-[11px] text-amber-700 mt-1">📍 จังหวัด: <b>{picked.province}</b> · ลูกค้ายังไม่ได้กรอกที่อยู่เต็ม (โชว์จังหวัดไว้ก่อน)</div>
                )}
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
              <div className="flex gap-2">
                <input value={mPhone} onChange={(e) => setMPhone(e.target.value)} placeholder="เบอร์โทร * (กดดึงเบอร์จากชื่อได้)" className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] text-sm num" />
                <button
                  type="button"
                  onClick={async () => {
                    const nm = mName.trim()
                    if (nm.length < 2) {
                      setErr('พิมพ์ชื่อก่อน แล้วกดดึงเบอร์')
                      return
                    }
                    setErr('')
                    try {
                      const r = await fetch('/api/customers/search?q=' + encodeURIComponent(nm))
                      const b = await r.json().catch(() => ({}))
                      const rows = (b.results ?? []).filter((x: { phone?: string }) => x?.phone)
                      if (rows.length === 1) {
                        setMPhone(String(rows[0].phone))
                        if (!mAddress.trim() && rows[0].address) setMAddress(String(rows[0].address))
                      } else if (rows.length > 1) {
                        setErr('เจอหลายคนชื่อนี้ — ใช้ช่อง “ค้นหา” ด้านบนเพื่อเลือกให้ตรงเบอร์')
                      } else {
                        setErr('ไม่พบชื่อนี้ในระบบ — กรอกเบอร์เองได้')
                      }
                    } catch {
                      setErr('ดึงเบอร์ไม่สำเร็จ')
                    }
                  }}
                  className="px-3 py-2 rounded-md border border-[var(--primary)] text-[var(--primary)] text-[12px] font-semibold whitespace-nowrap"
                >
                  🔍 ดึงเบอร์จากชื่อ
                </button>
              </div>
              <input value={mCode} onChange={(e) => setMCode(e.target.value.toUpperCase())} placeholder="รหัสสแกน (ไม่บังคับ)" className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm num" />
              <textarea value={mAddress} onChange={(e) => setMAddress(e.target.value)} placeholder="ที่อยู่ (ไม่บังคับ)" rows={2} className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm resize-y" />
            </div>
            <button
              onClick={() => {
                if (!mName.trim() || !mPhone.trim()) {
                  setErr('ต้องมีชื่อ + เบอร์ (กด “🔍 ดึงเบอร์จากชื่อ” ได้)')
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
          /* ── ค้นหา: รหัสสแกน หรือ ชื่อ/เบอร์ (สองช่องเท่ากัน) ──────── */
          <div>
            {/* ① ค้นด้วยรหัสสแกน (จากใบจับ) — ดึงเบอร์+ที่อยู่ให้เอง */}
            <div className="text-[11.5px] font-semibold text-[var(--dark)] mb-1">① รหัสสแกน (จากใบจับ) — เติมเบอร์+ที่อยู่ให้เอง</div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') resolveByCode(code) }}
                placeholder="เช่น A6MHPX12"
                className="flex-1 px-3 py-2 rounded-md border border-[var(--border)] text-sm num"
                autoFocus
              />
              <button
                type="button"
                onClick={() => resolveByCode(code)}
                disabled={codeLoading}
                className="px-4 py-2 rounded-md text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                style={{ background: 'var(--primary)' }}
              >
                {codeLoading ? 'กำลังดึง…' : 'ดึงข้อมูล →'}
              </button>
            </div>
            {codeLoading && <div className="text-[11px] text-[var(--primary)] mt-1">⏳ กำลังดึง… (ถ้ารหัสไม่อยู่ในพูล ครั้งแรกระบบทำดัชนี ~1-2 นาที ครั้งต่อไปเร็วทันที)</div>}

            <div className="text-center text-[11px] text-[var(--text-secondary)] my-2">— หรือ —</div>

            {/* ② ค้นด้วยชื่อ / เบอร์ */}
            <div className="text-[11.5px] font-semibold text-[var(--dark)] mb-1">② ค้นด้วยชื่อ / เบอร์</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="พิมพ์ชื่อ-นามสกุล หรือ เบอร์…"
              className="w-full px-3 py-2 rounded-md border border-[var(--border)] text-sm"
            />
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">💡 เลือกผลแล้วระบบเติมเบอร์เต็ม + ที่อยู่ให้เอง (ค้นทั้งฐานข้อมูล ไม่ติดลิมิตพูล)</div>

            <div className="mt-2 border border-[var(--border)] rounded-md divide-y max-h-64 overflow-y-auto">
              {poolLoading ? (
                <div className="px-3 py-6 text-center text-[13px] text-[var(--text-secondary)]">
                  ⏳ กำลังโหลดรายชื่อผู้มีสิทธิ์…
                  <div className="text-[11px] mt-1 opacity-80">รอสักครู่ (~5 วิ) แล้วพิมพ์ค้นได้เลย</div>
                </div>
              ) : !q.trim() ? (
                <div className="px-3 py-5 text-center text-[12px] text-[var(--text-secondary)]">
                  พิมพ์ ชื่อ-นามสกุล (จากกระดาษ) → ระบบจะเติมเบอร์โทรให้เอง
                  <div className="text-[11px] mt-0.5 opacity-80">ค้นได้ทั้งฐานข้อมูล แม้ไม่อยู่ในพูล {pool.length.toLocaleString()} คน</div>
                </div>
              ) : (
                <>
                  {results.map(({ c, matchedCode }, idx) => {
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
                  })}

                  {/* ── ผลค้นจากฐานข้อมูลทั้งหมด (ไม่ติด cap พูล) — เลือกแล้วเติมเบอร์เต็มอัตโนมัติ ── */}
                  {srvLoading && <div className="px-3 py-2 text-center text-[12px] text-[var(--text-secondary)]">⏳ ค้นจากฐานข้อมูลทั้งหมด…</div>}
                  {srv.length > 0 && (
                    <>
                      <div className="px-3 py-1 bg-[var(--bg-soft)] text-[10px] uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
                        จากฐานข้อมูลทั้งหมด · เลือกแล้วเติมเบอร์ให้เอง
                      </div>
                      {srv.map((s, i) => {
                        const pw = findPrevWins(winners, s.phone, slot.round)
                        return (
                          <button
                            key={'srv' + i}
                            onClick={() => pickName(s.name, s.phone, s.address)}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--bg-soft)] flex items-center justify-between gap-2"
                          >
                            <span className="min-w-0">
                              <span className="font-semibold text-sm">{s.name || '(ไม่มีชื่อ)'}</span>{' '}
                              <span className="text-[12px] text-[var(--text-secondary)] num">{s.phone}</span>
                            </span>
                            {pw.length > 0 && <span className="chip chip-yellow flex-shrink-0">เคยได้รอบ {pw.map((w) => w.round).join(',')}</span>}
                          </button>
                        )
                      })}
                    </>
                  )}

                  {results.length === 0 && srv.length === 0 && !srvLoading && (
                    <div className="px-3 py-3 text-[12px] text-[var(--text-secondary)] text-center">ไม่พบ — ลองคำอื่น หรือ “กรอกเอง”</div>
                  )}
                </>
              )}
            </div>

            {err && <div className="mt-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">{err}</div>}

            <button onClick={() => setManual(true)} className="w-full mt-3 px-4 py-2 rounded-md border border-[var(--border)] text-sm font-semibold text-[var(--text-secondary)]">
              ✎ กรอกเอง (ไม่เจอในระบบ)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
