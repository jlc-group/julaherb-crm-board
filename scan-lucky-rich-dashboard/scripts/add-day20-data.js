// Add Day 20 data into live-data.json + recompute cumulative/top10
const fs = require('fs')
const path = require('path')

const liveDataPath = path.join(__dirname, '..', 'src', 'lib', 'live-data.json')
const live = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'))

// Day 20 SKU scans (from screenshot — 26 SKUs visible)
const DAY20_SCANS = {
  'L3-8G': 2699, 'L4-8G': 686, 'L6-8G': 620, 'L10-7G': 449, 'L7-6G': 302,
  'L13-10G': 249, 'L3-40G': 242, 'C4-8G': 208, 'L19-8G': 205, 'L8B-6G': 156,
  'L6-40G': 118, 'C3-7G': 107, 'L20-7G': 95, 'D3-70G': 94, 'JH906-70G': 93,
  'L8A-6G': 88, 'JHK1-8G': 85, 'JHA1-40G': 84, 'C2-8G': 74, 'L4-40G': 73,
  'C1-6G': 65, 'JH704-8G': 58, 'JH703-8G': 57, 'L10-30G': 52, 'JH904-70G': 48,
  'JH905-70G': 46,
}

// Estimate users by ratio from Day 16-19
let added = 0
for (const [sku, scans] of Object.entries(DAY20_SCANS)) {
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
  live.per_sku_daily[sku]['20'] = { r: scans, u: users }
  added++
}

// Add Day 20 to snapshot.days
const day20Snapshot = {
  date: '2026-05-20',
  weekday: 'พุธ',
  rights: 7666,  // = success scans (DB tickets unknown yet — assume 1:1)
  users: 0,  // TBD — DB data pending
  skuActive: Object.keys(DAY20_SCANS).length,
}
const existingIdx = live.snapshot.days.findIndex(d => d.date === '2026-05-20')
if (existingIdx >= 0) {
  live.snapshot.days[existingIdx] = day20Snapshot
} else {
  live.snapshot.days.push(day20Snapshot)
}

// Recompute totals
live.snapshot.totals.rights = live.snapshot.days.reduce((s, d) => s + d.rights, 0)
live.snapshot.totals.users  = 12191  // approx (10,262 + ~2,000) — TBD when distinct count available

// Recompute cumulativeSkus + top10Skus from 5 days
const skuNames = {}
for (const s of [...live.snapshot.top10Skus, ...(live.snapshot.cumulativeSkus || [])]) {
  const m = s.sku.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (m) skuNames[m[2].trim()] = m[1].trim()
}

const totals = []
for (const [sku, days] of Object.entries(live.per_sku_daily)) {
  let r = 0, u = 0
  for (const dk of ['16', '17', '18', '19', '20']) {
    if (days[dk]) {
      r += days[dk].r
      u += days[dk].u
    }
  }
  const name = skuNames[sku] || sku
  totals.push({
    sku: `${name} (${sku})`,
    rights: r,
    users: u,
    scans: r,
    rightsPerUser: u > 0 ? +(r / u).toFixed(2) : 0,
  })
}
totals.sort((a, b) => b.rights - a.rights)

live.snapshot.top10Skus = totals.slice(0, 10)
live.snapshot.cumulativeSkus = totals.map(t => ({
  sku: t.sku, rights: t.rights, users: t.users, scans: t.scans,
}))

// Update _meta
live._meta.source_files = [
  'scan_data_2026-05-16.json',
  'scan_data_2026-05-17.json',
  'scan_data_2026-05-18.json',
  'scan_data_2026-05-19.json',
  'scan_data_2026-05-20.json (partial — top 26 SKUs from screenshot)',
]
live._meta.days_count = 5
live._meta.ingested_at = new Date().toISOString()

fs.writeFileSync(liveDataPath, JSON.stringify(live, null, 2))

console.log(`✅ Added Day 20 to ${added} SKUs`)
console.log(`\n📊 New Top 5:`)
live.snapshot.top10Skus.slice(0, 5).forEach((s, i) => {
  console.log(`  ${i+1}. ${s.sku} — ${s.rights.toLocaleString()} rights / ${s.users.toLocaleString()} users`)
})
console.log(`\n📈 5-day totals: ${live.snapshot.totals.rights.toLocaleString()} rights`)
console.log(`   (note: ~613 long-tail scans missing — pending full DB data)`)
