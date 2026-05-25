// Calculate expected tickets per day
// Formula: expected = sum(scans × rightsPerScan) over all SKUs
// Where: db_tickets ≈ scans (because DB has 1:1 bug)
// So: extra = sum(scans × (perScan - 1)) for SKUs with perScan >= 2
//     expected = success_total + extra

const fs = require('fs')
const path = require('path')

// ─── Build SKU → perScan map from products-real.ts ───
const txt = fs.readFileSync(path.join(__dirname, '..', 'src', 'config', 'products-real.ts'), 'utf8')
const perScan = {}
const re = /sku: '([^']+)'.*?rightsPerScan: (\d+)/g
let m
while ((m = re.exec(txt)) !== null) {
  perScan[m[1]] = parseInt(m[2], 10)
}
console.log(`Loaded ${Object.keys(perScan).length} SKUs from master`)

// Helper: normalize SKU code (strip UB- prefix, strip x6 suffix variants)
function normSku(raw) {
  let s = raw.trim().toUpperCase()
  // strip UB- prefix
  if (s.startsWith('UB-')) s = s.slice(3)
  // strip xN suffix (e.g. L3-8GX6 → L3-8G)
  s = s.replace(/X\d+$/, '')
  return s
}

function lookupPerScan(rawSku) {
  const norm = normSku(rawSku)
  if (perScan[norm] != null) return perScan[norm]
  // Try direct match
  if (perScan[rawSku] != null) return perScan[rawSku]
  return 1  // default
}

