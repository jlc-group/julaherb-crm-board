// Build PowerPoint deck (10-slide version with Baseline Comparison table)
// Run: node build-deck-10.js → outputs scan-lucky-rich-day1-3-10slides.pptx
const pptxgen = require('pptxgenjs')
const fs = require('fs')
const path = require('path')

const LIVE = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '..', 'scan-lucky-rich-dashboard', 'src', 'lib', 'live-data.json'),
  'utf8'
))

// ── Colors ──
const GREEN = '16A34A'
const DEEP  = '14532D'
const GOLD  = 'FACC15'
const GOLD_DEEP = 'CA8A04'
const WHITE = 'FFFFFF'
const BG    = 'F8FAFC'
const TEXT  = '1F2937'
const MUTED = '6B7280'
const RED   = 'EF4444'
const GREEN_50 = 'F0FDF4'
const RED_50   = 'FEF2F2'

const FONT = 'Calibri'
const fmt = (n) => Number(n).toLocaleString('en-US')

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'
pres.author = "Jula's Herb x ไทยรัฐ TV"
pres.title  = 'Campaign Report Day 1-3 (10 slides)'

// ── Helpers ──
function header(slide, title, num, total = 10) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.45,
    fill: { color: DEEP }, line: { color: DEEP },
  })
  slide.addText(title, {
    x: 0.4, y: 0.05, w: 8.5, h: 0.35,
    fontSize: 14, fontFace: FONT, color: WHITE, bold: true, valign: 'middle', margin: 0,
  })
  slide.addText(`${num} / ${total}`, {
    x: 9, y: 0.05, w: 0.9, h: 0.35,
    fontSize: 10, fontFace: FONT, color: GOLD, align: 'right', valign: 'middle', margin: 0,
  })
  slide.addText("สแกนลุ้นรวย สวยลุ้นล้าน  •  Jula's Herb × ไทยรัฐ TV  •  16-18 พ.ค. 2026", {
    x: 0.4, y: 5.3, w: 9.2, h: 0.25,
    fontSize: 8.5, fontFace: FONT, color: MUTED, align: 'left', valign: 'middle', margin: 0,
  })
}

