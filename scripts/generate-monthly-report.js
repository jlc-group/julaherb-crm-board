/**
 * generate-monthly-report.js
 * สร้าง .pptx สรุปรายเดือนจากไฟล์ Excel ที่โหลดจากปุ่ม "ดาวน์โหลดข้อมูล"
 *
 * วิธีใช้:
 *   node scripts/generate-monthly-report.js "Report Update per Month/dashboard-export-2026-05-16-to-2026-06-16 (1).xlsx"
 *
 * ต้องรันจาก root ของ repo (C:\My GitHub\julaherb-crm-board-final)
 */

const path = require('path')
const XLSX = require('../scan-lucky-rich-dashboard/node_modules/xlsx')
const PptxGenJS = require('../scan-lucky-rich-dashboard/node_modules/pptxgenjs')

// ─── Colors ───────────────────────────────────────────────────────
const GREEN  = '0A5C40'
const GREEN2 = '14532D'
const GOLD   = 'B45309'
const RED    = 'DC2626'
const GREY   = '64748B'
const FONT   = 'Tahoma'

const nf = (n) => Number(n || 0).toLocaleString('th-TH')

// ─── อ่านไฟล์ Excel ───────────────────────────────────────────────
const xlsxPath = path.resolve(process.argv[2] || 'Report Update per Month/dashboard-export-2026-05-16-to-2026-06-16 (1).xlsx')
console.log('📂 อ่านไฟล์:', xlsxPath)
const wb = XLSX.readFile(xlsxPath)

const sheet  = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name] || {})
const sumArr = sheet('Summary')

// แปลง Summary array → object
const S = {}
sumArr.forEach(r => { if (r.key && !(r.key in S)) S[r.key] = r.value })
const daily    = sheet('Daily Rows')
const provinces= sheet('Top Provinces')
const heavyU   = sheet('Heavy Users')
const skuRows  = sheet('SKU Per Day').sort((a,b) => b.specTickets - a.specTickets)
const engRows  = sheet('Engagement')
const members  = sheet('Members Daily')

// ─── คำนวณ derived values ─────────────────────────────────────────
const peakDay = daily.reduce((best, r) => (!best || r.success > best.success) ? r : best, null)
const totalMemberNew = members.reduce((s,r) => s + (r.memberNew||0), 0)
const totalMemberOld = members.reduce((s,r) => s + (r.memberOld||0), 0)
const avgScansPerUser = S.uniqueUsers ? (S.success / S.uniqueUsers).toFixed(2) : '0'
const maxScans = Math.max(...heavyU.map(u => u.scans || 0))
const v20 = heavyU.filter(u => u.scans >= 20).length
const v30 = heavyU.filter(u => u.scans >= 30).length
const v50 = heavyU.filter(u => u.scans >= 50).length
const uptimePct = 100 - (daily.filter(r => r.outage && r.outage !== '').length / daily.length * 100)

// ─── Week-over-week buckets (7 วัน/chunk นับจากวันแรก) ─────────────
const weekBuckets = []
for (let i = 0; i < daily.length; i += 7) {
  const chunk = daily.slice(i, i + 7)
  const total = chunk.reduce((s, r) => s + (r.success || 0), 0)
  weekBuckets.push({
    label: `สัปดาห์ ${weekBuckets.length + 1}\n(${chunk[0].date.slice(5)}–${chunk[chunk.length-1].date.slice(5)})`,
    shortLabel: `ส${weekBuckets.length + 1}\n${chunk[0].date.slice(5)}`,
    total,
    days: chunk.length,
    avgPerDay: Math.round(total / chunk.length),
  })
}
const wowGrowth = weekBuckets.length >= 2
  ? ((weekBuckets[weekBuckets.length-1].total - weekBuckets[weekBuckets.length-2].total) / weekBuckets[weekBuckets.length-2].total * 100).toFixed(1)
  : '0'

// ─── Day-of-week pattern (เฉลี่ย) ────────────────────────────────
const DAYS_TH = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์']
const DAYS_SHORT = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']
const dayAccum = Array.from({length:7}, () => ({sum:0, count:0}))
daily.forEach(r => {
  const d = new Date(r.date)
  const dow = isNaN(d) ? -1 : d.getDay()
  if (dow >= 0) { dayAccum[dow].sum += r.success || 0; dayAccum[dow].count++ }
})
const dayAvg = dayAccum.map((acc, i) => ({
  label: DAYS_SHORT[i],
  fullName: DAYS_TH[i],
  avg: acc.count ? Math.round(acc.sum / acc.count) : 0,
}))
const peakDow = dayAvg.reduce((best, d) => d.avg > best.avg ? d : best, dayAvg[0])

// ─── Anomaly detection ────────────────────────────────────────────
const meanSuccess = daily.reduce((s,r) => s + (r.success||0), 0) / daily.length
const stdSuccess = Math.sqrt(daily.reduce((s,r) => s + Math.pow((r.success||0)-meanSuccess,2), 0) / daily.length)
const dupNormal = daily.reduce((s,r) => s + (r.dupSelf||0), 0) / daily.length
const anomalies = daily.filter(r =>
  (r.success||0) < meanSuccess - 1.5 * stdSuccess ||
  (r.dupSelf||0) > dupNormal * 2.5
).map(r => ({
  date: r.date,
  weekday: r.weekday,
  success: r.success,
  dupSelf: r.dupSelf,
  successRate: r.successRate,
  type: (r.dupSelf||0) > dupNormal * 2.5
    ? `ซ้ำพุ่ง ${nf(r.dupSelf)} (ปกติ ~${nf(Math.round(dupNormal))})`
    : `สำเร็จต่ำ ${nf(r.success)} (เฉลี่ย ${nf(Math.round(meanSuccess))})`,
}))

