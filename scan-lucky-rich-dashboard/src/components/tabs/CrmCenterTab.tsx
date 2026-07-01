'use client'
/**
 * ❤️ CRM Center — แผนดูแลลูกค้าเชิงรุก 3 OBJ จาก data จริง (live)
 * 1. Acquisition  2. Engagement/Level-up  3. Retention + Referral
 * ดึง data ที่มีอยู่มา size โอกาส + แนะนำ play (ไม่ยิง action จริง — ทีม CRM กดใน saversure)
 */
import TabHeader from '@/components/ui/TabHeader'
import { numFmt, getCampaignToday, CAMPAIGN_START } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import type { ScansTotalsResponse, EngagementResponse, MembersDailyResponse, ProvincesResponse, SegmentsResponse } from '@/lib/api/types'

const TONE = {
  green: { c: '#15803d', bg: '#eaf5ee', soft: '#f0faf3' },
  blue: { c: '#1d4ed8', bg: '#eef2ff', soft: '#f5f8ff' },
  amber: { c: '#b45309', bg: '#fef6e7', soft: '#fffbf0' },
}

export default function CrmCenterTab() {
  const to = getCampaignToday().toISOString().slice(0, 10)
  const rangeQ = `from=${CAMPAIGN_START}&to=${to}`
  const totals = useApi<ScansTotalsResponse>(`/api/scans/totals?${rangeQ}`)
  const engagement = useApi<EngagementResponse>(`/api/customers/engagement?${rangeQ}`)
  const members = useApi<MembersDailyResponse>(`/api/members/daily?${rangeQ}`)
  const provinces = useApi<ProvincesResponse>(`/api/customers/provinces?date=${to}&limit=10`)
  const segments = useApi<SegmentsResponse>(`/api/customers/segments`)

  // ── derived (live) ──
  const distinct = totals.data?.distinctUsers ?? totals.data?.uniqueUsers ?? 0
  const bk = engagement.data?.buckets ?? []
  const oneTime = bk[0]?.users ?? 0
  const repeat2to5 = bk[1]?.users ?? 0
  const heavy = (bk[2]?.users ?? 0) + (bk[3]?.users ?? 0)
  const engTotal = engagement.data?.totalUsers ?? 0
  const repeatPct = engTotal > 0 ? Math.round(((repeat2to5 + heavy) / engTotal) * 100) : 0
  const avgScan = engagement.data?.avgScansPerUser ?? 0
  const newTotal = members.data?.totals.memberNew ?? 0
  const newPerDay = members.data?.totals.avgNewPerDay ?? 0
  const seg = (n: string) => segments.data?.segments.find(s => s.name.toLowerCase().includes(n))?.count ?? 0
  const loyal = seg('loyal')
  const champions = seg('champion')
  const topProv = provinces.data?.provinces?.[0]
  const bkkShare = topProv && distinct ? Math.round((topProv.users / distinct) * 100) : 0

  const loading = totals.loading || engagement.loading

  return (
    <div className="space-y-4 pt-4 pb-10">
      <TabHeader icon="❤️" title="CRM Center" subtitle="แผนดูแลลูกค้าเชิงรุก — ดึง data จริงมา size โอกาส + แนะนำ action (LINE OA / saversure)" />

      <div className="card p-3 text-[11.5px] flex items-start gap-2" style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
        <span>⚠️</span>
        <span>
          <b>Scope note:</b> ลูกค้าทั้งหมด/สมาชิก/จังหวัดมาจากแคมเปญจริง แต่ <b>engagement</b> และ <b>segments</b> ยังเป็น snapshot ทั้งระบบ saversure — ใช้เป็นแนวทาง CRM ชั่วคราวจนกว่า backend เปิด campaign-scoped endpoint
        </span>
      </div>

      {/* ── HERO strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Hero label="ลูกค้าทั้งหมด" value={numFmt(distinct)} sub="distinct" tone="green" />
        <Hero label="กลับมาซ้ำ (Repeat)" value={`${repeatPct}%`} sub={`เฉลี่ย ${avgScan} สแกน/คน`} tone="blue" />
        <Hero label="Loyal Scanners" value={numFmt(loyal)} sub="segment" tone="amber" />
        <Hero label="Champions" value={numFmt(champions)} sub="segment ดีสุด" tone="amber" />
        <Hero label="สมัครใหม่" value={`${numFmt(newPerDay)}/วัน`} sub={`รวม ${numFmt(newTotal)}`} tone="green" />
      </div>

      {loading && <div className="text-center py-8 text-[var(--text-muted)] text-[13px]">⏳ กำลังโหลด data ลูกค้า...</div>}

      {/* ════ OBJ 1 — ACQUISITION ════ */}
      <Zone n={1} tone="green" title="หาลูกค้าใหม่ (Acquisition)"
        tagline="ดึงคนใหม่เข้ามารู้จัก + เปลี่ยนคนที่ลองครั้งเดียวให้อยู่ต่อ"
        opportunity={`โอกาสจาก data: มี ${numFmt(oneTime)} คนที่สแกนครั้งเดียวแล้วหาย (35%) = กลุ่ม activation · ฐาน ${numFmt(distinct)} คนพร้อมชวนเพื่อน`}>
        <Play tone="green" title="First-scan Activation" target={`${numFmt(oneTime)} คน (สแกนครั้งเดียว)`}
          action="LINE welcome series ทันทีหลังสแกนแรก → ดึงให้สแกนครั้งที่ 2 ภายใน 3-5 วัน" channel="LINE OA"
          impact="ลด leak ปากกรวย · เปลี่ยน 'ลอง' เป็น 'ลูกค้าจริง'" />
        <Play tone="green" title="Member-get-Member" target={`ฐาน ${numFmt(distinct)} คน`}
          action="ชวนเพื่อนสแกน รับสิทธิ์เพิ่มทั้งคู่ + viral share link" channel="LINE share"
          impact="acquisition ต้นทุนต่ำ + เชื่อม OBJ3 (บอกต่อ)" />
        <Play tone="green" title="Geographic Expansion" target={`กทม. กระจุก ~${bkkShare}% · จังหวัดอื่น penetration ต่ำ`}
          action="POSM + geo-targeted ads + KOL ท้องถิ่น ในจังหวัดที่ขายแต่สแกนน้อย" channel="Offline + Ads"
          impact="ขยายฐานนอก กทม." />
        <KpiRow items={['สมาชิกใหม่/วัน', 'activation rate (สแกน1→2)', 'referral acquisition %', 'coverage จังหวัด']} tone="green" />
      </Zone>

      {/* ════ OBJ 2 — ENGAGEMENT ════ */}
      <Zone n={2} tone="blue" title="กระตุ้น + อัพเลเวลลูกค้า (Engagement)"
        tagline="ดันให้สแกนถี่ขึ้น ซื้อหลากหลายขึ้น เลื่อนระดับลูกค้าให้สูงขึ้น"
        opportunity={`โอกาสจาก data: ${numFmt(repeat2to5)} คนอยู่กลุ่ม 'สแกน 2-5 ครั้ง' (พร้อมดันขึ้น heavy) · ปัจจุบัน heavy แค่ ${numFmt(heavy)} คน · avg ${avgScan} สแกน/คน`}>
        <Play tone="blue" title="Tier / Level-up Gamification" target={`${numFmt(repeat2to5)} คน (กลุ่ม 2-5)`}
          action="ระบบ tier Bronze/Silver/Gold ตามจำนวนสแกน → ปลดล็อกสิทธิ์ x2 / draw พิเศษ" channel="App + LINE"
          impact={`ดัน avg ${avgScan} → 6+ สแกน/คน`} />
        <Play tone="blue" title="Cross-category Quest" target="ลูกค้าซื้อแคบ (Boss SKU 24.5%)"
          action="'สแกนครบ 3 หมวด (ครีม+กันแดด+เซรั่ม) รับสิทธิ์โบนัส' → แนะนำสินค้าใหม่" channel="LINE trigger"
          impact="เพิ่ม basket + ทดลองสินค้าตัวอื่น" />
        <Play tone="blue" title="2nd-scan Auto-nudge" target={`${numFmt(oneTime)} คน (เงียบหลังสแกนแรก)`}
          action="crm/triggers ส่ง LINE อัตโนมัติเตือนกลับมาสแกน (habit loop)" channel="LINE trigger"
          impact="สร้างนิสัยสแกนต่อเนื่อง" />
        <KpiRow items={['avg สแกน/คน', '% เลื่อน bucket ขึ้น', 'cross-category rate', 'tier distribution']} tone="blue" />
      </Zone>

      {/* ════ OBJ 3 — RETENTION + REFERRAL ════ */}
      <Zone n={3} tone="amber" title="รักษา + บอกต่อ (Retention & Referral)"
        tagline="รักษาลูกค้าให้อยู่ครบ 7 เดือน + เปลี่ยนคนพอใจเป็นกระบอกเสียง"
        opportunity={`โอกาสจาก data: Loyal ${numFmt(loyal)} + Champions ${numFmt(champions)} = แกนหลักที่ต้องรักษา · repeat ${repeatPct}% (ฐานพอใจพร้อมบอกต่อ) · ${numFmt(oneTime)} คนเสี่ยงหลุด (สแกนครั้งเดียว)`}>
        <Play tone="amber" title="VIP Retention" target={`Loyal ${numFmt(loyal)} + Champions ${numFmt(champions)}`}
          action="สิทธิพิเศษ: ประกาศผลก่อน · draw เฉพาะสมาชิก · badge เกียรติยศ" channel="LINE OA"
          impact="คงกลุ่มแกนให้ active ถึง 18 ธ.ค." />
        <Play tone="amber" title="Win-back (Churn)" target={`${numFmt(oneTime)} คน + At-Risk`}
          action="LINE broadcast: 'รางวัลเหลือ X ใบ! กลับมาลุ้นต่อ' + โบนัสสิทธิ์" channel="LINE broadcast"
          impact="reactivate กลุ่มที่กำลังหลุด" />
        <Play tone="amber" title="Referral Loop + UGC" target={`repeat ${repeatPct}% (คนพอใจ)`}
          action="referrer+เพื่อนได้สิทธิ์ · 'รีวิว+แชร์ รับโบนัส' เปลี่ยนลูกค้าเป็นกระบอกเสียง" channel="LINE + Social"
          impact="บอกต่อ + social proof → วนกลับ acquisition" />
        <KpiRow items={['churn rate', 'repeat rate', 'referral rate', 'reactivation rate']} tone="amber" />
      </Zone>

      {/* ── Loop footer ── */}
      <div className="card p-4 flex items-center gap-3 text-[12.5px]" style={{ background: 'var(--brand-50, #f0faf3)', borderLeft: '4px solid #15803d' }}>
        <span className="text-[22px]">🔄</span>
        <div>
          <b className="text-[var(--dark)]">วงจรโต:</b> สแกนแรก (1️⃣ Acquisition) → อัพเลเวล/ซื้อเพิ่ม (2️⃣ Engagement) → พอใจ→บอกต่อ (3️⃣ Referral) → เพื่อนเข้ามาเป็นลูกค้าใหม่ (กลับ 1️⃣)
          <span className="text-[var(--text-muted)]"> — referral คือสะพานเชื่อม retention กลับไป acquisition</span>
        </div>
      </div>

      <div className="text-[10.5px] text-[var(--text-muted)] flex items-start gap-1.5 px-1">
        <span>ℹ️</span>
        <span>ตัวเลขดึงจาก saversureV2 ผ่าน dashboard API · tab นี้เป็น <b>แผน + ตัวเลข targeting</b> — ⚠️ engagement/segments ยังเป็นทั้งระบบ ไม่ใช่เฉพาะแคมเปญ · การยิง LINE broadcast/trigger จริงทำในระบบ saversure (ทีม CRM) · ยังไม่มี sales → คำนวณ LTV/ROI ไม่ได้</span>
      </div>
    </div>
  )
}

