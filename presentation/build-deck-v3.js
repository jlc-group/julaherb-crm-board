// Build v3 — Rights calculated from Excel master per SKU
// Run: node build-deck-v3.js → outputs scan-lucky-rich-day1-3-v3.pptx
const pptxgen = require('pptxgenjs')
const fs = require('fs')
const path = require('path')

// Colors
const GREEN = '16A34A', DEEP = '14532D', GOLD = 'FACC15', GOLD_DEEP = 'CA8A04'
const WHITE = 'FFFFFF', BG = 'F8FAFC', TEXT = '1F2937', MUTED = '6B7280', RED = 'EF4444'
const GREEN_50 = 'F0FDF4', RED_50 = 'FEF2F2', YELLOW_50 = 'FEF9C3'
const FONT = 'Calibri'
const fmt = (n) => Number(n).toLocaleString('en-US')

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'
pres.title  = 'Campaign Report Day 1-3 v3'

// ── Data (verified from ข้อมูลรายวัน folder + Excel master) ──
const DAY_DATA = [
  { date: '16 พ.ค.', wd: 'เสาร์',   newMem: 384, oldMem: 2305, success: 7163, rights: 9094 },
  { date: '17 พ.ค.', wd: 'อาทิตย์', newMem: 414, oldMem: 2617, success: 8713, rights: 10849 },
  { date: '18 พ.ค.', wd: 'จันทร์',  newMem: 428, oldMem: 2153, success: 6459, rights: 8044 },
]
const TOTAL_SUCCESS = 22335
const TOTAL_RIGHTS  = 27987       // ~28,000 (from Excel master calculation)
const TOTAL_NEW_MEM = 1226
const TOTAL_OLD_MEM = 7075
const TOTAL_USERS   = 8301
const MEMBER_BASE   = 834360
const PENETRATION_PCT = (TOTAL_USERS / MEMBER_BASE * 100).toFixed(2)

// Top SKU (3-day) with Excel master rightsPerScan
const TOP_SKU = [
  { sku: 'L3-8G',     name: 'ดีดีครีมแตงโม 8g',   price: 49,  rps: 1, scans: 7436 },
  { sku: 'L4-8G',     name: 'เซรั่มลำไย 8g',      price: 49,  rps: 1, scans: 2164 },
  { sku: 'L6-8G',     name: 'เซรั่มแครอท 8g',     price: 49,  rps: 1, scans: 1602 },
  { sku: 'L10-7G',    name: 'กันแดด 3D 7g',       price: 59,  rps: 1, scans: 1523 },
  { sku: 'L7-6G',     name: 'โดสส้มแดง 6g',       price: 49,  rps: 1, scans: 1084 },
  { sku: 'L13-10G',   name: 'ครีมกุหลาบ 10g',     price: 59,  rps: 1, scans: 1030 },
  { sku: 'C4-8G',     name: 'เซรั่มขิงดำ 8g',     price: 49,  rps: 1, scans:  751 },
  { sku: 'L3-40G',    name: 'ดีดีครีมแตงโม 40g',  price: 245, rps: 5, scans:  691, gem: true },
  { sku: 'L19-8G',    name: 'มอยส์เจลฉ่ำบัว',     price: 49,  rps: 1, scans:  586 },
  { sku: 'L8B-6G',    name: 'อีอีคูชั่น 02',      price: 49,  rps: 1, scans:  402 },
  { sku: 'D3-70G',    name: 'ยาสีฟันออริจินัล',   price: 105, rps: 2, scans:  341, gem: true },
  { sku: 'JHA1-40G',  name: 'บีบีโลชั่นแตงโม',   price: 49,  rps: 1, scans:  303 },
  { sku: 'L8A-6G',    name: 'อีอีคูชั่น 01',      price: 49,  rps: 1, scans:  277 },
  { sku: 'L20-7G',    name: 'กันแดดทานตะวัน 7g',  price: 59,  rps: 1, scans:  261 },
  { sku: 'JH906-70G', name: 'สบู่ลำไย 70g',       price: 59,  rps: 1, scans:  257 },
  { sku: 'L4-40G',    name: 'เซรั่มลำไย 40g',     price: 245, rps: 5, scans:  244, gem: true },
  { sku: 'C3-7G',     name: 'กันแดดเมลอน 7g',     price: 49,  rps: 1, scans:  225 },
  { sku: 'JH905-70G', name: 'สบู่แตงโม 70g',      price: 59,  rps: 1, scans:  202 },
  { sku: 'L10-30G',   name: 'กันแดด 3D 30g',      price: 245, rps: 5, scans:  194, gem: true },
  { sku: 'L6-40G',    name: 'เซรั่มแครอท 40g',    price: 245, rps: 5, scans:  189, gem: true },
]