console.log(`📊 ข้อมูล: ${S.from} → ${S.to} (${daily.length} วัน)`)
console.log(`   สแกนสำเร็จ ${nf(S.success)} | unique users ${nf(S.uniqueUsers)} | tickets ${nf(S.tickets)}`)

// ─── สร้าง PPTX ──────────────────────────────────────────────────
const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE' // 13.33 x 7.5"

const TOTAL_SLIDES = 14

function frame(s, n, title, sub, badge) {
  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:'100%', h:0.9, fill:{color:GREEN} })
  s.addText(title, { x:0.4, y:0.08, w:9, h:0.75, fontSize:24, bold:true, color:'FFFFFF', fontFace:FONT, valign:'middle' })
  s.addText(sub.toUpperCase(), { x:0.45, y:0.56, w:9, h:0.3, fontSize:9, color:'BBE5C9', fontFace:FONT })
  if (badge) s.addText(badge, { x:10.6, y:0.28, w:2.3, h:0.38, fontSize:9, bold:true, color:'713F12', fill:{color:'FDE68A'}, align:'center', fontFace:FONT, rectRadius:4 })
  s.addText(`สแกนลุ้นรวย สวยลุ้นล้าน  •  Slide ${n} / ${TOTAL_SLIDES}  •  ข้อมูล ${S.from} – ${S.to}`,
    { x:0.4, y:7.1, w:12.5, h:0.25, fontSize:7, color:GREY, fontFace:FONT })
}

function kpi(s, x, y, w, label, value, sub, tone) {
  const bg = tone === 'gold' ? 'FFFBEB' : tone === 'red' ? 'FEF2F2' : 'F1F5F9'
  const vc = tone === 'gold' ? GOLD : tone === 'red' ? RED : GREEN
  s.addShape(pptx.ShapeType.roundRect, { x, y, w, h:1.7, fill:{color:bg}, line:{color:'E2E8F0',width:1}, rectRadius:0.1 })
  s.addText(label,  { x, y:y+0.12, w, h:0.3, fontSize:10, bold:true,  color:GREY, align:'center', fontFace:FONT })
  s.addText(value,  { x, y:y+0.44, w, h:0.7, fontSize:28, bold:true,  color:vc,   align:'center', fontFace:FONT })
  s.addText(sub,    { x, y:y+1.2,  w, h:0.35,fontSize:10, color:'94A3B8', align:'center', fontFace:FONT })
}

// ── 1. COVER ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide()
  s.background = { color: GREEN2 }
  s.addShape(pptx.ShapeType.rect, { x:0, y:3.5, w:'100%', h:0.06, fill:{color:'FFFFFF'}, line:{color:'FFFFFF'} })
  s.addText('MONTHLY CAMPAIGN REPORT', { x:0, y:1.4, w:'100%', h:0.5, fontSize:13, color:'BBE5C9', align:'center', charSpacing:5, fontFace:FONT })
  s.addText('สแกนลุ้นรวย สวยลุ้นล้าน', { x:0, y:2.0, w:'100%', h:1.1, fontSize:46, bold:true, color:'FFFFFF', align:'center', fontFace:FONT })
  s.addText("Jula's Herb × ไทยรัฐ", { x:0, y:3.2, w:'100%', h:0.5, fontSize:17, color:'DDEEDD', align:'center', fontFace:FONT })
  s.addText(`รายงานสรุปผล 1 เดือน • ${S.from} – ${S.to}`, { x:0, y:4.8, w:'100%', h:0.4, fontSize:13, color:'AACCBB', align:'center', fontFace:FONT })
  s.addText(`สแกนสำเร็จรวม  ${nf(S.success)}  ครั้ง  •  ผู้เข้าร่วม  ${nf(S.uniqueUsers)}  คน`, { x:0, y:5.5, w:'100%', h:0.4, fontSize:13, bold:true, color:'FBBF24', align:'center', fontFace:FONT })
  s.addText(`ออกรายงาน: ${new Date().toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'})}`, { x:0, y:7.1, w:'100%', h:0.3, fontSize:9, color:'556655', align:'center', fontFace:FONT })
}

// ── 2. EXECUTIVE SUMMARY ──────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 2, 'สรุปผู้บริหาร', 'Executive Summary — 1 Month Overview')
  const w=2.35, gap=0.14, x0=0.4, y=2.2
  kpi(s, x0+0*(w+gap), y, w, 'สแกนสำเร็จ',     nf(S.success),         `success rate ${Number(S.successRate).toFixed(1)}%`)
  kpi(s, x0+1*(w+gap), y, w, 'ผู้เข้าร่วม',     nf(S.uniqueUsers),     `distinct: ${nf(S.distinctUsers)}`)
  kpi(s, x0+2*(w+gap), y, w, 'สิทธิ์ (DB)',     nf(S.tickets),         `expected ${nf(S.expectedTickets)}`, 'gold')
  kpi(s, x0+3*(w+gap), y, w, 'สแกนทั้งหมด',    nf(S.totalAttempts),   'รวมซ้ำ/ไม่พบ')
  kpi(s, x0+4*(w+gap), y, w, 'ระยะเวลา',        `${daily.length} วัน`, `เฉลี่ย ${nf(Math.round(S.avgScansPerDay))} สแกน/วัน`)

  if (Number(S.ticketGap) > 0) {
    s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:4.3, w:12.5, h:0.7, fill:{color:'FEF3C7'}, line:{color:'F59E0B',width:1.5}, rectRadius:0.08 })
    s.addText(`⚠️  DB ออกสิทธิ์น้อยกว่าที่ควรได้ ${nf(S.ticketGap)} สิทธิ์ (${(S.ticketGap/S.expectedTickets*100).toFixed(1)}% ของสเปก) — ควร verify ก่อนจับรางวัล`,
      { x:0.6, y:4.35, w:12.1, h:0.6, fontSize:12, color:'78350F', fontFace:FONT, valign:'middle' })
  }
}

