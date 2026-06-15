// ════════════════════════════════════════════════════════════════
// 📑 PPTX generator — สร้างสไลด์นำเสนอ (.pptx) จาก data จริง (client-side)
// ใช้ pptxgenjs • เรียกตอนกดปุ่ม "ดาวน์โหลด PPTX" ใน ReportTab
// ════════════════════════════════════════════════════════════════
import PptxGenJS from 'pptxgenjs'
import type {
  ScansTotalsResponse, DailyRow, MembersDailyResponse,
  EngagementResponse, ProvinceRow, HeavyUser, UptimeResponse,
} from '@/lib/api/types'

const GREEN = '14532D'
const GREEN_MID = '166534'
const GOLD = 'B45309'
const RED = 'DC2626'
const GREY = '64748B'
const FONT = 'Tahoma' // render ภาษาไทยได้บน Windows/Office

export interface ReportData {
  generatedAt: string
  from: string
  to: string
  totals: ScansTotalsResponse | null
  daily: DailyRow[]
  members: MembersDailyResponse | null
  engagement: EngagementResponse | null
  provinces: ProvinceRow[]
  heavy: HeavyUser[]
  uptime: UptimeResponse | null
  sku: { name: string; rights: number; users: number; share: number }[]
  velocity: { v20: number; v30: number; v50: number }
  peakDay: { date: string; scans: number } | null
}

const nf = (n: number) => n.toLocaleString('en-US')

