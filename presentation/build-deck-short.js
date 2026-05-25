// Build PowerPoint deck (SHORT 5-slide version)
// Run: node build-deck-short.js → outputs scan-lucky-rich-day1-3-short.pptx
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

const FONT = 'Calibri'
const fmt = (n) => Number(n).toLocaleString('en-US')

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'
pres.author = "Jula's Herb x ไทยรัฐ TV"
pres.title  = 'Campaign Report Day 1-3 (Short)'

// ── Helpers ──
function header(slide, title, num, total = 5) {
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
    fontSize: 26, fontFace: FONT, color: DEEP, bold: true, valign: 'middle', margin: 0,
  })
  if (sub) slide.addText(sub, {
    x: x + 0.15, y: y + 0.95, w: w - 0.3, h: 0.25,
    fontSize: 9, fontFace: FONT, color: MUTED, valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 1: Executive Summary (combined cover + key numbers)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: DEEP }
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: GOLD }, line: { color: GOLD } })

  s.addText('CAMPAIGN REPORT — DAY 1-3', {
    x: 0.6, y: 0.4, w: 9, h: 0.35,
    fontSize: 12, fontFace: FONT, color: GOLD, bold: true, charSpacing: 8, margin: 0,
  })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', {
    x: 0.6, y: 0.75, w: 9, h: 0.65,
    fontSize: 32, fontFace: FONT, color: WHITE, bold: true, margin: 0,
  })
  s.addText('16-18 พ.ค. 2026  •  Jula\'s Herb × ไทยรัฐ TV', {
    x: 0.6, y: 1.4, w: 9, h: 0.35,
    fontSize: 14, fontFace: FONT, color: 'CBD5E1', margin: 0,
  })

  // 4 hero stats on dark bg
  const stats = [
    { val: '22,301', lab: 'สิทธิ์รวม',         sub: '+7.2% vs มี.ค.', color: GOLD },
    { val: '8,101',  lab: 'Unique Users',     sub: '50%+ repeat',     color: WHITE },
    { val: '78/93',  lab: 'SKU Active',       sub: '16 dead SKU',     color: WHITE },
    { val: '33%',    lab: 'Hero SKU (L3-8G)', sub: 'ดีดีครีมแตงโม',     color: GOLD },
  ]
  stats.forEach((st, i) => {
    const x = 0.6 + i * 2.3
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.05, w: 2.1, h: 1.55,
      fill: { color: 'FFFFFF', transparency: 92 }, line: { color: GOLD, width: 1 },
    })
    s.addText(st.val, {
      x: x + 0.1, y: 2.15, w: 1.9, h: 0.7,
      fontSize: 32, fontFace: FONT, color: st.color, bold: true, margin: 0,
    })
    s.addText(st.lab, {
      x: x + 0.1, y: 2.85, w: 1.9, h: 0.3,
      fontSize: 11, fontFace: FONT, color: WHITE, bold: true, margin: 0,
    })
    s.addText(st.sub, {
      x: x + 0.1, y: 3.18, w: 1.9, h: 0.3,
      fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0,
    })
  })

  // One-liner bottom
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.95, w: 8.8, h: 1.2, fill: { color: 'FFFFFF', transparency: 88 }, line: { color: GOLD, width: 1 } })
  s.addText('💡 Bottom line', {
    x: 0.8, y: 4.05, w: 8.5, h: 0.3,
    fontSize: 12, fontFace: FONT, color: GOLD, bold: true, margin: 0,
  })
  s.addText('แคมเปญสร้าง engagement สูง (repeat 50%+, batch scan) + acquisition โต — แต่ lift ยอดสแกนจริงน้อย (+1.2% MoM) → ต้องเพิ่ม push activation', {
    x: 0.8, y: 4.4, w: 8.5, h: 0.7,
    fontSize: 12, fontFace: FONT, color: WHITE, margin: 0,
  })
}