// ── 3. DAILY TREND ────────────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 3, 'แนวโน้มการสแกน (รายวัน)', 'Daily Scan Trend')
  const labels  = daily.map(r => r.date.slice(5))
  const chartData = [
    { name:'สแกนสำเร็จ',    labels, values: daily.map(r => r.success) },
    { name:'สิทธิ์ตามสเปก', labels, values: daily.map(r => r.expectedTickets) },
  ]
  s.addChart(pptx.ChartType.line, chartData, {
    x:0.4, y:1.1, w:12.5, h:5.2,
    showLegend:true, legendPos:'t',
    lineSmooth:true, chartColors:['10B981','6366F1'], lineSize:2,
    catAxisLabelFontSize:7, valAxisLabelFontSize:8, fontFace:FONT,
  })
  if (peakDay) s.addText(`📈 Peak: ${peakDay.date}  •  ${nf(peakDay.success)} สแกน  •  ${nf(peakDay.expectedTickets)} สิทธิ์`,
    { x:0.4, y:6.4, w:10, h:0.3, fontSize:10, color:GREEN, bold:true, fontFace:FONT })
}

// ── 4. TOP SKU ────────────────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 4, 'สินค้าขายดี — Top SKU', 'Top Products by Rights Redeemed')
  const top10 = skuRows.slice(0, 10)
  const header = ['#','สินค้า','สแกน','สิทธิ์','share%'].map(h => ({
    text: h, options: { bold:true, color:'FFFFFF', fill:{color:GREEN}, fontFace:FONT, fontSize:11 }
  }))
  const rows = [header, ...top10.map((r,i) => [
    { text: String(i+1), options:{fontFace:FONT} },
    { text: r.displayName || r.sku, options:{fontFace:FONT, fontSize:9} },
    { text: nf(r.scans),            options:{align:'right', fontFace:FONT} },
    { text: nf(r.specTickets),      options:{align:'right', fontFace:FONT, bold:true, color:GREEN} },
    { text: (r.sharePct||0).toFixed(1)+'%', options:{align:'right', fontFace:FONT} },
  ])]
  s.addTable(rows, { x:0.5, y:1.1, w:12.3, fontSize:11, border:{type:'solid',color:'E2E8F0',pt:0.5}, rowH:0.41 })
}

// ── 5. GEOGRAPHY ──────────────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 5, 'การกระจายตัวตามภูมิภาค', 'Geographic Distribution — Top 10 จังหวัด')
  const header = ['#','จังหวัด','สแกน','ผู้ใช้','เฉลี่ย/คน','หมายเหตุ'].map(h => ({
    text: h, options:{bold:true,color:'FFFFFF',fill:{color:GREEN},fontFace:FONT,fontSize:11}
  }))
  const rows = [header, ...provinces.map(p => [
    { text: String(p.rank), options:{fontFace:FONT} },
    { text: p.name,         options:{fontFace:FONT} },
    { text: nf(p.scans),   options:{align:'right',fontFace:FONT} },
    { text: nf(p.users),   options:{align:'right',fontFace:FONT} },
    { text: Number(p.avgPerUser||0).toFixed(1), options:{align:'right',fontFace:FONT, color: p.avgPerUser>5?RED:GREEN} },
    { text: p.flag==='watch'?'⚠️ เฝ้าระวัง':'', options:{fontFace:FONT,color:RED,fontSize:9} },
  ])]
  s.addTable(rows, { x:0.5, y:1.1, w:12.3, fontSize:11, border:{type:'solid',color:'E2E8F0',pt:0.5}, rowH:0.42 })

  const topProv = provinces[0]
  if (topProv) s.addText(`📌 ${topProv.name} มีผู้ใช้สูงสุด ${nf(topProv.users)} คน — เฉลี่ย ${Number(topProv.avgPerUser).toFixed(1)} สแกน/คน`,
    { x:0.4, y:6.55, w:10, h:0.3, fontSize:10, color:GREEN, bold:true, fontFace:FONT })
}

// ── 6. CUSTOMERS & ENGAGEMENT ─────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 6, 'ลูกค้า & Engagement', 'Customer Behavior & Member Growth')
  if (engRows.length) {
    s.addChart(pptx.ChartType.bar, [{ name:'ผู้ใช้', labels:engRows.map(b=>b.label), values:engRows.map(b=>b.users) }],
      { x:0.4, y:1.3, w:7, h:4.7, chartColors:['4338CA'], showValue:true, dataLabelFontSize:9,
        catAxisLabelFontSize:10, valAxisLabelFontSize:8, fontFace:FONT, barDir:'bar' })
  }
  const y0=1.6
  kpi(s, 7.8, y0,     4.7, 'เฉลี่ยสแกน/คน',  avgScansPerUser+' ครั้ง', `สูงสุด ${maxScans} ครั้ง/คน`)
  kpi(s, 7.8, y0+1.9, 2.2, 'สมัครใหม่',       nf(totalMemberNew), 'คน (new)')
  kpi(s, 10.2,y0+1.9, 2.3, 'สมาชิกเก่า',      nf(totalMemberOld), 'คน (returning)')

  if (engRows.length > 0) {
    const oneTime = engRows.find(b => b.label==='1 scan')
    if (oneTime) s.addText(`💡 ผู้สแกนครั้งเดียว ${oneTime.pct}% (${nf(oneTime.users)} คน) — กลุ่มเป้าหมาย re-engage`,
      { x:7.8, y:y0+4.0, w:5, h:0.5, fontSize:10, color:GOLD, bold:true, fontFace:FONT, wrap:true })
  }
}

