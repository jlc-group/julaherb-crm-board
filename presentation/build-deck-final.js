// Final boss-update deck — 11 slides + 3 appendix
// Run: node build-deck-final.js → outputs scan-lucky-rich-day1-5.pptx
const pptxgen = require('pptxgenjs')
const fs = require('fs')
const path = require('path')

// ── Colors (indigo monochrome — match dashboard) ──
const BRAND   = '6366F1'   // indigo-500
const BRAND_D = '4338CA'   // indigo-700
const BRAND_DD= '1E1B4B'   // indigo-950
const BRAND_L = 'EEF2FF'   // indigo-50
const BRAND_L2= 'E0E7FF'   // indigo-100
const WHITE   = 'FFFFFF'
const BG      = 'FAFBFC'
const TEXT    = '0F172A'
const MUTED   = '64748B'
const SOFT    = 'F1F5F9'
const BORDER  = 'E2E8F0'
const POSITIVE  = '10B981'
const WARN      = 'D97706'
const DANGER    = 'DC2626'
const PINK      = 'BE185D'

const FONT = 'Calibri'
const fmt = (n) => Number(n).toLocaleString('en-US')

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'  // 10 × 5.625
pres.author = "Jula's Herb x ไทยรัฐ TV"
pres.title  = 'Campaign Report Day 1-5 (Final)'

// ── Helpers ──
function header(slide, title, num, total) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.4,
    fill: { color: BRAND_DD }, line: { color: BRAND_DD },
  })
  slide.addText(title, {
    x: 0.4, y: 0.03, w: 8.5, h: 0.34,
    fontSize: 13, fontFace: FONT, color: WHITE, bold: true, valign: 'middle', margin: 0,
  })
  slide.addText(`${num} / ${total}`, {
    x: 9, y: 0.03, w: 0.9, h: 0.34,
    fontSize: 10, fontFace: FONT, color: BRAND_L2, align: 'right', valign: 'middle', margin: 0,
  })
  // footer
  slide.addText("สแกนลุ้นรวย สวยลุ้นล้าน  •  Jula's Herb × ไทยรัฐ TV  •  Day 1-5 (16-20 พ.ค. 2026)", {
    x: 0.4, y: 5.32, w: 9.2, h: 0.25,
    fontSize: 8.5, fontFace: FONT, color: MUTED, align: 'left', valign: 'middle', margin: 0,
  })
}

function bigStat(slide, x, y, w, h, value, label, sub, color = BRAND) {
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
    fontSize: 22, fontFace: FONT, color: BRAND_DD, bold: true, valign: 'middle', margin: 0,
  })
  if (sub) slide.addText(sub, {
    x: x + 0.18, y: y + 0.9, w: w - 0.3, h: 0.25,
    fontSize: 9, fontFace: FONT, color: MUTED, valign: 'middle', margin: 0,
  })
}

function sectionHeader(slide, title, dayTag) {
  slide.addText(title, {
    x: 0.4, y: 0.55, w: 6.5, h: 0.4,
    fontSize: 16, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0,
  })
  if (dayTag) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 7.5, y: 0.6, w: 2.0, h: 0.3,
      fill: { color: BRAND_L }, line: { color: BRAND_L2, width: 0.5 },
      rectRadius: 0.15,
    })
    slide.addText(dayTag, {
      x: 7.5, y: 0.6, w: 2.0, h: 0.3,
      fontSize: 10, fontFace: FONT, color: BRAND_D, bold: true, align: 'center', valign: 'middle', margin: 0,
    })
  }
}

// =============================================================
// SLIDE 1: Cover + TL;DR
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: BRAND_DD }
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: BRAND }, line: { color: BRAND } })

  s.addText('CAMPAIGN REPORT • DAY 1-5', {
    x: 0.5, y: 0.35, w: 9, h: 0.3,
    fontSize: 12, fontFace: FONT, color: BRAND_L2, bold: true, charSpacing: 6, margin: 0,
  })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', {
    x: 0.5, y: 0.65, w: 9, h: 0.6,
    fontSize: 30, fontFace: FONT, color: WHITE, bold: true, margin: 0,
  })
  s.addText("Jula's Herb × ไทยรัฐ TV  •  16-20 พ.ค. 2026  (วันที่ 1-5 ของแคมเปญ 7 เดือน)", {
    x: 0.5, y: 1.3, w: 9, h: 0.3,
    fontSize: 12, fontFace: FONT, color: 'CBD5E1', margin: 0,
  })

  // 3 stat cards
  const stats = [
    { val: '35K+',  lab: 'สแกนสำเร็จ',         sub: 'รวม 5 วัน' },
    { val: '10K+',  lab: 'ผู้ใช้งาน',            sub: 'unique users' },
    { val: '51%',   lab: 'อัตราสแกนซ้ำ',         sub: 'industry avg 25-30%', color: 'FBBF24' },
  ]
  stats.forEach((st, i) => {
    const x = 0.5 + i * 3.0
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.9, w: 2.8, h: 1.4,
      fill: { color: 'FFFFFF', transparency: 92 }, line: { color: BRAND, width: 1 },
    })
    s.addText(st.val, {
      x: x + 0.15, y: 2.05, w: 2.5, h: 0.6,
      fontSize: 30, fontFace: FONT, color: st.color || BRAND_L2, bold: true, margin: 0,
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

  // Bottom line callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 3.7, w: 9.0, h: 1.4,
    fill: { color: 'FFFFFF', transparency: 88 }, line: { color: BRAND, width: 1 },
  })
  s.addText('💡 บรรทัดสุดท้าย (Bottom line)', {
    x: 0.7, y: 3.8, w: 8.6, h: 0.3,
    fontSize: 12, fontFace: FONT, color: BRAND_L2, bold: true, margin: 0,
  })
  s.addText(
    'Engagement สูงเกินคาด — repeat rate 51% (industry avg 25%) แสดงว่าลูกค้าติดสนุก\n' +
    'Acquisition trending up (+11%/day) • Activation funnel ดี 85% • พร้อมขยาย scale',
    {
      x: 0.7, y: 4.15, w: 8.6, h: 0.9,
      fontSize: 13, fontFace: FONT, color: WHITE, margin: 0, paraSpaceAfter: 4,
    }
  )
}

