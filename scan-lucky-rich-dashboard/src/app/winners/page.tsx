'use client'

import { useEffect, useState } from 'react'
import MobileShell from '@/components/public/MobileShell'
import { DRAW_ROUNDS, winnerAnnounceISO } from '@/config/draw-rounds'

// วันเวลาประกาศผลรอบแรก (ผู้โชคดีรายวันใบแรก) = 1 ก.ค. 2569 15:00 น. (เวลาไทย)
const FIRST_ANNOUNCE = new Date(`${winnerAnnounceISO(DRAW_ROUNDS[0].round, '10K', 1)}T15:00:00+07:00`)

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

// เดือนออกรางวัลของแคมเปญ (ก.ค.–ธ.ค. 2569) — สร้างจาก config รอบจับรางวัล
interface PrizeMonth { iso: string; name: string; short: string; label: string }
const PRIZE_MONTHS: PrizeMonth[] = (() => {
  const seen = new Set<string>()
  const out: PrizeMonth[] = []
  for (const r of DRAW_ROUNDS) {
    if (seen.has(r.prizeMonthISO)) continue
    seen.add(r.prizeMonthISO)
    const year = r.prizeMonthShort.split(' ')[1] ?? '' // 'ก.ค. 2569' → '2569'
    out.push({ iso: r.prizeMonthISO, name: r.prizeMonthName, short: r.prizeMonthShort.split(' ')[0], label: `${r.prizeMonthName} ${year}` })
  }
  return out.sort((a, b) => (a.iso < b.iso ? -1 : 1))
})()

const isBigPrize = (tier: string) => tier === '100K' || tier === '1M'
const monthOf = (iso: string) => iso.slice(0, 7)