// ── 7. HEAVY USERS / RISK ─────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 7, 'ผู้ใช้สแกนสูง & ความเสี่ยง', 'Heavy Users & Risk Watch')
  const w=3.8, gap=0.2, x0=0.5, y=1.5
  kpi(s, x0+0*(w+gap), y, w, 'สแกน ≥20/วัน', String(v20)+' คน', 'กลุ่ม watch')
  kpi(s, x0+1*(w+gap), y, w, 'สแกน ≥30/วัน', String(v30)+' คน', 'กลุ่ม alert', 'gold')
  kpi(s, x0+2*(w+gap), y, w, 'สแกน ≥50/วัน', String(v50)+' คน', 'กลุ่มผิดปกติ', 'red')

  const header = ['#','จังหวัด','สแกนรวม','SKU','สถานะ'].map(h => ({
    text:h, options:{bold:true,color:'FFFFFF',fill:{color:GREEN},fontFace:FONT,fontSize:10}
  }))
  const rows = [header, ...heavyU.slice(0,12).map(u => [
    { text: String(u.rank),  options:{fontFace:FONT} },
    { text: u.province||'—', options:{fontFace:FONT} },
    { text: nf(u.scans),     options:{align:'right',bold:true,color:u.scans>=30?RED:GREEN,fontFace:FONT} },
    { text: String(u.skuDiversity||'—'), options:{align:'right',fontFace:FONT} },
    { text: u.flag==='watch'?'⚠️':'✅',  options:{align:'center',fontFace:FONT,fontSize:10} },
  ])]
  s.addTable(rows, { x:0.5, y:3.6, w:12.3, fontSize:10, border:{type:'solid',color:'E2E8F0',pt:0.5}, rowH:0.33 })
}

// ── 8. RIGHTS & DB ────────────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 8, 'สิทธิ์ & ความถูกต้อง DB', 'Rights Verification')
  kpi(s, 0.5, 1.5, 3.9, 'สิทธิ์ตามสเปก', nf(S.expectedTickets), 'สแกน × สิทธิ์/สินค้า', 'gold')
  kpi(s, 4.7, 1.5, 3.9, 'DB ออกจริง',    nf(S.tickets),         '1:1 bug ยังคงอยู่')
  kpi(s, 8.9, 1.5, 3.9, 'ขาดหาย',        nf(S.ticketGap),       `${(S.ticketGap/S.expectedTickets*100).toFixed(1)}% ของสเปก`, 'red')

  s.addShape(pptx.ShapeType.roundRect, { x:0.5, y:3.7, w:12.3, h:2.5, fill:{color:'FEF3C7'}, line:{color:'F59E0B',width:1.5}, rectRadius:0.1 })
  s.addText([
    { text:'⚠️  ข้อควรระวัง — ต้องดำเนินการก่อนจับรางวัล\n', options:{bold:true,color:'92400E'} },
    { text:`• DB ออกสิทธิ์แบบ 1:1 ทุก SKU แต่สเปกจริงบางสินค้าให้ 2–11 สิทธิ์\n`, options:{} },
    { text:`• สิทธิ์ที่ DB บันทึกน้อยกว่าที่ลูกค้าควรได้ ~${nf(S.ticketGap)} สิทธิ์\n`, options:{} },
    { text:`• ควร verify กับทีม Saversure และ cross-check ก่อนวันจับรางวัล`, options:{} },
  ], { x:0.8, y:3.85, w:11.8, h:2.2, fontSize:13, color:'78350F', fontFace:FONT, lineSpacingMultiple:1.5 })
}

// ── 9. SYSTEM UPTIME ─────────────────────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 9, 'เสถียรภาพระบบ', 'System Uptime & Reliability')
  const outages = daily.filter(r => r.outage && r.outage !== '')
  kpi(s, 0.6, 1.8, 5.5, 'Uptime ประมาณการ', uptimePct.toFixed(1)+'%', `${daily.length} วัน`, uptimePct>=99?undefined:'gold')
  kpi(s, 6.5, 1.8, 5.5, 'วันที่มี Outage',   String(outages.length)+' วัน', `จาก ${daily.length} วัน`, outages.length>0?'red':undefined)

  s.addText('วันที่มีปัญหาระบบ', { x:0.5, y:4.0, w:5, h:0.35, fontSize:13, bold:true, color:GREEN, fontFace:FONT })
  s.addText(outages.length===0
    ? '✅ ไม่พบ outage ตลอด 32 วัน'
    : outages.map(r=>`🚨 ${r.date} (${r.weekday})`).join('\n'),
    { x:0.5, y:4.4, w:5, h:2.5, fontSize:12, color:'475569', fontFace:FONT, lineSpacingMultiple:1.5 })
}

