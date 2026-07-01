'use client'
/**
 * 📑 ReportTab — เด็คนำเสนอแบบ carousel (16:9 แนวนอน · กดซ้าย-ขวา)
 * รวมเนื้อหา 2 เด็ค: Campaign Report + CRM Strategy จาก dashboard API
 * หมายเหตุ: CRM engagement/segments ยังเป็น scope ทั้งระบบจนกว่า backend เปิด campaign-scoped endpoint
 * โหลดได้: PDF (browser print) + PPTX (pptxgenjs)
 */
import { useState, useEffect } from 'react'
import TrendLineChart from '@/components/ui/TrendLineChart'
import { CAMPAIGN, PRIZES } from '@/config/campaign'
import { numFmt, getCampaignToday, CAMPAIGN_START } from '@/lib/utils'
import { useApi } from '@/lib/hooks/useApi'
import { buildSkuTable } from '@/lib/sku-redemption'
import { buildReportPptx } from '@/lib/report-pptx'
import type {
  ScansTotalsResponse, DailyRow, MembersDailyResponse, EngagementResponse,
  ProvincesResponse, HeavyUsersResponse, UptimeResponse, SegmentsResponse,
} from '@/lib/api/types'

const GREEN = '#14532d', GREEN_MID = '#166534', BLUE = '#1d4ed8', AMBER = '#b45309'