// ────────────────────────────────────────
function Hero({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: keyof typeof TONE }) {
  const t = TONE[tone]
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: t.soft, border: `1px solid ${t.c}22` }}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1">{label}</div>
      <div className="text-[24px] font-extrabold num leading-none" style={{ color: t.c }}>{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-1">{sub}</div>
    </div>
  )
}

function Zone({ n, tone, title, tagline, opportunity, children }: {
  n: number; tone: keyof typeof TONE; title: string; tagline: string; opportunity: string; children: React.ReactNode
}) {
  const t = TONE[tone]
  return (
    <div className="card p-0 overflow-hidden" style={{ border: `1px solid ${t.c}22` }}>
      <div className="px-4 py-3" style={{ background: t.bg }}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-extrabold text-[14px]" style={{ background: t.c }}>{n}</span>
          <h3 className="text-[16px] font-extrabold" style={{ color: t.c }}>{title}</h3>
        </div>
        <p className="text-[12px] text-[var(--text-secondary)] mt-1 ml-9">{tagline}</p>
        <p className="text-[11.5px] mt-1.5 ml-9 px-2 py-1 rounded inline-block" style={{ background: '#fff', color: 'var(--dark)' }}>📊 {opportunity}</p>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

function Play({ tone, title, target, action, channel, impact }: {
  tone: keyof typeof TONE; title: string; target: string; action: string; channel: string; impact: string
}) {
  const t = TONE[tone]
  return (
    <div className="rounded-lg p-3 grid grid-cols-1 md:grid-cols-[1.4fr_2.2fr_1.4fr] gap-3 items-start" style={{ background: t.soft, border: `1px solid ${t.c}18` }}>
      <div>
        <div className="text-[13px] font-bold text-[var(--dark)]">{title}</div>
        <div className="text-[11px] mt-1 px-1.5 py-0.5 rounded inline-block font-semibold" style={{ background: t.c + '18', color: t.c }}>🎯 {target}</div>
      </div>
      <div className="text-[12px] text-[var(--text)]">
        {action}
        <span className="ml-1.5 text-[9.5px] px-1.5 py-0.5 rounded-full font-bold align-middle" style={{ background: t.c, color: '#fff' }}>{channel}</span>
      </div>
      <div className="text-[11.5px] text-[var(--text-secondary)]"><b style={{ color: t.c }}>ผลคาดหวัง:</b> {impact}</div>
    </div>
  )
}

function KpiRow({ items, tone }: { items: string[]; tone: keyof typeof TONE }) {
  const t = TONE[tone]
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <span className="text-[10.5px] font-bold text-[var(--text-secondary)] uppercase tracking-wider self-center">KPI:</span>
      {items.map((k) => (
        <span key={k} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.c, border: `1px solid ${t.c}30` }}>{k}</span>
      ))}
    </div>
  )
}
