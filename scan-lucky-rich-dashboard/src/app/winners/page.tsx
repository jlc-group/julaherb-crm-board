'use client'

import { useEffect, useState } from 'react'

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

function tierBadge(tier: string): { label: string; cls: string } {
  if (tier === '1M') return { label: 'รางวัลใหญ่ที่สุด', cls: 'bg-[#fde68a] text-[#92400e]' }
  if (tier === '100K') return { label: 'รางวัลประจำเดือน', cls: 'bg-[#fef3c7] text-[#b45309]' }
  return { label: 'รางวัลประจำวัน', cls: 'bg-[#dcfce7] text-[#15803d]' }
}

export default function WinnersPage() {
  const [data, setData] = useState<PubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

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
  const today = data?.todayISO ?? ''
  const todayWinners = winners.filter((w) => w.announceISO === today)
  const pastWinners = winners.filter((w) => w.announceISO < today)
  const futureWinners = winners.filter((w) => w.announceISO > today) // โผล่เฉพาะโหมดพรีวิว

  return (
    <main
      className="min-h-screen px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center"
      style={{ background: 'linear-gradient(180deg,#f0fdf4 0%,#ffffff 45%,#f7fee7 100%)' }}
    >
      <div className="w-full max-w-lg">
        {/* header */}
        <div className="text-center mb-5">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg,#fef9c3,#fde68a)', boxShadow: '0 6px 18px rgba(217,119,6,0.18)' }}
          >
            <span className="text-[30px]">🏆</span>
          </div>
          <div className="text-[11px] font-bold tracking-wide text-[#15803d] uppercase">สแกนลุ้นรวย สวยลุ้นล้าน</div>
          <div className="text-[10.5px] text-[var(--text-muted)] mb-1">Jula&apos;s Herb × ไทยรัฐ</div>
          <h1 className="text-[22px] font-extrabold text-[#14532d]">ประกาศผลผู้โชคดี</h1>
        </div>

        {data?.preview && (
          <div className="mb-3 text-[12px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-xl px-3 py-2 text-center">
            🔧 โหมดพรีวิว (แอดมิน) — แสดงทุกวันรวมที่ยังไม่ถึงกำหนดประกาศ · ลูกค้าจะไม่เห็นรายการอนาคต
          </div>
        )}

        {loading ? (
          <div className="card p-8 text-center text-[var(--text-secondary)]">⏳ กำลังโหลด…</div>
        ) : err ? (
          <div className="card p-6 text-center text-[#b91c1c]">โหลดไม่สำเร็จ: {err}</div>
        ) : (
          <>
            {/* ไฮไลต์ ผู้โชคดีวันนี้ */}
            <div className="rounded-2xl p-5 border mb-4" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', borderColor: '#f5d58a' }}>
              <div className="text-[12px] font-bold text-[#b45309] flex items-center gap-1.5">🎉 ผู้โชคดีวันนี้</div>
              {todayWinners.length === 0 ? (
                <div className="text-[14px] text-[#a16207] mt-2 leading-relaxed">
                  วันนี้ยังไม่มีการประกาศ — ติดตามผลได้ทุกวัน <b>15:00 น.</b> 🕒
                </div>
              ) : (
                <div className="mt-2.5 space-y-2">
                  {todayWinners.map((w, i) => (
                    <div key={i} className="bg-white/70 rounded-xl px-3 py-2.5 border border-[#fbe3a8]">
                      <div className="text-[11px] text-[#a16207] font-semibold">{w.announceLabel}</div>
                      <div className="text-[18px] font-extrabold text-[#14532d] mt-0.5">{w.name || '(ผู้โชคดี)'}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12px] text-[var(--text-secondary)]">{w.phoneMasked}</span>
                        <span className="text-[13px] font-bold text-[#b45309]">🏆 {w.prizeLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* พรีวิว: รายการที่ยังไม่ถึงกำหนด */}
            {data?.preview && futureWinners.length > 0 && (
              <Section title={`🔒 ยังไม่ถึงกำหนดประกาศ (เห็นเฉพาะพรีวิว · ${futureWinners.length})`} rows={futureWinners} muted />
            )}

            {/* ผลย้อนหลัง */}
            {pastWinners.length > 0 ? (
              <Section title={`📋 ผลย้อนหลัง (${pastWinners.length})`} rows={pastWinners} />
            ) : todayWinners.length === 0 && !data?.preview ? (
              <div className="card p-6 text-center text-[var(--text-secondary)] text-[13px] leading-relaxed">
                ยังไม่เริ่มประกาศผล — ผู้โชคดีประจำวันรอบแรก <b className="text-[#15803d]">1 ก.ค. 2569</b>
                <br />
                ติดตามรายชื่อผู้โชคดีได้ที่หน้านี้ทุกวัน
              </div>
            ) : null}
          </>
        )}

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
          ประกาศผลทุกวัน 15:00 น. ทาง ไทยรัฐออนไลน์ และ LINE OA · Jula&apos;s Herb × ไทยรัฐ
        </p>
      </div>
    </main>
  )
}

function Section({ title, rows, muted }: { title: string; rows: PubWinner[]; muted?: boolean }) {
  return (
    <div className="mb-4">
      <div className="text-[12px] font-bold text-[var(--text-secondary)] mb-2 px-1">{title}</div>
      <div className={`card divide-y ${muted ? 'opacity-70' : ''}`}>
        {rows.map((w, i) => {
          const b = tierBadge(w.tier)
          return (
            <div key={i} className="px-3.5 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11.5px] text-[var(--text-secondary)]">{w.announceLabel}</div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${b.cls}`}>{b.label}</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <div className="font-bold text-[15px] text-[var(--dark)] truncate">{w.name || '(ผู้โชคดี)'}</div>
                <span className="text-[13px] font-bold text-[#b45309] flex-shrink-0">🏆 {w.prizeLabel}</span>
              </div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">{w.phoneMasked}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