// ─── Per-day SKU scan data (from ข้อมูลรายวัน + Daily update txt) ───
// Format: [sku, scans]
const DAILY = {
  '16': [
    // From Daily update/2026-05-16.txt + ข้อมูลรายวัน/16-5/ images
    ['L3-8G',2452],['L4-8G',659],['L6-8G',499],['L10-7G',471],['L13-10G',328],
    ['L7-6G',302],['C4-8G',255],['L3-40G',223],['L19-8G',205],['L8B-6G',134],
    ['D3-70G',132],['L20-7G',94],['JHA1-40G',87],['JH906-70G',80],['L8A-6G',79],
    ['L4-40G',79],['C3-7G',74],['L10-30G',71],['JH905-70G',69],['L6-40G',67],
    ['JH904-70G',64],['JHM2-4G',61],['JH703-8G',40],['L9-8G',40],['C2-8G',40],
    // Mid 26-50
    ['D2-70G',39],['L5-15G',34],['C1-6G',32],['C4-35G',28],['JH707-8G',27],
    ['JHK2-8G',24],['L20-30G',22],['L7-30G',20],['JHK3-6G',19],['L11-40G',19],
    ['JHK4-8G',18],['L14-40G',17],['C3-30G',15],['L19-48G',15],['JHK5-15G',14],
    ['L14-70G',14],['L13-40G',13],['S4-70G',13],['C1-15G',13],['T6A-5G',13],
    ['JHK4-48G',12],['JH704-8G',12],['JHK1-8G',11],['C2-35G',11],['JH706-8G',10],
    // Low 51-75
    ['JH708-6G',9],['L11-400G',9],['T5B-2.5G',6],['T5C-2G',6],['JH704-40G',5],
    ['T5A-2.5G',5],['JHK3-30G',4],['V1-14C',4],['T5A-2G',4],['T5C-2.5G',4],
    ['T6A-10G',4],['JHT3-2G',3],['L8B-30G',3],['T5B-2G',3],['L21-100G',2],
    ['JHT1-2G',2],['JH703-40G',1],['L1-150G',1],['JH706-40G',1],['R1-30G',1],
    ['JHM1-120G',1],['JHK6-7G',3],['JHM2-30G',3],['JHD1-70G',3],['L8A-30G',3],
  ],
  '17': [
    // From Daily update/2026-05-17.txt
    ['L3-8G',2822],['L4-8G',813],['L6-8G',631],['L10-7G',539],['L7-6G',443],
    ['L13-10G',411],['C4-8G',300],['L3-40G',265],['L19-8G',217],['L8B-6G',159],
    ['JHA1-40G',142],['L8A-6G',120],['D3-70G',116],['JH906-70G',100],['L4-40G',99],
    ['L20-7G',93],['JH904-70G',87],['JH905-70G',84],['C3-7G',83],['C2-8G',78],
    ['JH703-8G',75],['C1-6G',73],['L10-30G',71],['L6-40G',70],['JHK4-8G',69],
    // Mid 26-50
    ['L9-8G',62],['JH704-8G',58],['JH708-6G',37],['L5-15G',35],['L14-40G',34],
    ['JHK1-8G',33],['L7-30G',32],['D2-70G',30],['C4-35G',30],['L11-40G',30],
    ['JHM2-4G',28],['JHK2-8G',28],['JHK3-6G',26],['C2-35G',25],['L13-40G',24],
    ['JHK5-15G',23],['S4-70G',19],['JH707-8G',19],['T6A-5G',19],['L19-48G',17],
    ['L14-70G',16],['C3-30G',13],['JH706-8G',13],['L20-30G',9],['T5B-2.5G',9],
    // Low 51-74
    ['JHK6-7G',7],['T5A-2.5G',6],['T5C-2.5G',6],['L21-100G',5],['T5B-2G',5],
    ['T5C-2G',5],['JHK4-48G',4],['JHD1-70G',4],['L12-400G',4],['T5A-2G',4],
    ['C1-15G',3],['T6A-10G',3],['JHM1-120G',3],['L11-400G',3],['JHK3-30G',2],
    ['JHT1-2G',2],['JHT3-2G',2],['L8A-30G',2],['L8B-30G',2],['JH705-8G',2],
    ['JH704-40G',2],['R1-30G',2],['V1-14C',1],['JH707-40G',1],
  ],
  '18': [
    // From Daily update/2026-05-18.txt
    ['L3-8G',2157],['L4-8G',692],['L10-7G',513],['L6-8G',470],['L7-6G',335],
    ['L13-10G',291],['L3-40G',202],['C4-8G',196],['L19-8G',164],['L8B-6G',109],
    ['D3-70G',91],['L8A-6G',78],['JH906-70G',76],['L20-7G',74],['JHA1-40G',74],
    ['C3-7G',68],['L4-40G',66],['L10-30G',52],['L6-40G',52],['JH905-70G',49],
    ['C2-8G',48],['JHM2-4G',42],['JH904-70G',42],['L9-8G',38],['C1-6G',37],
    // Mid 26-50
    ['JH703-8G',33],['L7-30G',31],['L5-15G',28],['S4-70G',25],['C4-35G',25],
    ['D2-70G',22],['L14-40G',19],['L13-40G',18],['JH704-8G',18],['JH708-6G',15],
    ['JHK4-8G',14],['T6A-5G',13],['L11-40G',12],['L14-70G',11],['C3-30G',10],
    ['JHK5-15G',10],['L20-30G',8],['L19-48G',8],['JHK2-8G',8],['T5B-2G',8],
    ['V1-14C',7],['C2-35G',7],['C1-15G',6],['JH707-8G',6],['JHK4-48G',5],
    // Low 51-72
    ['JH705-8G',5],['L21-100G',4],['L11-400G',4],['L1-150G',3],['JHM2-30G',3],
    ['JH706-8G',3],['T5A-2.5G',3],['T5A-2G',3],['JHK3-30G',2],['JHK6-7G',2],
    ['JHT1-2G',2],['L12-400G',2],['JHK1-8G',2],['T5B-2.5G',2],['T5C-2G',2],
    ['JHK3-6G',1],['JHT2-2G',1],['JH704-40G',1],['JH706-40G',1],['R1-30G',1],
    ['T5C-2.5G',1],['T6A-10G',1],
  ],
  '19': [
    // From Daily update/2026-05-19.txt + ข้อมูลรายวัน/19-5/ images
    ['L3-8G',1746],['L4-8G',656],['L6-8G',473],['L10-7G',354],['L13-10G',225],
    ['L7-6G',201],['C4-8G',173],['L3-40G',171],['L19-8G',138],['L8B-6G',114],
    ['L20-7G',87],['D3-70G',87],['L8A-6G',81],['JH906-70G',73],['JHA1-40G',69],
    ['L4-40G',69],['L6-40G',63],['JH905-70G',60],['JHM2-4G',49],['JH703-8G',48],
    ['L7-30G',47],['JH904-70G',44],['L9-8G',41],['L10-30G',40],['L14-40G',39],
    // Mid 26-50
    ['JH704-8G',39],['C2-8G',38],['JHK2-8G',37],['D2-70G',36],['C3-7G',31],
    ['C1-6G',24],['L5-15G',22],['L11-40G',22],['L14-70G',21],['C4-35G',19],
    ['JHK3-6G',17],['L20-30G',17],['JHK4-8G',15],['S4-70G',14],['JH707-8G',14],
    ['T6A-5G',14],['JH708-6G',13],['C3-30G',11],['JH706-8G',11],['L13-40G',9],
    ['L19-48G',9],['C2-35G',9],['JHK4-48G',8],['C1-15G',7],['T5B-2G',7],
    // Low 51-78
    ['T5C-2G',7],['JHM1-120G',6],['JHK5-15G',5],['T6A-10G',5],['JHK6-7G',4],
    ['V1-14C',4],['JHD1-70G',4],['JHK1-8G',4],['T5B-2.5G',4],['L1-150G',3],
    ['JHT1-2G',3],['T5A-2.5G',3],['T5A-2G',3],['L21-100G',2],['JHM2-30G',2],
    ['JH707-40G',2],['JH706-40G',2],['T5C-2.5G',2],['JHK3-30G',1],['JHT2-2G',1],
    ['JHA2-40G',1],['L12-400G',1],['L8A-30G',1],['JHK1-40G',1],['JH702-40G',1],
    ['JH704-40G',1],['R1-30G',1],['L11-400G',1],
  ],
}