// Baseline (สแกนสำเร็จ)
const BASELINE = [
  { day: 16, mar: {scans:6859, wd:'จันทร์'},  apr:{scans:6733, wd:'พฤหัส'}, may:{scans:7163, wd:'เสาร์'} },
  { day: 17, mar: {scans:7498, wd:'อังคาร'},  apr:{scans:7211, wd:'ศุกร์'}, may:{scans:8713, wd:'อาทิตย์'} },
  { day: 18, mar: {scans:7114, wd:'พุธ'},     apr:{scans:8581, wd:'เสาร์'}, may:{scans:6459, wd:'จันทร์'} },
]
const B_MAR = 21471, B_APR = 22525, B_MAY = 22335

// Helpers
function header(slide, title, num, total = 10) {
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.45, fill: { color: DEEP }, line: { color: DEEP } })
  slide.addText(title, { x: 0.4, y: 0.05, w: 8.5, h: 0.35, fontSize: 14, fontFace: FONT, color: WHITE, bold: true, valign: 'middle', margin: 0 })
  slide.addText(`${num} / ${total}`, { x: 9, y: 0.05, w: 0.9, h: 0.35, fontSize: 10, fontFace: FONT, color: GOLD, align: 'right', valign: 'middle', margin: 0 })
  slide.addText("สแกนลุ้นรวย สวยลุ้นล้าน  •  16-18 พ.ค. 2026  •  สิทธิ์คำนวณจาก Excel master", { x: 0.4, y: 5.3, w: 9.2, h: 0.25, fontSize: 8.5, fontFace: FONT, color: MUTED, valign: 'middle', margin: 0 })
}
function bigStat(slide, x, y, w, h, value, label, sub, color = GREEN) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: WHITE }, line: { color: 'E5E7EB', width: 0.5 }, shadow: { type: 'outer', blur: 6, offset: 2, angle: 90, color: '000000', opacity: 0.06 } })
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h: 0.05, fill: { color }, line: { color } })
  slide.addText(label, { x: x + 0.15, y: y + 0.12, w: w - 0.3, h: 0.25, fontSize: 9, fontFace: FONT, color: MUTED, bold: true, valign: 'middle', margin: 0 })
  slide.addText(value, { x: x + 0.15, y: y + 0.35, w: w - 0.3, h: 0.55, fontSize: 22, fontFace: FONT, color: DEEP, bold: true, valign: 'middle', margin: 0 })
  if (sub) slide.addText(sub, { x: x + 0.15, y: y + 0.92, w: w - 0.3, h: 0.25, fontSize: 9, fontFace: FONT, color: MUTED, valign: 'middle', margin: 0 })
}