export default function WinnersPage() {
  const [data, setData] = useState<PubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

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

  const winners = data?.winners ?? []
  const hasAny = winners.length > 0

  // เดือนเริ่มต้น = เดือนล่าสุดที่มีผลประกาศ
  const latestMonth = hasAny ? winners.map((w) => monthOf(w.announceISO)).sort().slice(-1)[0] : null
  const activeMonth = selectedMonth ?? latestMonth ?? PRIZE_MONTHS[0].iso
  const activeLabel = PRIZE_MONTHS.find((m) => m.iso === activeMonth)?.label ?? ''

  const monthWinners = winners
    .filter((w) => monthOf(w.announceISO) === activeMonth)
    .sort((a, b) => (a.announceISO < b.announceISO ? 1 : a.announceISO > b.announceISO ? -1 : 0)) // เรียงวันที่ ใหม่ → เก่า
  const latest = monthWinners[0]
  const visible = expanded ? monthWinners : monthWinners.slice(0, 5)

  function pickMonth(iso: string) {
    setSelectedMonth(iso)
    setExpanded(false)
  }

  return (
    <MobileShell icon="🏆" badge={<LiveBadge />}>
      {/* page title */}
      <div className="text-center mb-4 mt-1">
        <h1 className="text-[24px] font-extrabold text-[#14532d] leading-tight">ประกาศผลผู้โชคดี</h1>
        {hasAny ? (
          <p className="text-[12.5px] font-semibold text-[#16a34a] mt-1">ประจำเดือน{activeLabel}</p>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)] mt-1">🟢 อัปเดตทุกวัน 15:00 น.</p>
        )}
      </div>

      {data?.preview && (
        <div className="mb-3 text-[12px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2 text-center">
          🔧 โหมดพรีวิว (แอดมิน) — แสดงทุกเดือนรวมที่ยังไม่ถึงกำหนดประกาศ · ลูกค้าจะไม่เห็นรายการอนาคต
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-8 text-center text-[var(--text-secondary)]">⏳ กำลังโหลด…</div>
      ) : err ? (
        <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 text-center text-[#b91c1c]">โหลดไม่สำเร็จ: {err}</div>
      ) : !hasAny ? (
        /* ── ก่อนเริ่มประกาศ: countdown ── */
        <div className="float-up pb-24">
          <div className="rounded-2xl p-5 border mb-4 shadow-sm text-center" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderColor: '#f5d58a' }}>
            <div className="text-[14px] text-[#a16207] leading-relaxed">ยังไม่เริ่มประกาศผล<br />ติดตามผลได้ทุกวัน <b>15:00 น.</b> 🕒</div>
          </div>
          <div className="rounded-2xl p-4 border mb-4 bg-white shadow-sm">
            <div className="text-[12.5px] font-bold text-[#15803d] flex items-center gap-1.5">⏳ เริ่มประกาศผลในอีก</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 mb-3">รอบแรก 1 ก.ค. 2569 · เวลา 15:00 น.</div>
            <Countdown target={FIRST_ANNOUNCE} />
          </div>
          <p className="text-center text-[11px] text-[var(--text-muted)] mt-6 leading-relaxed">
            ประกาศผลทุกวัน 15:00 น. ทาง ไทยรัฐออนไลน์ และ LINE OA<br />Jula&apos;s Herb × ไทยรัฐ
          </p>
        </div>
      ) : (
        /* ── มีผลแล้ว: เลือกเดือน + ผู้โชคดีล่าสุด + ลิสต์ ── */
        <div className="float-up pb-24">
          <MonthSwitcher months={PRIZE_MONTHS} active={activeMonth} onPick={pickMonth} />

          {latest ? (
            <MonthHeroCard w={latest} />
          ) : (
            <div className="rounded-2xl p-6 border shadow-sm text-center" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderColor: '#f5d58a' }}>
              <div className="text-[13.5px] text-[#a16207] leading-relaxed">เดือน{activeLabel}<br />ยังไม่มีการประกาศผล 🕒</div>
            </div>
          )}

          {monthWinners.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-5 mb-2 px-1">
                <span className="text-[12px] font-bold text-[#b45309]">📋 ผลรางวัลทั้งเดือน</span>
                <span className="text-[11px] text-[var(--text-muted)]">{monthWinners.length} รายการ</span>
              </div>
              <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-[var(--border-soft)] overflow-hidden">
                {visible.map((w, i) => (
                  <WinnerRow key={i} w={w} />
                ))}
              </div>
              {monthWinners.length > 5 && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="w-full mt-2 py-2.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-[12.5px] font-semibold active:scale-[0.99] transition"
                >
                  {expanded ? 'ย่อรายการ ▲' : `ดูทั้งหมด ${monthWinners.length} รายการ ▼`}
                </button>
              )}
            </>
          )}

          <p className="text-center text-[11px] text-[var(--text-muted)] mt-6 leading-relaxed">
            ประกาศผลทุกวัน 15:00 น. ทาง ไทยรัฐออนไลน์ และ LINE OA<br />Jula&apos;s Herb × ไทยรัฐ
          </p>
        </div>
      )}

      {/* ── ปุ่มลอย: ตรวจสอบสิทธิ์ของฉัน ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <a
          href="/claim"
          className="pointer-events-auto flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-white font-bold text-[15px] active:scale-[0.98] transition shadow-[0_6px_20px_rgba(22,163,74,0.4)]"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
        >
          🔍 ตรวจสอบสิทธิ์ของฉัน
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
      <button aria-label="เดือนก่อนหน้า" onClick={() => go(-1)} className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--border)] bg-white text-[#15803d] text-[18px] leading-none flex items-center justify-center active:scale-95 transition">‹</button>
      <div className="flex gap-1.5 overflow-x-auto flex-1 py-0.5" style={{ scrollbarWidth: 'none' }}>
        {months.map((m) => {
          const on = m.iso === active
          return (
            <button
              key={m.iso}
              onClick={() => onPick(m.iso)}
              aria-pressed={on}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${on ? 'text-white' : 'text-[#15803d] bg-[#f0fdf4]'}`}
              style={on ? { background: 'linear-gradient(135deg,#16a34a,#15803d)' } : undefined}
            >
              {m.short}
            </button>
          )
        })}
      </div>
      <button aria-label="เดือนถัดไป" onClick={() => go(1)} className="flex-shrink-0 w-8 h-8 rounded-full border border-[var(--border)] bg-white text-[#15803d] text-[18px] leading-none flex items-center justify-center active:scale-95 transition">›</button>
    </div>
  )
}

function MonthHeroCard({ w }: { w: PubWinner }) {
  return (
    <div className="relative rounded-2xl p-5 pt-6 text-center text-white shadow-[0_6px_20px_rgba(21,128,61,0.28)]"
      style={{ background: 'linear-gradient(150deg,#16a34a 0%,#15803d 55%,#166534 100%)' }}>
      <span className="absolute top-3 right-3 text-[10.5px] font-bold text-white bg-white/20 rounded-full px-2.5 py-1">{w.announceLabel}</span>
      <span className="inline-flex items-center justify-center w-14 h-14 rounded-full text-[26px] mb-2 bg-white/15">🎉</span>
      <div className="text-[11px] text-white/75 tracking-wide">🏆 ผู้โชคดีล่าสุด</div>
      <div className="text-[28px] font-extrabold leading-tight mt-1">{w.name || '(ผู้โชคดี)'}</div>
      <div className="text-[13px] text-white/80 mt-1 tracking-wide">{w.phoneMasked}</div>
      <div className="mt-3 rounded-xl px-3 py-2.5 bg-black/15 flex items-center justify-center gap-2">
        <span className="text-[11px] text-white/70">รางวัล</span>
        <span className="text-[16px] font-bold">🏅 {w.prizeLabel}</span>
      </div>
    </div>
  )
}

function WinnerRow({ w }: { w: PubWinner }) {
  const big = isBigPrize(w.tier)
  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3" style={big ? { background: '#fffbeb' } : undefined}>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-[#14532d] truncate">{big ? '👑 ' : ''}{w.name || '(ผู้โชคดี)'}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{w.announceLabel} · {w.phoneMasked}</div>
      </div>
      <span className="flex-shrink-0 text-[11px] font-bold text-[#b45309] bg-[#fef3c7] rounded-lg px-2.5 py-1 whitespace-nowrap">{w.prizeLabel}</span>
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
  if (now === null) return <div className="h-[68px]" /> // กัน hydration mismatch (เลขมาหลัง mount)
  const diff = Math.max(0, target.getTime() - now)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  const cells: [number, string][] = [[d, 'วัน'], [h, 'ชั่วโมง'], [m, 'นาที'], [s, 'วินาที']]
  return (
    <div className="flex gap-2">
      {cells.map(([v, label], i) => (
        <div key={i} className="flex-1 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] py-2.5 text-center">
          <div className="text-[24px] font-extrabold text-[#15803d] tabular-nums leading-none">{String(v).padStart(2, '0')}</div>
          <div className="text-[10px] text-[#16a34a] mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
