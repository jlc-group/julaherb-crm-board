'use client'

import { useEffect, useState } from 'react'
import MobileShell from '@/components/public/MobileShell'
import { DRAW_ROUNDS, winnerAnnounceISO } from '@/config/draw-rounds'

// วันเวลาประกาศผลรอบแรก (ผู้โชคดีรายวันใบแรก) = 1 ก.ค. 2569 10:45 น. (เวลาไทย)
const FIRST_ANNOUNCE = new Date(`${winnerAnnounceISO(DRAW_ROUNDS[0].round, '10K', 1)}T10:45:00+07:00`)
const BRAND = '#15803d'
const BRAND_BG = 'var(--brand-grad)' // ไล่สีแบรนด์ (เขียวเข้ม→อ่อน)
const CARD_GRAD = 'linear-gradient(160deg,#08461f 0%,#137d38 46%,#54bf3c 100%)' // การ์ดแกรนด์ (ชุดเดียวกับ /claim)
const GOLD = 'linear-gradient(135deg,#fde08a,#f1ad24)'

interface PubWinner {
  announceISO: string
  announceLabel: string
  round: number
  tier: string
  prizeLabel: string
  name: string
  phoneMasked: string
}

interface PubData {
  todayISO: string
  preview: boolean
  winners: PubWinner[]
}

interface PrizeMonth { iso: string; name: string; short: string; label: string }
const PRIZE_MONTHS: PrizeMonth[] = (() => {
  const seen = new Set<string>()
  const out: PrizeMonth[] = []
  for (const r of DRAW_ROUNDS) {
    if (seen.has(r.prizeMonthISO)) continue
    seen.add(r.prizeMonthISO)
    const year = r.prizeMonthShort.split(' ')[1] ?? ''
    out.push({ iso: r.prizeMonthISO, name: r.prizeMonthName, short: r.prizeMonthShort.split(' ')[0], label: `${r.prizeMonthName} ${year}` })
  }
  return out.sort((a, b) => (a.iso < b.iso ? -1 : 1))
})()

const isBigPrize = (tier: string) => tier === '100K' || tier === '1M'
const monthOf = (iso: string) => iso.slice(0, 7)

