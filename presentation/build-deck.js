// Build PowerPoint deck: Campaign Report Day 1-3
// Run: node build-deck.js → outputs scan-lucky-rich-day1-3.pptx
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

const FONT = 'Calibri'  // has Thai glyph support universally
const fmt = (n) => Number(n).toLocaleString('en-US')

// ── Setup ──
const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'  // 10 × 5.625
pres.author = "Jula's Herb x ไทยรัฐ TV"
pres.title  = 'Campaign Report Day 1-3'

// ── Helpers ──
function header(slide, title, num) {
  // Top bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.45,
    fill: { color: DEEP }, line: { color: DEEP },
  })
  slide.addText(title, {
    x: 0.4, y: 0.05, w: 8.5, h: 0.35,
    fontSize: 14, fontFace: FONT, color: WHITE, bold: true, valign: 'middle', margin: 0,
  })
  slide.addText(`${num} / 14`, {
    x: 9, y: 0.05, w: 0.9, h: 0.35,
    fontSize: 10, fontFace: FONT, color: GOLD, align: 'right', valign: 'middle', margin: 0,
  })
  // Brand strip at bottom
  slide.addText("สแกนลุ้นรวย สวยลุ้นล้าน  •  Jula's Herb × ไทยรัฐ TV", {
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
// SLIDE 1: Cover
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: DEEP }
  // gold accent
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('CAMPAIGN PERFORMANCE REPORT', {
    x: 0.8, y: 1.3, w: 8.5, h: 0.4,
    fontSize: 13, fontFace: FONT, color: GOLD, bold: true, charSpacing: 8, margin: 0,
  })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', {
    x: 0.8, y: 1.7, w: 8.5, h: 1.0,
    fontSize: 44, fontFace: FONT, color: WHITE, bold: true, margin: 0,
  })
  s.addText('Day 1-3 Summary  •  16-18 พ.ค. 2026', {
    x: 0.8, y: 2.85, w: 8.5, h: 0.5,
    fontSize: 20, fontFace: FONT, color: WHITE, margin: 0,
  })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.6, w: 1.2, h: 0.04, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText("Jula's Herb  ×  ไทยรัฐ TV", {
    x: 0.8, y: 3.75, w: 8.5, h: 0.4,
    fontSize: 16, fontFace: FONT, color: GOLD, italic: true, margin: 0,
  })
  s.addText('Presented: 19 พ.ค. 2026', {
    x: 0.8, y: 5.0, w: 8.5, h: 0.3,
    fontSize: 11, fontFace: FONT, color: 'CBD5E1', margin: 0,
  })
}