// ── 10. FOCUS AREAS & RECOMMENDATIONS ────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 10, 'จุดที่ต้อง Focus & ข้อเสนอแนะ', 'Key Findings & Recommended Actions')

  // ซ้าย: จุดเด่น
  s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:1.1, w:5.8, h:5.7, fill:{color:'F0FDF4'}, line:{color:'86EFAC',width:1.5}, rectRadius:0.12 })
  s.addText('✅  จุดเด่นเดือนแรก', { x:0.6, y:1.2, w:5.4, h:0.45, fontSize:15, bold:true, color:'15803D', fontFace:FONT })
  s.addText([
    { text:`• สแกนสำเร็จ ${nf(S.success)} ครั้ง (${Number(S.successRate).toFixed(1)}% success rate)\n`, options:{} },
    { text:`• ผู้เข้าร่วมแคมเปญ ${nf(S.uniqueUsers)} คน ใน 32 วัน\n`, options:{} },
    { text:`• Peak วัน ${peakDay?.date||'-'} ทำ ${nf(peakDay?.success||0)} สแกน\n`, options:{} },
    { text:`• Top province: ${provinces[0]?.name||'-'} (${nf(provinces[0]?.users||0)} คน)\n`, options:{} },
    { text:`• Top SKU: ${skuRows[0]?.displayName?.split(' ').slice(0,4).join(' ')||'-'} (${(skuRows[0]?.sharePct||0).toFixed(1)}% share)`, options:{} },
  ], { x:0.7, y:1.75, w:5.3, h:4.8, fontSize:12, color:'166534', fontFace:FONT, lineSpacingMultiple:1.6 })

  // ขวา: งานที่ต้อง focus
  s.addShape(pptx.ShapeType.roundRect, { x:6.7, y:1.1, w:6.2, h:5.7, fill:{color:'FFFBEB'}, line:{color:'FDE68A',width:1.5}, rectRadius:0.12 })
  s.addText('🎯  งานที่ต้อง Focus ต่อ', { x:6.9, y:1.2, w:5.8, h:0.45, fontSize:15, bold:true, color:GOLD, fontFace:FONT })
  s.addText([
    { text:`🚨  [เร่งด่วน] Verify DB ticket gap ${nf(S.ticketGap)} สิทธิ์\n     → ส่งให้ทีม Saversure แก้ก่อนจับรางวัล\n`, options:{color:'B91C1C'} },
    { text:`⚠️  Re-engage ผู้สแกนครั้งเดียว\n     → ${engRows.find(b=>b.label==='1 scan')?.pct||0}% (${nf(engRows.find(b=>b.label==='1 scan')?.users||0)} คน) ยังไม่กลับมาซ้ำ\n`, options:{color:'92400E'} },
    { text:`👁  เฝ้าระวัง Heavy Scanners\n     → ${v30} คน สแกน 30+/วัน ควรตรวจสอบก่อนจับรางวัล\n`, options:{color:'B45309'} },
    { text:`📡  ต่อ Saversure API (DATA_SOURCE=api)\n     → ข้อมูล SKU/Risk/Cohort จะ realtime ทันที`, options:{color:GREEN2} },
  ], { x:7.0, y:1.75, w:5.7, h:5.0, fontSize:11, color:'1E293B', fontFace:FONT, lineSpacingMultiple:1.55 })
}

// ── 11. WEEK-OVER-WEEK + DAY PATTERN ──────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 11, 'Pattern การสแกน', 'Week-over-Week & Day-of-Week Pattern')

  // WoW bar chart — top half
  const wowLabels = weekBuckets.map(w => w.label)
  const wowValues = weekBuckets.map(w => w.total)
  s.addChart(pptx.ChartType.bar, [{ name:'สแกนสำเร็จ', labels:wowLabels, values:wowValues }], {
    x:0.4, y:1.0, w:6.1, h:2.9,
    chartColors:['2563EB'],
    showValue:true, dataLabelFontSize:9,
    dataLabelColor:'FFFFFF',
    catAxisLabelFontSize:8, valAxisLabelFontSize:8, fontFace:FONT,
    showTitle:true, title:'สำเร็จรายสัปดาห์ (week-over-week)', titleFontSize:11, titleColor:GREEN,
  })

  // Day-of-week bar chart — top half, right side
  const dowLabels = dayAvg.map(d => d.label)
  const dowValues = dayAvg.map(d => d.avg)
  s.addChart(pptx.ChartType.bar, [{ name:'เฉลี่ย', labels:dowLabels, values:dowValues }], {
    x:6.9, y:1.0, w:6.0, h:2.9,
    chartColors:['4DA6FF'],
    showValue:true, dataLabelFontSize:9,
    dataLabelColor:'1E3A5F',
    catAxisLabelFontSize:9, valAxisLabelFontSize:8, fontFace:FONT,
    showTitle:true, title:'pattern รายวันในสัปดาห์ (เฉลี่ย)', titleFontSize:11, titleColor:GREEN,
  })

  // Week detail table — bottom
  const hdr = ['สัปดาห์','สำเร็จรวม','เฉลี่ย/วัน','% WoW','วัน'].map(h => ({
    text:h, options:{bold:true,color:'FFFFFF',fill:{color:GREEN},fontFace:FONT,fontSize:10}
  }))
  const wRows = [hdr, ...weekBuckets.map((w, i) => {
    const prev = weekBuckets[i-1]
    const wow = prev ? ((w.total-prev.total)/prev.total*100).toFixed(1)+'%' : '—'
    const wowColor = prev && w.total>prev.total ? '16A34A' : prev ? RED : GREY
    return [
      { text: w.label.split('\n').join(' '), options:{fontFace:FONT,fontSize:9} },
      { text: nf(w.total), options:{align:'right',bold:true,fontFace:FONT} },
      { text: nf(w.avgPerDay), options:{align:'right',fontFace:FONT} },
      { text: wow, options:{align:'right',bold:true,color:wowColor,fontFace:FONT} },
      { text: String(w.days), options:{align:'center',fontFace:FONT} },
    ]
  })]
  s.addTable(wRows, { x:0.4, y:4.1, w:6.1, fontSize:10, border:{type:'solid',color:'E2E8F0',pt:0.5}, rowH:0.38 })

  // Day insight — bottom right
  s.addShape(pptx.ShapeType.roundRect, { x:6.9, y:4.1, w:6.0, h:2.6, fill:{color:'EFF6FF'}, line:{color:'BFDBFE',width:1}, rectRadius:0.1 })
  s.addText('💡 Insight รายวัน', { x:7.1, y:4.18, w:5.6, h:0.35, fontSize:12, bold:true, color:'1E40AF', fontFace:FONT })
  s.addText([
    { text:`• ${peakDow.fullName} เป็น Peak ทุกสัปดาห์ (เฉลี่ย ${nf(peakDow.avg)} สแกน)\n`, options:{bold:true} },
    { text:`• อาทิตย์เติบโตต่อเนื่องทุกสัปดาห์ — แนะนำเน้น campaign วันอาทิตย์\n`, options:{} },
    { text:`• พฤหัส–ศุกร์ ต่ำสุดในสัปดาห์ (${nf(dayAvg[4].avg)}–${nf(dayAvg[5].avg)} สแกน)\n`, options:{} },
    { text:`• WoW สัปดาห์ 3 โต +26% — ควรหา trigger เพื่อ replicate`, options:{} },
  ], { x:7.1, y:4.6, w:5.6, h:2.0, fontSize:11, color:'1E3A5F', fontFace:FONT, lineSpacingMultiple:1.5 })
}