// =============================================================
// SLIDE 2: ภาพรวม 5 วันแรก (KPI)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'ภาพรวม 5 วันแรก (KPI)', 2, 12)
  sectionHeader(s, '📊 ภาพรวม 5 วันแรก', '16-20 พ.ค.')

  // 4 KPI cards row
  bigStat(s, 0.4, 1.1, 2.3, 1.2, '35K+',  '📱 สแกนสำเร็จ',    'รวม 5 วัน • avg 7K/วัน', BRAND)
  bigStat(s, 2.85, 1.1, 2.3, 1.2, '47K+', '🎟️ สิทธิ์ตามสเปก', 'DB ขาด -12K (-36%)', WARN)
  bigStat(s, 5.3, 1.1, 2.3, 1.2, '10K+',  '👥 ผู้ใช้งาน',       'unique users', BRAND)
  bigStat(s, 7.75, 1.1, 1.85, 1.2, '94%', '✅ ระบบทำงาน',     'Day 4 ล่ม 6 ชม.', POSITIVE)

  // Trend chart
  s.addChart(pres.charts.LINE, [
    { name: 'สิทธิ์ตามสเปก', labels: ['16', '17', '18', '19', '20*'], values: [9871, 11634, 8654, 7876, 9000] },
    { name: 'สแกนสำเร็จ',   labels: ['16', '17', '18', '19', '20*'], values: [7163, 8713, 6459, 5707, 7000] },
  ], {
    x: 0.4, y: 2.5, w: 6.5, h: 2.6,
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    chartColors: [BRAND, POSITIVE],
    lineSize: 2.5, lineDataSymbolSize: 8,
    showValue: true, dataLabelPosition: 't',
    dataLabelColor: BRAND_DD, dataLabelFontFace: FONT, dataLabelFontSize: 9,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    catGridLine: { style: 'none' },
    showTitle: true, title: 'แนวโน้ม: สิทธิ์ vs สแกนสำเร็จ 5 วัน',
    titleFontSize: 11, titleColor: BRAND_DD, titleFontFace: FONT,
  })

  // Pattern callout (right side)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.0, y: 2.5, w: 2.6, h: 2.6,
    fill: { color: BRAND_L }, line: { color: BRAND_L2, width: 1 },
  })
  s.addText('🔍 Pattern ที่เห็น', {
    x: 7.15, y: 2.6, w: 2.4, h: 0.3,
    fontSize: 12, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0,
  })
  s.addText([
    { text: '📈 Weekend peak ',  options: {} },
    { text: '+21.6%',              options: { bold: true, color: POSITIVE, breakLine: true } },
    { text: '   (เสาร์→อาทิตย์)',   options: { fontSize: 9, color: MUTED, breakLine: true } },
    { text: ' ',                    options: { breakLine: true } },
    { text: '📉 จันทร์ตก ',         options: {} },
    { text: '−26%',                 options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   จาก peak',          options: { fontSize: 9, color: MUTED, breakLine: true } },
    { text: ' ',                    options: { breakLine: true } },
    { text: '🚨 อังคารล่ม ',        options: {} },
    { text: '6 ชม.',                options: { bold: true, color: DANGER, breakLine: true } },
    { text: '   02:49–09:00 (API/CF)', options: { fontSize: 9, color: MUTED, breakLine: true } },
    { text: ' ',                    options: { breakLine: true } },
    { text: '✅ ฟื้นตัวภายในวัน',    options: { color: POSITIVE } },
  ], {
    x: 7.15, y: 2.95, w: 2.4, h: 2.1,
    fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 0, margin: 0,
  })

  s.addText('* Day 20 = ประมาณการ — รอข้อมูลจริง', {
    x: 0.4, y: 5.05, w: 6.5, h: 0.2,
    fontSize: 8.5, fontFace: FONT, color: MUTED, italic: true, margin: 0,
  })
}