// =============================================================
// SLIDE 2: Executive Summary
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Executive Summary', 2)

  s.addText('ภาพรวม 3 วันแรก', {
    x: 0.4, y: 0.55, w: 9, h: 0.4,
    fontSize: 22, fontFace: FONT, color: DEEP, bold: true, margin: 0,
  })

  // Top KPI row
  bigStat(s, 0.4, 1.1, 2.3, 1.25, fmt(LIVE.snapshot.totals.rights), 'สิทธิ์รวม (3 วัน)', '+7.2% vs มี.ค. baseline')
  bigStat(s, 2.85, 1.1, 2.3, 1.25, fmt(LIVE.snapshot.totals.users), 'Unique Users', '50%+ repeat rate')
  bigStat(s, 5.3, 1.1, 2.3, 1.25, '78 / 93', 'SKU Active', '84% portfolio active', GOLD_DEEP)
  bigStat(s, 7.75, 1.1, 1.85, 1.25, '33%', 'Hero SKU Share', 'L3-8G ดีดีครีมแตงโม', GOLD_DEEP)

  // Win/Watch/Action columns
  const colY = 2.7, colH = 2.4
  // Wins
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: colY, w: 3, h: colH, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1.2 } })
  s.addText('✅ Wins', { x: 0.55, y: colY + 0.1, w: 2.8, h: 0.35, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'New signup ขึ้นทุกวัน 13.1% → 17.6%', options: { bullet: true, breakLine: true } },
    { text: 'Repeat scanner 50-53% สูงกว่า industry 2x', options: { bullet: true, breakLine: true } },
    { text: 'Hero SKU emerged ชัดเจน', options: { bullet: true, breakLine: true } },
    { text: 'Top จังหวัดกระจาย — มีต่างจังหวัด ramp up', options: { bullet: true } },
  ], { x: 0.55, y: colY + 0.5, w: 2.8, h: colH - 0.6, fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0 })

  // Watch
  s.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: colY, w: 3, h: colH, fill: { color: 'FEFCE8' }, line: { color: GOLD_DEEP, width: 1.2 } })
  s.addText('⚠️ Watch Points', { x: 3.65, y: colY + 0.1, w: 2.8, h: 0.35, fontSize: 14, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText([
    { text: 'Concentration risk Top 3 = 50%', options: { bullet: true, breakLine: true } },
    { text: '16 SKUs ไม่ถูกสแกน 3 วันติด', options: { bullet: true, breakLine: true } },
    { text: 'Day-3 momentum drop -26%', options: { bullet: true, breakLine: true } },
    { text: 'Weekday-matched lift slight negative', options: { bullet: true } },
  ], { x: 3.65, y: colY + 0.5, w: 2.8, h: colH - 0.6, fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0 })

  // Actions
  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: colY, w: 3, h: colH, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1.2 } })
  s.addText('💡 Recommendations', { x: 6.75, y: colY + 0.1, w: 2.8, h: 0.35, fontSize: 14, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText([
    { text: 'LINE broadcast push engagement', options: { bullet: true, breakLine: true } },
    { text: 'Bundle promotion ดัน tier upgrade', options: { bullet: true, breakLine: true } },
    { text: 'Stock contingency for Hero SKU', options: { bullet: true, breakLine: true } },
    { text: 'Audit Dead SKU + POSM', options: { bullet: true } },
  ], { x: 6.75, y: colY + 0.5, w: 2.8, h: colH - 0.6, fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0 })
}

// =============================================================
// SLIDE 3: 3-Day Performance
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '3-Day Performance Detail', 3)
  s.addText('ภาพรวมรายวัน 16-18 พ.ค. 2026', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 20, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  // KPI by day (3 cards)
  const days = LIVE.snapshot.days
  const dayLabels = days.map(d => d.date.split('-')[2] + ' พ.ค. (' + d.weekday + ')')
  days.forEach((d, i) => {
    const x = 0.4 + i * 2.0
    const isPeak = d.rights === Math.max(...days.map(x => x.rights))
    bigStat(s, x, 1.15, 1.85, 1.3, fmt(d.rights), dayLabels[i], `${fmt(d.users)} users`, isPeak ? GREEN : GOLD_DEEP)
  })
  // Total
  bigStat(s, 6.4, 1.15, 3.2, 1.3, fmt(LIVE.snapshot.totals.rights), 'รวม 3 วัน', `${fmt(LIVE.snapshot.totals.users)} unique users`, DEEP)

  // Bar chart daily
  s.addChart(pres.charts.BAR, [{
    name: 'สิทธิ์รายวัน',
    labels: dayLabels,
    values: days.map(d => d.rights),
  }], {
    x: 0.4, y: 2.65, w: 6, h: 2.5,
    barDir: 'col',
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelColor: DEEP,
    dataLabelFontFace: FONT,
    dataLabelFontSize: 11,
    chartColors: [GREEN],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: MUTED, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontFace: FONT, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 },
    catGridLine: { style: 'none' },
    showLegend: false,
  })

  // Insight panel
  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.65, w: 3, h: 2.5, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('Pattern ที่เห็น', { x: 6.75, y: 2.75, w: 2.8, h: 0.35, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'วันเสาร์ → อาทิตย์ พุ่ง +21.6%', options: { bullet: true, breakLine: true } },
    { text: 'วันจันทร์ตก -26.1% from peak', options: { bullet: true, breakLine: true } },
    { text: 'Weekend = peak ชัดเจน', options: { bullet: true, breakLine: true } },
    { text: 'Plan content ก่อน weekend 30 นาที', options: { bullet: true } },
  ], { x: 6.75, y: 3.2, w: 2.8, h: 1.9, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0 })
}