// ── 12. ANOMALIES & NOTABLE EVENTS ───────────────────────────────
{
  const s = pptx.addSlide(); frame(s, 12, 'วันผิดปกติ & จุดที่ต้องตรวจสอบ', 'Anomalies & Notable Events')

  // KPI summary
  kpi(s, 0.4, 1.2, 3.8, 'วันผิดปกติ', String(anomalies.length)+' วัน', `จาก ${daily.length} วัน`, anomalies.length>3?'red':anomalies.length>0?'gold':undefined)
  kpi(s, 4.5, 1.2, 3.8, 'ซ้ำตัวเองเฉลี่ย', nf(Math.round(dupNormal))+'/วัน', `สูงสุด ${nf(Math.max(...daily.map(r=>r.dupSelf||0)))}`, dupNormal>800?'gold':undefined)
  kpi(s, 8.6, 1.2, 3.8, 'Success Rate เฉลี่ย', (daily.reduce((s,r)=>s+(r.successRate||0),0)/daily.length).toFixed(1)+'%', `ต่ำสุด ${daily.reduce((low,r)=>(r.successRate||100)<low?r.successRate:low,100).toFixed(1)}%`)

  // Anomaly table
  if (anomalies.length > 0) {
    const hdr2 = ['วัน','สำเร็จ','ซ้ำตัวเอง','success%','ปัญหาที่พบ'].map(h => ({
      text:h, options:{bold:true,color:'FFFFFF',fill:{color:'DC2626'},fontFace:FONT,fontSize:10}
    }))
    const aRows = [hdr2, ...anomalies.slice(0,8).map(a => [
      { text: `${a.date} (${a.weekday||''})`, options:{fontFace:FONT,fontSize:9} },
      { text: nf(a.success), options:{align:'right',bold:true,color:RED,fontFace:FONT} },
      { text: nf(a.dupSelf), options:{align:'right',fontFace:FONT} },
      { text: (a.successRate||0).toFixed(1)+'%', options:{align:'right',fontFace:FONT} },
      { text: a.type, options:{fontFace:FONT,fontSize:9,color:'7F1D1D'} },
    ])]
    s.addTable(aRows, { x:0.4, y:3.1, w:12.5, fontSize:10, border:{type:'solid',color:'FCA5A5',pt:0.5}, rowH:0.38 })
  } else {
    s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:3.1, w:12.5, h:1.2, fill:{color:'F0FDF4'}, line:{color:'86EFAC',width:1}, rectRadius:0.08 })
    s.addText('✅ ไม่พบวันผิดปกติอย่างมีนัยสำคัญ', { x:0.6, y:3.3, w:12.1, h:0.6, fontSize:14, bold:true, color:'15803D', align:'center', fontFace:FONT })
  }

  // แนวทาง
  s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:anomalies.length>0?4.9:4.6, w:12.5, h:2.1, fill:{color:'FEF9EC'}, line:{color:'FDE68A',width:1.5}, rectRadius:0.1 })
  s.addText([
    { text:'📋  แนวทางติดตาม\n', options:{bold:true,color:'92400E'} },
    { text:'• ตรวจ server log วันที่พบ dupSelf พุ่ง → หา timeout/UX ที่ทำให้กดซ้ำ\n', options:{} },
    { text:'• ตรวจ log วันที่ volume ต่ำโดยไม่มี error → อาจเป็น maintenance ที่ไม่ได้บันทึก\n', options:{} },
    { text:'• Monitor dupSelf: ถ้า > 15% ของ total 3 วันติดกัน → escalate ทีม product ทันที', options:{} },
  ], { x:0.6, y:anomalies.length>0?5.05:4.75, w:12.1, h:1.85, fontSize:11, color:'78350F', fontFace:FONT, lineSpacingMultiple:1.45 })
}