// =============================================================
// SLIDE 3: ตารางสแกน/สิทธิ์รายวัน
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'ตารางสถิติสแกน/สิทธิ์รายวัน', 3, 12)
  sectionHeader(s, '📋 ตารางรายวัน', '5 วัน')

  // Build table
  const headerStyle = { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 9 }
  const numStyle = { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10, valign: 'middle' }
  const muted = { ...numStyle, color: MUTED }
  const success = { ...numStyle, color: POSITIVE, bold: true }
  const danger = { ...numStyle, color: DANGER }
  const center = (color = TEXT) => ({ align: 'center', color, fontFace: FONT, fontSize: 10, valign: 'middle' })

  const rows = [
    [
      { text: 'วันที่', options: headerStyle },
      { text: 'วัน', options: headerStyle },
      { text: '⭐ สำเร็จ', options: { ...headerStyle, fill: { color: '15803D' } } },
      { text: '⛔ ซ้ำตัวเอง', options: { ...headerStyle, fill: { color: '991B1B' } } },
      { text: '⛔ ซ้ำคนอื่น', options: { ...headerStyle, fill: { color: '991B1B' } } },
      { text: '⛔ ไม่พบ', options: { ...headerStyle, fill: { color: '991B1B' } } },
      { text: 'รวม', options: headerStyle },
      { text: '% สำเร็จ', options: headerStyle },
      { text: '🎟️ สิทธิ์ (สเปก)', options: { ...headerStyle, fill: { color: BRAND } } },
    ],
    [
      { text: '16 พ.ค.', options: { ...center(BRAND_D), bold: true } },
      { text: 'เสาร์', options: center(MUTED) },
      { text: fmt(7163), options: success },
      { text: fmt(660), options: muted },
      { text: fmt(78), options: muted },
      { text: fmt(181), options: danger },
      { text: fmt(8082), options: numStyle },
      { text: '88.6%', options: { ...numStyle, color: POSITIVE, bold: true } },
      { text: fmt(9871), options: { ...numStyle, color: BRAND_D, bold: true, fill: { color: BRAND_L } } },
    ],
    [
      { text: '17 พ.ค.', options: { ...center(BRAND_D), bold: true } },
      { text: 'อาทิตย์', options: center(MUTED) },
      { text: fmt(8713), options: success },
      { text: fmt(755), options: muted },
      { text: fmt(130), options: muted },
      { text: fmt(174), options: danger },
      { text: fmt(9772), options: numStyle },
      { text: '89.2%', options: { ...numStyle, color: POSITIVE, bold: true } },
      { text: fmt(11634), options: { ...numStyle, color: BRAND_D, bold: true, fill: { color: BRAND_L } } },
    ],
    [
      { text: '18 พ.ค.', options: { ...center(BRAND_D), bold: true } },
      { text: 'จันทร์', options: center(MUTED) },
      { text: fmt(6459), options: success },
      { text: fmt(639), options: muted },
      { text: fmt(79), options: muted },
      { text: fmt(181), options: danger },
      { text: fmt(7358), options: numStyle },
      { text: '87.8%', options: { ...numStyle, color: POSITIVE, bold: true } },
      { text: fmt(8654), options: { ...numStyle, color: BRAND_D, bold: true, fill: { color: BRAND_L } } },
    ],
    [
      { text: '19 พ.ค.', options: { ...center(BRAND_D), bold: true } },
      { text: 'อังคาร 🚨', options: center(DANGER) },
      { text: fmt(5707), options: success },
      { text: fmt(588), options: muted },
      { text: fmt(164), options: muted },
      { text: fmt(162), options: danger },
      { text: fmt(6621), options: numStyle },
      { text: '86.2%', options: { ...numStyle, color: WARN, bold: true } },
      { text: fmt(7876), options: { ...numStyle, color: BRAND_D, bold: true, fill: { color: BRAND_L } } },
    ],
    [
      { text: '20 พ.ค.*', options: { ...center(MUTED), italic: true } },
      { text: '?', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
      { text: '—', options: center(MUTED) },
    ],
    [
      { text: 'รวม', options: { ...center(BRAND_DD), bold: true, fill: { color: BRAND_L2 } } },
      { text: '4 วัน*', options: { ...center(BRAND_DD), fill: { color: BRAND_L2 } } },
      { text: fmt(28042), options: { ...numStyle, color: BRAND_DD, bold: true, fill: { color: BRAND_L2 } } },
      { text: fmt(2642), options: { ...numStyle, color: BRAND_DD, fill: { color: BRAND_L2 } } },
      { text: fmt(451), options: { ...numStyle, color: BRAND_DD, fill: { color: BRAND_L2 } } },
      { text: fmt(698), options: { ...numStyle, color: BRAND_DD, fill: { color: BRAND_L2 } } },
      { text: fmt(31833), options: { ...numStyle, color: BRAND_DD, bold: true, fill: { color: BRAND_L2 } } },
      { text: '88.1%', options: { ...numStyle, color: BRAND_DD, bold: true, fill: { color: BRAND_L2 } } },
      { text: fmt(38035), options: { ...numStyle, color: BRAND_D, bold: true, fill: { color: BRAND_L } } },
    ],
  ]

  s.addTable(rows, {
    x: 0.3, y: 1.1, w: 9.4,
    colW: [0.85, 0.85, 1.15, 1.15, 1.15, 1.0, 0.95, 0.95, 1.35],
    rowH: 0.42,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  // Note box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 4.15, w: 9.2, h: 0.85,
    fill: { color: 'FFFBEB' }, line: { color: WARN, width: 1 },
  })
  s.addText([
    { text: '⚠️ ', options: { fontSize: 12, color: WARN } },
    { text: 'Day 19 มี outage 6 ชม. (02:49-09:00) ทำให้ยอดลดลง   ', options: { fontSize: 10, color: TEXT } },
    { text: 'Day 20 = รอข้อมูล', options: { fontSize: 10, color: MUTED, italic: true, breakLine: true } },
    { text: '🟡 ', options: { fontSize: 12, color: WARN } },
    { text: 'สิทธิ์ (สเปก) − สิทธิ์ (DB) = ขาดไป ', options: { fontSize: 10, color: TEXT } },
    { text: '10,000+ ใบ', options: { fontSize: 10, color: DANGER, bold: true } },
    { text: ' จาก bug 1:1 (ดู Slide 4)', options: { fontSize: 10, color: TEXT } },
  ], {
    x: 0.55, y: 4.2, w: 9.0, h: 0.75,
    fontFace: FONT, valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 4: DB Bug Critical
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '🚨 พบ Critical Issue: DB Ticket Bug', 4, 12)
  sectionHeader(s, '🚨 DB Bug: ขาดสิทธิ์ ~10K+ ใบ')

  // Side-by-side comparison
  // LEFT — ตามสเปก
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.1, w: 4.5, h: 2.3,
    fill: { color: 'F0FDF4' }, line: { color: POSITIVE, width: 1.5 },
  })
  s.addText('✅ ตามสเปก Excel (ที่ควรจะเป็น)', {
    x: 0.55, y: 1.2, w: 4.3, h: 0.3,
    fontSize: 12, fontFace: FONT, color: '15803D', bold: true, margin: 0,
  })
  s.addText([
    { text: '\nL3-40G  ดีดีครีมแตงโม 40 กรัม', options: {} },
    { text: '  →  5 สิทธิ์/scan', options: { bold: true, color: POSITIVE, breakLine: true } },
    { text: 'D3-70G  ยาสีฟันเจเด้นท์ 70 กรัม', options: {} },
    { text: '  →  2 สิทธิ์/scan', options: { bold: true, color: POSITIVE, breakLine: true } },
    { text: 'C4-35G  เซรั่มขิงดำ 35 กรัม', options: {} },
    { text: '  →  4 สิทธิ์/scan', options: { bold: true, color: POSITIVE, breakLine: true } },
    { text: 'L7-30G  โดสส้มแดง 30 กรัม', options: {} },
    { text: '  →  5 สิทธิ์/scan', options: { bold: true, color: POSITIVE, breakLine: true } },
    { text: '\n... (~30 SKU อื่นๆ มี 2-5 สิทธิ์/scan)', options: { italic: true, color: MUTED } },
  ], {
    x: 0.55, y: 1.5, w: 4.3, h: 1.85,
    fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })

  // RIGHT — DB ปัจจุบัน
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.1, w: 4.5, h: 2.3,
    fill: { color: 'FEF2F2' }, line: { color: DANGER, width: 1.5 },
  })
  s.addText('❌ DB ปัจจุบัน (bug)', {
    x: 5.25, y: 1.2, w: 4.3, h: 0.3,
    fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0,
  })
  s.addText([
    { text: '\nL3-40G  ดีดีครีมแตงโม 40 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: 'D3-70G  ยาสีฟันเจเด้นท์ 70 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: 'C4-35G  เซรั่มขิงดำ 35 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: 'L7-30G  โดสส้มแดง 30 กรัม', options: {} },
    { text: '  →  1 สิทธิ์/scan ❌', options: { bold: true, color: DANGER, breakLine: true } },
    { text: '\n** ทุก SKU ให้ 1:1 ตามจำนวน scan **', options: { bold: true, color: DANGER, italic: true } },
  ], {
    x: 5.25, y: 1.5, w: 4.3, h: 1.85,
    fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 2, margin: 0,
  })

  // Impact bar — big numbers
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 3.6, w: 9.2, h: 1.0,
    fill: { color: WHITE }, line: { color: WARN, width: 1.5 },
  })
  s.addText('📊 Impact (4 วันแรก — Day 1-4)', {
    x: 0.55, y: 3.65, w: 9, h: 0.3,
    fontSize: 11, fontFace: FONT, color: WARN, bold: true, margin: 0,
  })
  // 3 columns
  s.addText('DB ปัจจุบัน', {
    x: 0.55, y: 3.95, w: 2.5, h: 0.2,
    fontSize: 9, fontFace: FONT, color: MUTED, margin: 0,
  })
  s.addText('27,988 ใบ', {
    x: 0.55, y: 4.15, w: 2.5, h: 0.4,
    fontSize: 18, fontFace: FONT, color: DANGER, bold: true, margin: 0,
  })

  s.addText('ตามสเปก', {
    x: 3.5, y: 3.95, w: 2.5, h: 0.2,
    fontSize: 9, fontFace: FONT, color: MUTED, margin: 0,
  })
  s.addText('37,981 ใบ', {
    x: 3.5, y: 4.15, w: 2.5, h: 0.4,
    fontSize: 18, fontFace: FONT, color: POSITIVE, bold: true, margin: 0,
  })

  s.addText('ขาดไป', {
    x: 6.5, y: 3.95, w: 3, h: 0.2,
    fontSize: 9, fontFace: FONT, color: MUTED, margin: 0,
  })
  s.addText('−9,993 ใบ  (−36%)', {
    x: 6.5, y: 4.15, w: 3, h: 0.4,
    fontSize: 18, fontFace: FONT, color: DANGER, bold: true, margin: 0,
  })

  // Action box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 4.75, w: 9.2, h: 0.5,
    fill: { color: BRAND_DD }, line: { color: BRAND_DD },
  })
  s.addText([
    { text: '🔴 ACTION: ', options: { color: 'FBBF24', bold: true } },
    { text: 'ทีม DB ต้องแก้ก่อน prize draw (18 ธ.ค.) — มิฉะนั้นลูกค้าได้สิทธิ์น้อยกว่าที่ POSM/โฆษณาประกาศ', options: { color: WHITE } },
  ], {
    x: 0.55, y: 4.78, w: 9, h: 0.45,
    fontSize: 11, fontFace: FONT, valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 5: Engagement Win
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'จุดแข็ง: Engagement สูงเกินอุตสาหกรรม', 5, 12)
  sectionHeader(s, '💚 Engagement Win')

  // 4 KPI
  bigStat(s, 0.4, 1.1, 2.3, 1.2, '51%',      'อัตราสแกนซ้ำ (Repeat)', 'industry avg 25-30%', POSITIVE)
  bigStat(s, 2.85, 1.1, 2.3, 1.2, '0.8 นาที', 'ค่ามัธยฐานช่วงสแกน',   'batch scan behavior', BRAND)
  bigStat(s, 5.3, 1.1, 2.3, 1.2, '73%',      'กลับมาภายใน 1 ชม.',    'sticky users', BRAND)
  bigStat(s, 7.75, 1.1, 1.85, 1.2, '2.84',   'สิทธิ์ต่อคนเฉลี่ย',       'ดีกว่าทั่วไป', POSITIVE)

  // Distribution chart
  s.addChart(pres.charts.BAR, [{
    name: 'จำนวนผู้ใช้',
    labels: ['1 สแกน', '2-5 สแกน', '6-10 สแกน', '10+ สแกน'],
    values: [4944, 4028, 726, 337],
  }], {
    x: 0.4, y: 2.5, w: 6.0, h: 2.6,
    barDir: 'col',
    chartColors: [MUTED, BRAND, BRAND_D, BRAND_DD],
    showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: BRAND_DD, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    catGridLine: { style: 'none' },
    showLegend: false,
    showTitle: true, title: 'การกระจายตัวของผู้สแกน (4 วัน)',
    titleFontSize: 11, titleColor: BRAND_DD, titleFontFace: FONT,
  })

  // Insight box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.6, y: 2.5, w: 3.0, h: 2.6,
    fill: { color: 'ECFDF5' }, line: { color: POSITIVE, width: 1 },
  })
  s.addText('💡 ความหมาย', {
    x: 6.75, y: 2.6, w: 2.8, h: 0.3,
    fontSize: 12, fontFace: FONT, color: '065F46', bold: true, margin: 0,
  })
  s.addText([
    { text: '• ครึ่งหนึ่งของคนสแกน ', options: {} },
    { text: 'กลับมาสแกนซ้ำ', options: { bold: true, color: POSITIVE } },
    { text: ' (ไม่ใช่ครั้งเดียวจบ)', options: { breakLine: true } },
    { text: '\n• ค่ามัธยฐาน 0.8 นาที = ', options: {} },
    { text: 'สแกนหลายซองในครั้งเดียว', options: { bold: true } },
    { text: ' (batch)', options: { breakLine: true } },
    { text: '\n• 73% กลับมาภายใน 1 ชม. = ', options: {} },
    { text: 'sticky', options: { bold: true } },
    { text: ' — คนติดเล่น', options: { breakLine: true } },
    { text: '\n• 1,063 คน scan 6+ ครั้ง = ', options: {} },
    { text: 'heavy users', options: { bold: true, color: BRAND_D } },
    { text: ' (ผู้ภักดี)', options: {} },
  ], {
    x: 6.75, y: 2.95, w: 2.8, h: 2.1,
    fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 3, margin: 0,
  })
}

