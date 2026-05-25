// Update Day 20 SKU data from DB (full 74 SKUs vs 26 from screenshot)
const fs = require('fs')
const path = require('path')

const liveDataPath = path.join(__dirname, '..', 'src', 'lib', 'live-data.json')
const live = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'))

// Full Day 20 SKU scans from DB report
const DAY20_FULL = {
  // Top 25
  'L3-8G': 2699, 'L4-8G': 685, 'L6-8G': 620, 'L10-7G': 449, 'L7-6G': 302,
  'L13-10G': 249, 'L3-40G': 242, 'C4-8G': 208, 'L19-8G': 205, 'L8B-6G': 156,
  'L6-40G': 118, 'C3-7G': 106, 'L20-7G': 95, 'D3-70G': 94, 'JH906-70G': 93,
  'L8A-6G': 88, 'JHK1-8G': 85, 'JHA1-40G': 84, 'C2-8G': 74, 'L4-40G': 73,
  'C1-6G': 64, 'JH704-8G': 58, 'JH703-8G': 57, 'L10-30G': 52, 'JH904-70G': 48,
  // Mid 26-50
  'JH905-70G': 46, 'JHK2-8G': 43, 'JH708-6G': 41, 'JHM2-4G': 36, 'JH706-40G': 35,
  'L5-15G': 26, 'D2-70G': 25, 'L14-40G': 25, 'JH706-8G': 23, 'JHK4-8G': 23,
  'L7-30G': 23, 'L11-40G': 22, 'L9-8G': 21, 'L14-70G': 19, 'S4-70G': 19,
  'L20-30G': 18, 'C3-30G': 17, 'JHK5-15G': 16, 'T6A-5G': 16, 'C4-35G': 13,
  'C2-35G': 12, 'L13-40G': 12, 'JHK3-6G': 11, 'T5B-2G': 11, 'JHK4-48G': 9,
  // Low 51-74
  'JH705-8G': 8, 'L19-48G': 8, 'T5A-2.5G': 8, 'JH707-8G': 7, 'JHK6-7G': 7,
  'T5C-2G': 7, 'C1-15G': 6, 'T5A-2G': 6, 'T5C-2.5G': 5, 'T6A-10G': 5,
  'JHT1-2G': 4, 'L1-150G': 4, 'JHD1-70G': 3, 'JHT3-2G': 3, 'L8A-30G': 3,
  'L8B-30G': 3, 'L11-400G': 2, 'L21-100G': 2, 'JH703-40G': 1, 'JHK2-40G': 1,
  'JHM1-120G': 1, 'JHM2-30G': 1, 'L12-400G': 1, 'T5B-2.5G': 1,
}

// Update with users estimate from previous days ratio
let updated = 0
for (const [sku, scans] of Object.entries(DAY20_FULL)) {
  if (!live.per_sku_daily[sku]) {
    live.per_sku_daily[sku] = {}
  }
  const days = live.per_sku_daily[sku]
  let ratioSum = 0, ratioCount = 0
  for (const d of ['16','17','18','19']) {
    if (days[d] && days[d].r > 0) {
      ratioSum += days[d].u / days[d].r
      ratioCount++
    }
  }
  const ratio = ratioCount > 0 ? ratioSum / ratioCount : 0.5
  const users = Math.max(1, Math.round(scans * ratio))
  days['20'] = { r: scans, u: users }
  updated++
}

// Update Day 20 snapshot
const d20 = live.snapshot.days.find(d => d.date === '2026-05-20')
if (d20) {
  d20.rights = 7663      // DB tickets
  d20.users = 2618       // unique scanners DB
  d20.skuActive = Object.keys(DAY20_FULL).length
}

// Recompute totals + Top10 + cumulative
live.snapshot.totals.rights = live.snapshot.days.reduce((s, d) => s + d.rights, 0)
live.snapshot.totals.users  = 12805  // estimate: 10,262 (4-day) + 2,618 (Day 20) — not distinct

const skuNames = {}
for (const s of [...live.snapshot.top10Skus, ...(live.snapshot.cumulativeSkus || [])]) {
  const m = s.sku.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (m) skuNames[m[2].trim()] = m[1].trim()
}

const totals = []
for (const [sku, days] of Object.entries(live.per_sku_daily)) {
  let r = 0, u = 0
  for (const dk of ['16', '17', '18', '19', '20']) {
    if (days[dk]) { r += days[dk].r; u += days[dk].u }
  }
  const name = skuNames[sku] || sku
  totals.push({
    sku: `${name} (${sku})`,
    rights: r, users: u, scans: r,
    rightsPerUser: u > 0 ? +(r / u).toFixed(2) : 0,
  })
}
totals.sort((a, b) => b.rights - a.rights)
live.snapshot.top10Skus = totals.slice(0, 10)
live.snapshot.cumulativeSkus = totals.map(t => ({ sku: t.sku, rights: t.rights, users: t.users, scans: t.scans }))

live._meta.source_files = [
  'db: 2026-05-16.txt', 'db: 2026-05-17.txt', 'db: 2026-05-18.txt',
  'db: 2026-05-19.txt', 'db: 2026-05-20.txt (full 74 SKUs)',
]
live._meta.days_count = 5
live._meta.ingested_at = new Date().toISOString()

fs.writeFileSync(liveDataPath, JSON.stringify(live, null, 2))

console.log(`✅ Day 20 updated with ${updated} SKUs (full DB)`)
console.log(`\n📊 5-day Top 5:`)
live.snapshot.top10Skus.slice(0, 5).forEach((s, i) => {
  console.log(`  ${i+1}. ${s.sku} — ${s.rights.toLocaleString()} rights`)
})
console.log(`\n📈 5-day total: ${live.snapshot.totals.rights.toLocaleString()} rights`)