// =============================================================
// SLIDE 2: 3-Day Performance + Compare to Previous Months
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Performance — 3 วันแรก + เทียบเดือนก่อน', 2)

  // Left: day-by-day bar
  const days = LIVE.snapshot.days
  s.addText('รายวัน', { x: 0.4, y: 0.6, w: 5, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addChart(pres.charts.BAR, [{
    name: 'สิทธิ์',
    labels: days.map(d => d.date.split('-')[2] + ' พ.ค.\n(' + d.weekday + ')'),
    values: days.map(d => d.rights),
  }], {
    x: 0.4, y: 0.95, w: 5, h: 3.2,
    barDir: 'col',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 12,
    chartColors: ['94A3B8', GREEN, 'CBD5E1'],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
  })
  s.addText('Peak 17 พ.ค. (อาทิตย์) → drop -26% วันจันทร์', {
    x: 0.4, y: 4.15, w: 5, h: 0.3,
    fontSize: 10, fontFace: FONT, color: MUTED, italic: true, margin: 0,
  })

  // Right: month comparison
  s.addText('เทียบ 16-18 ของแต่ละเดือน', { x: 5.6, y: 0.6, w: 4, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addChart(pres.charts.BAR, [{
    name: 'สแกนรวม 3 วัน',
    labels: ['มี.ค.\n(no campaign)', 'เม.ย.\n(no campaign)', 'พ.ค. 🎯\n(มีแคมเปญ)'],
    values: [23529, 24903, 25212],
  }], {
    x: 5.6, y: 0.95, w: 4, h: 3.2,
    barDir: 'col',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 12,
    chartColors: ['CBD5E1', 'CBD5E1', GREEN],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 9, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
  })

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.5, w: 9.2, h: 0.7, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('📈 +7.2% vs มี.ค.   /   +1.2% MoM (vs เม.ย.)   —   เดือนที่มีแคมเปญทำได้สูงสุดในชุดเปรียบเทียบ', {
    x: 0.6, y: 4.5, w: 9, h: 0.7,
    fontSize: 14, fontFace: FONT, color: DEEP, bold: true, valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 3: Hero SKU + Customer Behavior
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Hero SKU + Customer Behavior', 3)

  // Left: Hero SKU box
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 4.6, h: 4.4, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 0.12, h: 4.4, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('🏆 BOSS SKU', { x: 0.7, y: 0.85, w: 4.2, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, bold: true, charSpacing: 6, margin: 0 })
  s.addText('ดีดีครีมแตงโม (L3-8G)', { x: 0.7, y: 1.15, w: 4.2, h: 0.5, fontSize: 18, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText('ซอง 8G  •  14 บาท', { x: 0.7, y: 1.65, w: 4.2, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, margin: 0 })

  s.addText('7,431', { x: 0.7, y: 2.0, w: 4.2, h: 1.0, fontSize: 56, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('สิทธิ์ใน 3 วัน  •  33% ของยอดทั้งแคมเปญ', { x: 0.7, y: 2.95, w: 4.2, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  s.addShape(pres.shapes.LINE, { x: 0.7, y: 3.4, w: 4.0, h: 0, line: { color: GOLD, width: 1 } })

  s.addText('Concentration', { x: 0.7, y: 3.5, w: 4.2, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  // Top 1 / 3 / 10 mini-bars
  const pareto = [
    { label: 'Top 1', val: 33 },
    { label: 'Top 3', val: 50 },
    { label: 'Top 10', val: 76 },
  ]
  pareto.forEach((p, i) => {
    const y = 3.85 + i * 0.4
    s.addText(p.label, { x: 0.7, y, w: 0.9, h: 0.3, fontSize: 10, fontFace: FONT, color: WHITE, margin: 0 })
    s.addShape(pres.shapes.RECTANGLE, { x: 1.6, y: y + 0.05, w: 2.5, h: 0.18, fill: { color: '14532D' }, line: { color: '14532D' } })
    s.addShape(pres.shapes.RECTANGLE, { x: 1.6, y: y + 0.05, w: 2.5 * (p.val / 100), h: 0.18, fill: { color: GOLD }, line: { color: GOLD } })
    s.addText(p.val + '%', { x: 4.15, y, w: 0.7, h: 0.3, fontSize: 10, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  })

  // Right: Customer behavior
  s.addText('Customer Behavior', { x: 5.3, y: 0.7, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  bigStat(s, 5.3, 1.05, 2.1, 1.15, '50-53%', 'Repeat Rate', 'industry 25-30%', GREEN)
  bigStat(s, 7.5, 1.05, 2.1, 1.15, '0.8 นาที', 'Median gap', 'batch scan')
  bigStat(s, 5.3, 2.3, 2.1, 1.15, '17.6%', 'New signup D3', 'from 13.1% D1', GOLD_DEEP)
  bigStat(s, 7.5, 2.3, 2.1, 1.15, '73%', 'กลับมา <1 ชม.', 'sticky users', GREEN)

  // Insight box
  s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 3.6, w: 4.3, h: 1.5, fill: { color: 'F0FDF4' }, line: { color: GREEN, width: 1 } })
  s.addText('💚 Engagement = Win', { x: 5.45, y: 3.7, w: 4.1, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('ลูกค้าสแกนต่อเนื่อง batch + new signup ขึ้นทุกวัน — แคมเปญสร้าง brand love แม้ยอดวันลด', {
    x: 5.45, y: 4.05, w: 4.1, h: 1.0,
    fontSize: 11, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 4: Watch Points + Forecast
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Watch Points + Forecast', 4)

  // Left: 4 watch points
  s.addText('⚠️ Watch Points', { x: 0.4, y: 0.6, w: 4.6, h: 0.3, fontSize: 14, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })

  const watch = [
    { num: '1', t: 'Hero SKU Concentration', d: 'L3-8G = 33% — ถ้า stock-out กระทบทันที' },
    { num: '2', t: 'Day-3 Momentum Drop', d: '-26% from peak — ต้องดูสัปดาห์ 2 rebound?' },
    { num: '3', t: 'Dead SKU 16 ตัว', d: 'ไม่สแกนเลย 3 วัน → distribution check' },
    { num: '4', t: '1 user 100+ scans/3d', d: 'อาจเป็น sales/multi-account → audit' },
  ]
  watch.forEach((w, i) => {
    const y = 0.95 + i * 0.9
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 4.6, h: 0.8, fill: { color: 'FEF2F2' }, line: { color: 'FECACA', width: 0.5 } })
    s.addShape(pres.shapes.OVAL, { x: 0.55, y: y + 0.2, w: 0.4, h: 0.4, fill: { color: RED }, line: { color: RED } })
    s.addText(w.num, { x: 0.55, y: y + 0.2, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(w.t, { x: 1.05, y: y + 0.08, w: 3.9, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(w.d, { x: 1.05, y: y + 0.4, w: 3.9, h: 0.4, fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Right: Forecast
  s.addText('🔮 Forecast ถึง 18 ธ.ค. (213 วัน)', { x: 5.2, y: 0.6, w: 4.5, h: 0.3, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  s.addChart(pres.charts.BAR, [{
    name: 'Total Rights',
    labels: ['Conservative\n(decay 30%)', 'Mid case\n(decay 15%)', 'Linear\n(velocity คงเดิม)'],
    values: [500000, 900000, 1600000],
  }], {
    x: 5.2, y: 1.0, w: 4.5, h: 2.8,
    barDir: 'col',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    chartColors: [RED, GOLD, GREEN],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 9,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 3.95, w: 4.5, h: 1.15, fill: { color: 'FFFBEB' }, line: { color: GOLD, width: 1 } })
  s.addText('💡 Recommendation', { x: 5.35, y: 4.05, w: 4.3, h: 0.3, fontSize: 12, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText('ตั้ง prize pool รับ ~1M สิทธิ์ เป็น base case (mid scenario)', {
    x: 5.35, y: 4.4, w: 4.3, h: 0.7,
    fontSize: 12, fontFace: FONT, color: TEXT, bold: true, margin: 0,
  })
}

// =============================================================
// SLIDE 5: Recommendations + Q&A
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Recommendations + Next Steps', 5)
  s.addText('🎯 5 actions priority order', { x: 0.4, y: 0.6, w: 9.2, h: 0.35, fontSize: 16, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const recs = [
    { num: '1', title: 'LINE broadcast push', desc: 'Engagement สูงแต่ activation ต่ำ — broadcast เตือนสิทธิ์ + รอบประกาศ' },
    { num: '2', title: 'Bundle promotion', desc: 'จับคู่ tier 1 + 2 ให้สิทธิ์ x2 ดัน customer ขึ้น value tier' },
    { num: '3', title: 'Hero SKU stock contingency', desc: 'L3-8G drives 33% — เตรียม backup supply + alert ถ้า inv < 7 วัน' },
    { num: '4', title: 'Dead SKU audit (16 ตัว)', desc: 'Distribution + POSM check ภายในสัปดาห์นี้' },
    { num: '5', title: 'Content timing', desc: 'ลง ads ก่อน weekend peak 30 นาที + focus เสาร์-อาทิตย์' },
  ]
  recs.forEach((r, i) => {
    const y = 1.05 + i * 0.62
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 5.5, h: 0.55, fill: { color: i % 2 === 0 ? BG : WHITE }, line: { color: 'E5E7EB', width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 0.08, h: 0.55, fill: { color: GREEN }, line: { color: GREEN } })
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.1, w: 0.36, h: 0.36, fill: { color: GREEN }, line: { color: GREEN } })
    s.addText(r.num, { x: 0.6, y: y + 0.1, w: 0.36, h: 0.36, fontSize: 13, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(r.title, { x: 1.1, y: y + 0.04, w: 4.6, h: 0.26, fontSize: 11.5, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(r.desc, { x: 1.1, y: y + 0.3, w: 4.7, h: 0.25, fontSize: 9, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Right: Questions for management
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.05, w: 3.5, h: 4.05, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.05, w: 0.1, h: 4.05, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('❓ Q & A', { x: 6.3, y: 1.2, w: 3.2, h: 0.4, fontSize: 18, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('คำถามที่อยากได้คำตอบ', { x: 6.3, y: 1.6, w: 3.2, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', italic: true, margin: 0 })

  s.addText([
    { text: 'KPI ของแคมเปญคืออะไร?', options: { bullet: true, breakLine: true } },
    { text: 'Media spend ลงไปเท่าไหร่? ROI?', options: { bullet: true, breakLine: true } },
    { text: 'Stock plan สำหรับ Hero SKU?', options: { bullet: true, breakLine: true } },
    { text: 'Approval งบ LINE broadcast?', options: { bullet: true, breakLine: true } },
    { text: 'Next review cadence?', options: { bullet: true } },
  ], { x: 6.3, y: 2.0, w: 3.2, h: 3.0, fontSize: 11, fontFace: FONT, color: WHITE, paraSpaceAfter: 6, margin: 0 })
}

// ── Write ──
const outPath = path.resolve(__dirname, 'scan-lucky-rich-day1-3-short.pptx')
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Generated:', outPath)
})
