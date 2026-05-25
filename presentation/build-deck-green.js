// Green-theme deck — 15 slides + 3 appendix
// Sections: Cover → Scan → Customer → Product → Forecast+Action
// Run: node build-deck-green.js
const pptxgen = require('pptxgenjs')
const path = require('path')

// ── 🌿 GREEN THEME palette (Jula's Herb tone) ──
const G_DEEP  = '064E3B'   // green-900 darkest
const G_DARK  = '065F46'   // green-800
const G_700   = '047857'
const G_600   = '059669'   // primary
const G_500   = '10B981'   // bright
const G_400   = '34D399'
const G_200   = 'A7F3D0'
const G_100   = 'D1FAE5'
const G_50    = 'ECFDF5'

const GOLD    = 'F59E0B'   // accent (boss SKU, ASKS, warnings)
const GOLD_L  = 'FBBF24'
const DANGER  = 'DC2626'
const DANGER_L= 'FEF2F2'
const WARN_L  = 'FFFBEB'

const WHITE   = 'FFFFFF'
const TEXT    = '0F172A'
const MUTED   = '64748B'
const SOFT    = 'F1F5F9'
const BORDER  = 'E2E8F0'
const PINK_TX = 'BE185D'

const FONT = 'Calibri'
const fmt = (n) => Number(n).toLocaleString('en-US')

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'
pres.author = "Jula's Herb x ไทยรัฐ TV"
pres.title  = 'Campaign Report Day 1-5 (Green theme)'

// ── Helpers ──
function header(slide, section, title, num, total) {
  // Top bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.42,
    fill: { color: G_DEEP }, line: { color: G_DEEP },
  })
  // Section tag chip
  if (section) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.25, y: 0.07, w: 1.1, h: 0.28,
      fill: { color: G_500 }, line: { color: G_500 },
      rectRadius: 0.04,
    })
    slide.addText(section, {
      x: 0.25, y: 0.07, w: 1.1, h: 0.28,
      fontSize: 9, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0,
    })
  }
  slide.addText(title, {
    x: section ? 1.5 : 0.4, y: 0.05, w: 7.5, h: 0.34,
    fontSize: 13, fontFace: FONT, color: WHITE, bold: true, valign: 'middle', margin: 0,
  })
  if (num) {
    slide.addText(`${num} / ${total}`, {
      x: 9, y: 0.05, w: 0.9, h: 0.34,
      fontSize: 10, fontFace: FONT, color: G_200, align: 'right', valign: 'middle', margin: 0,
    })
  }
  // Footer
  slide.addText("สแกนลุ้นรวย สวยลุ้นล้าน  •  Jula's Herb × ไทยรัฐ TV  •  Day 1-6 (16-21 พ.ค. 2026)", {
    x: 0.4, y: 5.32, w: 9.2, h: 0.25,
    fontSize: 8.5, fontFace: FONT, color: MUTED, align: 'left', valign: 'middle', margin: 0,
  })
}

function bigStat(slide, x, y, w, h, value, label, sub, color = G_600) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: WHITE }, line: { color: BORDER, width: 0.5 },
  })
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.06, h, fill: { color }, line: { color },
  })
  slide.addText(label, {
    x: x + 0.18, y: y + 0.1, w: w - 0.3, h: 0.25,
    fontSize: 9, fontFace: FONT, color: MUTED, bold: true, valign: 'middle', margin: 0,
  })
  slide.addText(value, {
    x: x + 0.18, y: y + 0.33, w: w - 0.3, h: 0.55,
    fontSize: 22, fontFace: FONT, color: G_DEEP, bold: true, valign: 'middle', margin: 0,
  })
  if (sub) slide.addText(sub, {
    x: x + 0.18, y: y + 0.9, w: w - 0.3, h: 0.25,
    fontSize: 9, fontFace: FONT, color: MUTED, valign: 'middle', margin: 0,
  })
}

function sectionHeader(slide, title, dayTag) {
  slide.addText(title, {
    x: 0.4, y: 0.55, w: 6.5, h: 0.4,
    fontSize: 16, fontFace: FONT, color: G_DEEP, bold: true, margin: 0,
  })
  if (dayTag) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 7.5, y: 0.6, w: 2.0, h: 0.3,
      fill: { color: G_100 }, line: { color: G_200, width: 0.5 },
      rectRadius: 0.15,
    })
    slide.addText(dayTag, {
      x: 7.5, y: 0.6, w: 2.0, h: 0.3,
      fontSize: 10, fontFace: FONT, color: G_700, bold: true, align: 'center', valign: 'middle', margin: 0,
    })
  }
}

// =============================================================
// SLIDE 1: Cover + Section overview
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: G_DEEP }
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: G_500 }, line: { color: G_500 } })

  s.addText('CAMPAIGN REPORT • DAY 1-6', {
    x: 0.5, y: 0.35, w: 9, h: 0.3,
    fontSize: 12, fontFace: FONT, color: G_200, bold: true, charSpacing: 6, margin: 0,
  })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', {
    x: 0.5, y: 0.65, w: 9, h: 0.6,
    fontSize: 30, fontFace: FONT, color: WHITE, bold: true, margin: 0,
  })
  s.addText("Jula's Herb × ไทยรัฐ TV  •  16-21 พ.ค. 2026  (วันที่ 1-6 ของแคมเปญ 7 เดือน)", {
    x: 0.5, y: 1.3, w: 9, h: 0.3,
    fontSize: 12, fontFace: FONT, color: 'CBD5E1', margin: 0,
  })

  // 3 punch stats
  const stats = [
    { val: '35,711', lab: 'สแกนสำเร็จ', sub: 'success scans 5 วัน' },
    { val: '51%',    lab: 'อัตราสแกนซ้ำ', sub: 'industry avg 25-30%', color: GOLD_L },
    { val: '11.5K',  lab: 'สิทธิ์ขาดจาก DB',  sub: '⚠ ต้องแก้ก่อน prize draw', color: 'FCA5A5' },
  ]
  stats.forEach((st, i) => {
    const x = 0.5 + i * 3.0
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w: 2.8, h: 1.4,
      fill: { color: WHITE, transparency: 92 }, line: { color: G_500, width: 1 } })
    s.addText(st.val, {
      x: x + 0.15, y: 2.05, w: 2.5, h: 0.6,
      fontSize: 28, fontFace: FONT, color: st.color || G_200, bold: true, margin: 0,
    })
    s.addText(st.lab, {
      x: x + 0.15, y: 2.65, w: 2.5, h: 0.3,
      fontSize: 12, fontFace: FONT, color: WHITE, bold: true, margin: 0,
    })
    s.addText(st.sub, {
      x: x + 0.15, y: 2.95, w: 2.5, h: 0.3,
      fontSize: 10, fontFace: FONT, color: 'CBD5E1', margin: 0,
    })
  })

  // Bottom-line callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.7, w: 9.0, h: 1.4,
    fill: { color: WHITE, transparency: 88 }, line: { color: G_500, width: 1 },
  })
  s.addText('💡 บรรทัดสุดท้าย', {
    x: 0.7, y: 3.8, w: 8.6, h: 0.3,
    fontSize: 12, fontFace: FONT, color: G_200, bold: true, margin: 0,
  })
  s.addText(
    'Engagement สูงเกินอุตสาหกรรม 2 เท่า + Acquisition โต +11%/วัน ก่อน outage\n' +
    'แต่เจอ DB bug ขาดสิทธิ์ 11K+ ใบ + พบ fraud pattern Day 19-20 — ต้องแก้ก่อน prize draw',
    {
      x: 0.7, y: 4.15, w: 8.6, h: 0.9,
      fontSize: 12.5, fontFace: FONT, color: WHITE, margin: 0, paraSpaceAfter: 4,
    }
  )
}