// ── 13. CROSS-SIZE COMPARISON ─────────────────────────────────────
{
  // ข้อมูล hardcode จากการวิเคราะห์ SKU cross-size
  const crossSize = [
    { name:'ลองแกน เมลาสม่า โปร เซรั่ม',          total:11781, sachet:9179+1603, tube:999,  ratio:9.2  },
    { name:'วอเตอร์เมลอน ทรีดี ออร่า ซัน การ์ด', total:10477, sachet:9717,      tube:760,  ratio:12.8 },
    { name:'แครอท เอจจิ้ง เพอร์เฟค เซรั่ม',        total:8033,  sachet:7169,      tube:864,  ratio:8.3  },
    { name:'บลูโรส ไบร์ทเทนนิ่ง อันเดอร์อาร์ม',   total:4699,  sachet:3863,      tube:836,  ratio:17.6 },
    { name:'เรด ออเร้นจ์ กลูต้า บูสเตอร์',         total:4762,  sachet:3931,      tube:831,  ratio:11.3 },
    { name:'เจเด้นท์ 3in1 ทูธเพสต์',               total:4020,  sachet:4020,      tube:0,    ratio:2.1  },
    { name:'ซันฟลาวเวอร์ ยูวี เจล SPF50+',          total:2742,  sachet:2267,      tube:475,  ratio:13.4 },
    { name:'อโวคาโด ไฮโดร ล็อก ครีม',               total:2013,  sachet:2013,      tube:0,    ratio:3.3  },
    { name:'เมลอน มิลก์ ยูวี เอสเซนส์ SPF50+',     total:2546,  sachet:2546,      tube:0,    ratio:1.7  },
    { name:'วอเตอร์เมลอน คูชั่น แมตต์ SPF50',       total:1225,  sachet:1177,      tube:48,   ratio:56.0 },
  ]

  const extremeRatio = [
    { name:'วอเตอร์เมลอน ไฮโดร ไวท์',   ratio:342.0, tube:4   },
    { name:'แมริโกลด์ แอคเน่เจล',        ratio:205.5, tube:10  },
    { name:'มอรินก้า แอดวานซ์ รีแพร์',   ratio:133.5, tube:21  },
    { name:'วอเตอร์เมลอน คูชั่น แมตต์',  ratio:56.0,  tube:48  },
    { name:'บลูโรส อันเดอร์อาร์ม',       ratio:17.6,  tube:836 },
  ]

  const s = pptx.addSlide(); frame(s, 13, 'Cross-Size: ซอง vs หลอด', 'Same-Product Cross-Size Comparison')

  // Bar chart top 10 total specTickets
  const csLabels = crossSize.map(p => p.name.split(' ').slice(0,3).join(' '))
  s.addChart(pptx.ChartType.bar, [
    { name:'ซอง (trial)', labels:csLabels, values:crossSize.map(p => p.sachet) },
    { name:'หลอด (full)', labels:csLabels, values:crossSize.map(p => p.tube)   },
  ], {
    x:0.4, y:1.0, w:7.2, h:3.8,
    barDir:'bar', barGrouping:'stacked',
    chartColors:['1D9E75','FDE68A'],
    showLegend:true, legendPos:'t',
    catAxisLabelFontSize:8, valAxisLabelFontSize:8, fontFace:FONT,
    showTitle:true, title:'สิทธิ์รวมแยกตาม format (Top 10 สินค้า)', titleFontSize:11, titleColor:GREEN,
  })

  // กล่อง Extreme Ratio เตือน
  s.addShape(pptx.ShapeType.roundRect, { x:7.8, y:1.0, w:5.1, h:3.8, fill:{color:'FFF7ED'}, line:{color:'FED7AA',width:1.5}, rectRadius:0.1 })
  s.addText('🔴  Ratio สูงสุด (หลอดขายได้น้อยมาก)', { x:8.0, y:1.1, w:4.7, h:0.38, fontSize:11, bold:true, color:'C2410C', fontFace:FONT })
  extremeRatio.forEach((r, i) => {
    s.addShape(pptx.ShapeType.roundRect, { x:8.0, y:1.6+i*0.45, w:4.7, h:0.38, fill:{color:'FFEDD5'}, line:{color:'FED7AA',width:0.5}, rectRadius:0.05 })
    s.addText(`${r.name.split(' ').slice(0,3).join(' ')}`, { x:8.05, y:1.65+i*0.45, w:3.0, h:0.28, fontSize:9, color:'7C2D12', fontFace:FONT })
    s.addText(`${r.ratio}x`, { x:11.0, y:1.65+i*0.45, w:1.5, h:0.28, fontSize:12, bold:true, color:RED, align:'right', fontFace:FONT })
  })

  // Insight table ด้านล่าง
  s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:5.0, w:12.5, h:2.2, fill:{color:'F0FDF4'}, line:{color:'86EFAC',width:1}, rectRadius:0.1 })
  s.addText('💡  Insight จาก Cross-Size Analysis', { x:0.6, y:5.08, w:12.1, h:0.38, fontSize:13, bold:true, color:GREEN, fontFace:FONT })
  s.addText([
    { text:'• ซอง (trial) ครองทุกสินค้า — ลูกค้าเลือกทดลองก่อนซื้อ full-size  |  ', options:{color:'166534'} },
    { text:'โอกาส: bundle ซอง → หลอดในแคมเปญถัดไป\n', options:{color:'15803D', bold:true} },
    { text:'• หลอดที่ ratio < 3x (คลีนซิ่ง, แบล็ก จิงเจอร์, เมลอน SPF) = full-size ยังขายได้ — ควรเพิ่ม spotlight\n', options:{color:'166534'} },
    { text:'• Ratio > 50x (คูชั่น, มอรินก้า, แมริโกลด์) = หลอดแทบไม่มีคนรู้จัก — พิจารณาเพิ่ม campaign เฉพาะ full-size', options:{color:'166534'} },
  ], { x:0.6, y:5.52, w:12.1, h:1.6, fontSize:11, color:'166534', fontFace:FONT, lineSpacingMultiple:1.45 })
}

