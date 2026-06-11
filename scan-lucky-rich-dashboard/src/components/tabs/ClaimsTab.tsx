'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { prizeAnnounceBySlot } from '@/config/draw-rounds'
import type { DrawWinner, DrawClaim, ClaimStatus } from '@/config/draw-rounds'
import { phoneLast9 } from '@/components/operations/draw-utils'
import { maskPhone, numFmt } from '@/lib/utils'
import TabHeader from '@/components/ui/TabHeader'
import KpiCard from '@/components/ui/KpiCard'

// header admin key (ถ้า deploy แล้วตั้ง ADMIN_KEY) — local ปล่อยว่างได้
function adminHeaders(): Record<string, string> {
  const k = typeof window !== 'undefined' ? localStorage.getItem('adminKey') : ''
  return k ? { 'x-admin-key': k } : {}
}

const STATUS_META: Record<string, { label: string; chip: string }> = {
  none: { label: 'ยังไม่มาติดต่อ', chip: 'chip-gray' },
  submitted: { label: 'เตรียมมาตรวจ', chip: 'chip-yellow' },
  approved: { label: 'เอกสารครบ', chip: 'chip' },
  rejected: { label: 'เอกสารไม่ครบ', chip: 'chip-red' },
  handed_over: { label: 'มอบของแล้ว', chip: 'chip-blue' },
}

interface Person {
  phoneLast9: string
  name: string
  phone: string
  prizes: { round: number; prizeLabel: string; slotId: string }[]
  rounds: number[]
  claim: DrawClaim | null
}