// =============================================================
// SLIDE 2: Executive Summary
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '', 'Executive Summary — Day 1-5', 2, 16)
  sectionHeader(s, '📋 สรุปภาพรวม 5 วันแรก', '16-20 พ.ค.')

  // 4 mini KPI cards
  bigStat(s, 0.4, 1.1, 2.3, 1.1, '35,711',  '⭐ สแกนสำเร็จ',   'avg 7,142/วัน', G_600)
  bigStat(s, 2.85, 1.1, 2.3, 1.1, '47,127', '🎟️ สิทธิ์ตามสเปก', 'DB ขาด −11,476', GOLD)
  bigStat(s, 5.3, 1.1, 2.3, 1.1, '2,101',   '🆕 สมาชิกใหม่',     '5 วัน • avg 420/วัน', G_500)
  bigStat(s, 7.75, 1.1, 1.85, 1.1, '94.9%', '✅ Uptime',         'Day 4 ล่ม 6 ชม.', G_600)

  // 2-column highlights: Wins / Concerns
  // LEFT — Wins
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 2.4, w: 4.5, h: 2.9,
    fill: { color: G_50 }, line: { color: G_500, width: 1.5 } })
  s.addText('🟢 จุดเด่น (Wins)', {
    x: 0.55, y: 2.5, w: 4.3, h: 0.3,
    fontSize: 13, fontFace: FONT, color: G_DEEP, bold: true, margin: 0,
  })
  s.addText([
    { text: '✅ Engagement สูง 2× industry', options: { bold: true, color: G_700, breakLine: true } },
    { text: '   Repeat rate 51% (avg ผู้ใช้สแกน 2.9 ครั้ง)\n', options: { fontSize: 10, color: TEXT, breakLine: true } },
    { text: '✅ Acquisition trending up', options: { bold: true, color: G_700, breakLine: true } },
    { text: '   สมาชิกใหม่ 384 → 414 → 428 (+11%/วัน Day 1-3)\n', options: { fontSize: 10, color: TEXT, breakLine: true } },
    { text: '✅ Activation funnel ดี 85%', options: { bold: true, color: G_700, breakLine: true } },
    { text: '   สมัครใหม่ 85% สแกนภายในวัน\n', options: { fontSize: 10, color: TEXT, breakLine: true } },
    { text: '✅ Recovery จาก outage เร็ว', options: { bold: true, color: G_700, breakLine: true } },
    { text: '   Day 20 (พุธ) +13.3% vs มี.ค. — ฟื้นตัวเต็มที่', options: { fontSize: 10, color: TEXT } },
  ], {
    x: 0.55, y: 2.85, w: 4.3, h: 2.2,
    fontSize: 11, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })

  // RIGHT — Concerns
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.4, w: 4.5, h: 2.9,
    fill: { color: DANGER_L }, line: { color: DANGER, width: 1.5 } })
  s.addText('🔴 ที่ต้องระวัง (Concerns)', {
    x: 5.25, y: 2.5, w: 4.3, h: 0.3,
    fontSize: 13, fontFace: FONT, color: '991B1B', bold: true, margin: 0,
  })
  s.addText([
    { text: '🚨 DB Bug ขาดสิทธิ์ −11,476 ใบ (−24%)', options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   SKU 40g/70g ตามสเปก 2-5 สิทธิ์ แต่ DB ให้ 1:1\n', options: { fontSize: 10, color: TEXT, breakLine: true } },
    { text: '🚨 2 users สแกน 201 ครั้งเท่ากันเป๊ะ', options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   Day 20 — สงสัย bot/script/coordinated\n', options: { fontSize: 10, color: TEXT, breakLine: true } },
    { text: '🚨 สระบุรี cluster 17.8 scans/user', options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   20 users สแกน 356 ครั้ง — fraud cluster\n', options: { fontSize: 10, color: TEXT, breakLine: true } },
    { text: '⚠ Outage Day 19 = 6 ชม.', options: { bold: true, color: GOLD, breakLine: true } },
    { text: '   Cloudflare tunnel? log lost — root cause TBD', options: { fontSize: 10, color: TEXT } },
  ], {
    x: 5.25, y: 2.85, w: 4.3, h: 2.2,
    fontSize: 11, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })
}

// =============================================================
// SECTION: 📊 SCAN
// =============================================================

// SLIDE 3: ภาพรวม 5 วัน
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📊 SCAN', 'ภาพรวม 5 วันแรก', 3, 16)
  sectionHeader(s, '📊 Performance Overview', '16-20 พ.ค.')

  bigStat(s, 0.4, 1.1, 2.3, 1.2, '42,298', '⭐ สแกนสำเร็จ', '6 วัน · avg 7,050/วัน', G_600)
  bigStat(s, 2.85, 1.1, 2.3, 1.2, '56,211', '🎟️ สิทธิ์รวม', 'scans × perScan (สเปก)', GOLD)
  bigStat(s, 5.3, 1.1, 2.3, 1.2, '2,520', '👥 ผู้สแกน/วัน', 'distinct · peak 2,968', G_500)
  bigStat(s, 7.75, 1.1, 1.85, 1.2, '94.4%', '✅ Uptime', '🚨 ล่ม 2 ครั้ง = 8 ชม.', G_700)

  // Trend line — spec tickets (calc) vs success scans (from-db)
  s.addChart(pres.charts.LINE, [
    { name: 'สิทธิ์รวม (calc)', labels: ['16', '17', '18', '19', '20', '21'], values: [9308, 11585, 8615, 7832, 10335, 8536] },
    { name: 'สแกนสำเร็จ',       labels: ['16', '17', '18', '19', '20', '21'], values: [7160, 8713, 6459, 5707, 7669, 6590] },
  ], {
    x: 0.4, y: 2.5, w: 6.5, h: 2.6,
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    chartColors: [G_600, GOLD],
    lineSize: 2.5, lineDataSymbolSize: 8,
    showValue: true, dataLabelPosition: 't',
    dataLabelColor: G_DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 9,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    showTitle: true, title: 'แนวโน้ม: สิทธิ์ vs สแกนสำเร็จ 5 วัน',
    titleFontSize: 11, titleColor: G_DEEP, titleFontFace: FONT,
  })

  // Pattern callout
  s.addShape(pres.shapes.RECTANGLE, { x: 7.0, y: 2.5, w: 2.6, h: 2.6,
    fill: { color: G_50 }, line: { color: G_200, width: 1 } })
  s.addText('🔍 Pattern', {
    x: 7.15, y: 2.6, w: 2.4, h: 0.3,
    fontSize: 12, fontFace: FONT, color: G_DEEP, bold: true, margin: 0,
  })
  s.addText([
    { text: '📈 Weekend peak ',  options: {} },
    { text: '+21.6%',             options: { bold: true, color: G_600, breakLine: true } },
    { text: '   (เสาร์→อาทิตย์)',   options: { fontSize: 9, color: MUTED, breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: '📉 จันทร์ตก ',         options: {} },
    { text: '−26%',                 options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   จาก peak', options: { fontSize: 9, color: MUTED, breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: '🚨 ล่ม 2 ครั้ง ',     options: {} },
    { text: '8 ชม.',                options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   Day19 6h + Day21 2h', options: { fontSize: 9, color: MUTED, breakLine: true } },
    { text: ' ', options: { breakLine: true } },
    { text: '✅ Day 20 ฟื้น +34%', options: { color: G_600 } },
  ], {
    x: 7.15, y: 2.95, w: 2.4, h: 2.1,
    fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 0, margin: 0,
  })
}

// SLIDE 4: ตารางสแกน/สิทธิ์รายวัน
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📊 SCAN', 'ตารางสถิติสแกน/สิทธิ์รายวัน', 4, 16)
  sectionHeader(s, '📋 ตารางรายวัน', '6 วัน')

  const hStyle = { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 9 }
  const num = { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10, valign: 'middle' }
  const muted = { ...num, color: MUTED }
  const success = { ...num, color: G_600, bold: true }
  const danger = { ...num, color: DANGER }
  const center = (color = TEXT) => ({ align: 'center', color, fontFace: FONT, fontSize: 10, valign: 'middle' })

  const tableData = [
    [
      { text: 'วันที่', options: hStyle },
      { text: 'วัน', options: hStyle },
      { text: '⭐ สำเร็จ', options: { ...hStyle, fill: { color: G_700 } } },
      { text: '⛔ ซ้ำตัวเอง', options: { ...hStyle, fill: { color: '991B1B' } } },
      { text: '⛔ ซ้ำคนอื่น', options: { ...hStyle, fill: { color: '991B1B' } } },
      { text: '⛔ ไม่พบ', options: { ...hStyle, fill: { color: '991B1B' } } },
      { text: 'รวม', options: hStyle },
      { text: '% สำเร็จ', options: hStyle },
      { text: '🎟️ สิทธิ์ (สเปก)', options: { ...hStyle, fill: { color: GOLD } } },
    ],
    ...[
      { d: '16', dow: 'เสาร์',  s: 7160, ds: 660, do: 78,  nf: 181, tot: 8079, rate: 88.6, spec: 9308 },
      { d: '17', dow: 'อาทิตย์', s: 8713, ds: 755, do: 304, nf: 0,   tot: 9772, rate: 89.2, spec: 11585 },
      { d: '18', dow: 'จันทร์', s: 6459, ds: 639, do: 260, nf: 0,   tot: 7358, rate: 87.8, spec: 8615 },
      { d: '19', dow: 'อังคาร 🚨', s: 5707, ds: 588, do: 326, nf: 0, tot: 6621, rate: 86.2, spec: 7832, alert: true },
      { d: '20', dow: 'พุธ',    s: 7669, ds: 654, do: 271, nf: 0,   tot: 8594, rate: 89.2, spec: 10335 },
      { d: '21', dow: 'พฤหัส 🚨', s: 6590, ds: 617, do: 245, nf: 0, tot: 7452, rate: 88.4, spec: 8536, alert: true },
    ].map(r => [
      { text: r.d + ' พ.ค.', options: { ...center(G_700), bold: true } },
      { text: r.dow, options: center(r.alert ? DANGER : MUTED) },
      { text: fmt(r.s), options: success },
      { text: fmt(r.ds), options: muted },
      { text: fmt(r.do), options: muted },
      { text: r.nf > 0 ? fmt(r.nf) : '—', options: r.nf > 0 ? danger : center(MUTED) },
      { text: fmt(r.tot), options: num },
      { text: r.rate.toFixed(1) + '%', options: { ...num, color: r.rate >= 89 ? G_600 : GOLD, bold: true } },
      { text: fmt(r.spec), options: { ...num, color: G_700, bold: true, fill: { color: G_50 } } },
    ]),
    [
      { text: 'รวม', options: { align: 'center', bold: true, color: G_DEEP, fill: { color: G_100 }, fontFace: FONT, fontSize: 11, valign: 'middle' } },
      { text: '6 วัน', options: { align: 'center', color: G_DEEP, fill: { color: G_100 }, fontFace: FONT, fontSize: 11, valign: 'middle' } },
      { text: fmt(42298), options: { ...num, color: G_DEEP, bold: true, fill: { color: G_100 }, fontSize: 11 } },
      { text: fmt(3913),  options: { ...num, color: G_DEEP, fill: { color: G_100 }, fontSize: 11 } },
      { text: fmt(1484),  options: { ...num, color: G_DEEP, fill: { color: G_100 }, fontSize: 11 } },
      { text: fmt(181),   options: { ...num, color: G_DEEP, fill: { color: G_100 }, fontSize: 11 } },
      { text: fmt(47876), options: { ...num, color: G_DEEP, bold: true, fill: { color: G_100 }, fontSize: 11 } },
      { text: '88.4%',    options: { ...num, color: G_DEEP, bold: true, fill: { color: G_100 }, fontSize: 11 } },
      { text: fmt(56211), options: { ...num, color: G_700, bold: true, fill: { color: G_200 }, fontSize: 11 } },
    ],
  ]

  s.addTable(tableData, {
    x: 0.3, y: 1.1, w: 9.4,
    colW: [0.85, 0.95, 1.1, 1.05, 1.05, 0.95, 0.95, 0.95, 1.55],
    rowH: 0.4,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  // Note
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.15, w: 9.2, h: 0.85,
    fill: { color: WARN_L }, line: { color: GOLD, width: 1 } })
  s.addText([
    { text: '⚠️ ', options: { fontSize: 12, color: GOLD } },
    { text: 'Day 19 outage 6 ชม. (02:49-09:00) + Day 21 outage 2 ชม. (03:00-04:59) ', options: { fontSize: 10, color: TEXT } },
    { text: '— 2 ครั้งใน 3 วัน · ช่วงเช้ามืดทั้งคู่ ⚠ น่าจะเป็น cron/maintenance ', options: { fontSize: 10, color: DANGER, bold: true, breakLine: true } },
    { text: '🟡 ', options: { fontSize: 12, color: GOLD } },
    { text: 'สิทธิ์ (สเปก) − DB = ขาดไป ', options: { fontSize: 10, color: TEXT } },
    { text: '13,913 ใบ (−24.8%)', options: { fontSize: 10, color: DANGER, bold: true } },
    { text: ' จาก bug 1:1 → ดู Slide 5', options: { fontSize: 10, color: TEXT } },
  ], {
    x: 0.55, y: 4.2, w: 9.0, h: 0.75,
    fontFace: FONT, valign: 'middle', margin: 0,
  })
}

// SLIDE 5: DB Bug Critical
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📊 SCAN', '🚨 Critical: DB Ticket Bug', 5, 16)
  sectionHeader(s, '🚨 DB Bug: ขาดสิทธิ์ 11.5K ใบ (−24%)')

  // LEFT — Spec
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 4.5, h: 2.3,
    fill: { color: G_50 }, line: { color: G_500, width: 1.5 } })
  s.addText('✅ ตามสเปก Excel (ที่ควรจะเป็น)', {
    x: 0.55, y: 1.2, w: 4.3, h: 0.3,
    fontSize: 12, fontFace: FONT, color: G_700, bold: true, margin: 0,
  })
  s.addText([
    { text: '\nL3-40G  ดีดีครีมแตงโม 40 กรัม', options: {} },
    { text: '  →  5 สิทธิ์/scan', options: { bold: true, color: G_600, breakLine: true } },
    { text: 'D3-70G  ยาสีฟัน 70 กรัม', options: {} },
    { text: '  →  2 สิทธิ์/scan', options: { bold: true, color: G_600, breakLine: true } },
    { text: 'C4-35G  เซรั่มขิงดำ 35 กรัม', options: {} },
    { text: '  →  4 สิทธิ์/scan', options: { bold: true, color: G_600, breakLine: true } },
    { text: 'L7-30G  โดสส้มแดง 30 กรัม', options: {} },
    { text: '  →  5 สิทธิ์/scan', options: { bold: true, color: G_600, breakLine: true } },
    { text: '\n...~30 SKUs มี 2-5 สิทธิ์/scan', options: { italic: true, color: MUTED } },
  ], {
    x: 0.55, y: 1.5, w: 4.3, h: 1.85,
    fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })

  // RIGHT — DB
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.1, w: 4.5, h: 2.3,
    fill: { color: DANGER_L }, line: { color: DANGER, width: 1.5 } })
  s.addText('❌ DB ปัจจุบัน (bug)', {
    x: 5.25, y: 1.2, w: 4.3, h: 0.3,
    fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0,
  })
  s.addText([
    { text: '\nL3-40G  ดีดีครีมแตงโม 40 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: 'D3-70G  ยาสีฟัน 70 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: 'C4-35G  เซรั่มขิงดำ 35 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: 'L7-30G  โดสส้มแดง 30 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: '\n** ทุก SKU ให้ 1:1 (1 scan = 1 สิทธิ์) **', options: { bold: true, color: DANGER, italic: true } },
  ], {
    x: 5.25, y: 1.5, w: 4.3, h: 1.85,
    fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })

  // Impact
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 3.6, w: 9.2, h: 1.0,
    fill: { color: WHITE }, line: { color: GOLD, width: 1.5 } })
  s.addText('📊 Impact (6 วันแรก)', {
    x: 0.55, y: 3.65, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT, color: GOLD, bold: true, margin: 0,
  })
  s.addText('DB ปัจจุบัน', { x: 0.55, y: 3.95, w: 2.5, h: 0.2, fontSize: 9, fontFace: FONT, color: MUTED, margin: 0 })
  s.addText('42,298 ใบ', { x: 0.55, y: 4.15, w: 2.5, h: 0.4, fontSize: 18, fontFace: FONT, color: DANGER, bold: true, margin: 0 })
  s.addText('ตามสเปก', { x: 3.5, y: 3.95, w: 2.5, h: 0.2, fontSize: 9, fontFace: FONT, color: MUTED, margin: 0 })
  s.addText('56,211 ใบ', { x: 3.5, y: 4.15, w: 2.5, h: 0.4, fontSize: 18, fontFace: FONT, color: G_600, bold: true, margin: 0 })
  s.addText('ขาดไป', { x: 6.5, y: 3.95, w: 3, h: 0.2, fontSize: 9, fontFace: FONT, color: MUTED, margin: 0 })
  s.addText('−13,913 ใบ  (−24.8%)', { x: 6.5, y: 4.15, w: 3, h: 0.4, fontSize: 18, fontFace: FONT, color: DANGER, bold: true, margin: 0 })

  // Action
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.75, w: 9.2, h: 0.5,
    fill: { color: G_DEEP }, line: { color: G_DEEP } })
  s.addText([
    { text: '🔴 ACTION: ', options: { color: GOLD_L, bold: true } },
    { text: 'ทีม DB ต้องแก้ก่อน prize draw (18 ธ.ค.) — มิฉะนั้นลูกค้าได้สิทธิ์น้อยกว่าที่ POSM/โฆษณาประกาศ', options: { color: WHITE } },
  ], {
    x: 0.55, y: 4.78, w: 9, h: 0.45,
    fontSize: 11, fontFace: FONT, valign: 'middle', margin: 0,
  })
}