// ── 14. CO-SCAN NETWORK ───────────────────────────────────────────
{
  const coPairs = [
    { rank:1,  a:'ลองแกน เมลาสม่า',       b:'ดีดี ครีม วอเตอร์เมลอน',   users:17842, hub:true  },
    { rank:2,  a:'ดีดี ครีม วอเตอร์เมลอน', b:'วอเตอร์เมลอน ทรีดี ออร่า', users:16909, hub:true  },
    { rank:3,  a:'แครอท เซรั่ม',           b:'ดีดี ครีม วอเตอร์เมลอน',   users:13172, hub:true  },
    { rank:4,  a:'แครอท เซรั่ม',           b:'ลองแกน เมลาสม่า',           users:11287, hub:false },
    { rank:5,  a:'ดีดี ครีม วอเตอร์เมลอน', b:'เรด ออเร้นจ์ กลูต้า',       users:10488, hub:true  },
    { rank:6,  a:'ดีดี ครีม 8G',           b:'ดีดี ครีม 40G (same SKU!)', users:10108, hub:true  },
    { rank:7,  a:'ลองแกน เมลาสม่า',       b:'วอเตอร์เมลอน ทรีดี ออร่า', users:7706,  hub:false },
    { rank:8,  a:'ดีดี ครีม วอเตอร์เมลอน', b:'วอเตอร์ ลิลลี่ มอยส์เจอร์', users:6897, hub:true  },
    { rank:9,  a:'แครอท เซรั่ม',           b:'วอเตอร์เมลอน ทรีดี ออร่า', users:6606,  hub:false },
    { rank:10, a:'แครอท เซรั่ม',           b:'เรด ออเร้นจ์ กลูต้า',       users:6408,  hub:false },
  ]

  const s = pptx.addSlide(); frame(s, 14, 'สินค้าที่ลูกค้าสแกนคู่กัน', 'Co-scan Network — Bundle Intelligence')

  // Hub KPI
  s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:1.05, w:8.3, h:0.85, fill:{color:'ECFDF5'}, line:{color:'6EE7B7',width:1.5}, rectRadius:0.1 })
  s.addText('⭐  HUB สินค้า: จุฬาเฮิร์บ ดีดี ครีม วอเตอร์เมลอน ซันสกรีน', { x:0.6, y:1.1, w:8.0, h:0.35, fontSize:13, bold:true, color:GREEN, fontFace:FONT })
  s.addText('ปรากฏใน 8 / 10 คู่ top co-scan — เป็นสินค้าที่ลูกค้า "ซื้อพร้อมกันเสมอ"', { x:0.6, y:1.48, w:8.0, h:0.3, fontSize:10, color:'065F46', fontFace:FONT })

  s.addShape(pptx.ShapeType.roundRect, { x:8.9, y:1.05, w:4.0, h:0.85, fill:{color:'FEF9EC'}, line:{color:'FDE68A',width:1.5}, rectRadius:0.1 })
  s.addText('🔄  Upsell สำเร็จ', { x:9.1, y:1.1, w:3.6, h:0.3, fontSize:11, bold:true, color:GOLD, fontFace:FONT })
  s.addText('#6: 10,108 คน ซื้อดีดีครีมทั้ง 8G + 40G — high-intent repeat buyer', { x:9.1, y:1.42, w:3.6, h:0.35, fontSize:9, color:'92400E', fontFace:FONT, wrap:true })

  // Co-scan table
  const hdr = ['#','สินค้า A','สินค้า B','คนสแกนทั้งคู่','hub'].map(h => ({
    text:h, options:{bold:true,color:'FFFFFF',fill:{color:GREEN},fontFace:FONT,fontSize:10}
  }))
  const coRows = [hdr, ...coPairs.map(p => [
    { text: String(p.rank), options:{align:'center',fontFace:FONT,bold:true} },
    { text: p.a, options:{fontFace:FONT,fontSize:9} },
    { text: p.b, options:{fontFace:FONT,fontSize:9,
        color: p.b.includes('ดีดี ครีม')||p.b.includes('40G')?'0C4A6E':'334155'} },
    { text: nf(p.users), options:{align:'right',bold:true,color:GREEN,fontFace:FONT} },
    { text: p.hub ? '⭐' : '', options:{align:'center',fontFace:FONT,fontSize:12} },
  ])]
  s.addTable(coRows, { x:0.4, y:2.05, w:12.5, fontSize:10, border:{type:'solid',color:'E2E8F0',pt:0.5}, rowH:0.36 })

  // Bundle recommendations
  s.addShape(pptx.ShapeType.roundRect, { x:0.4, y:5.85, w:12.5, h:1.45, fill:{color:'EFF6FF'}, line:{color:'BFDBFE',width:1.5}, rectRadius:0.1 })
  s.addText([
    { text:'🎯  Bundle แนะนำจากข้อมูล\n', options:{bold:true,color:'1E40AF'} },
    { text:'• Pack 3: ลองแกน + แครอท + ดีดี ครีม — top 3 คู่หมุนรอบ 3 ตัวนี้ (แนะนำแคมเปญ "เซ็ตผิวสว่าง")\n', options:{} },
    { text:'• ดัน ดีดี ครีม 40G ให้ลูกค้าที่ถือ 8G อยู่แล้ว — 10k คนพร้อม upsell ตามข้อมูล\n', options:{} },
    { text:'• เรด ออเร้นจ์ + ดีดี ครีม (#5: 10,488 คน) — บ่งชี้ลูกค้า glow/radiant skin เป็น segment แข็ง', options:{} },
  ], { x:0.6, y:5.95, w:12.1, h:1.28, fontSize:10.5, color:'1E3A5F', fontFace:FONT, lineSpacingMultiple:1.4 })
}

// ─── บันทึกไฟล์ ───────────────────────────────────────────────────
const outName = `Monthly-Report-${S.from}-to-${S.to}.pptx`
const outPath = path.join(path.dirname(xlsxPath), outName)

pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`\n✅  สร้างสำเร็จ: ${outPath}`)
  console.log('   เปิดใน PowerPoint หรือ Google Slides ได้เลย')
}).catch(err => {
  console.error('❌  Error:', err.message)
})