// =============================================================
// SLIDE 6: สมาชิกใหม่ + จังหวัด
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'สมาชิกใหม่ + การกระจายทางภูมิศาสตร์', 6, 12)
  sectionHeader(s, '🆕 Acquisition + Geographic Reach')

  // KPI top
  bigStat(s, 0.4, 1.1, 2.3, 1.1, '1,509', '🆕 สมาชิกใหม่รวม', '4 วัน • avg 377/วัน', BRAND)
  bigStat(s, 2.85, 1.1, 2.3, 1.1, '17.6%', '📈 อัตราสมาชิกใหม่', 'เพิ่มจาก 13.1% (Day 1)', POSITIVE)
  bigStat(s, 5.3, 1.1, 2.3, 1.1, '834,705', '👥 สมาชิกสะสม', 'ในระบบทั้งหมด', BRAND)
  bigStat(s, 7.75, 1.1, 1.85, 1.1, '88%', '✅ กรอก profile ครบ', 'high quality', POSITIVE)

  // Stacked bar — new vs existing
  s.addChart(pres.charts.BAR, [
    { name: 'สมาชิกใหม่', labels: ['16', '17', '18', '19'], values: [384, 414, 428, 283] },
    { name: 'สมาชิกเก่า', labels: ['16', '17', '18', '19'], values: [2305, 2617, 2153, 1702] },
  ], {
    x: 0.4, y: 2.4, w: 5.5, h: 2.6,
    barDir: 'col', barGrouping: 'stacked',
    chartColors: [POSITIVE, BRAND],
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    showValue: true, dataLabelColor: WHITE, dataLabelFontFace: FONT, dataLabelFontSize: 9,
    dataLabelFormatCode: '#,##0',
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    showTitle: true, title: 'สมาชิกใหม่ vs เก่า (4 วัน)',
    titleFontSize: 11, titleColor: BRAND_DD, titleFontFace: FONT,
  })

  // Top จังหวัด
  const provHeader = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', fontFace: FONT, fontSize: 9 } })
  const provRows = [
    [provHeader('#'), provHeader('จังหวัด'), provHeader('สแกน'), provHeader('Users')],
    ...[
      { rank: 1, name: 'กรุงเทพ',      scans: 4445, users: 1346 },
      { rank: 2, name: 'ชลบุรี',        scans: 1203, users:  431 },
      { rank: 3, name: 'นครราชสีมา',   scans: 1085, users:  362 },
      { rank: 4, name: 'สมุทรปราการ',   scans: 1157, users:  438 },
      { rank: 5, name: 'ปทุมธานี',      scans:  951, users:  307 },
      { rank: 6, name: 'เชียงใหม่',     scans:  868, users:  328 },
      { rank: 7, name: 'สงขลา',        scans:  793, users:  269 },
      { rank: 8, name: 'อุบลราชธานี',   scans:  122, users:   36, note: '↑ เข้า Top 10 Day 3' },
    ].map(p => [
      { text: String(p.rank), options: { align: 'center', color: TEXT, fontFace: FONT, fontSize: 9 } },
      { text: p.name + (p.note ? ' 🌟' : ''), options: { color: TEXT, bold: p.rank <= 3, fontFace: FONT, fontSize: 9 } },
      { text: fmt(p.scans), options: { align: 'right', color: BRAND_D, bold: true, fontFace: FONT, fontSize: 9 } },
      { text: fmt(p.users), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 9 } },
    ]),
  ]
  s.addTable(provRows, {
    x: 6.1, y: 2.4, w: 3.6, colW: [0.35, 1.8, 0.75, 0.7],
    rowH: 0.28, border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  // Note
  s.addText('💡 กระแสสมาชิกใหม่เพิ่มต่อเนื่อง — Day 3 อัตรา 18% สูงสุด • อุบลฯ เข้า Top 10 = กระจายไปต่างจังหวัดเริ่มเห็นผล', {
    x: 0.4, y: 5.05, w: 9.2, h: 0.2,
    fontSize: 9.5, fontFace: FONT, color: MUTED, italic: true, margin: 0,
  })
}

// =============================================================
// SLIDE 7: Boss SKU + Pareto
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Boss SKU + การกระจุกตัวของยอด', 7, 12)
  sectionHeader(s, '🏆 Boss SKU + Concentration')

  // LEFT: Boss SKU spotlight
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 4.6, h: 4.0, fill: { color: BRAND_DD }, line: { color: BRAND_DD } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 0.15, h: 4.0, fill: { color: 'FBBF24' }, line: { color: 'FBBF24' } })

  s.addText('🏆 BOSS SKU', {
    x: 0.75, y: 1.25, w: 4.2, h: 0.3,
    fontSize: 11, fontFace: FONT, color: 'FBBF24', bold: true, charSpacing: 6, margin: 0,
  })
  s.addText('ดีดีครีมแตงโม', {
    x: 0.75, y: 1.55, w: 4.2, h: 0.5,
    fontSize: 22, fontFace: FONT, color: WHITE, bold: true, margin: 0,
  })
  s.addText('L3-8G  •  ซอง 8 กรัม  •  49 บาท', {
    x: 0.75, y: 2.1, w: 4.2, h: 0.25,
    fontSize: 10.5, fontFace: FONT, color: 'FBBF24', margin: 0,
  })

  s.addText('9,177', {
    x: 0.75, y: 2.4, w: 4.2, h: 0.85,
    fontSize: 48, fontFace: FONT, color: 'FBBF24', bold: true, margin: 0,
  })
  s.addText('สิทธิ์รวม 4 วัน  •  33% ของแคมเปญ', {
    x: 0.75, y: 3.25, w: 4.2, h: 0.25,
    fontSize: 10.5, fontFace: FONT, color: 'CBD5E1', margin: 0,
  })

  // 4 sub-stats
  const subData = [
    { val: '3,939', lab: 'Users' },
    { val: '2.33', lab: 'สิทธิ์/คน' },
    { val: '2,294', lab: 'สิทธิ์/วัน' },
    { val: '×5',    lab: 'spec multiplier (40g)' },
  ]
  subData.forEach((d, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.75 + col * 2.1
    const y = 3.65 + row * 0.65
    s.addText(d.val, { x, y, w: 1.95, h: 0.35, fontSize: 16, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(d.lab, { x, y: y + 0.32, w: 1.95, h: 0.2, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  // RIGHT: Pareto bars
  s.addText('การกระจุกตัว (Pareto)', {
    x: 5.2, y: 1.15, w: 4.4, h: 0.35,
    fontSize: 13, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0,
  })

  const paretoData = [
    { label: 'Top 1 (L3-8G)', val: 33, color: 'FBBF24' },
    { label: 'Top 3 SKU',     val: 50, color: BRAND },
    { label: 'Top 10 SKU',    val: 77, color: BRAND_DD },
  ]
  paretoData.forEach((p, i) => {
    const y = 1.6 + i * 0.7
    s.addText(p.label, { x: 5.2, y, w: 4.4, h: 0.3, fontSize: 11, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: y + 0.3, w: 4.4, h: 0.25, fill: { color: SOFT }, line: { color: BORDER, width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: y + 0.3, w: 4.4 * (p.val / 100), h: 0.25, fill: { color: p.color }, line: { color: p.color } })
    s.addText(p.val + '%', { x: 5.2 + 4.4 * (p.val / 100) - 0.6, y: y + 0.3, w: 0.6, h: 0.25, fontSize: 10, fontFace: FONT, color: WHITE, bold: true, align: 'right', valign: 'middle', margin: 0 })
  })

  // Risk callout
  s.addShape(pres.shapes.RECTANGLE, { x: 5.2, y: 3.85, w: 4.4, h: 1.25, fill: { color: 'FEF2F2' }, line: { color: DANGER, width: 1.5 } })
  s.addText('⚠️  ความเสี่ยงสต็อก', { x: 5.35, y: 3.95, w: 4.2, h: 0.3, fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText(
    'ถ้า L3-8G stock-out จะกระทบ 33% ของแคมเปญทันที — ต้องเตรียม backup supply + alert เมื่อ inventory < 7 วัน',
    {
      x: 5.35, y: 4.3, w: 4.2, h: 0.75,
      fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
    }
  )
}

// =============================================================
// SLIDE 8 (NEW): Top 10 SKU
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Top 10 SKU — ที่มียอดสแกนสูงสุด (4 วันรวม)', 8, 12)
  sectionHeader(s, '🏆 Top 10 SKU')

  const hStyle = { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 10 }
  const rankStyle = (rank) => ({ align: 'center', bold: true, color: WHITE,
    fill: { color: rank === 1 ? 'F59E0B' : rank === 2 ? '94A3B8' : rank === 3 ? 'EA580C' : BRAND },
    fontFace: FONT, fontSize: 12, valign: 'middle' })
  const skuStyle = { color: BRAND_D, bold: true, fontFace: 'Courier New', fontSize: 10, valign: 'middle' }
  const nameStyle = { color: TEXT, fontFace: FONT, fontSize: 10.5, valign: 'middle' }
  const numStyle = { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10.5, valign: 'middle' }
  const bigNum = { align: 'right', color: BRAND_DD, bold: true, fontFace: FONT, fontSize: 12, valign: 'middle' }
  const pctStyle = { align: 'right', color: BRAND_D, bold: true, fontFace: FONT, fontSize: 10.5, valign: 'middle' }

  // Top 10 from cumulative 4-day data
  const top10 = [
    { rank: 1,  sku: 'L3-8G',   name: 'ดีดีครีมแตงโม 8 กรัม',          tickets: 9177, users: 3939, perScan: 1, share: 32.8 },
    { rank: 2,  sku: 'L4-8G',   name: 'เซรั่มลำไย 8 กรัม',             tickets: 2820, users: 1479, perScan: 1, share: 10.1 },
    { rank: 3,  sku: 'L6-8G',   name: 'เซรั่มแครอท 8 กรัม',            tickets: 2073, users: 1134, perScan: 1, share:  7.4 },
    { rank: 4,  sku: 'L10-7G',  name: 'กันแดด 3D ออร่า 7 กรัม',        tickets: 1877, users: 1102, perScan: 1, share:  6.7 },
    { rank: 5,  sku: 'L7-6G',   name: 'โดสส้มแดงกลูต้า 6 กรัม',         tickets: 1281, users:  652, perScan: 1, share:  4.6 },
    { rank: 6,  sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน 10 กรัม',      tickets: 1255, users:  786, perScan: 1, share:  4.5 },
    { rank: 7,  sku: 'C4-8G',   name: 'เซรั่มขิงดำซิงก์ 8 กรัม',          tickets:  924, users:  483, perScan: 1, share:  3.3 },
    { rank: 8,  sku: 'L3-40G',  name: 'ดีดีครีมแตงโม 40 กรัม',          tickets:  861, users:  734, perScan: 5, share:  3.1 },
    { rank: 9,  sku: 'L19-8G',  name: 'มอยส์เจลฉ่ำบัว 8 กรัม',          tickets:  724, users:  500, perScan: 1, share:  2.6 },
    { rank: 10, sku: 'L8B-6G',  name: 'อีอีคูชั่นแตงโม 02 6 กรัม',       tickets:  516, users:  302, perScan: 1, share:  1.8 },
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
      { text: String(r.rank), options: rankStyle(r.rank) },
      { text: r.sku, options: skuStyle },
      { text: r.name, options: nameStyle },
      { text: String(r.perScan), options: { ...numStyle, align: 'center',
        fill: { color: r.perScan === 1 ? SOFT : r.perScan === 2 ? '#dbeafe' : r.perScan >= 5 ? '#fef3c7' : '#e0e7ff' } } },
      { text: fmt(r.tickets), options: bigNum },
      { text: fmt(r.users), options: numStyle },
      { text: r.share.toFixed(1) + '%', options: pctStyle },
      // Visual bar showing share — cap at 12 chars max to keep row height stable
      { text: '▇'.repeat(Math.max(1, Math.min(12, Math.round(r.share / 3)))), options: { color: r.rank === 1 ? 'F59E0B' : BRAND, fontFace: FONT, fontSize: 10, valign: 'middle' } },
    ]),
  ]

  s.addTable(tableData, {
    x: 0.3, y: 1.0, w: 9.4,
    colW: [0.4, 0.95, 2.85, 0.85, 1.0, 0.85, 0.9, 1.6],
    rowH: 0.3,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  // Summary box — moved below table
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 4.65, w: 9.2, h: 0.5,
    fill: { color: BRAND_L }, line: { color: BRAND_L2, width: 1 },
  })
  s.addText([
    { text: '💡 ', options: { fontSize: 13 } },
    { text: 'Top 10 รวม ', options: { bold: true, fontSize: 11 } },
    { text: '21,508 สิทธิ์ = 77% ', options: { bold: true, color: BRAND_D, fontSize: 11 } },
    { text: 'ของแคมเปญ (Pareto) — Boss SKU ', options: { fontSize: 11 } },
    { text: 'L3-8G', options: { bold: true, color: BRAND_DD, fontSize: 11 } },
    { text: ' 33% • Top 3 รวม 50%   ', options: { fontSize: 11 } },
    { text: '⚠ Stock contingency จำเป็นสำหรับ Top 5', options: { color: WARN, bold: true, fontSize: 11 } },
  ], {
    x: 0.55, y: 4.7, w: 9, h: 0.4,
    fontFace: FONT, valign: 'middle', margin: 0,
  })
}

// =============================================================
// SLIDE 9: MoM Same-date Comparison (Option A)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'เทียบเดือน — วันเดียวกันใน มี.ค./เม.ย./พ.ค.', 9, 12)
  sectionHeader(s, '🗓️ เทียบเดือน (MoM Same-date)')

  // Table
  const hStyle = { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 10 }
  const num = { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10.5, valign: 'middle' }
  const dayCol = { align: 'center', color: BRAND_D, fontFace: FONT, fontSize: 12, bold: true, valign: 'middle' }
  const dow = { align: 'center', color: MUTED, fontFace: FONT, fontSize: 9 }

  const deltaCell = (pct, neutral = false) => {
    if (neutral) return { text: '—', options: { ...num, color: MUTED } }
    const pos = pct >= 0
    const txt = `${pos ? '+' : ''}${pct.toFixed(1)}% ${pos ? '✅' : '❌'}`
    return { text: txt, options: { ...num, color: pos ? POSITIVE : DANGER, bold: true } }
  }

  const cellPair = (val, weekday) => ({
    text: [
      { text: fmt(val) + '  ', options: { bold: true, color: TEXT, fontFace: FONT, fontSize: 11 } },
      { text: `(${weekday})`, options: { color: MUTED, fontFace: FONT, fontSize: 8.5 } },
    ],
    options: { align: 'right', valign: 'middle' },
  })

  const tableData = [
    [
      { text: 'วันที่', options: hStyle },
      { text: 'มี.ค.', options: hStyle },
      { text: 'เม.ย.', options: hStyle },
      { text: 'พ.ค. 🎯', options: { ...hStyle, fill: { color: BRAND } } },
      { text: 'Δ vs เม.ย.', options: hStyle },
      { text: 'Δ vs มี.ค.', options: hStyle },
    ],
    [
      { text: '16', options: dayCol },
      cellPair(7452, 'จันทร์'),
      cellPair(7375, 'พฤหัส'),
      { text: [{ text: fmt(8082) + '  ', options: { bold: true, color: BRAND_DD, fontFace: FONT, fontSize: 11 } }, { text: '(เสาร์)', options: { color: BRAND_D, fontFace: FONT, fontSize: 8.5 } }], options: { align: 'right', valign: 'middle', fill: { color: BRAND_L } } },
      deltaCell(9.6),
      deltaCell(8.5),
    ],
    [
      { text: '17', options: dayCol },
      cellPair(8236, 'อังคาร'),
      cellPair(8004, 'ศุกร์'),
      { text: [{ text: fmt(9772) + '  ', options: { bold: true, color: BRAND_DD, fontFace: FONT, fontSize: 11 } }, { text: '(อาทิตย์)', options: { color: BRAND_D, fontFace: FONT, fontSize: 8.5 } }], options: { align: 'right', valign: 'middle', fill: { color: BRAND_L } } },
      deltaCell(22.1),
      deltaCell(18.6),
    ],
    [
      { text: '18', options: dayCol },
      cellPair(7841, 'พุธ'),
      cellPair(9524, 'เสาร์'),
      { text: [{ text: fmt(7358) + '  ', options: { bold: true, color: BRAND_DD, fontFace: FONT, fontSize: 11 } }, { text: '(จันทร์)', options: { color: BRAND_D, fontFace: FONT, fontSize: 8.5 } }], options: { align: 'right', valign: 'middle', fill: { color: BRAND_L } } },
      deltaCell(-22.7),
      deltaCell(-6.2),
    ],
    [
      { text: '19', options: dayCol },
      cellPair(6643, 'พฤหัส'),
      cellPair(9261, 'อาทิตย์'),
      { text: [{ text: fmt(5707) + '  ', options: { bold: true, color: BRAND_DD, fontFace: FONT, fontSize: 11 } }, { text: '(อังคาร) 🚨', options: { color: DANGER, fontFace: FONT, fontSize: 8.5 } }], options: { align: 'right', valign: 'middle', fill: { color: BRAND_L } } },
      deltaCell(-38.4),
      deltaCell(-14.1),
    ],
    [
      { text: '20*', options: { ...dayCol, color: MUTED, italic: true } },
      cellPair(7158, 'ศุกร์'),
      cellPair(8200, 'จันทร์'),
      { text: '—', options: { ...num, color: MUTED, fill: { color: SOFT } } },
      { text: '—', options: { ...num, color: MUTED } },
      { text: '—', options: { ...num, color: MUTED } },
    ],
    [
      { text: 'รวม', options: { align: 'center', bold: true, color: BRAND_DD, fill: { color: BRAND_L2 }, fontFace: FONT, fontSize: 12, valign: 'middle' } },
      { text: fmt(30172), options: { ...num, bold: true, color: BRAND_DD, fill: { color: BRAND_L2 }, fontSize: 12 } },
      { text: fmt(34164), options: { ...num, bold: true, color: BRAND_DD, fill: { color: BRAND_L2 }, fontSize: 12 } },
      { text: fmt(30919) + '*', options: { ...num, bold: true, color: BRAND_D, fill: { color: BRAND }, fontSize: 12 } },
      { text: '−9.5%', options: { ...num, bold: true, color: DANGER, fill: { color: BRAND_L2 }, fontSize: 12 } },
      { text: '+2.5%', options: { ...num, bold: true, color: POSITIVE, fill: { color: BRAND_L2 }, fontSize: 12 } },
    ],
  ]

  s.addTable(tableData, {
    x: 0.4, y: 1.05, w: 9.2,
    colW: [0.7, 1.7, 1.7, 1.8, 1.65, 1.65],
    rowH: 0.42,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  // Caveat box
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.1, w: 9.2, h: 1.0, fill: { color: 'FFFBEB' }, line: { color: WARN, width: 1.2 } })
  s.addText('⚠️  ระวัง: การเทียบนี้ไม่ตรง weekday (Apples-to-Oranges)', { x: 0.55, y: 4.18, w: 9, h: 0.3, fontSize: 11.5, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText([
    { text: '• ', options: {} },
    { text: 'พ.ค. 16-17', options: { bold: true } },
    { text: ' = เสาร์-อาทิตย์ (weekend natural peak) แต่ ', options: {} },
    { text: 'มี.ค./เม.ย.', options: { bold: true } },
    { text: ' = วันธรรมดา → lift +22% อาจมาจาก weekend ไม่ใช่แคมเปญทั้งหมด', options: { breakLine: true } },
    { text: '• ', options: {} },
    { text: 'พ.ค. 19', options: { bold: true } },
    { text: ' มี outage 6 ชม. → ตัดยอด ~30% → -38% ส่วนใหญ่จาก outage ไม่ใช่ campaign performance', options: {} },
  ], {
    x: 0.55, y: 4.48, w: 9.0, h: 0.6,
    fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// SLIDE 10: Forecast → Prize Pool
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Forecast — ประมาณการสิทธิ์ถึงปลายแคมเปญ', 10, 12)
  sectionHeader(s, '🔮 Forecast → ต้องเตรียม Prize Pool เท่าไหร่')

  // 4 KPI
  bigStat(s, 0.4, 1.1, 2.3, 1.1, '47K+',  '🎟️ สิทธิ์สะสม Day 5', 'จาก spec', BRAND)
  bigStat(s, 2.85, 1.1, 2.3, 1.1, '9,407', '📊 เฉลี่ย/วัน', 'สิทธิ์/วัน', BRAND)
  bigStat(s, 5.3, 1.1, 2.3, 1.1, '212',   '📅 เหลือ (วัน)', 'ถึง 18 ธ.ค.', BRAND)
  bigStat(s, 7.75, 1.1, 1.85, 1.1, '~2M', '🎯 Recommended', 'prize pool budget', WARN)

  // Scenario bars
  s.addChart(pres.charts.BAR, [{
    name: 'สิทธิ์',
    labels: ['Conservative\n(decay 30%)', 'Mid\n(decay 15%)', 'Linear\n(velocity คงเดิม)'],
    values: [1400000, 2000000, 2500000],
  }], {
    x: 0.4, y: 2.5, w: 6.0, h: 2.6,
    barDir: 'col',
    chartColors: [WARN],
    showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: BRAND_DD, dataLabelFontFace: FONT, dataLabelFontSize: 11,
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    showLegend: false,
    showTitle: true, title: 'ประมาณการสิทธิ์รวมถึงสิ้นแคมเปญ (3 scenarios)',
    titleFontSize: 11, titleColor: BRAND_DD, titleFontFace: FONT,
  })

  // Recommendation box
  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.5, w: 3.0, h: 2.6, fill: { color: 'FFFBEB' }, line: { color: WARN, width: 1.2 } })
  s.addText('💡 คำแนะนำ', { x: 6.75, y: 2.6, w: 2.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '713F12', bold: true, margin: 0 })
  s.addText('ตั้ง prize pool รับ ~2M สิทธิ์ (Mid case)', { x: 6.75, y: 2.95, w: 2.8, h: 0.4, fontSize: 12, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
  s.addText([
    { text: '• Buffer +500K (Linear)', options: { breakLine: true } },
    { text: '• Trim -600K (Conservative)', options: { breakLine: true } },
    { text: '• ปรับ scenario ทุก 2 สัปดาห์', options: { breakLine: true } },
    { text: '\n', options: {} },
    { text: 'หมายเหตุ: ', options: { bold: true } },
    { text: 'ตัวเลขจะแม่นขึ้นเมื่อ data ครบ 2-3 สัปดาห์', options: { italic: true, color: MUTED } },
  ], {
    x: 6.75, y: 3.45, w: 2.8, h: 1.6,
    fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 4, margin: 0,
  })
}

// =============================================================
// SLIDE 11: Watch Points (ที่ต้องเฝ้าระวัง)
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'ที่ต้องเฝ้าระวัง + คุณภาพระบบ', 11, 12)
  sectionHeader(s, '⚠️ Watch Points + Quality')

  // 4 watch points (left half)
  s.addText('🔍 ที่ต้องเฝ้าระวัง', { x: 0.4, y: 1.1, w: 4.7, h: 0.3, fontSize: 13, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })

  const watch = [
    { num: '1', t: 'การกระจุกตัวของ Boss SKU', d: 'L3-8G = 33% — ถ้า stock-out กระทบทันที' },
    { num: '2', t: 'Day-3 Momentum Drop', d: '-26% จาก peak — รอดูสัปดาห์ 2 ฟื้นมั้ย' },
    { num: '3', t: 'Dead SKU 16 ตัว', d: 'ไม่สแกนเลย 4 วัน → audit shelf placement' },
    { num: '4', t: 'Heavy users 9 ราย ต้องสงสัย', d: 'อาจเป็น sales / multi-account → audit' },
  ]
  watch.forEach((w, i) => {
    const y = 1.5 + i * 0.85
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 4.7, h: 0.75, fill: { color: 'FEF2F2' }, line: { color: 'FECACA', width: 0.5 } })
    s.addShape(pres.shapes.OVAL, { x: 0.55, y: y + 0.17, w: 0.4, h: 0.4, fill: { color: DANGER }, line: { color: DANGER } })
    s.addText(w.num, { x: 0.55, y: y + 0.17, w: 0.4, h: 0.4, fontSize: 14, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(w.t, { x: 1.05, y: y + 0.05, w: 4.0, h: 0.3, fontSize: 11.5, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0 })
    s.addText(w.d, { x: 1.05, y: y + 0.35, w: 4.0, h: 0.4, fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Quality (right half)
  s.addText('🛡️ คุณภาพ + ความถูกต้อง', { x: 5.3, y: 1.1, w: 4.3, h: 0.3, fontSize: 13, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0 })

  bigStat(s, 5.3, 1.5, 2.1, 1.1, '88.6%', 'อัตราสำเร็จ', 'avg 4 วัน', POSITIVE)
  bigStat(s, 7.5, 1.5, 2.1, 1.1, '9', 'multi-account suspect', '≥30 scans/วัน', DANGER)

  // Verification table
  const vH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', fontFace: FONT, fontSize: 9 } })
  const vRows = [
    [vH('ประเภท'), vH('จำนวน'), vH('%')],
    [
      { text: '✅ สแกนสำเร็จ', options: { color: POSITIVE, bold: true, fontFace: FONT, fontSize: 10 } },
      { text: fmt(28042), options: { align: 'right', color: TEXT, bold: true, fontFace: FONT, fontSize: 10 } },
      { text: '88.6%', options: { align: 'right', color: POSITIVE, bold: true, fontFace: FONT, fontSize: 10 } },
    ],
    [
      { text: '⛔ ซ้ำตัวเอง', options: { color: MUTED, fontFace: FONT, fontSize: 10 } },
      { text: fmt(2642), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10 } },
      { text: '8.3%', options: { align: 'right', color: MUTED, fontFace: FONT, fontSize: 10 } },
    ],
    [
      { text: '⛔ ซ้ำคนอื่น', options: { color: MUTED, fontFace: FONT, fontSize: 10 } },
      { text: fmt(451), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10 } },
      { text: '1.4%', options: { align: 'right', color: MUTED, fontFace: FONT, fontSize: 10 } },
    ],
    [
      { text: '⛔ ไม่พบในระบบ', options: { color: DANGER, fontFace: FONT, fontSize: 10 } },
      { text: fmt(698), options: { align: 'right', color: TEXT, fontFace: FONT, fontSize: 10 } },
      { text: '2.2%', options: { align: 'right', color: DANGER, bold: true, fontFace: FONT, fontSize: 10 } },
    ],
  ]
  s.addTable(vRows, {
    x: 5.3, y: 2.8, w: 4.3, colW: [2.2, 1.2, 0.9],
    rowH: 0.32, border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })
}

// =============================================================
// SLIDE 12: Recommendations + Asks
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Recommendations + ขอ Approve', 12, 12)
  sectionHeader(s, '🎯 แผนงาน + ขอตัดสินใจ')

  // Left: 5 recommendations
  s.addText('🚀 แผนงานเรียงตามความเร่งด่วน', { x: 0.4, y: 1.05, w: 5.5, h: 0.3, fontSize: 13, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0 })

  const recs = [
    { num: '1', priority: 'NOW', color: DANGER,    title: 'แก้ DB ticket bug',          desc: 'ทีม dev priority 0 — สเปกบอก 2-5/scan แต่ DB ให้ 1:1' },
    { num: '2', priority: 'WK',  color: WARN,      title: 'Boss SKU stock contingency',  desc: 'L3-8G drives 33% — backup supply + alert ถ้า inv < 7 วัน' },
    { num: '3', priority: 'WK',  color: BRAND,     title: 'LINE broadcast (peak push)',  desc: 'Push 18:30 ดึงกลุ่ม 19-21 peak hours' },
    { num: '4', priority: 'MO',  color: BRAND,     title: 'Dead SKU audit (16 ตัว)',     desc: 'ตรวจ shelf placement + POSM ภายในเดือนนี้' },
    { num: '5', priority: 'QR',  color: POSITIVE,  title: 'VIP/Win-back program',        desc: 'Champion 1,388 + Lost 1,383 — ทำ retention + reactivate' },
  ]
  recs.forEach((r, i) => {
    const y = 1.4 + i * 0.68
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 5.5, h: 0.6, fill: { color: i % 2 === 0 ? BG : WHITE }, line: { color: BORDER, width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y, w: 0.08, h: 0.6, fill: { color: r.color }, line: { color: r.color } })
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.12, w: 0.36, h: 0.36, fill: { color: r.color }, line: { color: r.color } })
    s.addText(r.num, { x: 0.6, y: y + 0.12, w: 0.36, h: 0.36, fontSize: 13, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    // Priority chip
    s.addText(r.priority, { x: 1.1, y: y + 0.06, w: 0.5, h: 0.2, fontSize: 8, fontFace: FONT, color: r.color, bold: true, margin: 0 })
    s.addText(r.title, { x: 1.65, y: y + 0.04, w: 4.0, h: 0.25, fontSize: 11.5, fontFace: FONT, color: BRAND_DD, bold: true, margin: 0 })
    s.addText(r.desc, { x: 1.65, y: y + 0.3, w: 4.2, h: 0.3, fontSize: 9, fontFace: FONT, color: TEXT, margin: 0 })
  })

  // Right: Asks
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.05, w: 3.5, h: 4.05, fill: { color: BRAND_DD }, line: { color: BRAND_DD } })
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.05, w: 0.1, h: 4.05, fill: { color: 'FBBF24' }, line: { color: 'FBBF24' } })
  s.addText('❓ ASKS', { x: 6.3, y: 1.15, w: 3.2, h: 0.35, fontSize: 16, fontFace: FONT, color: 'FBBF24', bold: true, margin: 0 })
  s.addText('สิ่งที่ขอ approve / decision', { x: 6.3, y: 1.5, w: 3.2, h: 0.3, fontSize: 10, fontFace: FONT, color: 'CBD5E1', italic: true, margin: 0 })

  s.addText([
    { text: '✓ Sign-off ', options: { bold: true } },
    { text: 'DB bug fix priority 0', options: { color: 'FBBF24', bold: true, breakLine: true } },
    { text: '\n✓ Approve ', options: { bold: true } },
    { text: 'งบ LINE broadcast', options: { color: 'FBBF24', bold: true } },
    { text: ' (~xxx บาท/เดือน)', options: { breakLine: true } },
    { text: '\n✓ Decision ', options: { bold: true } },
    { text: 'stock buffer L3-8G', options: { color: 'FBBF24', bold: true, breakLine: true } },
    { text: '\n✓ Confirm ', options: { bold: true } },
    { text: 'next update cadence', options: { color: 'FBBF24', bold: true } },
    { text: ' — รายสัปดาห์?', options: { breakLine: true } },
    { text: '\n✓ Confirm ', options: { bold: true } },
    { text: 'prize budget ~2M', options: { color: 'FBBF24', bold: true } },
    { text: ' (mid case)', options: {} },
  ], {
    x: 6.3, y: 1.9, w: 3.2, h: 3.1,
    fontSize: 11, fontFace: FONT, color: WHITE, paraSpaceAfter: 8, margin: 0,
  })
}

// =============================================================
// APPENDIX A1 — Time of Day pattern
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Appendix A1 — Time of Day Pattern', 'A1', 'A')
  sectionHeader(s, '🕐 ช่วงเวลาที่สแกน — Peak Hour')

  s.addChart(pres.charts.BAR, [{
    name: 'จำนวนสแกน',
    labels: ['00-06', '07-09', '10-12', '13-15', '16-18', '19-21', '22-23'],
    values: [2202, 4277, 5031, 4144, 4164, 7382, 1786],
  }], {
    x: 0.4, y: 1.1, w: 9.2, h: 3.5,
    barDir: 'col',
    chartColors: [BRAND],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: BRAND_DD, dataLabelFontFace: FONT, dataLabelFontSize: 10,
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 11,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: SOFT, size: 0.5 },
    showLegend: false,
    showTitle: true, title: 'การกระจายตัวของสแกนรายชั่วโมง (4 วันรวม)',
    titleFontSize: 12, titleColor: BRAND_DD, titleFontFace: FONT,
  })

  s.addText([
    { text: '💡 Insight: ', options: { bold: true, color: BRAND_DD } },
    { text: '🔥 Peak ', options: {} },
    { text: '19-21 น.', options: { bold: true, color: DANGER } },
    { text: ' (7,382 ครั้ง = 22% ของทั้งวัน) → LINE broadcast push ', options: {} },
    { text: '18:30', options: { bold: true } },
    { text: ' จะดักกลุ่มนี้ได้พอดี', options: {} },
  ], {
    x: 0.4, y: 4.7, w: 9.2, h: 0.4,
    fontSize: 11.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// APPENDIX A2 — Cohort Retention
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Appendix A2 — Cohort Retention', 'A2', 'A')
  sectionHeader(s, '📅 Cohort Retention — W0/W1/W2')

  const cH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', fontFace: FONT, fontSize: 11 } })
  const cR = (label, w0, w1, w2, w3, count) => {
    const cell = (v) => v === null
      ? { text: '—', options: { align: 'center', color: MUTED, fontFace: FONT, fontSize: 11 } }
      : { text: `${v}%`, options: { align: 'center', color: v >= 70 ? WHITE : v >= 40 ? BRAND_DD : '713F12', bold: true, fill: { color: v >= 70 ? BRAND : v >= 40 ? BRAND_L : 'FEF3C7' }, fontFace: FONT, fontSize: 11 } }
    return [
      { text: [{ text: label, options: { bold: true, color: BRAND_DD, fontFace: FONT, fontSize: 11 } }, { text: ` (${count})`, options: { color: MUTED, fontFace: FONT, fontSize: 9 } }], options: { valign: 'middle' } },
      cell(w0), cell(w1), cell(w2), cell(w3),
    ]
  }

  const cohortRows = [
    [cH('Cohort'), cH('Week 0'), cH('Week 1'), cH('Week 2'), cH('Week 3')],
    cR('16 พ.ค. cohort', 100, 48, null, null, 440),
    cR('17 พ.ค. cohort', 100, 45, null, null, 460),
    cR('18 พ.ค. cohort', 100, null, null, null, 480),
    cR('19 พ.ค. cohort', 100, null, null, null, 308),
  ]

  s.addTable(cohortRows, {
    x: 0.4, y: 1.1, w: 9.2,
    colW: [3.0, 1.55, 1.55, 1.55, 1.55],
    rowH: 0.55,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addText([
    { text: '💡 Insight: ', options: { bold: true, color: BRAND_DD } },
    { text: 'W1 retention ~45-48% — น่าตั้ง ', options: {} },
    { text: '2nd-scan bonus', options: { bold: true, color: BRAND_D } },
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
// APPENDIX A3 — Heavy Users + Verification
// =============================================================
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Appendix A3 — Heavy Users + Fraud Audit', 'A3', 'A')
  sectionHeader(s, '🚩 Heavy Users + Verification')

  s.addText('🚩 Top 10 Heavy Users (รวม 4 วัน) — SKU น้อย = สงสัย', {
    x: 0.4, y: 1.1, w: 9.2, h: 0.3,
    fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0,
  })

  const hH = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: BRAND_DD }, align: 'center', fontFace: FONT, fontSize: 9 } })
  const hRows = [
    [hH('#'), hH('User'), hH('จังหวัด'), hH('Scans'), hH('SKUs'), hH('อายุ'), hH('Flag')],
    ...[
      { rank: 1, user: 'c25f0278', prov: 'กรุงเทพ',          scans: 103, sku: 7,  age: 29, flag: 'OK' },
      { rank: 2, user: 'd74b8ca0', prov: 'ปราจีนบุรี',         scans:  98, sku: 10, age: 39, flag: 'OK' },
      { rank: 3, user: 'dfcc0925', prov: 'สระแก้ว',           scans:  84, sku: 3,  age: 45, flag: '⚠ SUSPECT' },
      { rank: 4, user: 'c93f2337', prov: 'ขอนแก่น',            scans:  79, sku: 4,  age: 34, flag: 'OK' },
      { rank: 5, user: '8b19f418', prov: 'สมุทรปราการ',       scans:  75, sku: 11, age: 24, flag: 'OK' },
      { rank: 6, user: '7fd7a8e7', prov: 'อุบลราชธานี',        scans:  74, sku: 6,  age: 33, flag: 'OK' },
      { rank: 7, user: 'c77a7adb', prov: 'สระแก้ว',            scans:  70, sku: 4,  age: 20, flag: '⚠ SUSPECT' },
      { rank: 8, user: '8634e133', prov: 'สมุทรปราการ',       scans:  64, sku: 7,  age: 21, flag: 'OK' },
      { rank: 9, user: '02854cd3', prov: 'เชียงราย',           scans:  54, sku: 13, age: 25, flag: 'OK' },
      { rank: 10, user: '81313ac2', prov: 'ระยอง',             scans:  53, sku: 5,  age: 30, flag: 'OK' },
    ].map(u => [
      { text: String(u.rank), options: { align: 'center', color: TEXT, fontFace: FONT, fontSize: 9 } },
      { text: u.user, options: { color: BRAND_D, fontFace: 'Courier New', fontSize: 9 } },
      { text: u.prov, options: { color: TEXT, fontFace: FONT, fontSize: 9 } },
      { text: String(u.scans), options: { align: 'right', color: DANGER, bold: true, fontFace: FONT, fontSize: 9 } },
      { text: String(u.sku), options: { align: 'right', color: u.sku <= 4 ? DANGER : TEXT, bold: u.sku <= 4, fontFace: FONT, fontSize: 9 } },
      { text: String(u.age), options: { align: 'right', color: MUTED, fontFace: FONT, fontSize: 9 } },
      { text: u.flag, options: { align: 'center', color: u.flag.includes('⚠') ? DANGER : POSITIVE, bold: u.flag.includes('⚠'), fontFace: FONT, fontSize: 8.5 } },
    ]),
  ]
  s.addTable(hRows, {
    x: 0.4, y: 1.5, w: 9.2,
    colW: [0.4, 1.4, 1.8, 1.0, 0.9, 0.8, 1.3],
    rowH: 0.28,
    border: { type: 'solid', pt: 0.5, color: BORDER },
    fontFace: FONT,
  })

  s.addText([
    { text: '⚠️ Audit needed: ', options: { bold: true, color: DANGER } },
    { text: '2 users สแกน 70-84 ครั้ง แต่ใช้แค่ 3-4 SKUs — น่าจะเป็นผู้ค้าปลีกหรือ multi-account ต้อง verify', options: {} },
  ], {
    x: 0.4, y: 4.8, w: 9.2, h: 0.3,
    fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// =============================================================
// Write file
// =============================================================
const outPath = path.resolve(__dirname, 'scan-lucky-rich-day1-5-final-v5.pptx')
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Generated:', outPath)
  console.log('   • 12 main slides + 3 appendix = 15 total')
})