// SLIDE 6: Apples-to-Apples DoW
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📊 SCAN', 'Apples-to-Apples — เทียบ DoW', 6, 16)
  sectionHeader(s, '🎯 เทียบ DoW — Apples-to-Apples')

  const hStyle = { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 10 }
  const dowStyle = { align: 'left', color: G_700, fontFace: FONT, fontSize: 11, bold: true, valign: 'middle' }

  const dPct = (v, neg = false) => {
    if (v === null) return { text: '—', options: { align: 'right', color: MUTED, fontFace: FONT, fontSize: 11, valign: 'middle' } }
    const pos = v >= 0
    return {
      text: `${pos ? '+' : ''}${v.toFixed(1)}% ${pos ? '✅' : '❌'}`,
      options: { align: 'right', color: pos ? G_600 : DANGER, bold: true, fontFace: FONT, fontSize: 11, valign: 'middle' },
    }
  }
  const cell = (v, label) => ({
    text: [
      { text: fmt(v) + '  ', options: { bold: true, color: TEXT, fontFace: FONT, fontSize: 11 } },
      { text: `(${label})`, options: { color: MUTED, fontFace: FONT, fontSize: 9 } },
    ],
    options: { align: 'right', valign: 'middle' },
  })
  const cellMay = (v, label, hl = false) => ({
    text: [
      { text: fmt(v) + '  ', options: { bold: true, color: G_DEEP, fontFace: FONT, fontSize: 11 } },
      { text: `(${label})`, options: { color: hl ? DANGER : G_700, fontFace: FONT, fontSize: 9 } },
    ],
    options: { align: 'right', valign: 'middle', fill: { color: G_50 } },
  })
  const empty = { text: '—', options: { align: 'right', color: MUTED, fontFace: FONT, fontSize: 11, valign: 'middle' } }

  const tableData = [
    [
      { text: 'DoW', options: hStyle },
      { text: 'มี.ค.', options: hStyle },
      { text: 'เม.ย.', options: hStyle },
      { text: 'พ.ค. 🎯', options: { ...hStyle, fill: { color: G_500 } } },
      { text: 'Δ vs มี.ค.', options: hStyle },
      { text: 'Δ vs เม.ย.', options: hStyle },
      { text: 'หมายเหตุ', options: { ...hStyle, align: 'left' } },
    ],
    [{ text: 'จันทร์', options: dowStyle }, cell(6851, '16/3'), cell(7740, '20/4'), cellMay(6459, '18/5'), dPct(-5.7), dPct(-16.5),
      { text: '⚠ drop', options: { color: GOLD, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
    [{ text: 'อังคาร', options: dowStyle }, cell(7492, '17/3'), empty, cellMay(5707, '19/5', true), dPct(-23.8), empty,
      { text: '🚨 outage 6 ชม.', options: { color: DANGER, bold: true, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
    [{ text: 'พุธ', options: dowStyle }, cell(7112, '18/3'), empty, cellMay(7666, '20/5'), dPct(7.8), empty,
      { text: '✅ growth', options: { color: G_600, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
    [{ text: 'พฤหัส', options: dowStyle }, cell(6634, '19/3'), cell(6726, '16/4'), empty, empty, empty,
      { text: 'data ไม่พอ', options: { color: MUTED, italic: true, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
    [{ text: 'ศุกร์', options: dowStyle }, cell(6769, '20/3'), cell(7208, '17/4'), empty, empty, empty,
      { text: 'data ไม่พอ', options: { color: MUTED, italic: true, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
    [{ text: 'เสาร์', options: dowStyle }, empty, cell(8567, '18/4'), cellMay(7163, '16/5'), empty, dPct(-16.4),
      { text: '⚠ drop', options: { color: GOLD, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
    [{ text: 'อาทิตย์', options: dowStyle }, empty, cell(9254, '19/4'), cellMay(8713, '17/5'), empty, dPct(-5.8),
      { text: '⚖️ flat', options: { color: TEXT, fontFace: FONT, fontSize: 10, valign: 'middle' } }],
  ]

  s.addTable(tableData, {
    x: 0.4, y: 1.05, w: 9.2,
    colW: [0.85, 1.4, 1.4, 1.6, 1.35, 1.35, 1.25],
    rowH: 0.34,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  // Insight
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 3.95, w: 9.2, h: 1.2,
    fill: { color: WARN_L }, line: { color: GOLD, width: 1.2 } })
  s.addText('💡 Key insights', { x: 0.55, y: 4.05, w: 9, h: 0.3, fontSize: 11.5, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText([
    { text: '• ', options: {} },
    { text: 'อังคาร พ.ค. −23.8% vs มี.ค.', options: { bold: true, color: DANGER } },
    { text: ' — สาเหตุหลักจาก outage 6 ชม. (Day 19) ไม่ใช่ campaign performance', options: { breakLine: true } },
    { text: '• ', options: {} },
    { text: 'เสาร์/อาทิตย์ พ.ค. < เม.ย.', options: { bold: true } },
    { text: ' — เพราะ เม.ย. มีสงกรานต์-postpone → traffic peak weekend หลังสงกรานต์', options: { breakLine: true } },
    { text: '• ', options: {} },
    { text: 'พุธ พ.ค. +7.8% vs มี.ค.', options: { bold: true, color: G_600 } },
    { text: ' — campaign lift จริงที่ apples-to-apples (ทั้ง 2 ไม่มี outage/holiday bias)', options: {} },
  ], {
    x: 0.55, y: 4.35, w: 9, h: 0.75,
    fontSize: 10, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SECTION: 👥 CUSTOMER
// =============================================================

// SLIDE 7: Engagement Win
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '👥 CUSTOMER', 'Engagement Win — 51% Repeat Rate', 7, 16)
  sectionHeader(s, '💚 Engagement สูง 2× industry')

  bigStat(s, 0.4, 1.1, 2.3, 1.2, '51%',      'อัตราสแกนซ้ำ', 'industry avg 25-30%', G_600)
  bigStat(s, 2.85, 1.1, 2.3, 1.2, '0.8 นาที', 'ค่ามัธยฐานช่วง', 'batch scan behavior', G_500)
  bigStat(s, 5.3, 1.1, 2.3, 1.2, '73%',      'กลับ < 1 ชม.', 'sticky users', G_700)
  bigStat(s, 7.75, 1.1, 1.85, 1.2, '2.9',    'avg สแกน/คน', 'sum 5 days', G_600)

  s.addChart(pres.charts.BAR, [{
    name: 'จำนวนผู้ใช้',
    labels: ['1 สแกน', '2-5 สแกน', '6-10 สแกน', '10+ สแกน'],
    values: [6221, 5084, 925, 418],
  }], {
    x: 0.4, y: 2.5, w: 6.0, h: 2.6,
    barDir: 'col',
    chartColors: [MUTED, G_600, G_700, GOLD],
    showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: G_DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    showLegend: false,
    showTitle: true, title: 'การกระจายตัว: สแกนต่อคน (sum 5 วัน)',
    titleFontSize: 11, titleColor: G_DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.5, w: 3.0, h: 2.6,
    fill: { color: G_50 }, line: { color: G_500, width: 1 } })
  s.addText('💡 ความหมาย', {
    x: 6.75, y: 2.6, w: 2.8, h: 0.3,
    fontSize: 12, fontFace: FONT, color: G_DEEP, bold: true, margin: 0,
  })
  s.addText([
    { text: '• ครึ่งหนึ่งของคน ', options: {} },
    { text: 'กลับมาสแกนซ้ำ', options: { bold: true, color: G_600 } },
    { text: ' (ไม่ใช่ครั้งเดียวจบ)', options: { breakLine: true } },
    { text: '\n• 0.8 นาที = ', options: {} },
    { text: 'สแกนหลายซองในครั้งเดียว', options: { bold: true } },
    { text: ' (batch)', options: { breakLine: true } },
    { text: '\n• 73% กลับมาภายใน 1 ชม. = ', options: {} },
    { text: 'sticky', options: { bold: true } },
    { text: ' — คนติดเล่น', options: { breakLine: true } },
    { text: '\n• 1,343 คน scan 6+ ครั้ง = ', options: {} },
    { text: 'heavy users', options: { bold: true, color: G_700 } },
  ], {
    x: 6.75, y: 2.95, w: 2.8, h: 2.1,
    fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 3, margin: 0,
  })
}

// SLIDE 8: Acquisition + Geographic
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '👥 CUSTOMER', 'Acquisition + Geographic', 8, 16)
  sectionHeader(s, '🆕 สมาชิกใหม่ + ภูมิศาสตร์')

  bigStat(s, 0.4, 1.1, 2.3, 1.1, '2,504', '🆕 สมาชิกใหม่รวม', '6 วัน • avg 417/วัน', G_600)
  bigStat(s, 2.85, 1.1, 2.3, 1.1, '85%',  '✅ Activation rate', 'สมัครแล้วสแกน', G_500)
  bigStat(s, 5.3, 1.1, 2.3, 1.1, '835K',  '👥 สมาชิกสะสมระบบ', 'cumulative', G_700)
  bigStat(s, 7.75, 1.1, 1.85, 1.1, '14.5%','🌱 First-time', 'Day 20 newest cohort', G_600)

  // Stacked bar
  s.addChart(pres.charts.BAR, [
    { name: 'สมาชิกใหม่', labels: ['16', '17', '18', '19', '20', '21'], values: [440, 460, 480, 308, 413, 403] },
    { name: 'สมาชิกเก่า', labels: ['16', '17', '18', '19', '20'], values: [2305, 2617, 2153, 1702, 2316] },
  ], {
    x: 0.4, y: 2.4, w: 5.3, h: 2.7,
    barDir: 'col', barGrouping: 'stacked',
    chartColors: [G_500, G_700],
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    showValue: true, dataLabelColor: WHITE, dataLabelFontFace: FONT, dataLabelFontSize: 9,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valGridLine: { color: SOFT, size: 0.5 },
    showTitle: true, title: 'สมาชิกใหม่ vs เก่า (5 วัน)',
    titleFontSize: 11, titleColor: G_DEEP, titleFontFace: FONT,
  })

  // Top จังหวัด with anomaly
  const provHeader = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', fontFace: FONT, fontSize: 9 } })
  const provRows = [
    [provHeader('#'), provHeader('จังหวัด'), provHeader('Avg/user'), provHeader('flag')],
    ...[
      { rank: 1, name: 'กรุงเทพ',      avg: 2.51 },
      { rank: 2, name: 'สมุทรปราการ',   avg: 4.36 },
      { rank: 3, name: 'สระบุรี',       avg: 17.80, alert: true },
      { rank: 4, name: 'เชียงใหม่',     avg: 3.05 },
      { rank: 5, name: 'ชลบุรี',        avg: 2.81 },
      { rank: 6, name: 'นครราชสีมา',   avg: 3.30 },
      { rank: 7, name: 'สงขลา',        avg: 3.67 },
      { rank: 8, name: 'นนทบุรี',       avg: 2.26 },
    ].map(p => [
      { text: String(p.rank), options: { align: 'center', color: TEXT, fontFace: FONT, fontSize: 9 } },
      { text: p.name + (p.alert ? ' 🚨' : ''), options: { color: p.alert ? DANGER : TEXT, bold: p.alert, fontFace: FONT, fontSize: 9 } },
      { text: p.avg.toFixed(2), options: { align: 'right', color: p.alert ? DANGER : TEXT, bold: p.alert, fontFace: FONT, fontSize: 9 } },
      { text: p.alert ? '🚨 fraud' : (p.avg > 4 ? '⚠️' : 'OK'), options: { align: 'center', color: p.alert ? DANGER : MUTED, fontFace: FONT, fontSize: 9 } },
    ]),
  ]
  s.addTable(provRows, {
    x: 5.9, y: 2.4, w: 3.7, colW: [0.35, 1.5, 0.85, 1.0],
    rowH: 0.28, border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addText([
    { text: '🚨 ', options: { color: DANGER } },
    { text: 'สระบุรี Day 20', options: { bold: true, color: DANGER } },
    { text: ' — 20 users สแกน 356 ครั้ง = ', options: {} },
    { text: '17.8 ครั้ง/คน', options: { bold: true } },
    { text: ' (vs avg 2.9) — fraud cluster ต้อง investigate', options: {} },
  ], {
    x: 0.4, y: 5.0, w: 9.2, h: 0.2,
    fontSize: 10, fontFace: FONT, color: TEXT, italic: true, margin: 0,
  })
}

// SLIDE 9: RFM + Heavy Users
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '👥 CUSTOMER', 'RFM Segmentation + Heavy Users', 9, 16)
  sectionHeader(s, '🎯 Segmentation + Fraud Audit')

  // LEFT — RFM
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.05, w: 4.5, h: 4.05,
    fill: { color: G_50 }, line: { color: G_500, width: 1 } })
  s.addText('🎯 RFM Segmentation', { x: 0.55, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })
  s.addText('ลูกค้าสะสมทั้งระบบ 8,355 คน', { x: 0.55, y: 1.45, w: 4.3, h: 0.25, fontSize: 10, fontFace: FONT, color: MUTED, italic: true, margin: 0 })

  const rfm = [
    { name: 'Champion', count: 1388, pct: 16.6, color: G_600, note: 'สแกนล่าสุด + ถี่' },
    { name: 'Loyal',    count: 1322, pct: 15.8, color: G_500, note: 'ปานกลาง' },
    { name: 'At Risk',  count: 1959, pct: 23.4, color: GOLD,  note: 'ถี่แต่หายไป' },
    { name: 'Lost',     count: 1383, pct: 16.6, color: DANGER, note: 'หายไปนาน' },
    { name: 'Other',    count: 2303, pct: 27.6, color: '94A3B8', note: 'ใหม่/ไม่แอคทีฟ' },
  ]
  rfm.forEach((seg, i) => {
    const y = 1.85 + i * 0.6
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 4.3, h: 0.5,
      fill: { color: WHITE }, line: { color: seg.color, width: 1 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 0.08, h: 0.5,
      fill: { color: seg.color }, line: { color: seg.color } })
    s.addText(seg.name, { x: 0.75, y: y + 0.05, w: 1.3, h: 0.2, fontSize: 11, fontFace: FONT, color: seg.color, bold: true, margin: 0 })
    s.addText(seg.note, { x: 0.75, y: y + 0.26, w: 1.7, h: 0.2, fontSize: 9, fontFace: FONT, color: MUTED, margin: 0 })
    s.addText(fmt(seg.count), { x: 3.5, y: y + 0.06, w: 1.0, h: 0.25, fontSize: 14, fontFace: FONT, color: G_DEEP, bold: true, align: 'right', margin: 0 })
    s.addText(seg.pct.toFixed(1) + '%', { x: 3.5, y: y + 0.3, w: 1.0, h: 0.18, fontSize: 9, fontFace: FONT, color: MUTED, align: 'right', margin: 0 })
  })

  // RIGHT — Heavy Users (Day 20)
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.05, w: 4.5, h: 4.05,
    fill: { color: DANGER_L }, line: { color: DANGER, width: 1.5 } })
  s.addText('🚩 Heavy Users — Day 20 (Top 5)', { x: 5.25, y: 1.15, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText('🚨 พบ anomaly — 2 ราย scan 201 ครั้งเท่ากัน', { x: 5.25, y: 1.45, w: 4.3, h: 0.25, fontSize: 10, fontFace: FONT, color: DANGER, bold: true, italic: true, margin: 0 })

  const heavyH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', fontFace: FONT, fontSize: 9 } })
  const heavy = [
    [heavyH('User'), heavyH('จังหวัด'), heavyH('Scans'), heavyH('SKU'), heavyH('flag')],
    ...[
      { user: 'a5b2d2d6', prov: 'สมุทรปราการ',  scans: 201, sku: 8,  alert: '🚨 BOT' },
      { user: 'bbe6c398', prov: 'สระบุรี',       scans: 201, sku: 29, alert: '🚨 BOT' },
      { user: '59820080', prov: 'เพชรบุรี',      scans: 108, sku: 14, alert: '⚠ HEAVY' },
      { user: '9e8ae769', prov: 'สระบุรี',       scans: 103, sku: 20, alert: '⚠ HEAVY' },
      { user: 'cdd58ec8', prov: 'พิษณุโลก',      scans:  66, sku: 5,  alert: '⚠' },
    ].map(u => [
      { text: u.user, options: { color: G_700, bold: true, fontFace: 'Courier New', fontSize: 9 } },
      { text: u.prov, options: { color: TEXT, fontFace: FONT, fontSize: 9 } },
      { text: String(u.scans), options: { align: 'right', color: u.scans >= 200 ? DANGER : TEXT, bold: true, fontFace: FONT, fontSize: 9 } },
      { text: String(u.sku), options: { align: 'right', color: u.sku <= 10 ? GOLD : TEXT, fontFace: FONT, fontSize: 9 } },
      { text: u.alert, options: { align: 'center', color: u.alert.includes('🚨') ? DANGER : GOLD, bold: u.alert.includes('🚨'), fontFace: FONT, fontSize: 8.5 } },
    ]),
  ]
  s.addTable(heavy, {
    x: 5.25, y: 1.85, w: 4.2,
    colW: [1.0, 1.15, 0.7, 0.55, 0.8],
    rowH: 0.32, border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addText([
    { text: '\n💡 Action: ', options: { bold: true, color: G_DEEP } },
    { text: 'Champion+Loyal 32% = VIP base • ', options: {} },
    { text: 'audit 2 users @ 201 ก่อน prize draw', options: { bold: true, color: DANGER } },
  ], {
    x: 5.25, y: 4.55, w: 4.2, h: 0.55,
    fontSize: 10, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SECTION: 📦 PRODUCT
// =============================================================

// SLIDE 10: Boss SKU + Pareto
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📦 PRODUCT', 'Boss SKU + Concentration', 10, 16)
  sectionHeader(s, '🏆 Boss SKU + Pareto Risk')

  // LEFT — Boss spotlight
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 5, h: 4.0, fill: { color: G_DEEP }, line: { color: G_DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 0.15, h: 4.0, fill: { color: GOLD_L }, line: { color: GOLD_L } })
  s.addText('🏆 BOSS SKU', { x: 0.75, y: 1.25, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD_L, bold: true, charSpacing: 6, margin: 0 })
  s.addText('ดีดีครีมแตงโม', { x: 0.75, y: 1.55, w: 4.5, h: 0.5, fontSize: 22, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText('L3-8G  •  ซอง 8 กรัม  •  49 บาท', { x: 0.75, y: 2.1, w: 4.5, h: 0.25, fontSize: 10.5, fontFace: FONT, color: GOLD_L, margin: 0 })
  s.addText('14,148', { x: 0.75, y: 2.4, w: 4.5, h: 0.85, fontSize: 48, fontFace: FONT, color: GOLD_L, bold: true, margin: 0 })
  s.addText('สิทธิ์รวม 6 วัน  •  25.2% ของแคมเปญ', { x: 0.75, y: 3.25, w: 4.5, h: 0.25, fontSize: 10.5, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  const subData = [
    { val: '14,148', lab: 'สแกน (perScan ×1)' },
    { val: '6,089',  lab: 'Users (sum)' },
    { val: '2,358',  lab: 'สิทธิ์/วัน' },
    { val: '1×',     lab: 'spec multiplier' },
  ]
  subData.forEach((d, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 0.75 + col * 2.4
    const y = 3.65 + row * 0.65
    s.addText(d.val, { x, y, w: 2.2, h: 0.35, fontSize: 16, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(d.lab, { x, y: y + 0.32, w: 2.2, h: 0.2, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  // RIGHT — Pareto bars + Risk
  s.addText('การกระจุกตัว (Pareto)', { x: 5.6, y: 1.15, w: 4.0, h: 0.35, fontSize: 13, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })

  const pareto = [
    { label: 'Top 1 (L3-8G)', val: 25, color: GOLD_L },
    { label: 'Top 3 SKU',     val: 44, color: G_500 },
    { label: 'Top 10 SKU',    val: 72, color: G_DEEP },
  ]
  pareto.forEach((p, i) => {
    const y = 1.6 + i * 0.7
    s.addText(p.label, { x: 5.6, y, w: 4.0, h: 0.3, fontSize: 11, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: y + 0.3, w: 4.0, h: 0.25, fill: { color: SOFT }, line: { color: BORDER, width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: y + 0.3, w: 4.0 * (p.val / 100), h: 0.25, fill: { color: p.color }, line: { color: p.color } })
    s.addText(p.val + '%', { x: 5.6 + 4.0 * (p.val / 100) - 0.6, y: y + 0.3, w: 0.6, h: 0.25, fontSize: 10, fontFace: FONT, color: WHITE, bold: true, align: 'right', valign: 'middle', margin: 0 })
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: 3.85, w: 4.0, h: 1.25, fill: { color: DANGER_L }, line: { color: DANGER, width: 1.5 } })
  s.addText('⚠️  Concentration Risk', { x: 5.75, y: 3.95, w: 3.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText('ถ้า L3-8G stock-out จะกระทบ 25.2% ของแคมเปญ — เตรียม backup supply + alert เมื่อ inv < 7 วัน',
    { x: 5.75, y: 4.3, w: 3.8, h: 0.75, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0 })
}

// SLIDE 11: Top 10 SKU
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📦 PRODUCT', 'Top 10 SKU (6-day cumulative)', 11, 16)
  sectionHeader(s, '🏆 Top 10 SKU', 'รวม 6 วัน')

  const hStyle = { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 10 }
  const rank = (n) => ({
    text: String(n),
    options: { align: 'center', bold: true, color: WHITE,
      fill: { color: n === 1 ? GOLD : n === 2 ? '94A3B8' : n === 3 ? 'EA580C' : G_600 },
      fontFace: FONT, fontSize: 12, valign: 'middle' },
  })

  // Reranked by SPEC tickets (scans × perScan from spec) — 6 days
  const top10 = [
    { rank: 1,  sku: 'L3-8G',   name: 'ดีดีครีมแตงโม 8 กรัม',     tx: 14148, u: 6089, p: 1, sh: 25.2 },
    { rank: 2,  sku: 'L3-40G',  name: 'ดีดีครีมแตงโม 40 กรัม',    tx:  6425, u: 1126, p: 5, sh: 11.4 },
    { rank: 3,  sku: 'L4-8G',   name: 'เซรั่มลำไย 8 กรัม',         tx:  4210, u: 2208, p: 1, sh:  7.5 },
    { rank: 4,  sku: 'L6-8G',   name: 'เซรั่มแครอท 8 กรัม',        tx:  3155, u: 1731, p: 1, sh:  5.6 },
    { rank: 5,  sku: 'L10-7G',  name: 'กันแดด 3D ออร่า 7 กรัม',    tx:  2756, u: 1620, p: 1, sh:  4.9 },
    { rank: 6,  sku: 'L4-40G',  name: 'เซรั่มลำไย 40 กรัม',       tx:  2285, u:  457, p: 5, sh:  4.1 },
    { rank: 7,  sku: 'L6-40G',  name: 'เซรั่มแครอท 40 กรัม',      tx:  2110, u:  422, p: 5, sh:  3.8 },
    { rank: 8,  sku: 'L7-6G',   name: 'โดสส้มแดง 6 กรัม',          tx:  1835, u:  935, p: 1, sh:  3.3 },
    { rank: 9,  sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน 10 กรัม', tx:  1772, u: 1110, p: 1, sh:  3.2 },
    { rank: 10, sku: 'L10-30G', name: 'กันแดด 3D ออร่า 30 กรัม',  tx:  1655, u:  331, p: 5, sh:  2.9 },
  ]
  const tableData = [
    [
      { text: '#', options: hStyle },
      { text: 'SKU', options: hStyle },
      { text: 'ชื่อสินค้า', options: { ...hStyle, align: 'left' } },
      { text: 'สิทธิ์/scan', options: hStyle },
      { text: 'สิทธิ์รวม', options: hStyle },
      { text: 'Users', options: hStyle },
      { text: '% Share', options: hStyle },
      { text: 'Share bar', options: hStyle },
    ],
    ...top10.map(r => [
      rank(r.rank),
      { text: r.sku, options: { color: G_700, bold: true, fontFace: 'Courier New', fontSize: 10, valign: 'middle' } },
      { text: r.name, options: { color: TEXT, fontFace: FONT, fontSize: 10.5, valign: 'middle' } },
      { text: String(r.p), options: { align: 'center', color: TEXT, bold: true, fontFace: FONT, fontSize: 10,
        fill: { color: r.p === 1 ? SOFT : r.p >= 5 ? '#FEF3C7' : '#DBEAFE' }, valign: 'middle' } },
      { text: fmt(r.tx), options: { align: 'right', color: G_DEEP, bold: true, fontFace: FONT, fontSize: 12, valign: 'middle' } },
      { text: fmt(r.u), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10, valign: 'middle' } },
      { text: r.sh.toFixed(1) + '%', options: { align: 'right', color: G_700, bold: true, fontFace: FONT, fontSize: 10.5, valign: 'middle' } },
      { text: '▇'.repeat(Math.max(1, Math.min(12, Math.round(r.sh / 3)))),
        options: { color: r.rank === 1 ? GOLD : G_600, fontFace: FONT, fontSize: 10, valign: 'middle' } },
    ]),
  ]

  s.addTable(tableData, {
    x: 0.3, y: 1.0, w: 9.4,
    colW: [0.4, 0.95, 2.85, 0.85, 1.0, 0.85, 0.9, 1.6],
    rowH: 0.3,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.65, w: 9.2, h: 0.5,
    fill: { color: G_50 }, line: { color: G_500, width: 1 } })
  s.addText([
    { text: '💡 ', options: { fontSize: 13 } },
    { text: 'Top 10 รวม ', options: { bold: true, fontSize: 11 } },
    { text: '40,351 สิทธิ์ = 71.8% ', options: { bold: true, color: G_700, fontSize: 11 } },
    { text: 'ของแคมเปญ — Pareto • Boss ', options: { fontSize: 11 } },
    { text: 'L3-8G', options: { bold: true, color: G_DEEP, fontSize: 11 } },
    { text: ' 25.2% • Top 3 รวม 44% • 4 ตัวพรีเมียม 40g/30g เด้งเข้า Top 10', options: { fontSize: 11 } },
  ], {
    x: 0.55, y: 4.7, w: 9, h: 0.4,
    fontFace: FONT, valign: 'middle', margin: 0,
  })
}

// SLIDE 12: Dead SKU + Tier Mix
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📦 PRODUCT', 'SKU Health: Dead SKU + Tier Mix', 12, 16)
  sectionHeader(s, '💀 SKU Portfolio Health')

  // LEFT — Tier mix
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 4.5, h: 4.0,
    fill: { color: G_50 }, line: { color: G_500, width: 1 } })
  s.addText('🎯 Tier Mix — สัดส่วนสิทธิ์ (ตามสเปก)', { x: 0.55, y: 1.2, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })

  // Stacked horizontal bar — SPEC tickets (66.8% / 3.4% / 29.8%)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 1.6, w: 4.2 * 0.668, h: 0.4,
    fill: { color: G_600 }, line: { color: G_600 } })
  s.addText('67%', { x: 0.55, y: 1.6, w: 4.2 * 0.668, h: 0.4, fontSize: 11, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55 + 4.2 * 0.668, y: 1.6, w: 4.2 * 0.034, h: 0.4,
    fill: { color: G_400 }, line: { color: G_400 } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55 + 4.2 * 0.702, y: 1.6, w: 4.2 * 0.298, h: 0.4,
    fill: { color: G_200 }, line: { color: G_200 } })
  s.addText('30%', { x: 0.55 + 4.2 * 0.702, y: 1.6, w: 4.2 * 0.298, h: 0.4, fontSize: 11, fontFace: FONT, color: G_DEEP, bold: true, align: 'center', valign: 'middle', margin: 0 })

  // Tier rows — SPEC calculated (scans × perScan) — 6 days
  const tiers = [
    { name: '1 สิทธิ์/scan',  sku: 44, share: 66.8, count: 37547, color: G_600 },
    { name: '2 สิทธิ์/scan',  sku:  5, share: 3.4,  count:  1910, color: G_400 },
    { name: '3+ สิทธิ์/scan', sku: 30, share: 29.8, count: 16754, color: G_200 },
  ]
  tiers.forEach((t, i) => {
    const y = 2.25 + i * 0.55
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 4.2, h: 0.45,
      fill: { color: WHITE }, line: { color: t.color, width: 1 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 0.08, h: 0.45,
      fill: { color: t.color }, line: { color: t.color } })
    s.addText(t.name, { x: 0.75, y: y + 0.05, w: 1.8, h: 0.18, fontSize: 11, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })
    s.addText(`${t.sku} SKUs · ${fmt(t.count)} ใบ`, { x: 0.75, y: y + 0.24, w: 2.3, h: 0.18, fontSize: 9, fontFace: FONT, color: MUTED, margin: 0 })
    s.addText(t.share.toFixed(1) + '%', { x: 3.3, y: y + 0.1, w: 1.3, h: 0.3, fontSize: 14, fontFace: FONT, color: G_DEEP, bold: true, align: 'right', margin: 0 })
  })

  s.addText('💡 Premium tier (3+ สิทธิ์) ครอง 30% — push bundle promo เพื่อเพิ่ม share อีก', {
    x: 0.55, y: 4.6, w: 4.2, h: 0.4, fontSize: 9.5, fontFace: FONT, color: G_700, italic: true, margin: 0,
  })

  // RIGHT — Dead SKU + KPI
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 1.1, w: 4.5, h: 1.9,
    fill: { color: DANGER_L }, line: { color: DANGER, width: 1.5 } })
  s.addText('💀 Dead SKU (19 ตัว)', { x: 5.25, y: 1.2, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText('20.4% ของ portfolio — ไม่มีคนสแกนเลยตลอดแคมเปญ', { x: 5.25, y: 1.5, w: 4.3, h: 0.25, fontSize: 10, fontFace: FONT, color: MUTED, margin: 0 })
  s.addText([
    { text: '• ', options: {} },
    { text: 'เจลดาวเรือง JH701-8G/40G + JHK1-40G', options: { breakLine: true } },
    { text: '• ', options: {} },
    { text: 'เจลมะรุม JH702-8G/40G + JHK2-40G', options: { breakLine: true } },
    { text: '• ', options: {} },
    { text: 'อีอีคูชั่น JHQ1/Q2-30G + L8A/B-30G', options: { breakLine: true } },
    { text: '\n→ Action: audit shelf placement + QR visibility', options: { bold: true, color: DANGER } },
  ], {
    x: 5.25, y: 1.85, w: 4.3, h: 1.1, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })

  // KPI strip
  bigStat(s, 5.1, 3.15, 2.15, 1.0, '93', 'SKU ทั้งหมด', '74 active / 19 dead', G_700)
  bigStat(s, 7.45, 3.15, 2.15, 1.0, '78%', 'Active rate', '74/93 SKUs', G_500)

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 4.3, w: 4.5, h: 0.8,
    fill: { color: G_50 }, line: { color: G_500, width: 1 } })
  s.addText('🎁 Tier Upsell Bundle', { x: 5.25, y: 4.4, w: 4.3, h: 0.25, fontSize: 11, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })
  s.addText('ดัน customer ขึ้น Tier 2/3+ ผ่าน "ซื้อซองได้ 1 สิทธิ์ • ซื้อหลอด/เซ็ทได้ 2-5 สิทธิ์"',
    { x: 5.25, y: 4.65, w: 4.3, h: 0.4, fontSize: 10, fontFace: FONT, color: TEXT, margin: 0 })
}

// =============================================================
// SECTION: 🔮 FORECAST + ACTION
// =============================================================

// SLIDE 13: Forecast
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '🔮 FORECAST', 'Prize Pool Forecast', 13, 16)
  sectionHeader(s, '🔮 Forecast → Prize Pool ที่ต้องเตรียม')

  bigStat(s, 0.4, 1.1, 2.3, 1.1, '47K+',  '🎟️ สิทธิ์ Day 1-5', 'ตามสเปก', G_600)
  bigStat(s, 2.85, 1.1, 2.3, 1.1, '9,425','📊 เฉลี่ย/วัน', 'สิทธิ์/วัน', G_500)
  bigStat(s, 5.3, 1.1, 2.3, 1.1, '212',   '📅 เหลือ (วัน)', 'ถึง 18 ธ.ค.', G_700)
  bigStat(s, 7.75, 1.1, 1.85, 1.1, '~2M', '🎯 Recommended', 'prize budget', GOLD)

  s.addChart(pres.charts.BAR, [{
    name: 'สิทธิ์',
    labels: ['Conservative\n(decay 30%)', 'Mid\n(decay 15%)', 'Linear\n(velocity คงเดิม)'],
    values: [1400000, 2000000, 2500000],
  }], {
    x: 0.4, y: 2.5, w: 6.0, h: 2.6,
    barDir: 'col', chartColors: [GOLD],
    showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: G_DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valGridLine: { color: SOFT, size: 0.5 },
    showLegend: false,
    showTitle: true, title: 'ประมาณการสิทธิ์ถึง 18 ธ.ค. — 3 scenarios',
    titleFontSize: 11, titleColor: G_DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.5, w: 3.0, h: 2.6,
    fill: { color: WARN_L }, line: { color: GOLD, width: 1.2 } })
  s.addText('💡 คำแนะนำ', { x: 6.75, y: 2.6, w: 2.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText('ตั้ง prize pool รับ ~2M (Mid case)', { x: 6.75, y: 2.95, w: 2.8, h: 0.4, fontSize: 12, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
  s.addText([
    { text: '• Buffer +500K (Linear)', options: { breakLine: true } },
    { text: '• Trim -600K (Conservative)', options: { breakLine: true } },
    { text: '• ปรับ scenario ทุก 2 สัปดาห์', options: { breakLine: true } },
    { text: '\nหมายเหตุ: ', options: { bold: true } },
    { text: 'ตัวเลขจะแม่นขึ้นเมื่อ data ครบ 2-3 สัปดาห์', options: { italic: true, color: MUTED } },
  ], {
    x: 6.75, y: 3.45, w: 2.8, h: 1.6,
    fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 4, margin: 0,
  })
}

// SLIDE 14: Watch Points
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '🔮 ACTION', 'ที่ต้องเฝ้าระวัง + คุณภาพระบบ', 14, 16)
  sectionHeader(s, '⚠️ Watch Points + System Quality')

  // 4 watch points
  s.addText('🔍 ที่ต้องเฝ้าระวัง', { x: 0.4, y: 1.1, w: 4.7, h: 0.3, fontSize: 13, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })

  const watch = [
    { num: '1', t: 'DB Bug ขาดสิทธิ์ 11.5K ใบ', d: '−24% จาก spec — ต้องแก้ก่อน 18 ธ.ค.', color: DANGER },
    { num: '2', t: '🚨 Fraud: 2 users @ 201 scans', d: 'Day 20 a5b2/bbe6 — bot/script suspect', color: DANGER },
    { num: '3', t: 'สระบุรี cluster 17.8/user', d: '20 users / 356 scans — fraud cluster', color: DANGER },
    { num: '4', t: 'Outage 6 ชม. root cause TBD', d: 'API/Cloudflare suspect — log lost', color: GOLD },
  ]
  watch.forEach((w, i) => {
    const y = 1.45 + i * 0.85
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 4.7, h: 0.75,
      fill: { color: w.color === GOLD ? WARN_L : DANGER_L }, line: { color: w.color === GOLD ? '#FECACA' : 'FECACA', width: 0.5 } })
    s.addShape(pres.shapes.OVAL, { x: 0.55, y: y + 0.17, w: 0.4, h: 0.4, fill: { color: w.color }, line: { color: w.color } })
    s.addText(w.num, { x: 0.55, y: y + 0.17, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(w.t, { x: 1.05, y: y + 0.05, w: 4.0, h: 0.3, fontSize: 11.5, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })
    s.addText(w.d, { x: 1.05, y: y + 0.35, w: 4.0, h: 0.4, fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Quality
  s.addText('🛡️ คุณภาพ + ความถูกต้อง (5 วัน)', { x: 5.3, y: 1.1, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })

  bigStat(s, 5.3, 1.5, 2.1, 1.1, '88.3%', 'อัตราสำเร็จ', '5-day avg', G_600)
  bigStat(s, 7.5, 1.5, 2.1, 1.1, '11', 'multi-account', 'suspect users', DANGER)

  const vH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', fontFace: FONT, fontSize: 9 } })
  const vRows = [
    [vH('ประเภท'), vH('จำนวน'), vH('%')],
    [
      { text: '✅ สแกนสำเร็จ', options: { color: G_600, bold: true, fontFace: FONT, fontSize: 10 } },
      { text: fmt(35711), options: { align: 'right', color: TEXT, bold: true, fontFace: FONT, fontSize: 10 } },
      { text: '88.3%', options: { align: 'right', color: G_600, bold: true, fontFace: FONT, fontSize: 10 } },
    ],
    [
      { text: '⛔ ซ้ำตัวเอง', options: { color: MUTED, fontFace: FONT, fontSize: 10 } },
      { text: fmt(3296), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10 } },
      { text: '8.2%', options: { align: 'right', color: MUTED, fontFace: FONT, fontSize: 10 } },
    ],
    [
      { text: '⛔ ซ้ำคนอื่น + ไม่พบ', options: { color: DANGER, fontFace: FONT, fontSize: 10 } },
      { text: fmt(1420), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10 } },
      { text: '3.5%', options: { align: 'right', color: DANGER, bold: true, fontFace: FONT, fontSize: 10 } },
    ],
  ]
  s.addTable(vRows, {
    x: 5.3, y: 2.8, w: 4.3, colW: [2.2, 1.2, 0.9],
    rowH: 0.32, border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })
}

// SLIDE 15: Recommendations + Asks + Summary
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '🎯 SUMMARY', 'Recommendations + Asks + Next Steps', 15, 16)
  sectionHeader(s, '🎯 Action Items + ขอ Approve')

  // Left: 6 priority actions
  s.addText('🚀 Action Items (เรียงตามความเร่งด่วน)', { x: 0.4, y: 1.05, w: 5.5, h: 0.3, fontSize: 13, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })

  const recs = [
    { num: '1', priority: 'NOW',  color: DANGER,  title: 'แก้ DB ticket bug',          desc: 'dev priority 0 — ขาด 11.5K ใบ ก่อน prize draw 18 ธ.ค.' },
    { num: '2', priority: 'NOW',  color: DANGER,  title: 'Investigate fraud Day 20',    desc: 'a5b2/bbe6 @ 201 scans + สระบุรี cluster — ก่อน cutover' },
    { num: '3', priority: 'WK',   color: GOLD,    title: 'Boss SKU stock plan',         desc: 'L3-8G drives 33% — backup supply + alert inv < 7 วัน' },
    { num: '4', priority: 'WK',   color: G_500,   title: 'LINE broadcast 18:30 peak',  desc: 'Push ก่อน 19-21 น. peak hour (avg 1,800 scans)' },
    { num: '5', priority: 'MO',   color: G_500,   title: 'Dead SKU audit (19 ตัว)',     desc: 'ตรวจ shelf placement + QR visibility' },
    { num: '6', priority: 'QR',   color: G_600,   title: 'VIP/Win-back program',        desc: 'Champion 1,388 (VIP) + Lost 1,383 (win-back coupon)' },
  ]
  recs.forEach((r, i) => {
    const y = 1.4 + i * 0.6
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 5.5, h: 0.52,
      fill: { color: i % 2 === 0 ? G_50 : WHITE }, line: { color: BORDER, width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 0.08, h: 0.52, fill: { color: r.color }, line: { color: r.color } })
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.08, w: 0.36, h: 0.36, fill: { color: r.color }, line: { color: r.color } })
    s.addText(r.num, { x: 0.6, y: y + 0.08, w: 0.36, h: 0.36, fontSize: 13, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(r.priority, { x: 1.1, y: y + 0.04, w: 0.5, h: 0.2, fontSize: 8, fontFace: FONT, color: r.color, bold: true, margin: 0 })
    s.addText(r.title, { x: 1.65, y: y + 0.02, w: 4.1, h: 0.22, fontSize: 11, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })
    s.addText(r.desc, { x: 1.65, y: y + 0.26, w: 4.2, h: 0.25, fontSize: 9, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Right: ASKS (upper) — shorter to fit Summary below
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.05, w: 3.5, h: 2.7, fill: { color: G_DEEP }, line: { color: G_DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.05, w: 0.1, h: 2.7, fill: { color: GOLD_L }, line: { color: GOLD_L } })
  s.addText('❓ ASKS', { x: 6.3, y: 1.1, w: 3.2, h: 0.3, fontSize: 14, fontFace: FONT, color: GOLD_L, bold: true, margin: 0 })
  s.addText('สิ่งที่ขอ approve / decision', { x: 6.3, y: 1.4, w: 3.2, h: 0.22, fontSize: 9, fontFace: FONT, color: 'CBD5E1', italic: true, margin: 0 })

  s.addText([
    { text: '✓ Sign-off ', options: { bold: true } },
    { text: 'DB bug fix P0', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✓ Approve ', options: { bold: true } },
    { text: 'fraud investigation', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✓ Approve งบ ', options: { bold: true } },
    { text: 'LINE broadcast', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✓ Decision ', options: { bold: true } },
    { text: 'stock L3-8G buffer', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✓ Confirm ', options: { bold: true } },
    { text: 'prize pool ~2M', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✓ Confirm ', options: { bold: true } },
    { text: 'update รายสัปดาห์', options: { color: GOLD_L, bold: true } },
  ], {
    x: 6.3, y: 1.68, w: 3.2, h: 2.0,
    fontSize: 10, fontFace: FONT, color: WHITE, paraSpaceAfter: 2, margin: 0,
  })

  // SUMMARY box (below ASKS) — gold accent
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 3.85, w: 3.5, h: 1.25,
    fill: { color: GOLD }, line: { color: GOLD } })
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 3.85, w: 0.1, h: 1.25, fill: { color: G_DEEP }, line: { color: G_DEEP } })
  s.addText('📌 SUMMARY', { x: 6.3, y: 3.9, w: 3.2, h: 0.28, fontSize: 13, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText([
    { text: '🟢 ', options: {} },
    { text: 'Engagement สูง', options: { bold: true } },
    { text: ' (51% — 2× industry)', options: { breakLine: true } },
    { text: '🔴 ', options: {} },
    { text: 'DB bug + Fraud', options: { bold: true } },
    { text: ' = critical risks', options: { breakLine: true } },
    { text: '🎯 ', options: {} },
    { text: 'ขอ approve 6 action items', options: { bold: true } },
  ], {
    x: 6.3, y: 4.18, w: 3.2, h: 0.9,
    fontSize: 10.5, fontFace: FONT, color: WHITE, paraSpaceAfter: 0, margin: 0,
  })
}

// =============================================================
// SLIDE 16: FINAL EXECUTIVE SUMMARY (1 page wrap-up)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: G_DEEP }

  // Gold side bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: GOLD_L }, line: { color: GOLD_L } })

  // Top title
  s.addText('FINAL SUMMARY', {
    x: 0.5, y: 0.25, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT, color: GOLD_L, bold: true, charSpacing: 6, margin: 0,
  })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน — Day 1-6 (16-21 พ.ค. 2026)', {
    x: 0.5, y: 0.55, w: 9, h: 0.4,
    fontSize: 18, fontFace: FONT, color: WHITE, bold: true, margin: 0,
  })
  s.addText("Jula's Herb × ไทยรัฐ TV  •  สรุปภาพรวมเสนอเจ้านาย", {
    x: 0.5, y: 0.95, w: 9, h: 0.25,
    fontSize: 11, fontFace: FONT, color: 'CBD5E1', italic: true, margin: 0,
  })

  // 4 KPI strip
  const kpis = [
    { val: '42,298', lab: 'สแกนสำเร็จ',      sub: '6 วัน · avg 7,050/วัน' },
    { val: '56,211', lab: 'สิทธิ์รวมกิจกรรม', sub: 'scans × spec' },
    { val: '2,504',  lab: 'สมาชิกใหม่',       sub: 'avg 417/วัน · 97% activated' },
    { val: '94.4%',  lab: '% เวลาทำงาน',     sub: '🚨 ล่ม 2 ครั้ง = 8 ชม.' },
  ]
  kpis.forEach((k, i) => {
    const x = 0.5 + i * 2.3
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.35, w: 2.15, h: 1.0,
      fill: { color: WHITE, transparency: 88 }, line: { color: GOLD_L, width: 1 } })
    s.addText(k.val, { x: x + 0.1, y: 1.42, w: 1.95, h: 0.45, fontSize: 22, fontFace: FONT, color: GOLD_L, bold: true, margin: 0 })
    s.addText(k.lab, { x: x + 0.1, y: 1.88, w: 1.95, h: 0.25, fontSize: 10.5, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(k.sub, { x: x + 0.1, y: 2.10, w: 1.95, h: 0.22, fontSize: 8.5, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  // LEFT — Wins
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.55, w: 4.5, h: 1.95,
    fill: { color: WHITE, transparency: 90 }, line: { color: G_400, width: 1.2 } })
  s.addText('🟢  จุดเด่น (Wins)', {
    x: 0.65, y: 2.62, w: 4.3, h: 0.28,
    fontSize: 12.5, fontFace: FONT, color: G_200, bold: true, margin: 0,
  })
  s.addText([
    { text: '✅  Engagement สูง 2× industry — ', options: { bold: true } },
    { text: 'Repeat rate 51%', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✅  Acquisition โต — ', options: { bold: true } },
    { text: 'สมาชิกใหม่ 2,504 / activation 97%', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✅  True lift ', options: { bold: true } },
    { text: '+2.4% vs มี.ค.', options: { color: GOLD_L, bold: true } },
    { text: ' (baseline สะอาด)', options: { breakLine: true } },
    { text: '✅  Recovery จาก outage — ', options: { bold: true } },
    { text: 'Day 20 +34.4%', options: { color: GOLD_L, bold: true, breakLine: true } },
    { text: '✅  Boss SKU L3-8G ครอง 25.2% — ', options: { bold: true } },
    { text: 'ความนิยมชัด', options: { color: GOLD_L, bold: true } },
  ], {
    x: 0.65, y: 2.92, w: 4.3, h: 1.5,
    fontSize: 10, fontFace: FONT, color: WHITE, paraSpaceAfter: 2, margin: 0,
  })

  // RIGHT — Concerns
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.55, w: 4.5, h: 1.95,
    fill: { color: WHITE, transparency: 90 }, line: { color: DANGER, width: 1.2 } })
  s.addText('🔴  ที่ต้องระวัง (Concerns)', {
    x: 5.25, y: 2.62, w: 4.3, h: 0.28,
    fontSize: 12.5, fontFace: FONT, color: 'FCA5A5', bold: true, margin: 0,
  })
  s.addText([
    { text: '🚨  DB bug — ขาดสิทธิ์ ', options: { bold: true } },
    { text: '13,913 ใบ (−24.8%)', options: { color: 'FCA5A5', bold: true, breakLine: true } },
    { text: '🚨  Outage 2 ครั้งใน 3 วัน — ', options: { bold: true } },
    { text: 'Day19 (6h) + Day21 (2h)', options: { color: 'FCA5A5', bold: true, breakLine: true } },
    { text: '🚨  Fraud cluster สระบุรี — ', options: { bold: true } },
    { text: '20 users สแกน 17.8 ครั้ง/คน', options: { color: 'FCA5A5', bold: true, breakLine: true } },
    { text: '🚨  2 users สแกน 201 ครั้งเป๊ะ — ', options: { bold: true } },
    { text: 'bot/script', options: { color: 'FCA5A5', bold: true, breakLine: true } },
    { text: '⚠  Concentration Risk — ', options: { bold: true } },
    { text: 'Top 10 ครอง 72%', options: { color: 'FCA5A5', bold: true } },
  ], {
    x: 5.25, y: 2.92, w: 4.3, h: 1.5,
    fontSize: 10, fontFace: FONT, color: WHITE, paraSpaceAfter: 2, margin: 0,
  })

  // Bottom — Bottom line + Next steps
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.6, w: 9.1, h: 0.85,
    fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('📌  บรรทัดสุดท้าย', { x: 0.7, y: 4.65, w: 8.7, h: 0.25, fontSize: 11, fontFace: FONT, color: G_DEEP, bold: true, margin: 0 })
  s.addText([
    { text: '5 วันแรก ', options: {} },
    { text: 'ผลสำเร็จเกินคาด ', options: { bold: true, color: G_DEEP } },
    { text: '— engagement ติดตลาด แต่ต้อง ', options: {} },
    { text: 'เคลียร์ 3 ความเสี่ยง', options: { bold: true, color: DANGER } },
    { text: ' (DB bug · fraud · outage) ', options: {} },
    { text: 'ก่อนแจกรางวัล', options: { bold: true, color: DANGER } },
    { text: ' ไม่งั้นภาพลักษณ์เสียแม้ตัวเลขดูดี', options: {} },
  ], {
    x: 0.7, y: 4.90, w: 8.7, h: 0.55,
    fontSize: 11.5, fontFace: FONT, color: G_DEEP, valign: 'middle', margin: 0,
  })
}

// =============================================================
// APPENDIX A1: Time of Day Pattern
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📎 APPENDIX', 'Time of Day Pattern', 'A1', 'A')
  sectionHeader(s, '🕐 ช่วงเวลา — Peak Hour')

  s.addChart(pres.charts.BAR, [{
    name: 'จำนวนสแกน',
    labels: ['00-06', '07-12', '13-18', '19-22'],
    values: [3211, 6514, 6594, 9555],
  }], {
    x: 0.4, y: 1.1, w: 9.2, h: 3.5,
    barDir: 'col',
    chartColors: [G_600],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: G_DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 11,
    valGridLine: { color: SOFT, size: 0.5 },
    showLegend: false,
    showTitle: true, title: 'การกระจายตัวของสแกนรายชั่วโมง (5 วันรวม)',
    titleFontSize: 12, titleColor: G_DEEP, titleFontFace: FONT,
  })

  s.addText([
    { text: '💡 Insight: ', options: { bold: true, color: G_DEEP } },
    { text: '🔥 Peak ', options: {} },
    { text: '19-22 น.', options: { bold: true, color: GOLD } },
    { text: ' (9,555 ครั้ง = 37% ของวัน) → LINE broadcast push ', options: {} },
    { text: '18:30', options: { bold: true } },
    { text: ' จะดักกลุ่มนี้ได้พอดี', options: {} },
  ], {
    x: 0.4, y: 4.7, w: 9.2, h: 0.4,
    fontSize: 11.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// APPENDIX A2: Cohort Retention
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📎 APPENDIX', 'Cohort Retention W0-W3', 'A2', 'A')
  sectionHeader(s, '📅 Cohort Retention')

  const cH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', fontFace: FONT, fontSize: 11 } })
  const cR = (label, w0, w1, w2, w3, count) => {
    const cell = (v) => v === null
      ? { text: '—', options: { align: 'center', color: MUTED, fontFace: FONT, fontSize: 11 } }
      : { text: `${v}%`, options: { align: 'center', color: v >= 70 ? WHITE : v >= 40 ? G_DEEP : '713F12', bold: true,
          fill: { color: v >= 70 ? G_600 : v >= 40 ? G_100 : WARN_L }, fontFace: FONT, fontSize: 11 } }
    return [
      { text: [{ text: label, options: { bold: true, color: G_DEEP, fontFace: FONT, fontSize: 11 } }, { text: ` (${count})`, options: { color: MUTED, fontFace: FONT, fontSize: 9 } }], options: { valign: 'middle' } },
      cell(w0), cell(w1), cell(w2), cell(w3),
    ]
  }

  const cohortRows = [
    [cH('Cohort'), cH('Week 0'), cH('Week 1'), cH('Week 2'), cH('Week 3')],
    cR('16 พ.ค. cohort', 100, 48, null, null, 440),
    cR('17 พ.ค. cohort', 100, 45, null, null, 460),
    cR('18 พ.ค. cohort', 100, null, null, null, 480),
    cR('19 พ.ค. cohort', 100, null, null, null, 308),
    cR('20 พ.ค. cohort', 100, null, null, null, 413),
  ]

  s.addTable(cohortRows, {
    x: 0.4, y: 1.1, w: 9.2,
    colW: [3.0, 1.55, 1.55, 1.55, 1.55],
    rowH: 0.5,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addText([
    { text: '💡 Insight: ', options: { bold: true, color: G_DEEP } },
    { text: 'W1 retention ~45-48% — น่าตั้ง ', options: {} },
    { text: '2nd-scan bonus', options: { bold: true, color: G_700 } },
    { text: ' ใน Day 2-3 เพื่อ activate กลุ่ม drop-off', options: { breakLine: true } },
    { text: '\n⏳ ', options: {} },
    { text: 'W2+ data ยังไม่พอ', options: { italic: true } },
    { text: ' — รอเก็บข้อมูลถึง 30 พ.ค. ค่อยมี W2 retention ของ Day 1-2 cohort', options: { color: MUTED } },
  ], {
    x: 0.4, y: 4.0, w: 9.2, h: 1.0,
    fontSize: 11, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0,
  })
}

// =============================================================
// APPENDIX A3: SKU per Day Matrix
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '📎 APPENDIX', 'SKU × Day Matrix (Top 10)', 'A3', 'A')
  sectionHeader(s, '📋 SKU × Day Matrix — Top 10')

  const hStyle = { bold: true, color: WHITE, fill: { color: G_DEEP }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 9 }
  const skuStyle = { color: G_700, bold: true, fontFace: 'Courier New', fontSize: 9, valign: 'middle' }
  const numStyle = { align: 'right', color: TEXT, fontFace: FONT, fontSize: 9.5, valign: 'middle' }
  const bigNum = { align: 'right', color: G_DEEP, bold: true, fontFace: FONT, fontSize: 10.5, valign: 'middle' }

  function row(sku, p, d16, d17, d18, d19, d20) {
    const tot = d16 + d17 + d18 + d19 + d20
    return [
      { text: sku, options: skuStyle },
      { text: String(p), options: { align: 'center', color: TEXT, bold: true, fontFace: FONT, fontSize: 9,
          fill: { color: p === 1 ? SOFT : p >= 5 ? '#FEF3C7' : '#DBEAFE' }, valign: 'middle' } },
      { text: fmt(d16), options: numStyle },
      { text: fmt(d17), options: numStyle },
      { text: fmt(d18), options: numStyle },
      { text: fmt(d19), options: numStyle },
      { text: fmt(d20), options: numStyle },
      { text: fmt(tot), options: bigNum },
    ]
  }

  const fullRows = [
    [
      { text: 'SKU', options: hStyle },
      { text: 'per/scan', options: hStyle },
      { text: '16/5', options: hStyle },
      { text: '17/5', options: hStyle },
      { text: '18/5', options: hStyle },
      { text: '19/5', options: hStyle },
      { text: '20/5', options: hStyle },
      { text: 'รวม', options: { ...hStyle, fill: { color: GOLD } } },
    ],
    row('L3-8G',   1, 2452, 2822, 2157, 1746, 2699),
    row('L4-8G',   1,  659,  813,  692,  656,  685),
    row('L6-8G',   1,  499,  631,  470,  473,  620),
    row('L10-7G',  1,  471,  539,  513,  354,  449),
    row('L7-6G',   1,  302,  443,  335,  201,  302),
    row('L13-10G', 1,  328,  411,  291,  225,  249),
    row('C4-8G',   1,  255,  300,  196,  173,  208),
    row('L3-40G',  5,  223,  265,  202,  171,  242),
    row('L19-8G',  1,  205,  217,  164,  138,  205),
    row('L8B-6G',  1,  134,  159,  109,  114,  156),
  ]

  s.addTable(fullRows, {
    x: 0.3, y: 1.1, w: 9.4,
    colW: [1.0, 0.85, 1.05, 1.05, 1.05, 1.05, 1.05, 1.3],
    rowH: 0.32,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addText('🟡 SKU per_scan สูง (×5) = L3-40G ดีดีครีมแตงโม 40g → ตามสเปกควรได้ 5,425 สิทธิ์ vs DB ให้ 1,103 → ขาด 4,322 ใบ',
    { x: 0.4, y: 4.55, w: 9.2, h: 0.5, fontSize: 10.5, fontFace: FONT, color: TEXT, italic: true, margin: 0 })
}

// =============================================================
// Write
// =============================================================
const outPath = path.resolve(__dirname, 'scan-lucky-rich-day1-5-GREEN-v2.pptx')
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Generated:', outPath)
  console.log('   • 15 main slides + 3 appendix = 18 total')
  console.log('   • Sections: Cover/Exec • SCAN(4) • CUSTOMER(3) • PRODUCT(3) • FORECAST+ACTION(3)')
  console.log('   • Green theme (Jula\'s Herb tone)')
})