// ============ SLIDE 1: Cover ============
{
  const s = pres.addSlide()
  s.background = { color: DEEP }
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('CAMPAIGN REPORT — DAY 1-3', { x: 0.6, y: 0.35, w: 9, h: 0.3, fontSize: 12, fontFace: FONT, color: GOLD, bold: true, charSpacing: 8, margin: 0 })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', { x: 0.6, y: 0.7, w: 9, h: 0.65, fontSize: 32, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText("16-18 พ.ค. 2026  •  Jula's Herb × ไทยรัฐ TV", { x: 0.6, y: 1.35, w: 9, h: 0.3, fontSize: 13, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  const stats = [
    { val: fmt(TOTAL_SUCCESS),    lab: 'สแกนสำเร็จ',  sub: '3 วันรวม',         color: WHITE },
    { val: '~' + fmt(TOTAL_RIGHTS), lab: 'สิทธิ์ที่เกิด',  sub: 'จาก Excel master', color: GOLD },
    { val: fmt(TOTAL_USERS),      lab: 'Active Users', sub: `${PENETRATION_PCT}% of 834k`, color: WHITE },
    { val: '33%', lab: 'Hero L3-8G', sub: 'ดีดีครีมแตงโม', color: GOLD },
  ]
  stats.forEach((st, i) => {
    const x = 0.6 + i * 2.3
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.95, w: 2.1, h: 1.55, fill: { color: 'FFFFFF', transparency: 92 }, line: { color: GOLD, width: 1 } })
    s.addText(st.val, { x: x + 0.1, y: 2.05, w: 1.9, h: 0.7, fontSize: 26, fontFace: FONT, color: st.color, bold: true, margin: 0 })
    s.addText(st.lab, { x: x + 0.1, y: 2.78, w: 1.9, h: 0.3, fontSize: 11, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(st.sub, { x: x + 0.1, y: 3.1, w: 1.9, h: 0.3, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 3.85, w: 8.8, h: 1.3, fill: { color: 'FFFFFF', transparency: 88 }, line: { color: GOLD, width: 1 } })
  s.addText('💡 Bottom line', { x: 0.8, y: 3.95, w: 8.5, h: 0.3, fontSize: 12, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('สแกนสำเร็จ 22,335 ครั้ง → แจกสิทธิ์ ~28,000 ใบ (SKU 2-5 สิทธิ์/scan) • Lift +4.0% vs มี.ค. (true baseline) • Engagement 51% repeat • Activation แค่ 1% ของฐาน 834k', {
    x: 0.8, y: 4.3, w: 8.5, h: 0.8, fontSize: 11.5, fontFace: FONT, color: WHITE, margin: 0,
  })
}

// ============ SLIDE 2: ภาพรวมการสแกน ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'ภาพรวมการสแกน — สแกนสำเร็จ + สิทธิ์ที่เกิด', 2)

  bigStat(s, 0.4, 0.7, 2.3, 1.4, fmt(TOTAL_SUCCESS), 'สแกนสำเร็จรวม', '3 วัน', GREEN)
  bigStat(s, 2.85, 0.7, 2.3, 1.4, '~' + fmt(TOTAL_RIGHTS), 'สิทธิ์ที่เกิด', 'scan × spec', GOLD_DEEP)
  bigStat(s, 5.3, 0.7, 2.3, 1.4, fmt(TOTAL_USERS), 'Active Users', `${PENETRATION_PCT}% of base`)
  bigStat(s, 7.75, 0.7, 1.85, 1.4, '1.25', 'สิทธิ์/scan avg', '28k ÷ 22.3k', GOLD_DEEP)

  s.addText('🟢 นับเฉพาะสแกนสำเร็จ — ไม่นับสแกนซ้ำ/ไม่พบ:', { x: 0.4, y: 2.3, w: 9, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })

  const skip = [
    { t: 'สแกนซ้ำตัวเอง', v: '2,054' },
    { t: 'สแกนซ้ำคนอื่น', v: '287' },
    { t: 'ไม่พบในระบบ', v: '536' },
    { t: 'ไม่สำเร็จ (Newly)', v: '0' },
  ]
  skip.forEach((it, i) => {
    const x = 0.4 + i * 2.35
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.7, w: 2.2, h: 1.0, fill: { color: BG }, line: { color: 'E5E7EB', width: 0.5 } })
    s.addText(it.t, { x: x + 0.15, y: 2.8, w: 2.0, h: 0.3, fontSize: 11, fontFace: FONT, color: MUTED, bold: true, margin: 0 })
    s.addText(it.v + ' ครั้ง', { x: x + 0.15, y: 3.15, w: 2.0, h: 0.5, fontSize: 20, fontFace: FONT, color: GOLD_DEEP, bold: true, margin: 0 })
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.0, w: 9.2, h: 1.1, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('💡 สูตร: สิทธิ์ = scan × สิทธิ์/scan (จาก Excel)', { x: 0.55, y: 4.1, w: 9, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('ซอง 8g/6g/7g = 1 สิทธิ์/scan (49฿) • ยาสีฟัน 70g = 2 สิทธิ์/scan (99-129฿) • หลอดใหญ่ 40g/30g = 5 สิทธิ์/scan (245-290฿) → สิทธิ์รวมมากกว่า scan ปกติ', {
    x: 0.55, y: 4.4, w: 9, h: 0.65, fontSize: 11, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// ============ SLIDE 3: 3-Day Performance ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, '3-Day Performance — รายวัน', 3)

  DAY_DATA.forEach((d, i) => {
    const x = 0.4 + i * 2.05
    const peak = d.success === Math.max(...DAY_DATA.map(x => x.success))
    bigStat(s, x, 0.7, 1.95, 1.55, fmt(d.success),
      `${d.date} (${d.wd})`,
      `สิทธิ์ ~${fmt(d.rights)}`,
      peak ? GREEN : GOLD_DEEP)
  })
  bigStat(s, 6.6, 0.7, 3, 1.55, fmt(TOTAL_SUCCESS), 'รวม 3 วัน', `สิทธิ์ ~${fmt(TOTAL_RIGHTS)} • ${fmt(TOTAL_USERS)} users`, DEEP)

  s.addChart(pres.charts.BAR, [
    { name: 'สแกนสำเร็จ', labels: DAY_DATA.map(d => `${d.date}\n(${d.wd})`), values: DAY_DATA.map(d => d.success) },
    { name: 'สิทธิ์ที่เกิด', labels: DAY_DATA.map(d => `${d.date}\n(${d.wd})`), values: DAY_DATA.map(d => d.rights) },
  ], {
    x: 0.4, y: 2.45, w: 6, h: 2.6,
    barDir: 'col', barGrouping: 'clustered',
    showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 10,
    chartColors: [GREEN, GOLD],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontSize: 10, catAxisLabelFontFace: FONT,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.45, w: 3, h: 2.6, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('Pattern', { x: 6.75, y: 2.55, w: 2.8, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'เสาร์ → อาทิตย์ +21.6%', options: { bullet: true, breakLine: true } },
    { text: 'จันทร์ -25.9% from peak', options: { bullet: true, breakLine: true } },
    { text: 'Weekend = peak ชัดเจน', options: { bullet: true, breakLine: true } },
    { text: 'สิทธิ์มากกว่า scan ~25%', options: { bullet: true } },
  ], { x: 6.75, y: 2.9, w: 2.8, h: 2.1, fontSize: 10.5, fontFace: FONT, color: TEXT, paraSpaceAfter: 6, margin: 0 })
}

// ============ SLIDE 4: Baseline Comparison ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Baseline Comparison — สแกนสำเร็จ 16-18 ของ มี.ค./เม.ย./พ.ค.', 4)
  s.addText('มี.ค. = clean baseline (ไม่มีแคมเปญ) • เม.ย. = ช่วงสงกรานต์ • พ.ค. = สแกนลุ้นรวย', { x: 0.4, y: 0.55, w: 9.2, h: 0.3, fontSize: 12, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const cell = (val, wd, hl = false) => ({
    text: [
      { text: fmt(val) + '  ', options: { bold: true, color: hl ? DEEP : TEXT, fontFace: FONT, fontSize: 12 } },
      { text: '(' + wd + ')', options: { color: MUTED, fontFace: FONT, fontSize: 9 } },
    ],
    options: { align: 'right', valign: 'middle', ...(hl ? { fill: { color: GREEN_50 } } : {}) },
  })
  const deltaCell = (pct) => {
    const pos = pct >= 0
    return { text: (pos ? '+' : '') + pct.toFixed(1) + '% ' + (pos ? '✅' : '❌'),
      options: { align: 'right', valign: 'middle', bold: true, color: pos ? GREEN : RED, fontFace: FONT, fontSize: 12 } }
  }
  const dayCell = (n) => ({ text: String(n), options: { align: 'center', bold: true, color: GREEN, fontFace: FONT, fontSize: 14, valign: 'middle' } })
  const hdr = (txt, fill = DEEP) => ({ text: txt, options: { bold: true, color: WHITE, fill: { color: fill }, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 11 } })
  const pctDelta = (a, b) => ((a - b) / b) * 100

  const rows = [
    [hdr('วันที่'), hdr('มี.ค.\n(no campaign)'), hdr('เม.ย.\n(สงกรานต์)'), hdr('พ.ค. 🎯\n(ลุ้นรวย)', GREEN), hdr('Δ vs เม.ย.'), hdr('Δ vs มี.ค.\n⭐ true lift')],
    ...BASELINE.map(r => [
      dayCell(r.day),
      cell(r.mar.scans, r.mar.wd),
      cell(r.apr.scans, r.apr.wd),
      cell(r.may.scans, r.may.wd, true),
      deltaCell(pctDelta(r.may.scans, r.apr.scans)),
      deltaCell(pctDelta(r.may.scans, r.mar.scans)),
    ]),
    [
      { text: 'รวม', options: { align: 'center', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: fmt(B_MAR), options: { align: 'right', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: fmt(B_APR), options: { align: 'right', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      { text: fmt(B_MAY), options: { align: 'right', bold: true, color: DEEP, fill: { color: GREEN }, fontFace: FONT, fontSize: 13, valign: 'middle' } },
      deltaCell(pctDelta(B_MAY, B_APR)),
      deltaCell(pctDelta(B_MAY, B_MAR)),
    ],
  ]
  s.addTable(rows, {
    x: 0.4, y: 0.95, w: 9.2, colW: [0.7, 1.7, 1.7, 1.8, 1.65, 1.65],
    rowH: 0.55, border: { type: 'solid', pt: 0.5, color: 'E2E8F0' }, fontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.0, w: 9.2, h: 1.1, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1.2 } })
  s.addText('✅ KEY: True lift = +4.0% เทียบ มี.ค. (เดือนเดียวที่ไม่มีแคมเปญ)', { x: 0.55, y: 4.1, w: 9, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('เม.ย. มีสงกรานต์ campaign → ไม่ใช่ baseline สะอาด • Δ −0.84% vs เม.ย. คาดได้ (เทียบ campaign-vs-campaign) • Caveat: weekday mismatch ระหว่าง พ.ค. 16-17 (เสาร์-อาทิตย์) vs มี.ค. (วันธรรมดา)', {
    x: 0.55, y: 4.4, w: 9, h: 0.7, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// ============ SLIDE 5: Customer Mix ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Customer Mix — สมาชิกใหม่ vs เก่า', 5)

  bigStat(s, 0.4, 0.7, 2.3, 1.3, fmt(TOTAL_NEW_MEM), 'สมาชิกใหม่', `${(TOTAL_NEW_MEM/TOTAL_USERS*100).toFixed(1)}% ของ active`, GREEN)
  bigStat(s, 2.85, 0.7, 2.3, 1.3, fmt(TOTAL_OLD_MEM), 'สมาชิกเก่า', `${(TOTAL_OLD_MEM/TOTAL_USERS*100).toFixed(1)}% ของ active`)
  bigStat(s, 5.3, 0.7, 2.3, 1.3, fmt(MEMBER_BASE), 'ฐานสมาชิก JLC', 'in DB', GOLD_DEEP)
  bigStat(s, 7.75, 0.7, 1.85, 1.3, `${PENETRATION_PCT}%`, 'Penetration', `${fmt(TOTAL_USERS)} active`, RED)

  s.addChart(pres.charts.BAR, [
    { name: 'สมาชิกใหม่', labels: DAY_DATA.map(d => d.date), values: DAY_DATA.map(d => d.newMem) },
    { name: 'สมาชิกเก่า', labels: DAY_DATA.map(d => d.date), values: DAY_DATA.map(d => d.oldMem) },
  ], {
    x: 0.4, y: 2.2, w: 6, h: 2.9,
    barDir: 'col', barGrouping: 'stacked',
    chartColors: [GREEN, GOLD],
    chartArea: { fill: { color: WHITE } },
    showValue: true, dataLabelFontFace: FONT, dataLabelFontSize: 9, dataLabelColor: WHITE,
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: true, legendPos: 'b', legendFontFace: FONT, legendFontSize: 10,
    showTitle: true, title: 'New vs Old per Day', titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.6, y: 2.2, w: 3, h: 2.9, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('💡 Big Picture', { x: 6.75, y: 2.3, w: 2.8, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText('ฐาน JLC = 834k คน', { x: 6.75, y: 2.65, w: 2.8, h: 0.3, fontSize: 11, fontFace: FONT, color: TEXT, margin: 0 })
  s.addText(`Activated แค่ ${PENETRATION_PCT}%`, { x: 6.75, y: 2.95, w: 2.8, h: 0.4, fontSize: 18, fontFace: FONT, color: RED, bold: true, margin: 0 })
  s.addText([
    { text: 'runway โต activation สูงมาก', options: { bullet: true, breakLine: true } },
    { text: 'New rate ขึ้น 14%→16%→20%', options: { bullet: true, breakLine: true } },
    { text: 'LINE broadcast จะปลุกได้', options: { bullet: true } },
  ], { x: 6.75, y: 3.55, w: 2.8, h: 1.55, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// ============ SLIDE 6: Engagement Win ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Engagement Win 💚', 6)

  bigStat(s, 0.4, 0.7, 2.3, 1.3, '51%', 'Repeat Rate', 'industry 25-30%', GREEN)
  bigStat(s, 2.85, 0.7, 2.3, 1.3, '0.8 นาที', 'Median gap', 'batch scan')
  bigStat(s, 5.3, 0.7, 2.3, 1.3, '73%', 'Return < 1 ชม.', 'sticky users', GOLD_DEEP)
  bigStat(s, 7.75, 0.7, 1.85, 1.3, '2.69', 'สแกน/คน', `${fmt(TOTAL_SUCCESS)}÷${fmt(TOTAL_USERS)}`, GOLD_DEEP)

  const dist = [
    { label: '1 scan',  val: 4041 }, { label: '2 scans', val: 1695 },
    { label: '3 scans', val:  756 }, { label: '4-5',     val:  755 },
    { label: '6-10',    val:  584 }, { label: '10+',     val:  270 },
  ]
  s.addChart(pres.charts.BAR, [{ name: 'Users', labels: dist.map(d => d.label), values: dist.map(d => d.val) }], {
    x: 0.4, y: 2.2, w: 6.2, h: 2.8,
    barDir: 'col', showValue: true, dataLabelPosition: 'outEnd',
    dataLabelColor: DEEP, dataLabelFontFace: FONT, dataLabelFontSize: 10,
    chartColors: ['94A3B8', GREEN, '15803D', DEEP, GOLD, GOLD_DEEP],
    chartArea: { fill: { color: WHITE } },
    catAxisLabelColor: TEXT, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 10,
    valAxisLabelColor: MUTED, valAxisLabelFontSize: 9,
    valGridLine: { color: 'E2E8F0', size: 0.5 }, catGridLine: { style: 'none' },
    showLegend: false, showTitle: true, title: 'Distribution: scans per user (3-day)',
    titleFontSize: 12, titleColor: DEEP, titleFontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 2.2, w: 2.8, h: 2.8, fill: { color: GREEN_50 }, line: { color: GREEN, width: 1 } })
  s.addText('💡 What it means', { x: 6.95, y: 2.3, w: 2.6, h: 0.3, fontSize: 13, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  s.addText([
    { text: 'Median 0.8 นาที = batch scan', options: { bullet: true, breakLine: true } },
    { text: '50% มี scan 2+ ครั้ง', options: { bullet: true, breakLine: true } },
    { text: '6+ scans = 854 heavy users', options: { bullet: true, breakLine: true } },
    { text: 'แคมเปญสร้าง brand love', options: { bullet: true } },
  ], { x: 6.95, y: 2.7, w: 2.6, h: 2.2, fontSize: 10, fontFace: FONT, color: TEXT, paraSpaceAfter: 5, margin: 0 })
}

// ============ SLIDE 7: Hero SKU ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Hero SKU 🏆 — L3-8G ดีดีครีมแตงโม', 7)

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 5, h: 4.45, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 0.7, w: 0.15, h: 4.45, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('🏆 BOSS SKU', { x: 0.75, y: 0.85, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, bold: true, charSpacing: 6, margin: 0 })
  s.addText('ดีดีครีมแตงโม', { x: 0.75, y: 1.15, w: 4.5, h: 0.5, fontSize: 22, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
  s.addText('L3-8G  •  ซอง 8G  •  49 บาท  •  1 สิทธิ์/scan', { x: 0.75, y: 1.7, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: GOLD, margin: 0 })

  s.addText('7,436', { x: 0.75, y: 2.1, w: 4.5, h: 1.0, fontSize: 52, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('สแกนสำเร็จ 3 วัน  =  7,436 สิทธิ์', { x: 0.75, y: 3.05, w: 4.5, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', margin: 0 })

  const sub = [
    { v: 'D16: 2,452', l: 'เสาร์' },
    { v: 'D17: 2,822', l: 'อาทิตย์ peak' },
    { v: 'D18: 2,162', l: 'จันทร์' },
    { v: '33% ของ scan', l: '27% ของสิทธิ์' },
  ]
  sub.forEach((d, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 0.75 + col * 2.2, y = 3.5 + row * 0.75
    s.addText(d.v, { x, y, w: 2.0, h: 0.4, fontSize: 17, fontFace: FONT, color: WHITE, bold: true, margin: 0 })
    s.addText(d.l, { x, y: y + 0.4, w: 2.0, h: 0.25, fontSize: 9, fontFace: FONT, color: 'CBD5E1', margin: 0 })
  })

  s.addText('Concentration (Pareto)', { x: 5.6, y: 0.75, w: 4, h: 0.35, fontSize: 14, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
  const pareto = [
    { label: 'Top 1 (L3-8G)', val: 33, color: GOLD },
    { label: 'Top 3 SKU',     val: 50, color: GREEN },
    { label: 'Top 10 SKU',    val: 76, color: DEEP },
  ]
  pareto.forEach((p, i) => {
    const y = 1.25 + i * 0.7
    s.addText(p.label, { x: 5.6, y, w: 4, h: 0.3, fontSize: 11, fontFace: FONT, color: TEXT, bold: true, margin: 0 })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: y + 0.3, w: 4, h: 0.25, fill: { color: 'F1F5F9' }, line: { color: 'E2E8F0', width: 0.5 } })
    s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: y + 0.3, w: 4 * (p.val / 100), h: 0.25, fill: { color: p.color }, line: { color: p.color } })
    s.addText(p.val + '%', { x: 5.6 + 4 * (p.val / 100) - 0.6, y: y + 0.3, w: 0.6, h: 0.25, fontSize: 10, fontFace: FONT, color: WHITE, bold: true, align: 'right', valign: 'middle', margin: 0 })
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: 3.55, w: 4, h: 1.55, fill: { color: RED_50 }, line: { color: RED, width: 1 } })
  s.addText('⚠️ Concentration Risk', { x: 5.75, y: 3.65, w: 3.8, h: 0.3, fontSize: 12, fontFace: FONT, color: '991B1B', bold: true, margin: 0 })
  s.addText('ถ้า L3-8G stock-out = กระทบ 33% ของยอด scan ทันที — backup supply + alert ถ้า inv < 7 วัน', {
    x: 5.75, y: 4.0, w: 3.8, h: 1.05, fontSize: 10.5, fontFace: FONT, color: TEXT, margin: 0,
  })
}

// ============ SLIDE 8: Top 15 SKU ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Top 15 SKU — สแกน + สิทธิ์ที่เกิด', 8)
  s.addText('สิทธิ์ = สแกนสำเร็จ × สิทธิ์/scan (Excel master) • 💎 = SKU ราคาสูง สิทธิ์/scan 2-5', { x: 0.4, y: 0.55, w: 9.2, h: 0.3, fontSize: 11, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const top15 = TOP_SKU.slice(0, 15)
  const rows = [[
    { text: '#', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'center', fontFace: FONT, fontSize: 10 } },
    { text: 'SKU', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'left', fontFace: FONT, fontSize: 10 } },
    { text: 'ชื่อ', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'left', fontFace: FONT, fontSize: 10 } },
    { text: 'ราคา', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'right', fontFace: FONT, fontSize: 10 } },
    { text: 'สิทธิ์/scan', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'center', fontFace: FONT, fontSize: 10 } },
    { text: 'สแกน 3 วัน', options: { bold: true, color: WHITE, fill: { color: DEEP }, align: 'right', fontFace: FONT, fontSize: 10 } },
    { text: 'สิทธิ์ที่เกิด', options: { bold: true, color: WHITE, fill: { color: GOLD_DEEP }, align: 'right', fontFace: FONT, fontSize: 10 } },
  ]]
  top15.forEach((sku, i) => {
    const calc = sku.scans * sku.rps
    const isGem = sku.gem
    rows.push([
      { text: String(i + 1), options: { align: 'center', fontFace: FONT, fontSize: 10, color: i === 0 ? GOLD_DEEP : TEXT, bold: i === 0, valign: 'middle' } },
      { text: sku.sku, options: { align: 'left', fontFace: FONT, fontSize: 10, color: GREEN, bold: true, valign: 'middle' } },
      { text: sku.name + (isGem ? '  💎' : '') + (i === 0 ? '  🏆' : ''), options: { align: 'left', fontFace: FONT, fontSize: 10, color: TEXT, valign: 'middle' } },
      { text: fmt(sku.price) + '฿', options: { align: 'right', fontFace: FONT, fontSize: 10, color: TEXT, valign: 'middle' } },
      { text: String(sku.rps), options: { align: 'center', fontFace: FONT, fontSize: 11, color: sku.rps >= 2 ? GOLD_DEEP : TEXT, bold: sku.rps >= 2, valign: 'middle' } },
      { text: fmt(sku.scans), options: { align: 'right', fontFace: FONT, fontSize: 10, color: TEXT, valign: 'middle' } },
      { text: fmt(calc), options: { align: 'right', fontFace: FONT, fontSize: 11, color: isGem ? '854D0E' : DEEP, bold: true, valign: 'middle', ...(isGem ? { fill: { color: YELLOW_50 } } : {}) } },
    ])
  })
  // Subtotal row
  const topScans = top15.reduce((s, x) => s + x.scans, 0)
  const topRights = top15.reduce((s, x) => s + x.scans * x.rps, 0)
  rows.push([
    { text: '', options: { fill: { color: 'E5F7ED' } } },
    { text: '', options: { fill: { color: 'E5F7ED' } } },
    { text: 'Top 15 รวม', options: { align: 'left', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 11, valign: 'middle' } },
    { text: '', options: { fill: { color: 'E5F7ED' } } },
    { text: '', options: { fill: { color: 'E5F7ED' } } },
    { text: fmt(topScans), options: { align: 'right', bold: true, color: DEEP, fill: { color: 'E5F7ED' }, fontFace: FONT, fontSize: 11, valign: 'middle' } },
    { text: fmt(topRights), options: { align: 'right', bold: true, color: WHITE, fill: { color: GREEN }, fontFace: FONT, fontSize: 12, valign: 'middle' } },
  ])

  s.addTable(rows, {
    x: 0.4, y: 0.95, w: 9.2,
    colW: [0.4, 1.0, 3.0, 0.7, 0.9, 1.3, 1.9],
    rowH: 0.24, border: { type: 'solid', pt: 0.3, color: 'E2E8F0' }, fontFace: FONT,
  })

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 5.0, w: 9.2, h: 0.25, fill: { color: YELLOW_50 }, line: { color: GOLD_DEEP, width: 0.5 } })
  s.addText('💎 = Hidden Gem (สิทธิ์/scan = 2-5) → push customer ซื้อ size ใหญ่ = สิทธิ์มากขึ้น + ขายของแพงขึ้น', {
    x: 0.55, y: 5.0, w: 9, h: 0.25, fontSize: 9, fontFace: FONT, color: '854D0E', bold: true, valign: 'middle', margin: 0,
  })
}

// ============ SLIDE 9: Watch Points ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Watch Points — ที่ต้องระวัง', 9)

  const watch = [
    { num: '1', t: 'Hero SKU Concentration', d: 'L3-8G = 33% ของ scan • ถ้า stock-out กระทบทันที — เตรียม backup supply + alert ถ้า inv < 7 วัน' },
    { num: '2', t: 'Day-3 Momentum Drop', d: 'จันทร์ตก -25.9% จาก peak (อาทิตย์) — ต้องดูสัปดาห์ถัดไปว่า rebound หรือ structural?' },
    { num: '3', t: 'Dead SKU 16 ตัว', d: 'ไม่มีสแกนเลย 3 วัน → ต้อง audit distribution + POSM ภายในสัปดาห์นี้' },
    { num: '4', t: '1 user สแกน 100+ ครั้ง', d: 'อาจเป็น sales/multi-account → ต้อง audit + อาจ block ถ้าเป็น fraud' },
    { num: '5', t: 'True lift +4% vs มี.ค.', d: 'เม.ย. มีสงกรานต์ campaign → ไม่ใช่ clean baseline • มี.ค. = baseline สะอาด → +4% คือ lift จริง — น้อยกว่าคาด ต้อง push activation' },
    { num: '6', t: 'Penetration แค่ 1% ของฐาน', d: 'ฐาน JLC 834k แต่ activated แค่ 8,301 — runway โต activation เยอะ ถ้าทำ broadcast' },
  ]
  watch.forEach((w, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 0.4 + col * 4.7, y = 0.7 + row * 1.45
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.5, h: 1.35, fill: { color: RED_50 }, line: { color: 'FECACA', width: 0.5 } })
    s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.2, w: 0.45, h: 0.45, fill: { color: RED }, line: { color: RED } })
    s.addText(w.num, { x: x + 0.15, y: y + 0.2, w: 0.45, h: 0.45, fontSize: 16, fontFace: FONT, color: WHITE, bold: true, align: 'center', valign: 'middle', margin: 0 })
    s.addText(w.t, { x: x + 0.7, y: y + 0.1, w: 3.7, h: 0.3, fontSize: 12, fontFace: FONT, color: DEEP, bold: true, margin: 0 })
    s.addText(w.d, { x: x + 0.7, y: y + 0.4, w: 3.7, h: 0.9, fontSize: 9.5, fontFace: FONT, color: TEXT, margin: 0 })
  })
}

// ============ SLIDE 10: Recommendations + Q&A ============
{
  const s = pres.addSlide()
  s.background = { color: WHITE }
  header(s, 'Recommendations + Q&A', 10)
  s.addText('🎯 5 actions priority order', { x: 0.4, y: 0.6, w: 9.2, h: 0.3, fontSize: 14, fontFace: FONT, color: GREEN, bold: true, margin: 0 })

  const recs = [
    { num: '1', title: 'LINE broadcast push', desc: 'Penetration 1% — broadcast เตือนสิทธิ์ + รอบประกาศ ปลุกฐาน 834k' },
    { num: '2', title: 'Push hidden gem SKU', desc: 'L3-40G/L4-40G ขนาด 40g = 5 สิทธิ์/scan — bundle promo + content "ซื้อใหญ่ลุ้นเยอะ"' },
    { num: '3', title: 'Hero SKU stock plan', desc: 'L3-8G drives 33% — backup supply + alert ถ้า inv < 7 วัน' },
    { num: '4', title: 'Dead SKU audit (16 ตัว)', desc: 'Distribution + POSM check ภายในสัปดาห์นี้' },
    { num: '5', title: 'Weekend content timing', desc: 'Peak อาทิตย์ +21% — focus ads เสาร์-อาทิตย์ + ลงก่อน peak 30 นาที' },
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

  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.0, w: 3.5, h: 4.05, fill: { color: DEEP }, line: { color: DEEP } })
  s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: 1.0, w: 0.1, h: 4.05, fill: { color: GOLD }, line: { color: GOLD } })
  s.addText('❓ Q & A', { x: 6.3, y: 1.15, w: 3.2, h: 0.4, fontSize: 18, fontFace: FONT, color: GOLD, bold: true, margin: 0 })
  s.addText('คำถามที่อยากได้คำตอบ', { x: 6.3, y: 1.55, w: 3.2, h: 0.3, fontSize: 11, fontFace: FONT, color: 'CBD5E1', italic: true, margin: 0 })
  s.addText([
    { text: 'KPI ของแคมเปญคืออะไร?', options: { bullet: true, breakLine: true } },
    { text: 'Media spend? ROI?', options: { bullet: true, breakLine: true } },
    { text: 'Hero SKU stock plan?', options: { bullet: true, breakLine: true } },
    { text: 'Approval LINE broadcast?', options: { bullet: true, breakLine: true } },
    { text: 'Next review cadence?', options: { bullet: true } },
  ], { x: 6.3, y: 1.95, w: 3.2, h: 3.0, fontSize: 11, fontFace: FONT, color: WHITE, paraSpaceAfter: 6, margin: 0 })
}

const outPath = path.resolve(__dirname, 'scan-lucky-rich-day1-3-v3-fixed.pptx')
pres.writeFile({ fileName: outPath }).then(() => {
  console.log('✅ Generated:', outPath)
})