const TH_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const thDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${TH_ABBR[(m || 1) - 1]} ${(y || 0) + 543}`
}

export default function WinnersPage() {
  const [data, setData] = useState<PubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [simDate, setSimDate] = useState<string | null>(null) // โหมด preview: จำลองว่า "วันนี้" คือวันไหน (แอดมินกดดูข้ามวัน)

  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get('preview') === '1'
    const adminKey = localStorage.getItem('adminKey') || ''
    const url = preview ? '/api/winners/public?all=1' : '/api/winners/public'
    fetch(url, { headers: preview && adminKey ? { 'x-admin-key': adminKey } : {} })
      .then((r) => r.json())
      .then((b: PubData) => setData(b))
      .catch((e) => setErr(String(e?.message ?? e)))
      .finally(() => setLoading(false))
  }, [])

  const allWinners = data?.winners ?? []
  const preview = !!data?.preview
  // วันประกาศที่ไม่ซ้ำ เรียงน้อย→มาก (ใช้กับตัวเลือกจำลองวันที่ฝั่งแอดมิน)
  const announceDates = Array.from(new Set(allWinners.map((w) => w.announceISO).filter(Boolean))).sort()

  // preview: ตั้งวันจำลองเริ่มต้น = วันประกาศแรก
  useEffect(() => {
    if (preview && simDate === null && announceDates.length) setSimDate(announceDates[0])
  }, [preview, simDate, announceDates.length])

  // preview + เลือกวัน → จำลองมุมมองลูกค้า ณ วันนั้น (announceISO ≤ simDate · เงื่อนไขเดียวกับ gate ฝั่ง server)
  // ลูกค้าปกติ (ไม่มี preview) → เห็นทั้งหมดที่ API ส่งมา (ซึ่ง gate วันจริงอยู่แล้ว)
  const winners = preview && simDate ? allWinners.filter((w) => w.announceISO <= simDate) : allWinners
  const hasAny = allWinners.length > 0

  const latestMonth = winners.length ? winners.map((w) => monthOf(w.announceISO)).sort().slice(-1)[0] : null
  const activeMonth = selectedMonth ?? latestMonth ?? PRIZE_MONTHS[0].iso
  const activeLabel = PRIZE_MONTHS.find((m) => m.iso === activeMonth)?.label ?? ''

  const monthWinners = winners
    .filter((w) => monthOf(w.announceISO) === activeMonth)
    .sort((a, b) => (a.announceISO < b.announceISO ? 1 : a.announceISO > b.announceISO ? -1 : 0))
  const latest = monthWinners[0]
  // แยกรางวัลใหญ่ (100K/1M) ออกเป็นก้อนต่างหาก · ที่เหลือเป็นรายวัน (10K)
  const bigWinners = monthWinners.filter((w) => isBigPrize(w.tier))
  const dailyWinners = monthWinners.filter((w) => !isBigPrize(w.tier))
  const visibleDaily = expanded ? dailyWinners : dailyWinners.slice(0, 5)

  function pickMonth(iso: string) {
    setSelectedMonth(iso)
    setExpanded(false)
  }

  return (
    <MobileShell icon="🏆" badge={<LiveBadge />}>
      <div className="text-center mb-4 mt-1">
        <h1 className="text-[22px] font-bold text-[var(--dark)] leading-tight">ประกาศผลผู้โชคดี</h1>
        {hasAny ? (
          <p className="text-[12.5px] font-semibold text-[#16a34a] mt-1">ประจำเดือน{activeLabel}</p>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)] mt-1 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" /> อัปเดตทุกวัน 10:45 น. เป็นต้นไป
          </p>
        )}
      </div>

      {data?.preview && (
        <div className="mb-3 text-[12px] text-[var(--text-secondary)] bg-[var(--bg-soft)] border border-[var(--border)] rounded-xl px-3 py-2 text-center">
          โหมดพรีวิว (แอดมิน) — เลือกวันเพื่อดูว่าลูกค้าจะเห็นรายชื่ออะไรบ้างในวันนั้น
        </div>
      )}

      {preview && hasAny && simDate && (
        <PreviewDatePicker
          dates={announceDates}
          value={simDate}
          onChange={(d) => { setSimDate(d); setExpanded(false) }}
          shownCount={winners.length}
          total={allWinners.length}
        />
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">กำลังโหลด…</div>
      ) : err ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] p-6 text-center text-[#b91c1c]">โหลดไม่สำเร็จ: {err}</div>
      ) : !hasAny ? (
        /* ── ก่อนเริ่มประกาศ: countdown ── */
        <div className="float-up pb-24">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 mb-3 text-center">
            <i className="ti ti-clock text-[24px] text-[var(--text-muted)]" aria-hidden="true" />
            <div className="text-[14px] text-[var(--text)] mt-2 leading-relaxed">ยังไม่เริ่มประกาศผล<br />ติดตามผลได้ทุกวัน <b>10:45 น.</b> เป็นต้นไป</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4 mb-4">
            <div className="text-[12.5px] font-semibold text-[var(--dark)]">เริ่มประกาศผลในอีก</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 mb-3">รอบแรก 1 ก.ค. 2569 · เวลา 10:45 น. เป็นต้นไป</div>
            <Countdown target={FIRST_ANNOUNCE} />
          </div>
          <p className="text-center text-[11px] text-[var(--text-muted)] mt-6 leading-relaxed">
            ประกาศผลทุกวัน 10:45 น. เป็นต้นไป ทาง ไทยรัฐออนไลน์ และ LINE OA<br />จุฬาเฮิร์บ สานฝันคนไทย
          </p>
        </div>
      ) : (
        /* ── มีผลแล้ว ── */
        <div className="float-up pb-24">
          <MonthSwitcher months={PRIZE_MONTHS} active={activeMonth} onPick={pickMonth} />

          {latest ? (
            <MonthHeroCard w={latest} />
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
              <div className="text-[13.5px] text-[var(--text-secondary)] leading-relaxed">เดือน{activeLabel}<br />ยังไม่มีการประกาศผล</div>
            </div>
          )}

          {/* ── รางวัลใหญ่ (100K/1M) — ก้อนทองต่างหาก เด่นกว่ารายวัน ── */}
          {bigWinners.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[13px] font-bold text-[#b45309]">🏆 รางวัลใหญ่ประจำเดือน</span>
                <span className="text-[11px] text-[#a16207]">{bigWinners.length} รางวัล</span>
              </div>
              <div className="rounded-2xl overflow-hidden border-2 border-[#f1ad24]" style={{ background: 'linear-gradient(160deg,#fffaf0,#fdebbf)', boxShadow: '0 6px 18px rgba(241,173,36,0.22)' }}>
                {bigWinners.map((w, i) => (
                  <BigWinnerRow key={i} w={w} />
                ))}
              </div>
            </div>
          )}

          {/* ── ผู้โชคดีรายวัน (ทอง 10K) — วันที่อยู่ซ้าย ── */}
          {dailyWinners.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-5 mb-2 px-1">
                <span className="text-[12px] font-semibold text-[var(--text-secondary)]">ผู้โชคดีรายวัน</span>
                <span className="text-[11px] text-[var(--text-muted)]">{dailyWinners.length} รายการ</span>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
                {visibleDaily.map((w, i) => (
                  <WinnerRow key={i} w={w} />
                ))}
              </div>
              {dailyWinners.length > 5 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="w-full mt-2 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-[12.5px] font-semibold active:scale-[0.99] transition"
                >
                  {expanded ? 'ย่อรายการ' : `ดูทั้งหมด ${dailyWinners.length} รายการ`}
                </button>
              )}
            </>
          )}

          <p className="text-center text-[11px] text-[var(--text-muted)] mt-6 leading-relaxed">
            ประกาศผลทุกวัน 10:45 น. เป็นต้นไป ทาง ไทยรัฐออนไลน์ และ LINE OA<br />จุฬาเฮิร์บ สานฝันคนไทย
          </p>
        </div>
      )}

      {/* ── ปุ่มลอย: ตรวจสอบสิทธิ์ของฉัน ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <a
          href="/claim"
          className="pointer-events-auto flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition"
          style={{ background: BRAND_BG }}
        >
          <i className="ti ti-search" aria-hidden="true" /> ตรวจสอบสิทธิ์ของฉัน
        </a>
      </div>
    </MobileShell>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-white bg-white/15 rounded-full pl-1.5 pr-2 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" /> Live
    </span>
  )
}

function MonthSwitcher({ months, active, onPick }: { months: PrizeMonth[]; active: string; onPick: (iso: string) => void }) {
  const idx = months.findIndex((m) => m.iso === active)
  const go = (d: number) => onPick(months[(idx + d + months.length) % months.length].iso)
  return (
    <div className="flex items-center gap-1.5 mb-4">
      <button aria-label="เดือนก่อนหน้า" onClick={() => go(-1)} className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--border)] bg-white text-[#15803d] flex items-center justify-center active:scale-95 transition">
        <i className="ti ti-chevron-left text-[18px]" aria-hidden="true" />
      </button>
      <div className="flex gap-1.5 overflow-x-auto flex-1 py-0.5" style={{ scrollbarWidth: 'none' }}>
        {months.map((m) => {
          const on = m.iso === active
          return (
            <button
              key={m.iso}
              onClick={() => onPick(m.iso)}
              aria-pressed={on}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${on ? 'text-white' : 'text-[#15803d] bg-[#f0fdf4] border border-[#dcfce7]'}`}
              style={on ? { background: BRAND } : undefined}
            >
              {m.short}
            </button>
          )
        })}
      </div>
      <button aria-label="เดือนถัดไป" onClick={() => go(1)} className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--border)] bg-white text-[#15803d] flex items-center justify-center active:scale-95 transition">
        <i className="ti ti-chevron-right text-[18px]" aria-hidden="true" />
      </button>
    </div>
  )
}