function bigStat(slide, x, y, w, h, value, label, sub, color = GREEN) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h, fill: { color: WHITE }, line: { color: 'E5E7EB', width: 0.5 },
    shadow: { type: 'outer', blur: 6, offset: 2, angle: 90, color: '000000', opacity: 0.06 },
  })
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.05, fill: { color }, line: { color },
  })
  slide.addText(label, {
    x: x + 0.15, y: y + 0.12, w: w - 0.3, h: 0.25,
    fontSize: 9, fontFace: FONT, color: MUTED, bold: true, valign: 'middle', margin: 0,
  })
  slide.addText(value, {
    x: x + 0.15, y: y + 0.35, w: w - 0.3, h: 0.55,
    fontSize: 24, fontFace: FONT, color: DEEP, bold: true, valign: 'middle', margin: 0,
  })
  if (sub) slide.addText(sub, {
    x: x + 0.15, y: y + 0.92, w: w - 0.3, h: 0.25,
    fontSize: 9, fontFace: FONT, color: MUTED, valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 1: Cover + Executive Summary
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: DEEP }
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: GOLD }, line: { color: GOLD } })

  s.addText('CAMPAIGN REPORT — DAY 1-3', { x: 0.6, y: 0.35, w: 9, h: 0.3, fontSize: 12, fontFace: FONT, color: GOLD, bold: true, charSpacing: 8, margin: 0 })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', { x: 0.6, y: 0.7, w: 9, h: 0.65, fontSize: 32, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText("16-18 พ.ค. 2026  •  Jula's Herb × ไทยรัฐ TV", { x: 0.6, y: 1.35, w: 9, h: 0.3, fontSize: 13, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  const stats = [
    { val: '22,301', lab: 'สิทธิ์รวม',         sub: '+7.2% vs มี.ค.', color: GOLD },
    { val: '8,101',  lab: 'Unique Users',     sub: '50%+ repeat',     color: WHITE },
    { val: '78/93',  lab: 'SKU Active',       sub: '16 dead SKU',     color: WHITE },
    { val: '33%',    lab: 'Hero SKU (L3-8G)', sub: 'ดีดีครีมแตงโม',     color: GOLD },
  ]
  stats.forEach((st, i) => {
    const x = 0.6 + i * 2.3
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.1, h: 1.55, fill: { color: 'FFFFFF', transparency: 92 }, line: { color: GOLD, width: 1 } })
    s.addText(st.val, { x: x + 0.1, y: 2.05, w: 1.9, h: 0.7, fontSize: 30, fontFace: FONT, color: st.color, bold: true, margin: 0 })
    s.addText(st.lab, { x: x + 0.1, y: 2.78, w: 1.9, h: 0.3, fontSize: 11, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(st.sub, { x: x + 0.1, y: 3.1, w: 1.9, h: 0.3, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.85, w: 8.8, h: 1.3, fill: { color: 'FFFFFF', transparency: 88 }, line: { color: GOLD, width: 1 } })
  s.addText('💡 Bottom line', { x: 0.8, y: 3.95, w: 8.5, h: 0.3, fontSize: 12, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('Engagement สูง (repeat 50%+, batch scan) + acquisition โต (new signup 13.1% → 17.6%) — แต่ lift ยอดสแกนจริงน้อย (+1.2% MoM) → ต้องเพิ่ม activation', {
    x: 0.8, y: 4.3, w: 8.5, h: 0.8, fontSize: 12, fontFace: FONT, color: WHITE, margin: 0,
  })
}

// =============================================================
// SLIDE 2: 3-Day Performance
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '3-Day Performance — รายวัน', 2)

  const days = LIVE.snapshot.days
  // 3 day cards
  days.forEach((d, i) => {
    const x = 0.4 + i * 2.05
    const isPeak = d.rights === Math.max(...days.map(x => x.rights))
    bigStat(s, x, 0.7, 1.95, 1.4, fmt(d.rights), `${d.date.split('-')[2]} พ.ค. (${d.weekday})`, `${fmt(d.users)} users • ${d.skuActive}/93 SKU`, isPeak ? GREEN : GOLD_DEEP)
  })
  bigStat(s, 6.6, 0.7, 3, 1.4, fmt(LIVE.snapshot.totals.rights), 'รวม 3 วัน', `${fmt(LIVE.snapshot.totals.users)} unique users`, DEEP)

  // Bar chart
  s.addChart(pres.charts.BAR, [{
    name: 'สิทธิ์',
    labels: days.map(d => `${d.date.split('-')[2]} พ.ค.\n(${d.weekday})`),
    values: days.map(d => d.rights),
  }], {
    x: 0.4, y: 2.3, w: 6, h: 2.7,
    barDir: 'col', showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 12,
    chartColors: ['94A3B8', GREEN, 'CBD5E1'],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.3, w: 3, h: 2.7, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('Pattern ที่เห็น', { x: 6.75, y: 2.4, w: 2.8, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'เสาร์→อาทิตย์ พุ่ง +21.6%', options: { bullet: true, breakLine: true } },
    { text: 'จันทร์ตก -26% from peak', options: { bullet: true, breakLine: true } },
    { text: 'Weekend = peak ชัดเจน', options: { bullet: true, breakLine: true } },
    { text: 'ลง content ก่อน peak 30 นาที', options: { bullet: true } },
  ], { x: 6.75, y: 2.8, w: 2.8, h: 2.15, fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0 })
}

// =============================================================
// SLIDE 3: Baseline Comparison ⭐ NEW
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Baseline Comparison — 16-18 ของ มี.ค./เม.ย./พ.ค.', 3)
  s.addText('เทียบกับเดือนก่อนทั้งราย-วันและรวม', { x: 0.4, y: 0.55, w: 9, h: 0.3, fontSize: 14, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  // Helper: cell text with weekday inline
  const cell = (val, wd, opts = {}) => ({
    text: [
      { text: fmt(val) + '  ', options: { bold: true, color: opts.color || TEXT, fontFace: FONT, fontSize: 12 } },
      { text: '(' + wd + ')', options: { color: MUTED, fontFace: FONT, fontSize: 9 } },
    ],
    options: { align: 'right', valign: 'middle', ...(opts.fill ? { fill: { color: opts.fill } } : {}) },
  })
  const deltaCell = (pct, opts = {}) => {
    const pos = pct >= 0
    const txt = (pos ? '+' : '') + pct.toFixed(1) + '% ' + (pos ? '✅' : '❌')
    return {
      text: txt,
      options: {
        align: 'right', valign: 'middle', bold: true, color: pos ? GREEN : RED, fontFace: FONT, fontSize: 12,
        ...(opts.fill ? { fill: { color: opts.fill } } : {}),
      },
    }
  }
  const dayCell = (n, opts = {}) => ({
    text: String(n), options: { align: 'center', bold: true, color: GREEN, fontFace: FONT, fontSize: 14, valign: 'middle', ...(opts.fill ? { fill: { color: opts.fill } } : {}) },
  })

  const headerStyle = (txt, fill = DEEP) => ({
    text: txt,
    options: { bold: true, color: WHITE, fill: { color: fill }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 11 },
  })

  const tableData = [
    [
      headerStyle('วันที่'),
      headerStyle('มี.ค.'),
      headerStyle('เม.ย.'),
      headerStyle('พ.ค. 🎯', GREEN),
      headerStyle('Δ vs เม.ย.'),
      headerStyle('Δ vs มี.ค.'),
    ],
    [
      dayCell(16),
      cell(7452, 'จันทร์'),
      cell(7375, 'พฤหัส'),
      cell(8082, 'เสาร์', { fill: GREEN_50, color: DEEP }),
      deltaCell(9.6),
      deltaCell(8.5),
    ],
    [
      dayCell(17),
      cell(8236, 'อังคาร'),
      cell(8004, 'ศุกร์'),
      cell(9772, 'อาทิตย์', { fill: GREEN_50, color: DEEP }),
      deltaCell(22.1),
      deltaCell(18.6),
    ],
    [
      dayCell(18),
      cell(7841, 'พุธ'),
      cell(9524, 'เสาร์'),
      cell(7358, 'จันทร์', { fill: GREEN_50, color: DEEP }),
      deltaCell(-22.7),
      deltaCell(-6.2),
    ],
    [
      { text: 'รวม', options: { align: 'center', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: fmt(23529), options: { align: 'right', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: fmt(24903), options: { align: 'right', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: fmt(25212), options: { align: 'right', bold: true, color: DEEP, fill: { color: GREEN }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: '+1.2%', options: { align: 'right', bold: true, color: GREEN, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: '+7.2%', options: { align: 'right', bold: true, color: GREEN, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
    ],
  ]

  s.addTable(tableData, {
    x: 0.4, y: 0.95, w: 9.2,
    colW: [0.7, 1.7, 1.7, 1.8, 1.65, 1.65],
    rowH: 0.55,
    border: { type: 'solid', pt: 0.5, color: 'E2E8F0' },
    fontFace: FONT,
  })

  // Legend
  s.addText('🎯 = เดือนที่มีแคมเปญ', { x: 7.5, y: 3.6, w: 2.1, h: 0.25, fontSize: 9, fontFace: FONT, color: MUTED, italic: true, align: 'right', margin: 0 })

  // Caveat callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.0, w: 9.2, h: 1.1, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1.2 } })
  s.addText('⚠️  Weekday-match warning', { x: 0.55, y: 4.1, w: 9, h: 0.3, fontSize: 12, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText('พ.ค. 16-17 = เสาร์-อาทิตย์ (weekend natural peak) แต่ มี.ค./เม.ย. 16-17 = วันธรรมดา → lift +22.1% ของวัน 17 อาจมาจาก weekend effect ไม่ใช่แคมเปญทั้งหมด — รวม 3 วัน lift จริงคือ +1.2% MoM', {
    x: 0.55, y: 4.4, w: 9, h: 0.65, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 4: Customer Acquisition
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Customer Acquisition 🆕', 4)
  s.addText('New customers ขึ้นต่อเนื่องทั้ง 3 วัน', { x: 0.4, y: 0.55, w: 9, h: 0.3, fontSize: 14, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const cm = LIVE.customer_mix || []
  bigStat(s, 0.4, 0.95, 2.3, 1.2, fmt(LIVE.snapshot.totals.users), 'Total Users', '3-day unique')
  bigStat(s, 2.85, 0.95, 2.3, 1.2, fmt(cm.reduce((s,d)=>s+d.newSignup,0)), 'New Signup รวม', '15% ของ users')
  bigStat(s, 5.3, 0.95, 2.3, 1.2, '100%', 'Profile Completion', 'high quality leads', GOLD_DEEP)
  bigStat(s, 7.75, 0.95, 1.85, 1.2, '17.6%', 'Day-3 new rate', 'from 13.1% ⬆️', GREEN)

  s.addChart(pres.charts.BAR, [
    { name: 'New', labels: cm.map(d => d.date.split('-')[2] + ' พ.ค.'), values: cm.map(d => d.newSignup) },
    { name: 'Existing', labels: cm.map(d => d.date.split('-')[2] + ' พ.ค.'), values: cm.map(d => d.existing) },
  ], {
    x: 0.4, y: 2.3, w: 6, h: 2.7,
    barDir: 'col', barGrouping: 'stacked',
    chartColors: [GREEN, GOLD],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    showTitle: true, title: 'New vs Existing per Day', titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.3, w: 3, h: 2.7, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('💡 Key Insight', { x: 6.75, y: 2.4, w: 2.8, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('New signup rate', { x: 6.75, y: 2.75, w: 2.8, h: 0.3, fontSize: 10, fontFace: FONT, color: TEXT, margin: 0 })
  s.addText('13.1% → 14.2% → 17.6%', { x: 6.75, y: 3.05, w: 2.8, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })
  s.addText([
    { text: 'แม้ยอดวันรวมลด แต่กระแสคนใหม่ยังขึ้น', options: { bullet: true, breakLine: true } },
    { text: 'Viral spread กำลังทำงาน', options: { bullet: true } },
  ], { x: 6.75, y: 3.55, w: 2.8, h: 1.4, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 5: Engagement Win
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Engagement Win 💚', 5)
  s.addText('Repeat rate สูงกว่า industry avg 2 เท่า', { x: 0.4, y: 0.55, w: 9, h: 0.3, fontSize: 14, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  bigStat(s, 0.4, 0.95, 2.3, 1.3, '51%', 'Repeat Rate', 'industry 25-30%', GREEN)
  bigStat(s, 2.85, 0.95, 2.3, 1.3, '0.8 นาที', 'Median gap', 'batch scan behavior')
  bigStat(s, 5.3, 0.95, 2.3, 1.3, '73%', 'Return < 1 ชม.', 'sticky users', GOLD_DEEP)
  bigStat(s, 7.75, 0.95, 1.85, 1.3, '2.84', 'สิทธิ์/คน', '3-day avg', GOLD_DEEP)

  const dist = [
    { label: '1 scan',  val: 4041 },
    { label: '2 scans', val: 1695 },
    { label: '3 scans', val:  756 },
    { label: '4-5',     val:  755 },
    { label: '6-10',    val:  584 },
    { label: '10+',     val:  270 },
  ]
  s.addChart(pres.charts.BAR, [{
    name: 'Users', labels: dist.map(d => d.label), values: dist.map(d => d.val),
  }], {
    x: 0.4, y: 2.4, w: 6.2, h: 2.7,
    barDir: 'col',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 10,
    chartColors: ['94A3B8', GREEN, '15803D', DEEP, GOLD, GOLD_DEEP],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
    showTitle: true, title: 'Distribution: scans per user (3-day total)',
    titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 2.4, w: 2.8, h: 2.7, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('💡 What it means', { x: 6.95, y: 2.5, w: 2.6, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'Median 0.8 นาที = สแกนหลายซองในครั้งเดียว', options: { bullet: true, breakLine: true } },
    { text: '50% มี scan 2+ ครั้ง — ไม่ "ครั้งเดียวจบ"', options: { bullet: true, breakLine: true } },
    { text: '6+ scans = heavy users 854 คน', options: { bullet: true, breakLine: true } },
    { text: 'แคมเปญสร้าง brand love', options: { bullet: true } },
  ], { x: 6.95, y: 2.9, w: 2.6, h: 2.1, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 6: Hero SKU + Concentration
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Hero SKU 🏆 — L3-8G ดีดีครีมแตงโม', 6)

  // Hero box
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 5, h: 4.45, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 0.15, h: 4.45, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('🏆 BOSS SKU', { x: 0.75, y: 0.85, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, bold: true, charSpacing: 6, margin: 0 })
  s.addText('ดีดีครีมแตงโม', { x: 0.75, y: 1.15, w: 4.5, h: 0.5, fontSize: 22, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText('L3-8G  •  ซองเล็ก 8G  •  14 บาท', { x: 0.75, y: 1.7, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, margin: 0 })

  s.addText('7,431', { x: 0.75, y: 2.1, w: 4.5, h: 1.0, fontSize: 56, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('สิทธิ์รวม 3 วัน  •  33% ของยอดทั้งแคมเปญ', { x: 0.75, y: 3.05, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  const subData = [
    { val: '3,187', lab: 'Users' },
    { val: '2.33', lab: 'สิทธิ์/คน' },
    { val: '2,477', lab: 'velocity/วัน' },
    { val: '1,178', lab: 'peak users D2' },
  ]
  subData.forEach((d, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.75 + col * 2.2
    const y = 3.5 + row * 0.75
    s.addText(d.val, { x, y, w: 2.0, h: 0.4, fontSize: 20, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(d.lab, { x, y: y + 0.4, w: 2.0, h: 0.25, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  // Right column: Pareto + risk
  s.addText('Concentration (Pareto)', { x: 5.6, y: 0.75, w: 4, h: 0.35, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  const paretoData = [
    { label: 'Top 1 (L3-8G)', val: 33, color: GOLD },
    { label: 'Top 3 SKU',     val: 50, color: GREEN },
    { label: 'Top 10 SKU',    val: 76, color: DEEP },
  ]
  paretoData.forEach((p, i) => {
    const y = 1.25 + i * 0.7
    s.addText(p.label, { x: 5.6, y, w: 4, h: 0.3, fontSize: 11, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: y + 0.3, w: 4, h: 0.25, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: y + 0.3, w: 4 * (p.val / 100), h: 0.25, fill: { color: p.color }, line: { color: p.color } })
    s.addText(p.val + '%', { x: 5.6 + 4 * (p.val / 100) - 0.6, y: y + 0.3, w: 0.6, h: 0.25, fontSize: 10, fontFace: FONT, color: WHITE, bold: true, align: 'right', valign: 'middle', margin: 0 })
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: 3.55, w: 4, h: 1.55, fill: { color: RED_50 }, line: { color: RED, width: 1 } })
  s.addText('⚠️  Concentration Risk', { x: 5.75, y: 3.65, w: 3.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText('ถ้า L3-8G stock-out = กระทบ 33% ของยอดทันที — ต้องเตรียม backup supply + alert ถ้า inv < 7 วัน', {
    x: 5.75, y: 4.0, w: 3.8, h: 1.05, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 7: SKU Portfolio + Geographic
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'SKU Portfolio + Geographic Reach', 7)

  // Left: SKU Portfolio
  s.addText('📦 SKU Portfolio Health', { x: 0.4, y: 0.6, w: 4.6, h: 0.35, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  bigStat(s, 0.4, 1.0, 2.2, 1.15, '78 / 93', 'SKU Active', '84% portfolio')
  bigStat(s, 2.8, 1.0, 2.1, 1.15, '16', 'Dead SKU', '17% portfolio', RED)

  // Cross-size donut
  s.addChart(pres.charts.DOUGHNUT, [{
    name: 'Size Mix',
    labels: ['8G', '7G', '6G', '40G', '70G', '10G', 'อื่นๆ'],
    values: [60, 9, 9, 7, 5, 5, 5],
  }], {
    x: 0.4, y: 2.25, w: 4.5, h: 2.85,
    chartColors: [GREEN, '15803D', DEEP, GOLD, GOLD_DEEP, '6B7280', '94A3B8'],
    chartArea: { fill: { color: WHITE } },
    showLegend: true, legendPos: 'r', legendFontFace: FONT, legendFontSize: 9,
    showPercent: true, dataLabelColor: WHITE, dataLabelFontFace: FONT, dataLabelFontSize: 9,
    showTitle: true, title: 'Cross-Size Distribution',
    titleFontSize: 11, titleColor: DEEP, titleFontFace: FONT,
  })

  // Right: Top จังหวัด
  s.addText('🗺️ Top จังหวัด', { x: 5.1, y: 0.6, w: 4.5, h: 0.35, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  const provinces = (LIVE.provinces || []).slice(0, 8)
  const provHeader = ['#', 'จังหวัด', 'Users', 'Tickets'].map(t => ({
    text: t, options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'center', fontFace: FONT, fontSize: 10 },
  }))
  const provRows = [provHeader, ...provinces.map((p, i) => [
    { text: String(p.rank || i + 1), options: { align: 'center', color: TEXT, fontFace: FONT, fontSize: 10 } },
    { text: p.name || p.province || '-', options: { color: TEXT, bold: i < 3, fontFace: FONT, fontSize: 10 } },
    { text: fmt(p.users || 0), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10 } },
    { text: fmt(p.tickets || p.scans || 0), options: { align: 'right', color: DEEP, bold: true, fontFace: FONT, fontSize: 10 } },
  ])]
  s.addTable(provRows, {
    x: 5.1, y: 1.0, w: 4.5, colW: [0.4, 2.0, 1.0, 1.1],
    rowH: 0.32,
    border: { type: 'solid', pt: 0.5, color: 'E2E8F0' },
    fontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 4.05, w: 4.5, h: 1.05, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1 } })
  s.addText('💡 Note: อุบลฯ เข้า Top 5 วันที่ 18 → การกระจายไปต่างจังหวัดเริ่มเห็นผล', {
    x: 5.25, y: 4.15, w: 4.3, h: 0.9, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 8: Watch Points + Risk/Quality
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Watch Points + Risk/Quality', 8)

  // Left: 4 watch points
  s.addText('⚠️ Watch Points', { x: 0.4, y: 0.6, w: 4.6, h: 0.3, fontSize: 14, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  const watch = [
    { num: '1', t: 'Hero SKU Concentration', d: 'L3-8G = 33% — ถ้า stock-out กระทบทันที' },
    { num: '2', t: 'Day-3 Momentum Drop', d: '-26% from peak — รอดูสัปดาห์ 2 rebound?' },
    { num: '3', t: 'Dead SKU 16 ตัว', d: 'ไม่สแกนเลย 3 วัน → distribution check' },
    { num: '4', t: '1 user 100+ scans/3d', d: 'อาจ sales/multi-account → audit' },
  ]
  watch.forEach((w, i) => {
    const y = 0.95 + i * 0.85
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 4.6, h: 0.75, fill: { color: RED_50 }, line: { color: 'FECACA', width: 0.5 } })
    s.addShape(pres.shapes.OVAL, { x: 0.55, y: y + 0.17, w: 0.4, h: 0.4, fill: { color: RED }, line: { color: RED } })
    s.addText(w.num, { x: 0.55, y: y + 0.17, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(w.t, { x: 1.05, y: y + 0.05, w: 3.9, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(w.d, { x: 1.05, y: y + 0.35, w: 3.9, h: 0.4, fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Right: Risk/Quality
  s.addText('🛡️ Risk & Quality', { x: 5.2, y: 0.6, w: 4.5, h: 0.3, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  bigStat(s, 5.2, 0.95, 2.15, 1.15, '88.2%', 'Valid Scan Rate', 'avg 3 days', GREEN)
  bigStat(s, 7.45, 0.95, 2.15, 1.15, '9', 'Multi-Account', '≥50 scans/3d', RED)

  // Verification mini chart
  s.addChart(pres.charts.BAR, [
    { name: 'Day 16', labels: ['Success', 'Dup Self', 'Dup Other'], values: [7163, 660, 259] },
    { name: 'Day 17', labels: ['Success', 'Dup Self', 'Dup Other'], values: [8713, 755, 304] },
    { name: 'Day 18', labels: ['Success', 'Dup Self', 'Dup Other'], values: [6459, 639, 260] },
  ], {
    x: 5.2, y: 2.3, w: 4.5, h: 2.8,
    barDir: 'col', chartColors: [GREEN, GOLD, GOLD_DEEP],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 9,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 8,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 9,
    showTitle: true, title: 'Verification by Day',
    titleFontSize: 11, titleColor: DEEP, titleFontFace: FONT,
  })
}

// =============================================================
// SLIDE 9: Forecast
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Forecast 🔮 ถึง Draw Date (18 ธ.ค.)', 9)
  s.addText('3 scenarios — แนะนำ config prize รับ ~1M สิทธิ์', { x: 0.4, y: 0.55, w: 9, h: 0.3, fontSize: 14, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const fc = LIVE.forecast || {}
  bigStat(s, 0.4, 0.95, 2.3, 1.15, fmt(fc.to_date || 23922), 'สิทธิ์สะสม', 'as of 19 พ.ค.', GREEN)
  bigStat(s, 2.85, 0.95, 2.3, 1.15, fmt(fc.daily_avg || 7434), 'Daily avg (3 วัน)', 'สิทธิ์/วัน')
  bigStat(s, 5.3, 0.95, 2.3, 1.15, '213', 'Days Remaining', 'ถึง 18 ธ.ค.', GOLD_DEEP)
  bigStat(s, 7.75, 0.95, 1.85, 1.15, '~1M', 'Recommended', 'prize pool', GOLD_DEEP)

  s.addChart(pres.charts.BAR, [{
    name: 'Forecast',
    labels: ['Conservative\n(decay 30%)', 'Mid\n(decay 15%)', 'Linear\n(velocity คงเดิม)'],
    values: [500000, 900000, 1600000],
  }], {
    x: 0.4, y: 2.25, w: 6, h: 2.85,
    barDir: 'col',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    chartColors: [RED, GOLD, GREEN],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
    showTitle: true, title: 'Projected Total Rights by Campaign End',
    titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.25, w: 3, h: 2.85, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1.2 } })
  s.addText('💡 Recommendation', { x: 6.75, y: 2.35, w: 2.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText('ตั้ง prize pool รับ ~1M สิทธิ์ เป็น base case', { x: 6.75, y: 2.7, w: 2.8, h: 0.7, fontSize: 12, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
  s.addText([
    { text: 'มี buffer: +600k (linear)', options: { bullet: true, breakLine: true } },
    { text: 'หรือ trim: -400k (conservative)', options: { bullet: true, breakLine: true } },
    { text: 'ปรับ scenario ทุก 2 สัปดาห์', options: { bullet: true } },
  ], { x: 6.75, y: 3.6, w: 2.8, h: 1.4, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 10: Recommendations + Q&A
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Recommendations + Q&A', 10)
  s.addText('🎯 5 actions priority order', { x: 0.4, y: 0.6, w: 9.2, h: 0.3, fontSize: 14, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const recs = [
    { num: '1', title: 'LINE broadcast push', desc: 'Engagement สูง แต่ activation ต่ำ — broadcast เตือนสิทธิ์ + รอบประกาศ' },
    { num: '2', title: 'Bundle promotion', desc: 'จับคู่ tier 1 + 2 ให้สิทธิ์ x2 — ดัน customer ขึ้น value tier' },
    { num: '3', title: 'Hero SKU stock contingency', desc: 'L3-8G drives 33% — backup supply + alert ถ้า inv < 7 วัน' },
    { num: '4', title: 'Dead SKU audit (16 ตัว)', desc: 'Distribution + POSM check ภายในสัปดาห์นี้' },
    { num: '5', title: 'Content timing', desc: 'ลง ads ก่อน weekend peak 30 นาที + focus เสาร์-อาทิตย์' },
  ]
  recs.forEach((r, i) => {
    const y = 1.0 + i * 0.62
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 5.5, h: 0.55, fill: { color: i % 2 === 0 ? BG : WHITE }, line: { color: 'E5E7EB', width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 0.08, h: 0.55, fill: { color: GREEN }, line: { color: GREEN } })
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.1, w: 0.36, h: 0.36, fill: { color: GREEN }, line: { color: GREEN } })
    s.addText(r.num, { x: 0.6, y: y + 0.1, w: 0.36, h: 0.36, fontSize: 13, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(r.title, { x: 1.1, y: y + 0.04, w: 4.6, h: 0.26, fontSize: 11.5, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(r.desc, { x: 1.1, y: y + 0.3, w: 4.7, h: 0.25, fontSize: 9, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Right: Q&A sidebar
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.0, w: 3.5, h: 4.05, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.0, w: 0.1, h: 4.05, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('❓ Q & A', { x: 6.3, y: 1.15, w: 3.2, h: 0.4, fontSize: 18, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('คำถามที่อยากได้คำตอบ', { x: 6.3, y: 1.55, w: 3.2, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', italic: true, margin: 0 })

  s.addText([
    { text: 'KPI ของแคมเปญคืออะไร?', options: { bullet: true, breakLine: true } },
    { text: 'Media spend ลงไปเท่าไหร่? ROI?', options: { bullet: true, breakLine: true } },
    { text: 'Stock plan สำหรับ Hero SKU?', options: { bullet: true, breakLine: true } },
    { text: 'Approval งบ LINE broadcast?', options: { bullet: true, breakLine: true } },
    { text: 'Next review cadence?', options: { bullet: true } },
  ], { x: 6.3, y: 1.95, w: 3.2, h: 3.0, fontSize: 11, fontFace: FONT, color: WHITE, paraSpaceAfter: 6, margin: 0 })
}

// ── Write ──
const outPath = path.resolve(__dirname, 'scan-lucky-rich-day1-3-10slides.pptx')
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Generated:', outPath)
})