export default function ClaimsTab({ focusPhone = null }: { focusPhone?: string | null }) {
  const [winners, setWinners] = useState<DrawWinner[]>([])
  const [claims, setClaims] = useState<DrawClaim[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [viewing, setViewing] = useState<Person | null>(null)
  const [authErr, setAuthErr] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null) // เบอร์ 9 หลักท้าย ที่ถูกโฟกัสจาก Operations
  const [readyToClear, setReadyToClear] = useState(false) // true เมื่อแถวถูก scroll เข้ามาแล้ว → เริ่มจับเวลาเคลียร์ไฮไลต์
  const [claimUrl, setClaimUrl] = useState('/claim')
  const [linkCopied, setLinkCopied] = useState(false)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrolledFor = useRef<string | null>(null)

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

  const load = useCallback(async () => {
    try {
      const [wr, cr] = await Promise.all([
        fetch('/api/draw/winners'),
        fetch('/api/draw/claims', { headers: adminHeaders() }),
      ])
      const wb = await wr.json()
      setWinners(wb.winners ?? [])
      if (cr.status === 401) {
        setAuthErr(true)
        setClaims([])
      } else {
        setAuthErr(false)
        const cb = await cr.json()
        setClaims(cb.claims ?? [])
      }
    } catch {
      /* keep */
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const persons: Person[] = useMemo(() => {
    const map = new Map<string, Person>()
    for (const w of winners) {
      const k = phoneLast9(w.phone)
      if (!k) continue
      let p = map.get(k)
      if (!p) {
        p = { phoneLast9: k, name: w.name, phone: w.phone, prizes: [], rounds: [], claim: null }
        map.set(k, p)
      }
      p.prizes.push({ round: w.round, prizeLabel: w.prizeLabel, slotId: w.slotId })
      if (!p.rounds.includes(w.round)) p.rounds.push(w.round)
    }
    const cmap = new Map(claims.map((c) => [c.phoneLast9, c]))
    return Array.from(map.values()).map((p) => ({ ...p, claim: cmap.get(p.phoneLast9) ?? null }))
  }, [winners, claims])

  const statusOf = (p: Person): string => p.claim?.status ?? 'none'

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: persons.length, none: 0, submitted: 0, approved: 0, rejected: 0, handed_over: 0 }
    for (const p of persons) c[statusOf(p)]++
    return c
  }, [persons])

  const shown = useMemo(
    () =>
      persons
        .filter((p) => filter === 'all' || statusOf(p) === filter)
        .sort((a, b) => Math.min(...a.rounds) - Math.min(...b.rounds)),
    [persons, filter],
  )

  // โฟกัสผู้ได้รางวัลที่ถูกกดมาจากแท็บ Operations (ตั้ง filter เป็นทั้งหมดให้เห็นแน่ + ไฮไลต์)
  useEffect(() => {
    if (!focusPhone) return
    setFilter('all')
    setHighlight(focusPhone)
    setReadyToClear(false)
    scrolledFor.current = null
  }, [focusPhone])

  // เลื่อนไปยังแถวที่ไฮไลต์ "เมื่อแถวเรนเดอร์จริง" (รอข้อมูลโหลดเสร็จ) แล้วส่งสัญญาณให้เริ่มจับเวลา
  useEffect(() => {
    if (!highlight || scrolledFor.current === highlight) return
    const el = rowRefs.current[highlight]
    if (!el) return // ข้อมูลยังโหลดไม่เสร็จ — รอ shown เปลี่ยนแล้วลองใหม่
    scrolledFor.current = highlight
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setReadyToClear(true)
  }, [highlight, shown])

  // ไฮไลต์หายเองหลัง ~3.5 วิ — เริ่มนับ "หลังเห็นแถวจริง" (กันกรณีโหลดช้ากว่า 3 วิ แล้วไฮไลต์หายก่อนแถวขึ้น)
  useEffect(() => {
    if (!highlight || !readyToClear) return
    const t = setTimeout(() => setHighlight(null), 3500)
    return () => clearTimeout(t)
  }, [highlight, readyToClear])

  async function update(phoneLast9: string, patch: { status?: ClaimStatus; reviewNote?: string; purgeFiles?: boolean }) {
    const r = await fetch('/api/draw/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ phoneLast9, ...patch }),
    })
    if (r.status === 401) {
      const k = prompt('ใส่ admin key:')
      if (k) {
        localStorage.setItem('adminKey', k)
        return update(phoneLast9, patch)
      }
      return
    }
    load()
  }

  return (
    <div className="space-y-4">
      <TabHeader icon="🏅" title="รับรางวัล — ตรวจเอกสารหน้างาน" subtitle={`ผู้ชนะ ${counts.total} คน · เตรียมมาตรวจแล้ว ${counts.total - counts.none} · มอบของแล้ว ${counts.handed_over}`} />

      {/* ลิงก์ให้ลูกค้าตรวจสิทธิ์และดูรายการเอกสารที่ต้องเตรียม */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[18px]">🔗</span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-[var(--dark)]">ลิงก์ตรวจสิทธิ์และดูเอกสารที่ต้องเตรียม</div>
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

      {authErr && (
        <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          ต้องใส่ admin key เพื่อดูข้อมูลรับรางวัล —{' '}
          <button className="underline font-semibold" onClick={() => { const k = prompt('admin key:'); if (k) { localStorage.setItem('adminKey', k); load() } }}>ใส่ key</button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="ผู้ชนะทั้งหมด" value={numFmt(counts.total)} sub="คน" />
        <KpiCard label="ยังไม่มาติดต่อ" value={counts.none} sub="รอรับรางวัล" />
        <KpiCard label="เตรียมมาตรวจ" value={counts.submitted} sub="มีข้อมูลเดิม" gold />
        <KpiCard label="เอกสารครบ" value={counts.approved} sub="พร้อมมอบ" />
        <KpiCard label="มอบของแล้ว" value={counts.handed_over} sub="เสร็จสิ้น" />
      </div>

      {/* filter */}
      <div className="flex flex-wrap gap-1.5">
        {[['all', 'ทั้งหมด'], ['none', 'ยังไม่มาติดต่อ'], ['submitted', 'เตรียมมาตรวจ'], ['approved', 'เอกสารครบ'], ['rejected', 'เอกสารไม่ครบ'], ['handed_over', 'มอบแล้ว']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-3 py-1 rounded-full text-[12px] font-semibold border ${filter === v ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)]'}`}>
            {l}
          </button>
        ))}
      </div>

      {persons.length === 0 ? (
        <div className="card p-8 text-center text-[var(--text-secondary)] text-sm">ยังไม่มีผู้ชนะ — บันทึกผู้ชนะที่แท็บ Operations ก่อน</div>
      ) : (
        <div className="card divide-y">
          {shown.map((p) => {
            const st = statusOf(p)
            const m = STATUS_META[st]
            const isHi = highlight === p.phoneLast9
            return (
              <div
                key={p.phoneLast9}
                ref={(el) => {
                  rowRefs.current[p.phoneLast9] = el
                }}
                className={`px-3 py-2.5 flex items-center gap-3 flex-wrap transition ${isHi ? 'bg-[#fff7e0] ring-2 ring-inset ring-[#e0a82e] shadow-[0_0_0_3px_rgba(224,168,46,0.25)]' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm">{p.name || '(ไม่มีชื่อ)'} <span className="text-[12px] text-[var(--text-secondary)] font-normal">· {maskPhone(p.phone)}</span></div>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {p.prizes.map((x, i) => {
                      const announce = prizeAnnounceBySlot(x.round, x.slotId)
                      return (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-[var(--bg-soft)] border border-[var(--border)] rounded px-1.5 py-0.5">
                          <span className="font-semibold text-[var(--primary)]">รอบ {x.round}</span>
                          {announce && <span className="text-[var(--text-secondary)]">· {announce}</span>}
                          <span className="text-[#b45309] font-medium">· {x.prizeLabel}</span>
                        </span>
                      )
                    })}
                    {p.claim?.hasProxy && <span className="text-[11px] text-amber-700">📄 มอบอำนาจ</span>}
                  </div>
                  {p.claim?.reviewNote && <div className="text-[11px] text-[var(--text-secondary)] italic">โน้ต: {p.claim.reviewNote}</div>}
                </div>
                <span className={`chip ${m.chip} flex-shrink-0`}>{m.label}</span>
                {p.claim && (
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => setViewing(p)} className="text-[12px] text-[var(--primary)] font-semibold">ดูไฟล์เดิม</button>
                    {st !== 'approved' && st !== 'handed_over' && <button onClick={() => update(p.phoneLast9, { status: 'approved' })} className="text-[12px] text-emerald-600 font-semibold">เอกสารครบ</button>}
                    {st !== 'rejected' && st !== 'handed_over' && <button onClick={() => update(p.phoneLast9, { status: 'rejected' })} className="text-[12px] text-red-500 font-semibold">เอกสารไม่ครบ</button>}
                    {st !== 'handed_over' && <button onClick={() => { if (confirm('ยืนยันว่ามอบของแล้ว? (ลบไฟล์เอกสารทิ้งด้วยเพื่อความปลอดภัย)')) update(p.phoneLast9, { status: 'handed_over', purgeFiles: true }) }} className="text-[12px] text-blue-600 font-semibold">มอบแล้ว</button>}
                    <button onClick={() => { const n = prompt('โน้ต:', p.claim?.reviewNote ?? ''); if (n !== null) update(p.phoneLast9, { reviewNote: n }) }} className="text-[12px] text-[var(--text-secondary)]">โน้ต</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {viewing && <FileViewer person={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

// ── modal ดูไฟล์เอกสารเดิมจาก flow เก่า (fetch พร้อม admin header → blob) ─────────────────
function FileViewer({ person, onClose }: { person: Person; onClose: () => void }) {
  const [urls, setUrls] = useState<{ label: string; url: string; pdf: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let revoked: string[] = []
    ;(async () => {
      const types: [string, string][] = [['idCard', 'บัตรประชาชน']]
      if (person.claim?.hasProxy) types.push(['poa', 'หนังสือมอบอำนาจ'], ['proxyIdCard', 'บัตรผู้รับมอบอำนาจ'])
      const out: { label: string; url: string; pdf: boolean }[] = []
      for (const [type, label] of types) {
        if (!(person.claim?.files as any)?.[type]) continue
        try {
          const r = await fetch(`/api/claim/file?phone=${person.phoneLast9}&type=${type}`, { headers: adminHeaders() })
          if (!r.ok) continue
          const blob = await r.blob()
          const url = URL.createObjectURL(blob)
          revoked.push(url)
          out.push({ label, url, pdf: blob.type === 'application/pdf' })
        } catch {
          /* skip */
        }
      }
      setUrls(out)
      setLoading(false)
    })()
    return () => revoked.forEach((u) => URL.revokeObjectURL(u))
  }, [person])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-[var(--dark)]">ไฟล์เอกสารเดิม — {person.name} ({maskPhone(person.phone)})</div>
          <button onClick={onClose} className="text-xl px-2">✕</button>
        </div>
        {loading ? (
          <div className="text-center text-[var(--text-secondary)] py-8">⏳ กำลังโหลด…</div>
        ) : urls.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-8">ไม่มีไฟล์เดิม (flow ใหม่ให้ตรวจเอกสารตัวจริงหน้างาน)</div>
        ) : (
          <div className="space-y-4">
            {urls.map((u, i) => (
              <div key={i}>
                <div className="text-[13px] font-semibold mb-1">{u.label}</div>
                {u.pdf ? (
                  <a href={u.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] underline text-sm">เปิดไฟล์ PDF →</a>
                ) : (
                  <img src={u.url} alt={u.label} className="max-w-full rounded border border-[var(--border)]" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
