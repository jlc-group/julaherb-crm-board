// One-shot: parse Day 21 + Day 22 from-db txt files → update live-data.json
// Run once. Adds per-SKU scans + estimated users per SKU.
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DB_DIR = path.join(ROOT, 'Final Data daily update', 'daily - from db')
const LIVE_PATH = path.join(ROOT, 'scan-lucky-rich-dashboard', 'src', 'lib', 'live-data.json')

const live = JSON.parse(fs.readFileSync(LIVE_PATH, 'utf8'))

// Daily totals (from txt headers)
const DAY_INFO = {
  '21': { success: 6590, uniqueUsers: 2470, dow: 'พฤหัสบดี' },
  '22': { success: 6147, uniqueUsers: 2423, dow: 'ศุกร์' },
  '23': { success: 7147, uniqueUsers: 2612, dow: 'เสาร์' },
  '24': { success: 8168, uniqueUsers: 2716, dow: 'อาทิตย์' },
}

// Parse per-SKU scans from txt file (same regex as aggregate-from-sources.js)
function parseDaySku(dayKey) {
  const txt = fs.readFileSync(path.join(DB_DIR, `2026-05-${dayKey}.txt`), 'utf8')
  const skuMap = {}
  for (const line of txt.split('\n')) {
    // Pattern A: "| # | SKU NAME | tickets | per_scan | %"
    let m = line.match(/^\|\s*\d+\s*\|\s*([A-Z][A-Z0-9-]+)\s+[^|]+\|\s*([\d,]+)\s*\|/)
    if (m) {
      const sku = m[1]
      const n = parseInt(m[2].replace(/,/g, ''), 10)
      if (n > 0) skuMap[sku] = (skuMap[sku] || 0) + n
      continue
    }
    // Pattern B: "(SKU) | number"
    m = line.match(/\(([A-Z][A-Z0-9-]+)\)[^|]*\|\s*\*?\*?([\d,]+)/)
    if (m) {
      const sku = m[1]
      const n = parseInt(m[2].replace(/,/g, ''), 10)
      if (n > 0) skuMap[sku] = (skuMap[sku] || 0) + n
      continue
    }
    // Pattern C: "| SKU NAME | number"
    m = line.match(/^\|\s*([A-Z][A-Z0-9-]+)\s+[^|]+\|\s*([\d,]+)\s*\|/)
    if (m) {
      const sku = m[1]
      const n = parseInt(m[2].replace(/,/g, ''), 10)
      if (n > 0) skuMap[sku] = (skuMap[sku] || 0) + n
    }
  }
  return skuMap
}

// Merge into PER_SKU_DAILY
for (const [dk, info] of Object.entries(DAY_INFO)) {
  const skuMap = parseDaySku(dk)
  const totalScans = Object.values(skuMap).reduce((s, v) => s + v, 0)
  const userRatio = totalScans > 0 ? info.uniqueUsers / totalScans : 0.4

  console.log(`\n📅 Day ${dk} (${info.dow}): parsed ${Object.keys(skuMap).length} SKUs · scans=${totalScans} vs saversure=${info.success}`)
  console.log(`   user ratio estimate = ${userRatio.toFixed(3)}`)

  for (const [sku, scans] of Object.entries(skuMap)) {
    if (!live.per_sku_daily[sku]) live.per_sku_daily[sku] = {}
    live.per_sku_daily[sku][dk] = {
      r: scans,
      u: Math.max(1, Math.round(scans * userRatio)),  // estimate (DB doesn't give per-SKU distinct)
    }
  }
}

// Update snapshot.days with Day 21 + 22
const newDays = [
  { date: '2026-05-21', rights: 6560, success: 6590, users: 2470 },
  { date: '2026-05-22', rights: 6137, success: 6147, users: 2423 },
  { date: '2026-05-23', rights: 7146, success: 7147, users: 2612 },
  { date: '2026-05-24', rights: 7962, success: 8168, users: 2716 },
]
for (const nd of newDays) {
  const existing = live.snapshot.days.findIndex(d => d.date === nd.date)
  if (existing >= 0) live.snapshot.days[existing] = nd
  else live.snapshot.days.push(nd)
}
live.snapshot.days.sort((a, b) => a.date.localeCompare(b.date))

// Update totals
if (live.snapshot.totals) {
  live.snapshot.totals.success = live.snapshot.days.reduce((s, d) => s + (d.success || 0), 0)
  live.snapshot.totals.rights = live.snapshot.days.reduce((s, d) => s + (d.rights || 0), 0)
}

// Write back
fs.writeFileSync(LIVE_PATH, JSON.stringify(live, null, 2))
console.log(`\n✅ Updated ${LIVE_PATH}`)
console.log(`   • snapshot.days count: ${live.snapshot.days.length}`)
console.log(`   • per_sku_daily SKU count: ${Object.keys(live.per_sku_daily).length}`)