// ─── Calculate ───
console.log('\n📊 Expected Tickets per Day\n')
console.log('Day | DB Sum | Extra | Expected | Diff% | Top 5 contributors (perScan>=2)')
console.log('----|--------|-------|----------|-------|----------------------------------')

const results = {}
for (const day of ['16','17','18','19']) {
  const skus = DAILY[day]
  const dbSum = skus.reduce((s, [_,n]) => s+n, 0)
  let extra = 0
  const contrib = []
  for (const [sku, scans] of skus) {
    const ps = lookupPerScan(sku)
    if (ps >= 2) {
      const e = scans * (ps - 1)
      extra += e
      contrib.push({ sku, scans, ps, extra: e })
    }
  }
  contrib.sort((a,b) => b.extra - a.extra)
  const expected = dbSum + extra
  const diffPct = ((extra / dbSum) * 100).toFixed(1)
  const top = contrib.slice(0,5).map(c => `${c.sku}(${c.scans}×${c.ps}→+${c.extra})`).join(', ')
  console.log(`${day}  | ${dbSum.toString().padStart(6)} | ${extra.toString().padStart(5)} | ${expected.toString().padStart(8)} | +${diffPct}% | ${top}`)
  results[day] = { dbSum, extra, expected, contrib }
}

// 4-day total
const totDb = Object.values(results).reduce((s,r) => s+r.dbSum, 0)
const totExtra = Object.values(results).reduce((s,r) => s+r.extra, 0)
const totExp = totDb + totExtra
console.log(`\nรวม | ${totDb.toString().padStart(6)} | ${totExtra.toString().padStart(5)} | ${totExp.toString().padStart(8)} | +${((totExtra/totDb)*100).toFixed(1)}%`)

console.log('\n✅ ใช้ตัวเลข Expected ในแดชบอร์ดได้แล้ว')