// =============================================================
// SLIDE 4: Compare vs Previous Months
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'เทียบกับเดือนก่อน (16-18 ของแต่ละเดือน)', 4)
  s.addText('เดือนที่มีแคมเปญทำได้สูงสุดในชุดเปรียบเทียบ', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  // Bar chart 3 months
  s.addChart(pres.charts.BAR, [{
    name: 'สแกนรวม',
    labels: ['มี.ค. (no campaign)', 'เม.ย. (no campaign)', 'พ.ค. (มีแคมเปญ)'],
    values: [23529, 24903, 25212],
  }], {
    x: 0.4, y: 1.1, w: 5.8, h: 3.6,
    barDir: 'col',
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 14,
    chartColors: ['CBD5E1', 'CBD5E1', GREEN],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 },
    catGridLine: { style: 'none' },
    showLegend: false,
  })

  // Right column: big deltas + insights
  bigStat(s, 6.6, 1.1, 3, 1.1, '+7.2%', 'vs มี.ค.', '+1,683 สิทธิ์', GREEN)
  bigStat(s, 6.6, 2.3, 3, 1.1, '+1.2%', 'vs เม.ย. (MoM)', '+309 สิทธิ์', GOLD_DEEP)

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 3.5, w: 3, h: 1.2, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('Note', { x: 6.75, y: 3.6, w: 2.8, h: 0.25, fontSize: 11, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('Weekday-matched analysis แสดงว่า lift บางส่วนมาจาก weekend effect — ดูรายละเอียดใน slide 10', {
    x: 6.75, y: 3.85, w: 2.8, h: 0.8, fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 5: Customer Acquisition
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Customer Acquisition 🆕', 5)
  s.addText('New customers ขึ้นต่อเนื่องทั้ง 3 วัน', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const cm = LIVE.customer_mix || []
  bigStat(s, 0.4, 1.1, 2.3, 1.15, fmt(LIVE.snapshot.totals.users), 'Total Users (3 วัน)', '8,101 คน')
  bigStat(s, 2.85, 1.1, 2.3, 1.15, fmt(cm.reduce((s,d)=>s+d.newSignup,0)), 'New Signup รวม', '14.9% ของ users')
  bigStat(s, 5.3, 1.1, 2.3, 1.15, '100%', 'Profile Completion', 'High quality leads', GOLD_DEEP)
  bigStat(s, 7.75, 1.1, 1.85, 1.15, '17.6%', 'Day-3 new rate', 'จาก 13.1% ⬆️', GREEN)

  // Bar chart new signup by day
  s.addChart(pres.charts.BAR, [{
    name: 'New Signup',
    labels: cm.map(d => d.date.split('-')[2] + ' พ.ค.'),
    values: cm.map(d => d.newSignup),
  }, {
    name: 'Existing',
    labels: cm.map(d => d.date.split('-')[2] + ' พ.ค.'),
    values: cm.map(d => d.existing),
  }], {
    x: 0.4, y: 2.5, w: 6, h: 2.6,
    barDir: 'col', barGrouping: 'stacked',
    chartColors: [GREEN, GOLD],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 },
    catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    showTitle: true, title: 'New vs Existing per Day', titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.5, w: 3, h: 2.6, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('Key Insight', { x: 6.75, y: 2.6, w: 2.8, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'New signup rate', options: { bullet: true, breakLine: true } },
    { text: '   13.1% → 14.2% → 17.6%', options: { breakLine: true, fontSize: 13, bold: true, color: GREEN } },
    { text: 'แม้ยอดวันรวมลด แต่กระแสคนใหม่ยังขึ้น', options: { bullet: true, breakLine: true } },
    { text: 'Implication: viral spread กำลังทำงาน', options: { bullet: true } },
  ], { x: 6.75, y: 3.0, w: 2.8, h: 2.0, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 6: Engagement Win
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Engagement Win 💚', 6)
  s.addText('Repeat rate สูงกว่า industry avg 2 เท่า', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  bigStat(s, 0.4, 1.1, 2.3, 1.3, '51%', 'Repeat Rate', 'industry avg 25-30%', GREEN)
  bigStat(s, 2.85, 1.1, 2.3, 1.3, '0.8 นาที', 'Median gap', 'batch scan behavior')
  bigStat(s, 5.3, 1.1, 2.3, 1.3, '73%', 'Return ใน 1 ชม.', 'sticky users', GOLD_DEEP)
  bigStat(s, 7.75, 1.1, 1.85, 1.3, '2.84', 'สิทธิ์/คน', '3-day avg', GOLD_DEEP)

  // Scan distribution bar
  const dist = [
    { label: '1 scan',    val: 4041 },
    { label: '2 scans',   val: 1695 },
    { label: '3 scans',   val:  756 },
    { label: '4-5',       val:  755 },
    { label: '6-10',      val:  584 },
    { label: '10+',       val:  270 },
  ]
  s.addChart(pres.charts.BAR, [{
    name: 'Users',
    labels: dist.map(d => d.label),
    values: dist.map(d => d.val),
  }], {
    x: 0.4, y: 2.65, w: 6.2, h: 2.45,
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

  s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 2.65, w: 2.8, h: 2.45, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('💡 What it means', { x: 6.95, y: 2.75, w: 2.6, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'Median gap 0.8 นาที = ลูกค้าสแกนหลายซองในครั้งเดียว', options: { bullet: true, breakLine: true } },
    { text: '50% มี scan 2+ ครั้ง — ส่วนใหญ่ไม่ "ครั้งเดียวจบ"', options: { bullet: true, breakLine: true } },
    { text: '6+ scans = heavy users 854 คน', options: { bullet: true } },
  ], { x: 6.95, y: 3.2, w: 2.6, h: 1.85, fontSize: 9.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 7: Hero SKU
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Hero SKU 🏆 — L3-8G ดีดีครีมแตงโม', 7)

  // Hero box (huge)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 5, h: 4.5, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 0.15, h: 4.5, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('BOSS SKU', { x: 0.75, y: 0.9, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, bold: true, charSpacing: 6, margin: 0 })
  s.addText('ดีดีครีมแตงโม', { x: 0.75, y: 1.2, w: 4.5, h: 0.5, fontSize: 24, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText('L3-8G  •  ซองเล็ก 8G  •  14 บาท', { x: 0.75, y: 1.75, w: 4.5, h: 0.3, fontSize: 12, fontFace: FONT, color: GOLD, margin: 0 })

  // Big stats inside box
  const heroX = 0.75
  s.addText('7,431', { x: heroX, y: 2.2, w: 4.5, h: 1.0, fontSize: 56, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('สิทธิ์รวม 3 วัน', { x: heroX, y: 3.15, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  // Sub stats grid 2x2
  const subData = [
    { val: '33%', lab: 'ส่วนแบ่ง campaign' },
    { val: '3,187', lab: 'Users' },
    { val: '2.33', lab: 'สิทธิ์/คน' },
    { val: '2,477', lab: 'velocity/วัน' },
  ]
  subData.forEach((d, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = heroX + col * 2.15
    const y = 3.55 + row * 0.8
    s.addText(d.val, { x, y, w: 2, h: 0.4, fontSize: 22, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(d.lab, { x, y: y + 0.4, w: 2, h: 0.25, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  // Right column: Pareto
  s.addText('Concentration (Pareto)', { x: 5.6, y: 0.75, w: 4, h: 0.35, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  // 3 horizontal bars showing Top 1/3/10 share
  const paretoData = [
    { label: 'Top 1 (L3-8G)', val: 33, color: GOLD },
    { label: 'Top 3 SKU',     val: 50, color: GREEN },
    { label: 'Top 10 SKU',    val: 76, color: DEEP },
  ]
  paretoData.forEach((p, i) => {
    const y = 1.25 + i * 0.7
    s.addText(p.label, { x: 5.6, y, w: 4, h: 0.3, fontSize: 11, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.6, y: y + 0.3, w: 4, h: 0.25,
      fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 0.5 },
    })
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.6, y: y + 0.3, w: 4 * (p.val / 100), h: 0.25,
      fill: { color: p.color }, line: { color: p.color },
    })
    s.addText(p.val + '%', { x: 5.6 + 4 * (p.val / 100) - 0.6, y: y + 0.3, w: 0.6, h: 0.25, fontSize: 10, fontFace: FONT, color: WHITE, bold: true, align: 'right', valign: 'middle', margin: 0 })
  })

  // Risk callout
  s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: 3.55, w: 4, h: 1.55, fill: { color: 'FEF2F2' }, line: { color: RED, width: 1 } })
  s.addText('⚠️  Concentration Risk', { x: 5.75, y: 3.65, w: 3.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText('ถ้า L3-8G stock-out = กระทบ 33% ของยอดทันที — ต้องเตรียม backup supply', {
    x: 5.75, y: 4.0, w: 3.8, h: 1.05, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 8: SKU Portfolio Health
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'SKU Portfolio Health 📦', 8)
  s.addText('Sachet-driven campaign — 8G ซองเล็กขับเคลื่อนหลัก', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  bigStat(s, 0.4, 1.1, 2.3, 1.2, '78 / 93', 'SKU Active', '84% portfolio')
  bigStat(s, 2.85, 1.1, 2.3, 1.2, '16', 'Dead SKU (3 วันติด)', '17% ของ portfolio', RED)
  bigStat(s, 5.3, 1.1, 2.3, 1.2, '60%', 'Sachet 8G share', 'trial-pack driven', GOLD_DEEP)
  bigStat(s, 7.75, 1.1, 1.85, 1.2, '13%', 'Full size (40G+)', 'opportunity to grow', GOLD_DEEP)

  // Donut: Cross-size
  s.addChart(pres.charts.DOUGHNUT, [{
    name: 'Size Mix',
    labels: ['8G (sachet)', '7G', '6G', '40G', '70G', '10G', 'อื่นๆ'],
    values: [60, 9, 9, 7, 5, 5, 5],
  }], {
    x: 0.4, y: 2.55, w: 4.5, h: 2.6,
    chartColors: [GREEN, '15803D', DEEP, GOLD, GOLD_DEEP, '6B7280', '94A3B8'],
    chartArea: { fill: { color: WHITE } },
    showLegend: true, legendPos: 'r', legendFontFace: FONT, legendFontSize: 10,
    showPercent: true, dataLabelColor: WHITE, dataLabelFontFace: FONT, dataLabelFontSize: 10,
    showTitle: true, title: 'Cross-Size Distribution',
    titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  // Dead SKU list
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 2.55, w: 4.5, h: 2.6, fill: { color: 'FEF2F2' }, line: { color: RED, width: 1 } })
  s.addText('🪦 Dead SKU 3 วันติด (16 ตัว)', { x: 5.25, y: 2.65, w: 4.2, h: 0.3, fontSize: 13, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText([
    { text: 'น้ำตบแตงโม L5-90G / L5A-90G', options: { bullet: true, breakLine: true } },
    { text: 'สครับเกลือ / สครับแตงโม', options: { bullet: true, breakLine: true } },
    { text: 'อีอีคูชั่นแตงโม JHQ1 / JHQ2', options: { bullet: true, breakLine: true } },
    { text: 'เจลดาวเรือง / เจลมะรุม legacy SKUs', options: { bullet: true, breakLine: true } },
    { text: 'เซรั่มขิงดำ (40G) / เซรั่มมะม่วง (40G)', options: { bullet: true } },
  ], { x: 5.25, y: 3.05, w: 4.2, h: 1.4, fontSize: 9.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 4, margin: 0 })
  s.addText('Action: Distribution check + POSM audit', { x: 5.25, y: 4.65, w: 4.2, h: 0.35, fontSize: 10, fontFace: FONT, color: '991B1B', bold: true, italic: true, margin: 0 })
}

// =============================================================
// SLIDE 9: Geographic Reach
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Geographic Reach 🗺️', 9)
  s.addText('Top จังหวัด + การกระจายไปต่างจังหวัด', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  // Top 10 table
  const provinces = LIVE.provinces || []
  const top10 = provinces.slice(0, 10)
  const tableHeader = [
    { text: '#',       options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'center' } },
    { text: 'จังหวัด',  options: { bold: true, color: WHITE, fill: { color: DEEP } } },
    { text: 'Users',   options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'right' } },
    { text: 'Tickets', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'right' } },
  ]
  const rows = [tableHeader, ...top10.map((p, i) => [
    { text: String(p.rank || i + 1), options: { align: 'center', color: TEXT } },
    { text: p.name || p.province || '-', options: { color: TEXT, bold: i < 3 } },
    { text: fmt(p.users || 0), options: { align: 'right', color: TEXT } },
    { text: fmt(p.tickets || p.scans || 0), options: { align: 'right', color: DEEP, bold: true } },
  ])]

  s.addTable(rows, {
    x: 0.4, y: 1.1, w: 5.5, colW: [0.5, 2.2, 1.3, 1.5],
    fontSize: 10, fontFace: FONT,
    border: { type: 'solid', pt: 0.5, color: 'E2E8F0' },
    rowH: 0.32,
  })

  // Insights right column
  s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 1.1, w: 3.4, h: 1.7, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('📍 Pattern', { x: 6.35, y: 1.2, w: 3.2, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'กรุงเทพ ครอง #1 ทั้ง 3 วัน', options: { bullet: true, breakLine: true } },
    { text: 'สมุทรปราการ ขึ้น #2 วัน 17', options: { bullet: true, breakLine: true } },
    { text: 'อุบลราชธานี เข้า Top 5 วัน 18 🆕', options: { bullet: true } },
  ], { x: 6.35, y: 1.5, w: 3.2, h: 1.2, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 2.95, w: 3.4, h: 2.1, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1 } })
  s.addText('💡 Implication', { x: 6.35, y: 3.05, w: 3.2, h: 0.3, fontSize: 13, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText([
    { text: 'การกระจายไปต่างจังหวัดเริ่มเห็นผล วันที่ 3', options: { bullet: true, breakLine: true } },
    { text: 'Plan: เพิ่ม distribution coverage ที่ขาย ในจังหวัดรอบนอก', options: { bullet: true, breakLine: true } },
    { text: 'Monitor: ภาคใต้/อีสานยังไม่ติด Top 10 → ตรวจ POSM', options: { bullet: true } },
  ], { x: 6.35, y: 3.35, w: 3.2, h: 1.65, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 10: Watch Points
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Watch Points ⚠️ — Honest Section', 10)
  s.addText('Risks + Concerns ต้อง monitor ใน 7 วันถัดไป', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: '713F12', bold: true, margin: 0 })

  const watch = [
    { num: '1', title: 'Weekday-matched lift slight negative',
      desc: 'เสาร์ 16/5: -8.2% vs avg เสาร์ก่อนหน้า | อาทิตย์ 17/5: -1.9% — บางส่วนของ +7.2% มาจาก weekend natural ไม่ใช่แคมเปญดันล้วน' },
    { num: '2', title: 'Hero SKU Concentration Risk',
      desc: 'L3-8G = 33% ของยอด → ถ้า stock-out จะกระทบทันที — ต้องเตรียม backup supply' },
    { num: '3', title: 'Day-3 Momentum Drop -26%',
      desc: 'จากวัน peak 8,709 → 6,432 — ต้อง confirm สัปดาห์ 2 ว่าจะ rebound หรือ continued decay' },
    { num: '4', title: 'Dead SKU 16 ตัว (ไม่ scan 3 วันติด)',
      desc: 'น่าจะเป็นปัญหา distribution / POSM coverage — ต้อง audit ระดับร้านค้า' },
    { num: '5', title: 'Suspicious User Activity',
      desc: '1 user สแกน 100+ ครั้ง / 3 วัน + 9 users ≥50 ครั้ง — ต้อง audit ว่าเป็นเซลส์/พนักงาน หรือ multi-account abuse' },
  ]
  watch.forEach((w, i) => {
    const y = 1.1 + i * 0.82
    s.addShape(pres.shapes.OVAL, { x: 0.4, y, w: 0.5, h: 0.5, fill: { color: GOLD }, line: { color: GOLD } })
    s.addText(w.num, { x: 0.4, y, w: 0.5, h: 0.5, fontSize: 18, fontFace: FONT, color: DEEP, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(w.title, { x: 1.05, y: y - 0.02, w: 8.5, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(w.desc,  { x: 1.05, y: y + 0.28, w: 8.5, h: 0.5, fontSize: 10, fontFace: FONT, color: TEXT, margin: 0 })
  })
}

// =============================================================
// SLIDE 11: Risk & Quality
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Risk & Quality 🛡️', 11)
  s.addText('Verification + fraud detection — pattern ปกติยังไม่มี critical signal', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  bigStat(s, 0.4, 1.1, 2.3, 1.25, '88.2%', 'Valid Scan Rate', 'avg 3 days', GREEN)
  bigStat(s, 2.85, 1.1, 2.3, 1.25, '11.8%', 'Duplicate Attempts', 'acceptable', GOLD_DEEP)
  bigStat(s, 5.3, 1.1, 2.3, 1.25, '21 / 30 / 13', 'Velocity Alerts', '≥20 scans/hr per day', GOLD_DEEP)
  bigStat(s, 7.75, 1.1, 1.85, 1.25, '9', 'Multi-Account', '≥50 scans / 3 days', RED)

  // Scan Funnel chart
  s.addChart(pres.charts.BAR, [{
    name: 'Day 16', labels: ['Success', 'Dup Self', 'Dup Other'], values: [7163, 660, 259],
  }, {
    name: 'Day 17', labels: ['Success', 'Dup Self', 'Dup Other'], values: [8713, 755, 304],
  }, {
    name: 'Day 18', labels: ['Success', 'Dup Self', 'Dup Other'], values: [6459, 639, 260],
  }], {
    x: 0.4, y: 2.6, w: 6, h: 2.5,
    barDir: 'col',
    chartColors: [GREEN, GOLD, GOLD_DEEP],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 9,
    showTitle: true, title: 'Scan Verification by Day',
    titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.6, w: 3, h: 2.5, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('Top Burst Speed', { x: 6.75, y: 2.7, w: 2.8, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('79 scans/ชั่วโมง', { x: 6.75, y: 3.0, w: 2.8, h: 0.5, fontSize: 26, fontFace: FONT, color: GREEN, bold: true, margin: 0 })
  s.addText('(วัน peak — 17 พ.ค.)', { x: 6.75, y: 3.55, w: 2.8, h: 0.3, fontSize: 10, fontFace: FONT, color: MUTED, margin: 0 })
  s.addShape(pres.shapes.LINE, { x: 6.75, y: 3.95, w: 2.7, h: 0, line: { color: 'E2E8F0', width: 1 } })
  s.addText('Action: audit user 100+ scans/3 days', { x: 6.75, y: 4.05, w: 2.8, h: 0.3, fontSize: 10, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
  s.addText('Check: เซลส์ / พนักงาน MT / multi-account', { x: 6.75, y: 4.4, w: 2.8, h: 0.6, fontSize: 9.5, fontFace: FONT, color: MUTED, margin: 0 })
}

// =============================================================
// SLIDE 12: Forecast
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Forecast 🔮 ถึง Draw Date (18 ธ.ค.)', 12)
  s.addText('3 scenarios — แนะนำ config prize รับ ~1M สิทธิ์', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const fc = LIVE.forecast || {}
  bigStat(s, 0.4, 1.1, 2.3, 1.2, fmt(fc.to_date || 23922), 'สิทธิ์สะสม', 'as of 19 พ.ค.', GREEN)
  bigStat(s, 2.85, 1.1, 2.3, 1.2, fmt(fc.daily_avg || 7434), 'Daily avg (3 วัน)', 'สิทธิ์/วัน')
  bigStat(s, 5.3, 1.1, 2.3, 1.2, '213', 'Days Remaining', 'ถึง 18 ธ.ค.', GOLD_DEEP)
  bigStat(s, 7.75, 1.1, 1.85, 1.2, '~1M', 'Recommended', 'prize pool baseline', GOLD_DEEP)

  // Forecast chart
  s.addChart(pres.charts.BAR, [{
    name: 'Forecast',
    labels: ['Conservative\n(decay 30%/เดือน)', 'Mid case\n(decay 15%/เดือน)', 'Linear\n(velocity คงเดิม)'],
    values: [500000, 900000, 1600000],
  }], {
    x: 0.4, y: 2.6, w: 6, h: 2.55,
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

  // Right insight
  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.6, w: 3, h: 2.55, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1.2 } })
  s.addText('💡 Recommendation', { x: 6.75, y: 2.7, w: 2.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText('ตั้ง prize pool รับ ~1M สิทธิ์ เป็น base case', { x: 6.75, y: 3.05, w: 2.8, h: 0.6, fontSize: 12, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
  s.addText([
    { text: 'มี buffer: +600k (linear case)', options: { bullet: true, breakLine: true } },
    { text: 'หรือ trim: -400k (conservative)', options: { bullet: true, breakLine: true } },
    { text: 'ปรับ scenario กลางสัปดาห์ทุก 2 สัปดาห์', options: { bullet: true } },
  ], { x: 6.75, y: 3.8, w: 2.8, h: 1.3, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// =============================================================
// SLIDE 13: Recommendations
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Recommendations 🎯 — 5 Actions', 13)
  s.addText('สิ่งที่ควรทำ 7 วันถัดไป (priority order)', { x: 0.4, y: 0.55, w: 9, h: 0.4, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const recs = [
    { num: '1', icon: '📣', title: 'LINE broadcast push',
      desc: 'Engagement สูง แต่ acquisition ต่ำกว่า baseline — broadcast เตือนสิทธิ์ที่ถืออยู่ + รอบประกาศ' },
    { num: '2', icon: '🎁', title: 'Bundle promotion (tier upgrade)',
      desc: 'จับคู่ tier 1 (ซอง) + tier 2 (หลอด) ให้สิทธิ์ x2 — ดัน customer ขึ้น value tier' },
    { num: '3', icon: '📦', title: 'Hero SKU stock contingency',
      desc: 'L3-8G drives 33% — เตรียม backup supply + alert ถ้า inventory < 7 วันใช้งาน' },
    { num: '4', icon: '🔍', title: 'Dead SKU audit (16 ตัว)',
      desc: 'Distribution check + POSM ทุกร้าน — assignment ทีม sales ภายในสัปดาห์นี้' },
    { num: '5', icon: '⏰', title: 'Content timing optimization',
      desc: 'Peak 12-14 + 19-21 — ลง content/ads ก่อน peak 30 นาที, focus weekend' },
  ]
  recs.forEach((r, i) => {
    const y = 1.1 + i * 0.82
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 9.2, h: 0.72, fill: { color: i % 2 === 0 ? BG : WHITE }, line: { color: 'E5E7EB', width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 0.08, h: 0.72, fill: { color: GREEN }, line: { color: GREEN } })
    s.addShape(pres.shapes.OVAL, { x: 0.65, y: y + 0.13, w: 0.45, h: 0.45, fill: { color: GREEN }, line: { color: GREEN } })
    s.addText(r.num, { x: 0.65, y: y + 0.13, w: 0.45, h: 0.45, fontSize: 16, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(r.icon + ' ' + r.title, { x: 1.3, y: y + 0.05, w: 8, h: 0.32, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(r.desc, { x: 1.3, y: y + 0.36, w: 8.2, h: 0.36, fontSize: 10, fontFace: FONT, color: TEXT, margin: 0 })
  })
}

// =============================================================
// SLIDE 14: Q&A
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: DEEP }
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('QUESTIONS & DISCUSSION', { x: 0.8, y: 0.8, w: 8.5, h: 0.4, fontSize: 13, fontFace: FONT, color: GOLD, bold: true, charSpacing: 8, margin: 0 })
  s.addText('Q & A', { x: 0.8, y: 1.2, w: 8.5, h: 1.0, fontSize: 60, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 2.4, w: 1.2, h: 0.04, fill: { color: GOLD }, line: { color: GOLD } })

  s.addText('คำถามที่อยากได้คำตอบจากที่ประชุม', { x: 0.8, y: 2.6, w: 8.5, h: 0.4, fontSize: 14, fontFace: FONT, color: GOLD, italic: true, margin: 0 })
  s.addText([
    { text: 'KPI definition สำหรับ campaign success คืออะไร?', options: { bullet: true, breakLine: true } },
    { text: 'Media spend allocation ที่ลงไปแล้ว = เท่าไหร่? ROI?', options: { bullet: true, breakLine: true } },
    { text: 'Stock contingency plan สำหรับ Hero SKU (L3-8G)?', options: { bullet: true, breakLine: true } },
    { text: 'Next presentation cadence — weekly / bi-weekly?', options: { bullet: true, breakLine: true } },
    { text: 'Budget approval สำหรับ LINE broadcast?', options: { bullet: true } },
  ], { x: 0.8, y: 3.1, w: 8.5, h: 2.2, fontSize: 14, fontFace: FONT, color: WHITE, paraSpaceAfter: 8, margin: 0 })
}

// ── Write ──
const outPath = path.resolve(__dirname, 'scan-lucky-rich-day1-3.pptx')
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Generated:', outPath)
})