// ตัวเลือกจำลองวันที่ — แอดมินกดดูข้ามวันว่า "ถ้าวันนี้คือวันที่ X ลูกค้าจะเห็นกี่รายชื่อ" (โหมด preview เท่านั้น)
function PreviewDatePicker({ dates, value, onChange, shownCount, total }: {
  dates: string[]; value: string; onChange: (d: string) => void; shownCount: number; total: number
}) {
  const idx = dates.indexOf(value)
  const go = (delta: number) => {
    const n = Math.min(dates.length - 1, Math.max(0, idx + delta))
    onChange(dates[n])
  }
  return (
    <div className="mb-3 rounded-xl border border-[#f4d58a] bg-[#fffdf5] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11.5px] font-semibold text-[#92600a]">จำลองวันที่ (แอดมิน)</span>
        <span className="text-[10.5px] text-[#a16207]">ลูกค้าจะเห็น {shownCount}/{total} รายชื่อ</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => go(-1)} disabled={idx <= 0} aria-label="วันก่อนหน้า"
          className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e7c66a] bg-white text-[#b45309] text-[20px] leading-none flex items-center justify-center disabled:opacity-30 active:scale-95 transition">‹</button>
        <div className="flex-1 text-center">
          <div className="text-[15px] font-bold text-[#7a4e00] leading-tight">{thDate(value)}</div>
          <div className="text-[10px] text-[#a16207] mt-0.5">เสมือนว่านี่คือ "วันนี้" · เลื่อน ‹ › ดูข้ามวัน</div>
        </div>
        <button onClick={() => go(1)} disabled={idx >= dates.length - 1} aria-label="วันถัดไป"
          className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e7c66a] bg-white text-[#b45309] text-[20px] leading-none flex items-center justify-center disabled:opacity-30 active:scale-95 transition">›</button>
      </div>
      <div className="flex gap-1.5 mt-2.5">
        <button onClick={() => onChange(dates[0])}
          className="flex-1 py-1.5 rounded-lg border border-[#e7c66a] bg-white text-[11px] font-semibold text-[#92600a] active:scale-[0.98] transition">วันแรก</button>
        <button onClick={() => onChange(dates[dates.length - 1])}
          className="flex-1 py-1.5 rounded-lg border border-[#e7c66a] bg-white text-[11px] font-semibold text-[#92600a] active:scale-[0.98] transition">วันสุดท้าย (รวม 100K)</button>
      </div>
    </div>
  )
}