export async function buildReportPptx(d: ReportData): Promise<void> {
  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5"
  pptx.defineSlideMaster({ title: 'BASE', background: { color: 'FFFFFF' } })

  // ── helper: หัวสไลด์ + footer ──
  function frame(slide: PptxGenJS.Slide, n: number, title: string, sub: string, badge?: string) {
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.9, fill: { color: GREEN } })
    slide.addText(title, { x: 0.4, y: 0.08, w: 9, h: 0.75, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: FONT, valign: 'middle' })
    slide.addText(sub.toUpperCase(), { x: 0.45, y: 0.55, w: 9, h: 0.3, fontSize: 10, color: 'BBE5C9', fontFace: FONT })
    if (badge) slide.addText(badge, { x: 10.4, y: 0.28, w: 2.5, h: 0.4, fontSize: 10, bold: true, color: '713F12', fill: { color: 'FDE68A' }, align: 'center', fontFace: FONT, rectRadius: 4 })
    slide.addText(`สแกนลุ้นรวย สวยลุ้นล้าน  •  หน้า ${n} / 11`, { x: 0.4, y: 7.05, w: 12.5, h: 0.3, fontSize: 8, color: GREY, fontFace: FONT })
  }

  // KPI box
  function kpi(slide: PptxGenJS.Slide, x: number, y: number, w: number, label: string, value: string, sub: string, tone?: 'gold' | 'red') {
    const bg = tone === 'gold' ? 'FFFBEB' : tone === 'red' ? 'FEF2F2' : 'F1F5F9'
    const vc = tone === 'gold' ? GOLD : tone === 'red' ? RED : GREEN
    slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 1.7, fill: { color: bg }, line: { color: 'E2E8F0', width: 1 }, rectRadius: 0.1 })
    slide.addText(label, { x, y: y + 0.12, w, h: 0.3, fontSize: 10, bold: true, color: GREY, align: 'center', fontFace: FONT })
    slide.addText(value, { x, y: y + 0.45, w, h: 0.7, fontSize: 30, bold: true, color: vc, align: 'center', fontFace: FONT })
    slide.addText(sub, { x, y: y + 1.2, w, h: 0.35, fontSize: 10, color: '94A3B8', align: 'center', fontFace: FONT })
  }

  const t = d.totals

  // ── 1. COVER ──
  {
    const s = pptx.addSlide()
    s.background = { color: GREEN }
    s.addText('CAMPAIGN REPORT', { x: 0, y: 1.8, w: '100%', h: 0.5, fontSize: 14, color: 'BBE5C9', align: 'center', charSpacing: 6, fontFace: FONT })
    s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', { x: 0, y: 2.5, w: '100%', h: 1.2, fontSize: 48, bold: true, color: 'FFFFFF', align: 'center', fontFace: FONT })
    s.addText("Jula's Herb x ไทยรัฐ", { x: 0, y: 3.8, w: '100%', h: 0.5, fontSize: 18, color: 'DDEEDD', align: 'center', fontFace: FONT })
    s.addText(`รายงานสรุปผล • ข้อมูล 16 พ.ค. – ${d.generatedAt}`, { x: 0, y: 4.8, w: '100%', h: 0.4, fontSize: 13, color: 'AACCBB', align: 'center', fontFace: FONT })
  }

  // ── 2. EXEC SUMMARY ──
  {
    const s = pptx.addSlide(); frame(s, 2, 'สรุปผู้บริหาร', 'Executive Summary')
    const w = 2.4, gap = 0.15, x0 = 0.4, y = 2.8
    kpi(s, x0 + 0 * (w + gap), y, w, 'สแกนสำเร็จ', nf(t?.success ?? 0), `success ${(t?.successRate ?? 0).toFixed(1)}%`)
    kpi(s, x0 + 1 * (w + gap), y, w, 'ผู้เข้าร่วม', nf(t?.uniqueUsers ?? 0), 'unique users')
    kpi(s, x0 + 2 * (w + gap), y, w, 'สิทธิ์ตามสเปก', nf(t?.expectedTickets ?? 0), `DB ${nf(t?.tickets ?? 0)}`, 'gold')
    kpi(s, x0 + 3 * (w + gap), y, w, 'การสแกนทั้งหมด', nf(t?.totalAttempts ?? 0), 'รวมซ้ำ/ไม่พบ')
    kpi(s, x0 + 4 * (w + gap), y, w, 'ระยะเวลา', `${d.daily.length} วัน`, 'ดำเนินการแล้ว')
  }

  // ── 3. OVERVIEW ──
  {
    const s = pptx.addSlide(); frame(s, 3, 'ภาพรวมแคมเปญ', 'Campaign Overview')
    const lines = [
      ['ระยะเวลา', '16 พ.ค. – 18 ธ.ค. 2569 (7 เดือน)'],
      ['สินค้าร่วมรายการ', '97 SKU (ซอง / หลอด / เซ็ต)'],
      ['ช่องทาง', '7-Eleven · Watson · Shopee · Lazada · TikTok · ตัวแทน'],
      ['ประกาศผล', 'ไทยรัฐออนไลน์ และ LINE OA เวลา 15:00 น.'],
    ]
    lines.forEach((ln, i) => {
      s.addText(ln[0], { x: 0.5, y: 1.5 + i * 0.95, w: 2.4, h: 0.4, fontSize: 11, bold: true, color: GREY, fontFace: FONT })
      s.addText(ln[1], { x: 0.5, y: 1.85 + i * 0.95, w: 6.2, h: 0.5, fontSize: 14, color: '1E293B', fontFace: FONT })
    })
    s.addShape(pptx.ShapeType.roundRect, { x: 7.4, y: 1.5, w: 5.4, h: 4.6, fill: { color: GREEN }, rectRadius: 0.15 })
    s.addText('มูลค่ารางวัลรวม', { x: 7.7, y: 1.8, w: 5, h: 0.4, fontSize: 12, color: 'BBE5C9', fontFace: FONT })
    s.addText('5.67M ฿  / 198 รางวัล', { x: 7.7, y: 2.2, w: 5, h: 0.7, fontSize: 28, bold: true, color: 'FFFFFF', fontFace: FONT })
    const prizes = [['ทองคำ 10,000 บาท', '167 รางวัล'], ['ทองคำ 100,000 บาท', '30 รางวัล'], ['ทองคำ 1,000,000 บาท', '1 รางวัล']]
    prizes.forEach((p, i) => {
      s.addText(p[0], { x: 7.7, y: 3.3 + i * 0.6, w: 3.5, h: 0.4, fontSize: 13, color: 'FFFFFF', fontFace: FONT })
      s.addText(p[1], { x: 11, y: 3.3 + i * 0.6, w: 1.6, h: 0.4, fontSize: 13, bold: true, color: 'FFFFFF', align: 'right', fontFace: FONT })
    })
  }

  // ── 4. TREND (line chart) ──
  {
    const s = pptx.addSlide(); frame(s, 4, 'แนวโน้มการสแกน', 'Daily Scan Trend')
    const labels = d.daily.map((r) => r.date.slice(5))
    const chartData = [
      { name: 'สแกนสำเร็จ', labels, values: d.daily.map((r) => r.success) },
      { name: 'สิทธิ์ตามสเปก', labels, values: d.daily.map((r) => r.expectedTickets) },
    ]
    s.addChart(pptx.ChartType.line, chartData, {
      x: 0.4, y: 1.3, w: 12.5, h: 5.0, showLegend: true, legendPos: 't',
      lineSmooth: true, chartColors: ['10B981', '6366F1'], lineSize: 2,
      catAxisLabelFontSize: 8, valAxisLabelFontSize: 9, fontFace: FONT,
    })
    if (d.peakDay) s.addText(`วัน peak: ${d.peakDay.date} (${nf(d.peakDay.scans)} สแกน)`, { x: 0.4, y: 6.4, w: 8, h: 0.3, fontSize: 10, color: GREEN, fontFace: FONT })
  }

  // ── 5. RIGHTS & DB ──
  {
    const s = pptx.addSlide(); frame(s, 5, 'สิทธิ์ & ความถูกต้องของ DB', 'Rights vs DB Issued')
    kpi(s, 0.6, 1.5, 3.8, 'สิทธิ์ตามสเปก', nf(t?.expectedTickets ?? 0), 'สแกน × สิทธิ์ต่อสินค้า', 'gold')
    kpi(s, 4.7, 1.5, 3.8, 'DB ออกจริง', nf(t?.tickets ?? 0), '1:1 bug')
    kpi(s, 8.8, 1.5, 3.8, 'ขาดหายไป', nf(t?.ticketGap ?? 0), `${t && t.expectedTickets ? ((t.ticketGap / t.expectedTickets) * 100).toFixed(0) : 0}% ของสเปก`, 'red')
    s.addShape(pptx.ShapeType.roundRect, { x: 0.6, y: 3.7, w: 12, h: 1.8, fill: { color: 'FEF3C7' }, line: { color: 'F59E0B', width: 1.5 }, rectRadius: 0.1 })
    s.addText(`⚠️ ข้อควรระวัง: DB ออกสิทธิ์แบบ 1:1 ทุก SKU แต่สเปกจริงบางสินค้าให้ 2-11 สิทธิ์\nสิทธิ์ที่ DB บันทึกน้อยกว่าที่ลูกค้าควรได้ ~${nf(t?.ticketGap ?? 0)} สิทธิ์ — ควร verify ก่อนจับรางวัล`,
      { x: 0.9, y: 3.9, w: 11.4, h: 1.4, fontSize: 14, color: '78350F', fontFace: FONT, valign: 'middle' })
  }

  // ── 6. CUSTOMERS ──
  {
    const s = pptx.addSlide(); frame(s, 6, 'ลูกค้า & สมาชิก', 'Customers & Engagement')
    const buckets = d.engagement?.buckets ?? []
    if (buckets.length) {
      s.addChart(pptx.ChartType.bar, [{ name: 'ผู้ใช้', labels: buckets.map((b) => b.label), values: buckets.map((b) => b.users) }],
        { x: 0.4, y: 1.4, w: 7, h: 4.6, chartColors: ['4338CA'], showValue: true, dataLabelFontSize: 9, catAxisLabelFontSize: 9, valAxisLabelFontSize: 8, fontFace: FONT, barDir: 'bar' })
    }
    kpi(s, 7.8, 1.6, 5, 'เฉลี่ยสแกน/คน', (d.engagement?.avgScansPerUser ?? 0).toFixed(2), `สูงสุด ${d.engagement?.maxScansPerUser ?? 0} ครั้ง/คน`)
    kpi(s, 7.8, 3.6, 2.4, 'สมัครใหม่', nf(d.members?.totals.memberNew ?? 0), 'คน')
    kpi(s, 10.4, 3.6, 2.4, 'เก่ามาสแกน', nf(d.members?.totals.memberOld ?? 0), 'คน')
  }

  // ── 7. PROVINCES ──
  {
    const s = pptx.addSlide(); frame(s, 7, 'Top จังหวัด', 'Geographic Distribution')
    const rows: PptxGenJS.TableRow[] = [
      ['#', 'จังหวัด', 'สแกน', 'ผู้ใช้', 'เฉลี่ย/คน'].map((h) => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: GREEN }, fontFace: FONT, fontSize: 11 } })),
      ...d.provinces.slice(0, 10).map((p) => [
        { text: String(p.rank), options: { fontFace: FONT } },
        { text: p.name, options: { fontFace: FONT } },
        { text: nf(p.scans), options: { align: 'right' as const, fontFace: FONT } },
        { text: nf(p.users), options: { align: 'right' as const, fontFace: FONT } },
        { text: p.avgPerUser.toFixed(1) + (p.avgPerUser > 5 ? ' ⚠️' : ''), options: { align: 'right' as const, color: p.avgPerUser > 5 ? RED : '1E293B', fontFace: FONT } },
      ]),
    ]
    s.addTable(rows, { x: 0.5, y: 1.3, w: 12.3, fontSize: 11, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, rowH: 0.4 })
  }

  // ── 8. SKU ──
  {
    const s = pptx.addSlide(); frame(s, 8, 'สินค้าขายดี (Top SKU)', 'Top Products', '🟡 snapshot ถึง 24 พ.ค.')
    const rows: PptxGenJS.TableRow[] = [
      ['#', 'สินค้า', 'สิทธิ์', 'ผู้ใช้', 'ส่วนแบ่ง'].map((h) => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: GREEN }, fontFace: FONT, fontSize: 11 } })),
      ...d.sku.slice(0, 10).map((r, i) => [
        { text: String(i + 1), options: { fontFace: FONT } },
        { text: r.name, options: { fontFace: FONT, fontSize: 10 } },
        { text: nf(r.rights), options: { align: 'right' as const, fontFace: FONT } },
        { text: nf(r.users), options: { align: 'right' as const, fontFace: FONT } },
        { text: r.share.toFixed(1) + '%', options: { align: 'right' as const, fontFace: FONT } },
      ]),
    ]
    s.addTable(rows, { x: 0.5, y: 1.3, w: 12.3, fontSize: 11, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, rowH: 0.38 })
  }

  // ── 9. RISK ──
  {
    const s = pptx.addSlide(); frame(s, 9, 'ความเสี่ยง & ทุจริต', 'Risk & Fraud Watch')
    kpi(s, 0.5, 1.6, 2.3, 'สแกน 20+/วัน', String(d.velocity.v20), 'คน')
    kpi(s, 3.0, 1.6, 2.3, 'สแกน 30+/วัน', String(d.velocity.v30), 'คน')
    kpi(s, 5.5, 1.6, 2.3, 'สแกน 50+/วัน', String(d.velocity.v50), 'คน', 'red')
    const rows: PptxGenJS.TableRow[] = [
      ['#', 'จังหวัด', 'สแกน/วัน', 'SKU'].map((h) => ({ text: h, options: { bold: true, color: 'FFFFFF', fill: { color: GREEN }, fontFace: FONT, fontSize: 10 } })),
      ...d.heavy.slice(0, 8).map((u) => [
        { text: String(u.rank), options: { fontFace: FONT } },
        { text: u.province, options: { fontFace: FONT } },
        { text: String(u.scans), options: { align: 'right' as const, bold: true, color: RED, fontFace: FONT } },
        { text: String(u.skuDiversity || '—'), options: { align: 'right' as const, fontFace: FONT } },
      ]),
    ]
    s.addTable(rows, { x: 8.1, y: 1.6, w: 4.7, fontSize: 10, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, rowH: 0.36 })
  }

  // ── 10. UPTIME ──
  {
    const s = pptx.addSlide(); frame(s, 10, 'เสถียรภาพระบบ', 'System Uptime')
    kpi(s, 0.6, 2.2, 3.8, 'Uptime', `${(d.uptime?.uptimePct ?? 100).toFixed(2)}%`, `${d.daily.length} วัน`, 'gold')
    kpi(s, 4.7, 2.2, 3.8, 'เวลาที่ล่ม', `${(d.uptime?.outageHours ?? 0).toFixed(1)} ชม.`, `${d.uptime?.outages.length ?? 0} ครั้ง`, 'red')
    const outs = d.uptime?.outages ?? []
    s.addText('รายการ Outage', { x: 8.8, y: 2.1, w: 4, h: 0.3, fontSize: 12, bold: true, color: GREEN, fontFace: FONT })
    s.addText(outs.length === 0 ? 'ไม่มี outage 🎉' : outs.slice(0, 5).map((o) => `🚨 ${o.start.split('T')[0]} • ${o.durationHours.toFixed(1)} ชม.`).join('\n'),
      { x: 8.8, y: 2.5, w: 4, h: 2.5, fontSize: 11, color: '475569', fontFace: FONT, lineSpacingMultiple: 1.4 })
  }

  // ── 11. FINDINGS ──
  {
    const s = pptx.addSlide(); frame(s, 11, 'ข้อค้นพบ & ข้อเสนอแนะ', 'Findings & Recommendations')
    s.addText('✅ จุดเด่น', { x: 0.5, y: 1.3, w: 6, h: 0.4, fontSize: 16, bold: true, color: '15803D', fontFace: FONT })
    s.addText([
      { text: `ยอดสแกนสำเร็จรวม ${nf(t?.success ?? 0)} ครั้ง • success rate ${(t?.successRate ?? 0).toFixed(1)}%`, options: { bullet: true } },
      { text: `ผู้เข้าร่วม ${nf(t?.uniqueUsers ?? 0)} คน • เฉลี่ย ${(d.engagement?.avgScansPerUser ?? 0).toFixed(1)} ครั้ง/คน`, options: { bullet: true } },
      { text: `ระบบเสถียร uptime ${(d.uptime?.uptimePct ?? 100).toFixed(1)}%`, options: { bullet: true } },
    ], { x: 0.6, y: 1.8, w: 6, h: 3, fontSize: 13, color: '1E293B', fontFace: FONT, lineSpacingMultiple: 1.5 })
    s.addText('🎯 ข้อเสนอแนะ', { x: 6.9, y: 1.3, w: 6, h: 0.4, fontSize: 16, bold: true, color: GOLD, fontFace: FONT })
    s.addText([
      { text: `เร่งด่วน: verify DB ticket (ขาด ~${nf(t?.ticketGap ?? 0)} สิทธิ์) ก่อนจับรางวัล`, options: { bullet: true, color: 'B91C1C' } },
      { text: 'VIP: ดูแลลูกค้า heavy scanner เพิ่ม engagement', options: { bullet: true } },
      { text: `เฝ้าระวัง: ตรวจผู้ใช้สแกนผิดปกติ (${d.velocity.v30} คนสแกน 30+/วัน)`, options: { bullet: true } },
      { text: 'Re-engage: push กลุ่มสแกนครั้งเดียวให้กลับมาซ้ำ', options: { bullet: true } },
    ], { x: 7.0, y: 1.8, w: 6, h: 3.5, fontSize: 13, color: '1E293B', fontFace: FONT, lineSpacingMultiple: 1.5 })
  }

  await pptx.writeFile({ fileName: `campaign-report-${d.to}.pptx` })
}
