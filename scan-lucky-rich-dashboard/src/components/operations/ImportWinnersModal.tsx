'use client'

// อัปโหลดรายชื่อผู้โชคดี (ชื่อ/นามสกุล/เบอร์) แล้ว "ระบุรายวัน" อัตโนมัติ
// หลักการ: ลำดับแถวในไฟล์ = ลำดับวัน → แถวที่ i ลงช่องรางวัลที่ i (เรียง 10K รายวัน → 100K → 1M)
// จับเบอร์กับพูลของรอบเพื่อเติม รหัส/สินค้า/สิทธิ์ · พรีวิว+เตือนก่อนเซฟ · เซฟผ่าน POST /api/draw/winners เดิม
import { useCallback, useMemo, useState } from 'react'
import { roundSlots, prizeAnnounce } from '@/config/draw-rounds'
import type { DrawRound, DrawWinner, PrizeSlot } from '@/config/draw-rounds'
import { phoneLast9, type PoolCustomer } from './draw-utils'

interface Props {
  round: DrawRound
  winners: DrawWinner[]
  pool: PoolCustomer[]
  onClose: () => void
  onSaved: () => void
}

// เรียงช่องตามวัน (ให้ตรงกับ "ลำดับ" ในไฟล์ต้นฉบับ + หน้าตารางจับรางวัล)
const DAY_ORDER: Array<'10K' | '100K' | '1M'> = ['10K', '100K', '1M']

interface Entry {
  idx: number
  name: string
  phone: string
  slot?: PrizeSlot
  inPool: boolean
  rights?: number
  scanCode?: string
  productName?: string
  productSku?: string
  warn: string[] // คำเตือน (เตือนเฉยๆ)
  block?: string // ถ้ามี = ไม่บันทึกแถวนี้
}

const digits = (s: string) => (s || '').replace(/\D/g, '')

// แยกชื่อ/เบอร์จากไฟล์ — รองรับหัวตาราง (ชื่อ/นามสกุล/เบอร์) หรือไม่มีหัว (เดาจากรูปแบบเบอร์)
async function parseFile(file: File): Promise<{ name: string; phone: string }[]> {
  const XLSX = await import('xlsx')
  // CSV: อ่านเป็น text (UTF-8) เพื่อกันภาษาไทยเพี้ยน — array buffer จะถอดรหัสผิด codepage
  // XLSX/XLS: อ่านเป็น array buffer (string ใน .xlsx เป็น UTF-8 อยู่แล้ว)
  const isCsv = /\.csv$/i.test(file.name) || file.type.includes('csv')
  const wb = isCsv
    ? XLSX.read(await file.text(), { type: 'string' })
    : XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: '' })
  const norm = (row: unknown[]) => row.map((x) => String(x ?? '').trim())
  const PHONE_K = ['เบอร', 'โทร', 'phone', 'tel', 'มือถือ', 'mobile']
  const LAST_K = ['นามสกุล', 'สกุล', 'last', 'surname']
  const looksPhone = (c: string) => /\d[\d\s\-().]{7,}/.test(c)

  // หาแถวหัวตาราง (ในช่วง 8 แถวแรก)
  let headerRow = -1
  let cFirst = -1
  let cLast = -1
  let cPhone = -1
  let cFull = -1
  for (let r = 0; r < Math.min(aoa.length, 8); r++) {
    const cells = norm(aoa[r])
    const low = cells.map((c) => c.toLowerCase())
    const phoneIdx = low.findIndex((c) => PHONE_K.some((k) => c.includes(k)))
    const lastIdx = cells.findIndex((c) => LAST_K.some((k) => c.toLowerCase().includes(k)))
    const firstIdx = cells.findIndex((c) => c.includes('ชื่อ') && !c.includes('นามสกุล'))
    const combinedIdx = cells.findIndex((c) => c.includes('ชื่อ') && c.includes('สกุล'))
    const nameLatin = low.findIndex((c) => c === 'name' || c.includes('firstname') || c.includes('first name'))
    if (phoneIdx >= 0 || lastIdx >= 0 || firstIdx >= 0 || combinedIdx >= 0) {
      headerRow = r
      cPhone = phoneIdx
      cLast = lastIdx
      cFirst = firstIdx
      if (combinedIdx >= 0 && lastIdx < 0) {
        cFull = combinedIdx
        cFirst = -1
      } else if (firstIdx < 0 && nameLatin >= 0) {
        cFull = nameLatin
      }
      break
    }
  }

  const out: { name: string; phone: string }[] = []
  if (headerRow >= 0) {
    for (let r = headerRow + 1; r < aoa.length; r++) {
      const cells = norm(aoa[r])
      const phoneCell = cPhone >= 0 ? cells[cPhone] : cells.find(looksPhone) ?? ''
      const phone = digits(phoneCell)
      let name = ''
      if (cFull >= 0) name = cells[cFull] ?? ''
      else name = `${cFirst >= 0 ? cells[cFirst] ?? '' : ''} ${cLast >= 0 ? cells[cLast] ?? '' : ''}`.trim()
      if (!name && !phone) continue
      out.push({ name, phone })
    }
  } else {
    // ไม่มีหัวตาราง — เดา: เบอร์ = ช่องที่ดูเป็นเบอร์, ชื่อ = ช่องข้อความก่อนหน้าเบอร์
    for (const raw of aoa) {
      const cells = norm(raw).filter((c) => c !== '')
      if (!cells.length) continue
      const pIdx = cells.findIndex(looksPhone)
      const phone = digits(pIdx >= 0 ? cells[pIdx] : '')
      const name = (pIdx >= 0 ? cells.slice(0, pIdx) : cells).join(' ').trim()
      if (!name && !phone) continue
      out.push({ name, phone })
    }
  }
  return out
}