function MonthHeroCard({ w }: { w: PubWinner }) {
  const big = isBigPrize(w.tier)
  return (
    <div className="rounded-3xl overflow-hidden text-center text-white px-5 pt-6 pb-6" style={{ background: CARD_GRAD, boxShadow: '0 10px 30px rgba(8,70,31,0.28)' }}>
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full text-[30px]" style={{ background: GOLD, boxShadow: '0 4px 14px rgba(0,0,0,0.18)' }}>
        🏆
      </span>
      {big ? (
        /* รางวัลใหญ่ (100K/1M) — มีหลายคนต่อรอบ → ไม่โชว์ชื่อ/เบอร์ เน้นรางวัลประจำเดือน + ของรางวัล */
        <>
          <div className="mt-3">
            <span className="inline-block px-4 py-1.5 rounded-xl font-bold text-[13px]" style={{ background: 'rgba(255,224,138,0.18)', border: '1px solid rgba(255,224,138,0.5)', color: '#ffe08a' }}>รางวัลประจำวันที่ {thDate(w.announceISO)}</span>
          </div>
          <div className="mt-3.5">
            <span className="inline-flex items-center px-6 py-2 rounded-full font-extrabold text-[20px] text-[#5a3a00]" style={{ background: GOLD }}>{w.prizeLabel}</span>
          </div>
        </>
      ) : (
        /* รางวัลรายวัน (10K) — 1 คน/วัน → วันที่ → ชื่อ → เบอร์ → รางวัล */
        <>
          <div className="mt-3">
            <span className="inline-block px-4 py-1.5 rounded-xl font-bold text-[12.5px]" style={{ background: 'rgba(255,224,138,0.18)', border: '1px solid rgba(255,224,138,0.5)', color: '#ffe08a' }}>{w.announceLabel}</span>
          </div>
          <div className="text-[26px] font-extrabold leading-tight mt-2.5">{w.name || '(ผู้โชคดี)'}</div>
          <div className="text-[12px] text-white/80 mt-1 tracking-wide">{w.phoneMasked}</div>
          <div className="mt-3.5">
            <span className="inline-flex items-center px-5 py-1.5 rounded-full font-bold text-[15px] text-[#5a3a00]" style={{ background: GOLD }}>{w.prizeLabel}</span>
          </div>
        </>
      )}
    </div>
  )
}

// แถวรายวัน (ทอง 10K) — วันที่เป็นชิปทางซ้าย (เด่น มองง่าย) แล้วตามด้วยชื่อ/เบอร์/รางวัล
function WinnerRow({ w }: { w: PubWinner }) {
  const [, m, d] = w.announceISO.split('-').map(Number)
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-shrink-0 w-[42px] text-center rounded-lg bg-[#f0fdf4] border border-[#dcfce7] py-1">
        <div className="text-[16px] font-extrabold text-[#15803d] leading-none">{d}</div>
        <div className="text-[10px] text-[#16a34a] mt-0.5">{TH_ABBR[(m || 1) - 1]}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-[var(--dark)] truncate">{w.name || '(ผู้โชคดี)'}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{w.phoneMasked}</div>
      </div>
      <span className="flex-shrink-0 text-[11px] font-semibold text-[#b45309] bg-[#fef3c7] rounded-lg px-2.5 py-1 whitespace-nowrap">{w.prizeLabel}</span>
    </div>
  )
}

// แถวรางวัลใหญ่ (100K/1M) — โทนทอง เด่นกว่ารายวัน
function BigWinnerRow({ w }: { w: PubWinner }) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-[#fde68a] last:border-0">
      <div className="min-w-0">
        <div className="text-[14px] font-bold text-[#7a4e00] truncate">👑 {w.name || '(ผู้โชคดี)'}</div>
        <div className="text-[11px] text-[#a16207] mt-0.5 truncate">{w.phoneMasked}</div>
      </div>
      <span className="flex-shrink-0 text-[12px] font-extrabold text-[#5a3a00] rounded-lg px-3 py-1.5 whitespace-nowrap" style={{ background: GOLD }}>{w.prizeLabel}</span>
    </div>
  )
}

function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (now === null) return <div className="h-[68px]" />
  const diff = Math.max(0, target.getTime() - now)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  const cells: [number, string][] = [[d, 'วัน'], [h, 'ชั่วโมง'], [m, 'นาที'], [s, 'วินาที']]
  return (
    <div className="flex gap-2">
      {cells.map(([v, label], i) => (
        <div key={i} className="flex-1 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] py-2.5 text-center">
          <div className="text-[24px] font-bold text-[#15803d] tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
          <div className="text-[10px] text-[#16a34a] mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