export default function ReportTab() {
  const to = getCampaignToday().toISOString().slice(0, 10)
  const from = CAMPAIGN_START
  const rangeQ = `from=${from}&to=${to}`

  const totals = useApi<ScansTotalsResponse>(`/api/scans/totals?${rangeQ}`)
  const daily = useApi<DailyRow[]>(`/api/daily?${rangeQ}`)
  const members = useApi<MembersDailyResponse>(`/api/members/daily?${rangeQ}`)
  const engagement = useApi<EngagementResponse>(`/api/customers/engagement?${rangeQ}`)
  const provinces = useApi<ProvincesResponse>(`/api/customers/provinces?date=${to}&limit=10`)
  const heavy = useApi<HeavyUsersResponse>(`/api/customers/heavy-users?date=${to}&limit=10`)
  const uptime = useApi<UptimeResponse>(`/api/system/uptime?${rangeQ}`)
  const segments = useApi<SegmentsResponse>(`/api/customers/segments`)
  const skuRows = buildSkuTable('all').filter((r) => r.rightsRedeemed > 0).sort((a, b) => b.rightsRedeemed - a.rightsRedeemed)

  const [pptxBusy, setPptxBusy] = useState(false)
  const [idx, setIdx] = useState(0)

  const loading = totals.loading || daily.loading
  const dayCount = daily.data?.length ?? 0
  const t = totals.data
  const peakDay = (daily.data ?? []).reduce<DailyRow | null>((m, d) => (!m || d.success > m.success ? d : m), null)
  const outageDays = (daily.data ?? []).filter((d) => d.outage)
  const velo20 = (heavy.data?.users ?? []).filter((u) => u.scans >= 20).length
  const velo30 = (heavy.data?.users ?? []).filter((u) => u.scans >= 30).length
  const velo50 = (heavy.data?.users ?? []).filter((u) => u.scans >= 50).length

  // CRM derived
  const distinct = t?.distinctUsers ?? t?.uniqueUsers ?? 0
  const bk = engagement.data?.buckets ?? []
  const oneTime = bk[0]?.users ?? 0
  const repeat25 = bk[1]?.users ?? 0
  const heavyU = (bk[2]?.users ?? 0) + (bk[3]?.users ?? 0)
  const engTot = engagement.data?.totalUsers ?? 0
  const repeatPct = engTot > 0 ? Math.round(((repeat25 + heavyU) / engTot) * 100) : 0
  const avgScan = engagement.data?.avgScansPerUser ?? 0
  const segCount = (n: string) => segments.data?.segments.find(s => s.name.toLowerCase().includes(n))?.count ?? 0
  const loyal = segCount('loyal'), champions = segCount('champion')

  const fmtTHDate = (iso: string) => {
    const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const p = iso.split('-'); return `${parseInt(p[2])} ${TH[parseInt(p[1]) - 1]} ${parseInt(p[0]) + 543}`
  }

  async function downloadPptx() {
    setPptxBusy(true)
    try {
      await buildReportPptx({
        generatedAt: fmtTHDate(to), from, to,
        totals: t ?? null, daily: daily.data ?? [], members: members.data ?? null,
        engagement: engagement.data ?? null, provinces: provinces.data?.provinces ?? [],
        heavy: heavy.data?.users ?? [], uptime: uptime.data ?? null,
        sku: skuRows.slice(0, 10).map((r) => ({ name: r.displayName, rights: r.rightsRedeemed, users: r.users, share: r.sharePct })),
        velocity: { v20: velo20, v30: velo30, v50: velo50 },
        peakDay: peakDay ? { date: fmtTHDate(peakDay.date), scans: peakDay.success } : null,
      })
    } finally { setPptxBusy(false) }
  }

  // ── slide descriptors (รวม Campaign + CRM) ──
  const defs: SlideDef[] = [
    // ===== CAMPAIGN REPORT =====
    { cover: true, body: (
      <div className="flex flex-col items-center justify-center h-full text-center text-white" style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_MID} 100%)` }}>
        <div className="text-[13px] uppercase tracking-[0.3em] opacity-70 mb-4">Campaign Report</div>
        <div className="text-[44px] font-extrabold leading-tight mb-2">สแกนลุ้นรวย<br />สวยลุ้นล้าน</div>
        <div className="text-[16px] opacity-80 mb-6">{CAMPAIGN.partner}</div>
        <div className="text-[13px] opacity-70">รายงานสรุปผล · ข้อมูล 16 พ.ค. – {fmtTHDate(to)}</div>
      </div>) },
    { tag: 'REPORT', title: 'สรุปผู้บริหาร', subtitle: 'Executive Summary', body: (
      <div className="grid grid-cols-5 gap-3 h-full items-center px-2">
        <BigKpi label="สแกนสำเร็จ" value={numFmt(t?.success ?? 0)} sub={`success ${(t?.successRate ?? 0).toFixed(1)}%`} />
        <BigKpi label="ผู้เข้าร่วม" value={numFmt(distinct)} sub="distinct" />
        <BigKpi label="สิทธิ์ตามสเปก" value={numFmt(t?.expectedTickets ?? 0)} sub={`DB ${numFmt(t?.tickets ?? 0)}`} gold />
        <BigKpi label="การสแกนทั้งหมด" value={numFmt(t?.totalAttempts ?? 0)} sub="รวมซ้ำ/ไม่พบ" />
        <BigKpi label="ระยะเวลา" value={`${dayCount} วัน`} sub="ดำเนินการแล้ว" />
      </div>) },
    { tag: 'REPORT', title: 'ภาพรวมแคมเปญ', subtitle: 'Campaign Overview', body: (
      <div className="grid grid-cols-2 gap-6 h-full items-center px-4">
        <div className="space-y-3">
          <OvRow icon="ti-calendar" label="ระยะเวลา" value="16 พ.ค. – 18 ธ.ค. 2569 (7 เดือน)" />
          <OvRow icon="ti-package" label="สินค้าร่วมรายการ" value="97 SKU (ซอง / หลอด / เซ็ต)" />
          <OvRow icon="ti-businessplan" label="ช่องทาง" value="7-Eleven · Watson · Shopee · Lazada · TikTok · ตัวแทน" />
          <OvRow icon="ti-speakerphone" label="ประกาศผล" value={`${CAMPAIGN.announceChannel} เวลา ${CAMPAIGN.announceTime} น.`} />
        </div>
        <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${GREEN}, ${GREEN_MID})` }}>
          <div className="text-[12px] uppercase tracking-wider opacity-70 mb-1">มูลค่ารางวัลรวม</div>
          <div className="text-[36px] font-extrabold mb-3">5.67M ฿ <span className="text-[14px] font-normal opacity-70">/ 198 รางวัล</span></div>
          {PRIZES.map((p) => (<div key={p.id} className="flex justify-between text-[13px] py-1 border-t border-white/15"><span>{p.tierLabel} บาท</span><span className="font-bold">{p.totalCount} รางวัล</span></div>))}
        </div>
      </div>) },
    { tag: 'REPORT', title: 'แนวโน้มการสแกน', subtitle: 'Daily Scan Trend', body: (
      <div className="px-2 h-full flex flex-col">
        <div className="flex-1 min-h-0"><TrendLineChart days={daily.data ?? []} rangeLabel={`${dayCount} วัน`} /></div>
        <div className="flex gap-4 text-[12px] mt-2 text-[var(--text-secondary)]">
          {peakDay && <span>📈 วัน peak: <b className="text-[var(--green-700)]">{fmtTHDate(peakDay.date)}</b> ({numFmt(peakDay.success)} สแกน)</span>}
          {outageDays.length > 0 && <span className="text-red-600">🚨 outage {outageDays.length} วัน</span>}
        </div>
      </div>) },
    { tag: 'REPORT', title: 'สิทธิ์ & ความถูกต้องของ DB', subtitle: 'Rights vs DB Issued', body: (
      <div className="grid grid-cols-3 gap-4 h-full items-center px-4">
        <BigKpi label="สิทธิ์ตามสเปก" value={numFmt(t?.expectedTickets ?? 0)} sub="สแกน × สิทธิ์ต่อสินค้า" gold />
        <BigKpi label="DB ออกจริง" value={numFmt(t?.tickets ?? 0)} sub="1:1 bug" />
        <BigKpi label="ขาดหายไป" value={numFmt(t?.ticketGap ?? 0)} sub={`${t && t.expectedTickets ? ((t.ticketGap / t.expectedTickets) * 100).toFixed(0) : 0}% ของสเปก`} danger />
        <div className="col-span-3 rounded-xl p-3 text-[12.5px]" style={{ background: '#fef3c7', border: '1.5px solid #f59e0b' }}>
          ⚠️ <b>ข้อควรระวัง:</b> DB ออกสิทธิ์ 1:1 แต่สเปกจริงบางตัวให้ 2-11 สิทธิ์ → ขาด <b>~{numFmt(t?.ticketGap ?? 0)} สิทธิ์</b> ควร verify ก่อนจับรางวัล
        </div>
      </div>) },
    { tag: 'REPORT', title: 'ลูกค้า & การมีส่วนร่วม', subtitle: 'Customers & Engagement', body: (
      <div className="grid grid-cols-2 gap-6 h-full px-4 items-center">
        <div>
          <div className="text-[13px] font-bold text-[var(--dark)] mb-2">พฤติกรรมการสแกน (ครั้ง/คน)</div>
          {bk.map((b, i) => (
            <div key={b.label} className="mb-2">
              <div className="flex justify-between text-[12px] mb-0.5"><span>{b.label}</span><span className="font-bold">{numFmt(b.users)} คน ({b.pct.toFixed(0)}%)</span></div>
              <div className="h-3 rounded-full bg-[var(--bg-soft)] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: ['#94a3b8', '#6366f1', '#4338ca', '#10b981'][i] }} /></div>
            </div>))}
        </div>
        <div className="space-y-3">
          <BigKpi label="เฉลี่ยสแกน/คน" value={avgScan.toFixed(2)} sub={`สูงสุด ${engagement.data?.maxScansPerUser ?? 0} ครั้ง/คน`} />
          <div className="grid grid-cols-2 gap-3">
            <BigKpi small label="สมัครใหม่รวม" value={numFmt(members.data?.totals.memberNew ?? 0)} sub="คน" />
            <BigKpi small label="เก่ามาสแกนรวม" value={numFmt(members.data?.totals.memberOld ?? 0)} sub="ครั้ง" />
          </div>
        </div>
      </div>) },
    { tag: 'REPORT', title: 'Top จังหวัด', subtitle: 'Geographic Distribution', body: (
      <SlideTable head={['#', 'จังหวัด', 'สแกน', 'ผู้ใช้', 'เฉลี่ย/คน']}
        rows={(provinces.data?.provinces ?? []).map((p) => [String(p.rank), p.name, numFmt(p.scans), numFmt(p.users),
          <span key="a" className={p.avgPerUser > 5 ? 'text-red-600 font-bold' : ''}>{p.avgPerUser.toFixed(1)}{p.avgPerUser > 5 ? ' ⚠️' : ''}</span>])}
        note="⚠️ จังหวัดที่เฉลี่ย/คน > 5 = เฝ้าระวัง (อาจเป็นผู้ค้าส่ง/multi-account)" />) },
    { tag: 'REPORT', title: 'สินค้าขายดี (Top SKU)', subtitle: 'Top Products', badge: '🟡 snapshot ถึง 24 พ.ค.', body: (
      <SlideTable head={['#', 'สินค้า', 'สิทธิ์', 'ผู้ใช้', 'ส่วนแบ่ง']}
        rows={skuRows.slice(0, 10).map((r, i) => [String(i + 1), r.displayName, numFmt(r.rightsRedeemed), numFmt(r.users), `${r.sharePct.toFixed(1)}%`])} />) },
    { tag: 'REPORT', title: 'ความเสี่ยง & ทุจริต', subtitle: 'Risk & Fraud Watch', body: (
      <div className="grid grid-cols-2 gap-6 h-full px-4 items-center">
        <div className="grid grid-cols-3 gap-3">
          <BigKpi small label="สแกน 20+/วัน" value={String(velo20)} sub="คน" />
          <BigKpi small label="สแกน 30+/วัน" value={String(velo30)} sub="คน" />
          <BigKpi small label="สแกน 50+/วัน" value={String(velo50)} sub="คน" danger />
        </div>
        <SlideTable compact head={['#', 'จังหวัด', 'สแกน/วัน', 'SKU']}
          rows={(heavy.data?.users ?? []).slice(0, 8).map((u) => [String(u.rank), u.province, <span key="s" className="font-bold text-red-600">{u.scans}</span>, String(u.skuDiversity || '—')])} />
      </div>) },
    { tag: 'REPORT', title: 'เสถียรภาพระบบ', subtitle: 'System Uptime', body: (
      <div className="grid grid-cols-3 gap-4 h-full items-center px-4">
        <BigKpi label="Uptime" value={`${(uptime.data?.uptimePct ?? 100).toFixed(2)}%`} sub={`${dayCount} วัน`} gold />
        <BigKpi label="เวลาที่ล่ม" value={`${(uptime.data?.outageHours ?? 0).toFixed(1)} ชม.`} sub={`${uptime.data?.outages.length ?? 0} ครั้ง`} danger />
        <div><div className="text-[12px] font-bold text-[var(--dark)] mb-1">รายการ Outage</div>
          {(uptime.data?.outages ?? []).length === 0 ? <div className="text-[12px] text-[var(--text-muted)]">ไม่มี outage 🎉</div>
            : (uptime.data?.outages ?? []).slice(0, 4).map((o, i) => (<div key={i} className="text-[11px] text-[var(--text-secondary)] py-0.5 border-b border-[var(--border-soft)]">🚨 {o.start.split('T')[0]} • {o.durationHours.toFixed(1)} ชม.</div>))}
        </div>
      </div>) },
    { tag: 'REPORT', title: 'ข้อค้นพบ & ข้อเสนอแนะ', subtitle: 'Findings & Recommendations', body: (
      <div className="grid grid-cols-2 gap-6 h-full px-4 py-2">
        <div><div className="text-[14px] font-bold text-[var(--green-700)] mb-2">✅ จุดเด่น</div>
          <ul className="text-[12.5px] space-y-1.5 list-disc pl-5">
            <li>สแกนสำเร็จ <b>{numFmt(t?.success ?? 0)}</b> ครั้ง • success rate <b>{(t?.successRate ?? 0).toFixed(1)}%</b></li>
            <li>ผู้เข้าร่วม <b>{numFmt(distinct)}</b> คน • เฉลี่ย {avgScan.toFixed(1)} ครั้ง/คน</li>
            <li>uptime <b>{(uptime.data?.uptimePct ?? 100).toFixed(1)}%</b></li>
          </ul></div>
        <div><div className="text-[14px] font-bold text-[#b45309] mb-2">🎯 ข้อเสนอแนะ</div>
          <ul className="text-[12.5px] space-y-1.5 list-disc pl-5">
            <li className="text-red-700"><b>เร่งด่วน:</b> verify DB ticket (ขาด ~{numFmt(t?.ticketGap ?? 0)} สิทธิ์)</li>
            <li><b>VIP:</b> ดูแล heavy scanner เพิ่ม engagement</li>
            <li><b>เฝ้าระวัง:</b> {velo30} คนสแกน 30+/วัน</li>
            <li><b>Re-engage:</b> push กลุ่มสแกนครั้งเดียวกลับมา</li>
          </ul></div>
      </div>) },

    // ===== CRM STRATEGY =====
    { cover: true, body: (
      <div className="flex flex-col items-center justify-center h-full text-center text-white" style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_MID} 100%)` }}>
        <div className="text-[13px] uppercase tracking-[0.3em] opacity-70 mb-4">CRM Strategy</div>
        <div className="text-[42px] font-extrabold leading-tight mb-3">ดูแลลูกค้าเชิงรุก</div>
        <div className="text-[15px]" style={{ color: '#f2d99b' }}>Acquisition · Engagement · Retention & Referral</div>
        <div className="text-[13px] opacity-70 mt-5">จากฐานลูกค้า {numFmt(distinct)} ราย · repeat {repeatPct}%</div>
        <div className="text-[10.5px] opacity-60 mt-2">หมายเหตุ: repeat/segments ยังเป็น scope ทั้งระบบ saversure</div>
      </div>) },
    { tag: 'CRM', title: 'ภาพรวมฐานลูกค้า', subtitle: 'Customer Base', accent: AMBER, body: (
      <div className="grid grid-cols-5 gap-3 h-full items-center px-2">
        <BigKpi label="ลูกค้าทั้งหมด" value={numFmt(distinct)} sub="distinct" />
        <BigKpi label="กลับมาซ้ำ" value={`${repeatPct}%`} sub={`เฉลี่ย ${avgScan} /คน`} />
        <BigKpi label="Loyal Scanners" value={numFmt(loyal)} sub="segment" gold />
        <BigKpi label="Champions" value={numFmt(champions)} sub="ดีสุด" gold />
        <BigKpi label="สแกนครั้งเดียว" value={numFmt(oneTime)} sub="เสี่ยงหลุด 35%" danger />
      </div>) },
    { tag: 'CRM', title: 'OBJ 1 · หาลูกค้าใหม่', subtitle: 'Acquisition', accent: '#15803d', body: (
      <div className="px-4 h-full flex flex-col justify-center gap-2.5">
        <CrmPlay c="#15803d" title="First-scan Activation" target={`${numFmt(oneTime)} คน (สแกนครั้งเดียว)`} action="LINE welcome series หลังสแกนแรก → ดึงสแกนครั้งที่ 2" impact="ลด leak ปากกรวย" />
        <CrmPlay c="#15803d" title="Member-get-Member" target={`ฐาน ${numFmt(distinct)} คน`} action="ชวนเพื่อนสแกน รับสิทธิ์เพิ่มทั้งคู่ + viral share" impact="acquisition ต้นทุนต่ำ" />
        <CrmPlay c="#15803d" title="Geographic Expansion" target="จังหวัดนอกเมือง penetration ต่ำ" action="POSM + geo-ads + KOL ท้องถิ่น" impact="ขยายฐานนอก กทม." />
      </div>) },
    { tag: 'CRM', title: 'OBJ 2 · กระตุ้น + อัพเลเวล', subtitle: 'Engagement', accent: BLUE, body: (
      <div className="px-4 h-full flex flex-col justify-center gap-2.5">
        <CrmPlay c={BLUE} title="Tier / Level-up Gamification" target={`${numFmt(repeat25)} คน (กลุ่ม 2-5)`} action="tier Bronze/Silver/Gold → ปลดล็อกสิทธิ์ x2 / draw พิเศษ" impact={`ดัน avg ${avgScan} → 6+`} />
        <CrmPlay c={BLUE} title="Cross-category Quest" target="ลูกค้าซื้อแคบ (Boss 24.5%)" action="สแกนครบ 3 หมวด รับสิทธิ์โบนัส" impact="เพิ่ม basket + ลองสินค้าใหม่" />
        <CrmPlay c={BLUE} title="2nd-scan Auto-nudge" target={`${numFmt(oneTime)} คน (เงียบ)`} action="crm/triggers ส่ง LINE เตือนกลับมาสแกน" impact="สร้างนิสัย (habit loop)" />
      </div>) },
    { tag: 'CRM', title: 'OBJ 3 · รักษา + บอกต่อ', subtitle: 'Retention & Referral', accent: AMBER, body: (
      <div className="px-4 h-full flex flex-col justify-center gap-2.5">
        <CrmPlay c={AMBER} title="VIP Retention" target={`Loyal ${numFmt(loyal)} + Champions ${numFmt(champions)}`} action="สิทธิพิเศษ · ประกาศผลก่อน · draw เฉพาะสมาชิก" impact="คงแกนให้ active ถึง 18 ธ.ค." />
        <CrmPlay c={AMBER} title="Win-back (Churn)" target={`${numFmt(oneTime)} คน + At-Risk`} action="LINE broadcast 'รางวัลเหลือ X ใบ!' + โบนัส" impact="reactivate กลุ่มหลุด" />
        <CrmPlay c={AMBER} title="Referral Loop + UGC" target={`repeat ${repeatPct}% (คนพอใจ)`} action="referrer+เพื่อนได้สิทธิ์ · รีวิว+แชร์ รับโบนัส" impact="บอกต่อ → วนกลับ acquisition" />
      </div>) },
    { tag: 'CRM', title: 'วงจรเติบโต', subtitle: 'Growth Loop', accent: '#15803d', body: (
      <div className="h-full flex flex-col items-center justify-center gap-5 px-6">
        <div className="flex items-center gap-3">
          {[['1️⃣ Acquisition', 'หาคนใหม่', '#15803d'], ['2️⃣ Engagement', 'อัพเลเวล', BLUE], ['3️⃣ Referral', 'บอกต่อ', AMBER]].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="rounded-xl px-5 py-3 text-center" style={{ background: '#f8fafc', border: `1.5px solid ${s[2]}` }}>
                <div className="text-[16px] font-extrabold" style={{ color: s[2] as string }}>{s[0]}</div>
                <div className="text-[11px] text-[var(--text-secondary)]">{s[1]}</div>
              </div>
              {i < 2 && <span className="text-[22px] text-[var(--text-muted)]">→</span>}
            </div>))}
        </div>
        <div className="text-[14px] font-bold text-[var(--green-700)]">↩ referral = สะพานเชื่อม retention กลับไป acquisition (วนโต)</div>
        <div className="text-[11px] text-[var(--text-muted)]">สแกน/สมาชิกมาจาก API แคมเปญ · engagement/segments ยังเป็นทั้งระบบ · action ทำผ่าน LINE OA / saversure (ทีม CRM)</div>
      </div>) },
  ]

  const total = defs.length
  const go = (d: number) => setIdx((i) => Math.max(0, Math.min(total - 1, i + d)))
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [total])

  return (
    <div className="space-y-3 pt-4">
      {/* Toolbar */}
      <div className="print:hidden flex items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-[16px] font-extrabold text-[var(--dark)]">📑 Report — เด็คนำเสนอ (กดซ้าย-ขวา)</h2>
          <p className="text-[11px] text-[var(--text-muted)]">{total} สไลด์ (Campaign + CRM) • ข้อมูล {from} → {to} ({dayCount} วัน) • ⚠️ CRM engagement/segments ยังเป็นทั้งระบบ</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => window.print()} disabled={loading} className="px-4 py-2 rounded-md text-white font-semibold text-[13px] hover:opacity-90 disabled:opacity-50" style={{ background: GREEN }}>
            <i className="ti ti-file-type-pdf mr-1.5" />PDF
          </button>
          <button onClick={downloadPptx} disabled={loading || pptxBusy} className="px-4 py-2 rounded-md font-semibold text-[13px] hover:opacity-90 disabled:opacity-50 border" style={{ borderColor: GREEN, color: GREEN }}>
            <i className="ti ti-file-type-ppt mr-1.5" />{pptxBusy ? 'กำลังสร้าง...' : 'PPTX'}
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-20 text-[var(--text-muted)] print:hidden">⏳ กำลังโหลดข้อมูลจาก API...</div>}

      {/* Carousel */}
      <div className="relative">
        {/* arrows */}
        <button onClick={() => go(-1)} disabled={idx === 0} aria-label="ก่อนหน้า"
          className="print:hidden absolute left-0 top-1/2 -translate-y-1/2 -ml-2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[20px] text-[var(--dark)] hover:bg-[var(--bg-soft)] disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
        <button onClick={() => go(1)} disabled={idx === total - 1} aria-label="ถัดไป"
          className="print:hidden absolute right-0 top-1/2 -translate-y-1/2 -mr-2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-[20px] text-[var(--dark)] hover:bg-[var(--bg-soft)] disabled:opacity-30 disabled:cursor-not-allowed">›</button>

        {/* slides (บนจอโชว์ทีละอัน · พิมพ์โชว์ทุกอัน) */}
        <div className="report-area">
          {defs.map((d, i) => (
            <div key={i} className="deck-page" style={{ display: i === idx ? 'block' : 'none' }}>
              <Slide n={i + 1} total={total} tag={d.tag} title={d.title} subtitle={d.subtitle} badge={d.badge} accent={d.accent} cover={d.cover}>{d.body}</Slide>
            </div>
          ))}
        </div>
      </div>

      {/* nav bar + dots */}
      <div className="print:hidden flex flex-col items-center gap-2">
        <div className="flex items-center gap-4">
          <button onClick={() => go(-1)} disabled={idx === 0} className="px-3 py-1.5 rounded-md border text-[12px] font-semibold disabled:opacity-30" style={{ borderColor: 'var(--border)' }}>◀ ก่อนหน้า</button>
          <span className="text-[13px] font-bold text-[var(--dark)]">{idx + 1} / {total}</span>
          <button onClick={() => go(1)} disabled={idx === total - 1} className="px-3 py-1.5 rounded-md text-white text-[12px] font-semibold disabled:opacity-30" style={{ background: GREEN }}>ถัดไป ▶</button>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center max-w-3xl">
          {defs.map((d, i) => (
            <button key={i} onClick={() => setIdx(i)} aria-label={`สไลด์ ${i + 1}`}
              className="w-2.5 h-2.5 rounded-full transition" title={d.title ?? (i === 0 ? 'Campaign cover' : 'CRM cover')}
              style={{ background: i === idx ? (d.tag === 'CRM' ? AMBER : GREEN) : '#cbd5e1' }} />
          ))}
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">💡 ใช้ปุ่มลูกศร ◀ ▶ บนคีย์บอร์ดได้ · กด PDF/PPTX เพื่อบันทึกทั้งเด็ค</div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
interface SlideDef { cover?: boolean; tag?: string; title?: string; subtitle?: string; badge?: string; accent?: string; body: React.ReactNode }

function Slide({ n, total, tag, title, subtitle, badge, accent, cover, children }: {
  n: number; total: number; tag?: string; title?: string; subtitle?: string; badge?: string; accent?: string; cover?: boolean; children: React.ReactNode
}) {
  const head = accent ?? '#14532d'
  return (
    <div className="report-slide bg-white rounded-xl overflow-hidden mx-auto"
         style={{ width: '100%', maxWidth: 1120, aspectRatio: '16 / 9', boxShadow: '0 8px 30px -12px rgba(15,23,42,0.25)', border: '1px solid var(--border)' }}>
      {cover ? <div className="h-full">{children}</div> : (
        <div className="flex flex-col h-full">
          <div className="px-6 py-3 flex items-center gap-3" style={{ background: `linear-gradient(90deg, ${head}, ${head}dd)` }}>
            {tag && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">{tag}</span>}
            <h3 className="text-[20px] font-extrabold text-white">{title}</h3>
            <span className="text-[12px] text-white/60 uppercase tracking-wider">{subtitle}</span>
            {badge && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-300 text-yellow-900">{badge}</span>}
          </div>
          <div className="flex-1 min-h-0 py-3">{children}</div>
          <div className="px-6 py-1.5 flex justify-between text-[9.5px] text-[var(--text-muted)] border-t border-[var(--border-soft)]">
            <span>สแกนลุ้นรวย สวยลุ้นล้าน • {CAMPAIGN.partner}</span>
            <span>{n} / {total}</span>
          </div>
        </div>)}
    </div>
  )
}

function BigKpi({ label, value, sub, gold, danger, small }: { label: string; value: string; sub?: string; gold?: boolean; danger?: boolean; small?: boolean }) {
  const color = danger ? '#dc2626' : gold ? '#b45309' : 'var(--dark)'
  return (
    <div className={`rounded-xl ${small ? 'p-2.5' : 'p-4'} text-center`} style={{ background: gold ? '#fffbeb' : danger ? '#fef2f2' : 'var(--bg-soft)', border: `1px solid ${gold ? '#fde68a' : danger ? '#fecaca' : 'var(--border-soft)'}` }}>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-1">{label}</div>
      <div className={`${small ? 'text-[20px]' : 'text-[30px]'} font-extrabold leading-none num`} style={{ color }}>{value}</div>
      {sub && <div className="text-[10.5px] text-[var(--text-muted)] mt-1">{sub}</div>}
    </div>
  )
}

function OvRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <i className={`ti ${icon} text-[var(--green-700)] text-lg mt-0.5`} />
      <div><div className="text-[11px] uppercase tracking-wider text-[var(--text-secondary)] font-bold">{label}</div>
        <div className="text-[13.5px] text-[var(--dark)] font-medium">{value}</div></div>
    </div>
  )
}

function CrmPlay({ c, title, target, action, impact }: { c: string; title: string; target: string; action: string; impact: string }) {
  return (
    <div className="rounded-lg p-3 grid grid-cols-[1.5fr_2.3fr_1.5fr] gap-3 items-center" style={{ background: '#fff', borderLeft: `4px solid ${c}`, border: `1px solid ${c}22` }}>
      <div>
        <div className="text-[13px] font-bold text-[var(--dark)]">{title}</div>
        <div className="text-[11px] mt-0.5 px-1.5 py-0.5 rounded inline-block font-semibold" style={{ background: c + '18', color: c }}>🎯 {target}</div>
      </div>
      <div className="text-[12px] text-[var(--text)]">{action}</div>
      <div className="text-[11.5px] text-[var(--text-secondary)]"><b style={{ color: c }}>ผล:</b> {impact}</div>
    </div>
  )
}

function SlideTable({ head, rows, note, compact }: { head: string[]; rows: React.ReactNode[][]; note?: string; compact?: boolean }) {
  return (
    <div className="px-4 h-full flex flex-col">
      <table className="w-full text-[12px]">
        <thead><tr className="text-[var(--text-secondary)] text-[10px] uppercase tracking-wider bg-[var(--bg-soft)]">
          {head.map((h, i) => <th key={i} className={`py-1.5 px-2 font-bold ${i === 0 ? 'text-left w-8' : i === 1 ? 'text-left' : 'text-right'}`}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map((r, ri) => (<tr key={ri} className="border-b border-[var(--border-soft)]">
          {r.map((c, ci) => <td key={ci} className={`${compact ? 'py-1' : 'py-1.5'} px-2 ${ci === 0 ? 'text-[var(--text-muted)]' : ci === 1 ? 'font-medium text-[var(--dark)]' : 'text-right num'}`}>{c}</td>)}
        </tr>))}</tbody>
      </table>
      {note && <div className="text-[10.5px] text-[var(--text-muted)] mt-auto pt-2">{note}</div>}
    </div>
  )
}