export default function ImportWinnersModal({ round, winners, pool, onClose, onSaved }: Props) {
  const [phase, setPhase] = useState<'select' | 'preview' | 'saving' | 'done'>('select')
  const [fileName, setFileName] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [parseErr, setParseErr] = useState('')
  const [autoAddr, setAutoAddr] = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState<{ saved: number; skipped: number; failed: number; logs: string[] }>({ saved: 0, skipped: 0, failed: 0, logs: [] })

  const ordered = useMemo<PrizeSlot[]>(
    () => DAY_ORDER.flatMap((t) => roundSlots(round).filter((s) => s.tier === t).sort((a, b) => a.indexInTier - b.indexInTier)),
    [round],
  )

  const build = useCallback(
    (parsed: { name: string; phone: string }[]): Entry[] => {
      const poolByPhone = new Map(pool.map((c) => [phoneLast9(c.phone), c]))
      const roundWinners = winners.filter((w) => w.round === round.round)
      const existingByPhone = new Set(roundWinners.map((w) => phoneLast9(w.phone)))
      const filledSlots = new Set(roundWinners.map((w) => w.slotId))
      const seen = new Set<string>()
      return parsed.map((p, i) => {
        const k = phoneLast9(p.phone)
        const slot = ordered[i]
        const c = k ? poolByPhone.get(k) : undefined
        const warn: string[] = []
        let block: string | undefined
        if (!k || k.length < 9) block = 'เบอร์ไม่ครบ/ไม่ถูกต้อง'
        else if (seen.has(k)) block = 'เบอร์ซ้ำในไฟล์'
        else if (existingByPhone.has(k)) block = 'เบอร์นี้เป็นผู้ชนะในรอบนี้แล้ว'
        if (k) seen.add(k)
        if (!slot) block = block ?? 'เกินจำนวนรางวัลของรอบ'
        else if (filledSlots.has(slot.slotId)) warn.push('ช่องนี้มีคนแล้ว — จะเขียนทับ')
        if (slot && !c) warn.push('ไม่เจอในพูล (ลงได้ แต่ไม่เติมรหัส/สินค้าให้)')
        let scanCode = ''
        let productName: string | undefined
        let productSku: string | undefined
        if (c && c.codes.length === 1) {
          scanCode = c.codes[0]
          const pr = c.products?.[scanCode]
          productName = pr?.name
          productSku = pr?.sku
        }
        return { idx: i, name: p.name, phone: p.phone, slot, inPool: !!c, rights: c?.rights, scanCode, productName, productSku, warn, block }
      })
    },
    [ordered, pool, winners, round.round],
  )

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParseErr('')
    try {
      const parsed = await parseFile(file)
      if (parsed.length === 0) {
        setParseErr('อ่านไฟล์ไม่พบรายชื่อ — ตรวจว่ามีคอลัมน์ ชื่อ/นามสกุล/เบอร์')
        return
      }
      setEntries(build(parsed))
      setPhase('preview')
    } catch (err) {
      setParseErr('อ่านไฟล์ไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function lookupAddress(phone: string): Promise<string> {
    try {
      const r = await fetch('/api/customers/address?phone=' + encodeURIComponent(digits(phone)))
      const b = await r.json()
      return b.address ? String(b.address) : ''
    } catch {
      return ''
    }
  }

  async function save() {
    const toSave = entries.filter((en) => en.slot && !en.block)
    setPhase('saving')
    setProgress({ done: 0, total: toSave.length })
    const logs: string[] = []
    let saved = 0
    let failed = 0
    for (let i = 0; i < toSave.length; i++) {
      const en = toSave[i]
      const slot = en.slot!
      const address = autoAddr ? await lookupAddress(en.phone) : ''
      try {
        const r = await fetch('/api/draw/winners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            round: round.round,
            slotId: slot.slotId,
            tier: slot.tier,
            prizeLabel: slot.tierLabel,
            name: en.name,
            phone: en.phone,
            scanCode: en.scanCode || undefined,
            productName: en.productName || undefined,
            productSku: en.productSku || undefined,
            rightsCount: en.rights,
            address: address || undefined,
          }),
        })
        if (r.ok) saved++
        else {
          failed++
          const b = await r.json().catch(() => ({}))
          logs.push(`❌ ${en.name} (${en.phone}): ${b.error ?? 'HTTP ' + r.status}`)
        }
      } catch (err) {
        failed++
        logs.push(`❌ ${en.name} (${en.phone}): ${err instanceof Error ? err.message : String(err)}`)
      }
      setProgress({ done: i + 1, total: toSave.length })
    }
    const skipped = entries.length - toSave.length
    setResult({ saved, skipped, failed, logs })
    setPhase('done')
    onSaved()
  }

  const willSave = entries.filter((en) => en.slot && !en.block).length
  const blocked = entries.length - willSave

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              รอบ {round.round} · จับฉลาก {round.drawDateLabel} · {round.totalCount} รางวัล
            </div>
            <div className="text-[16px] font-bold text-[var(--dark)] mt-0.5">📤 อัปโหลดรายชื่อ → ระบุรายวันอัตโนมัติ</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text)] text-xl leading-none px-2">✕</button>
        </div>

        {/* ── เลือกไฟล์ ─────────────────────────────────────────── */}
        {phase === 'select' && (
          <div>
            <div className="text-[12.5px] text-[var(--text-secondary)] bg-[var(--bg-soft)] rounded-md px-3 py-2 leading-relaxed mb-3">
              ไฟล์ <b>.xlsx / .csv</b> · คอลัมน์ <b>ชื่อ · นามสกุล · เบอร์โทรศัพท์</b> (มีหัวตารางหรือไม่มีก็ได้)
              <br />
              <b>ลำดับแถว = ลำดับวัน</b> — แถวแรกลงผู้โชคดีวันที่ 1 ของเดือน ไล่ลงไปจนครบ แล้วต่อรางวัลรายเดือน/รางวัลใหญ่
            </div>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--border)] rounded-lg py-10 cursor-pointer hover:bg-[var(--bg-soft)]">
              <span className="text-[32px]">📄</span>
              <span className="text-[13px] font-semibold text-[var(--primary)]">เลือกไฟล์รายชื่อ…</span>
              <span className="text-[11px] text-[var(--text-secondary)]">รองรับ Excel (.xlsx) และ CSV</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
            </label>
            {parseErr && <div className="mt-3 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-2.5 py-1.5">{parseErr}</div>}
            <button onClick={downloadTemplate} className="mt-3 text-[12px] text-[var(--primary)] font-semibold underline">⬇ ดาวน์โหลดไฟล์ตัวอย่าง (template)</button>
          </div>
        )}

        {/* ── พรีวิว ────────────────────────────────────────────── */}
        {phase === 'preview' && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2 text-[12.5px]">
              <span className="text-[var(--text-secondary)]">ไฟล์: <b>{fileName}</b> · อ่านได้ {entries.length} รายชื่อ</span>
              <span className="text-[#15803d] font-semibold">จะบันทึก {willSave}</span>
              {blocked > 0 && <span className="text-amber-700 font-semibold">ข้าม {blocked}</span>}
              <label className="ml-auto flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)] cursor-pointer">
                <input type="checkbox" checked={autoAddr} onChange={(e) => setAutoAddr(e.target.checked)} />
                ดึงที่อยู่/จังหวัดอัตโนมัติ (ช้าขึ้นเล็กน้อย)
              </label>
            </div>

            <div className="border border-[var(--border)] rounded-md overflow-auto max-h-[52vh]">
              <table className="w-full text-left text-[12.5px] border-collapse min-w-[640px]">
                <thead className="sticky top-0 bg-[var(--bg-soft)] text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-2 py-2 w-10 text-center">#</th>
                    <th className="px-2 py-2">รางวัล / วันที่ประกาศ</th>
                    <th className="px-2 py-2">ชื่อ-นามสกุล</th>
                    <th className="px-2 py-2 w-28 text-center">เบอร์</th>
                    <th className="px-2 py-2 w-44">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((en) => (
                    <tr key={en.idx} className={`border-b border-[var(--border)] ${en.block ? 'bg-red-50' : en.warn.length ? 'bg-amber-50' : ''}`}>
                      <td className="px-2 py-1.5 text-center text-[var(--text-secondary)]">{en.idx + 1}</td>
                      <td className="px-2 py-1.5">
                        {en.slot ? (
                          <span className="whitespace-nowrap">{prizeAnnounce(round.round, en.slot.tier, en.slot.indexInTier)} <span className="text-[var(--text-secondary)]">· {en.slot.tierShort}</span></span>
                        ) : (
                          <span className="text-red-600">— (เกินจำนวน)</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-semibold">{en.name || <span className="text-red-600 font-normal">(ไม่มีชื่อ)</span>}</td>
                      <td className="px-2 py-1.5 text-center num whitespace-nowrap">{en.phone || '—'}</td>
                      <td className="px-2 py-1.5">
                        {en.block ? (
                          <span className="text-[11px] text-red-700 font-semibold">⛔ {en.block}</span>
                        ) : (
                          <span className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-[#15803d]">{en.inPool ? `✓ เจอในพูล${en.rights ? ` · ${en.rights} สิทธิ์` : ''}` : '• กรอกจากไฟล์'}</span>
                            {en.warn.map((w, i) => <span key={i} className="text-[11px] text-amber-700">⚠️ {w}</span>)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={save} disabled={willSave === 0} className="flex-1 px-4 py-2 rounded-md text-white font-semibold text-sm disabled:opacity-50" style={{ background: 'var(--primary)' }}>
                ✓ ยืนยัน — บันทึก {willSave} รายชื่อลงรางวัล
              </button>
              <button onClick={() => { setPhase('select'); setEntries([]) }} className="px-4 py-2 rounded-md border border-[var(--border)] text-sm font-semibold">เลือกไฟล์ใหม่</button>
            </div>
          </div>
        )}

        {/* ── กำลังบันทึก ───────────────────────────────────────── */}
        {phase === 'saving' && (
          <div className="py-10 text-center">
            <div className="text-[14px] font-semibold text-[var(--dark)]">กำลังบันทึก… {progress.done}/{progress.total}</div>
            <div className="mt-3 h-2 bg-[var(--bg-soft)] rounded-full overflow-hidden max-w-sm mx-auto">
              <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-2">{autoAddr ? 'กำลังดึงที่อยู่ + บันทึกทีละราย' : 'บันทึกทีละราย'}</div>
          </div>
        )}

        {/* ── สรุปผล ────────────────────────────────────────────── */}
        {phase === 'done' && (
          <div>
            <div className="text-center py-4">
              <div className="text-[40px]">🎉</div>
              <div className="text-[16px] font-bold text-[var(--dark)] mt-1">บันทึกเสร็จแล้ว</div>
              <div className="mt-2 flex justify-center gap-4 text-[13px]">
                <span className="text-[#15803d] font-semibold">✓ บันทึก {result.saved}</span>
                {result.skipped > 0 && <span className="text-amber-700 font-semibold">ข้าม {result.skipped}</span>}
                {result.failed > 0 && <span className="text-red-600 font-semibold">ผิดพลาด {result.failed}</span>}
              </div>
            </div>
            {result.logs.length > 0 && (
              <div className="border border-red-200 bg-red-50 rounded-md p-2 max-h-40 overflow-auto text-[11.5px] text-red-700 space-y-0.5">
                {result.logs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            )}
            <div className="text-[12px] text-[var(--text-secondary)] mt-3 bg-[var(--bg-soft)] rounded px-3 py-2">
              💡 ดาวน์โหลดไฟล์ที่ระบุวันครบได้จากปุ่ม <b>“ดาวน์โหลดรายชื่อผู้โชคดี (Excel)”</b> ในหน้าจับรางวัล
            </div>
            <button onClick={onClose} className="w-full mt-3 px-4 py-2 rounded-md text-white font-semibold text-sm" style={{ background: 'var(--primary)' }}>เสร็จสิ้น</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ไฟล์ตัวอย่าง 3 คอลัมน์ (BOM กัน Excel อ่านไทยเพี้ยน)
function downloadTemplate() {
  const csv = '﻿' + ['ชื่อ,นามสกุล,เบอร์โทรศัพท์', 'สมชาย,ใจดี,0812345678', 'สมหญิง,รักสวย,0898765432'].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template_รายชื่อผู้โชคดี.csv'
  a.click()
  URL.revokeObjectURL(url)
}
