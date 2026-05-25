// Recompute top10Skus + cumulativeSkus from per_sku_daily (4 days)
const fs = require('fs')
const path = require('path')

const liveDataPath = path.join(__dirname, '..', 'src', 'lib', 'live-data.json')
const live = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'))

// SKU display names — extract from existing top10Skus + cumulativeSkus
const skuNames = {}
for (const s of [...live.snapshot.top10Skus, ...(live.snapshot.cumulativeSkus || [])]) {
  const m = s.sku.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (m) skuNames[m[2].trim()] = m[1].trim()
}

// Build totals from per_sku_daily (16+17+18+19)
const totals = []
for (const [sku, days] of Object.entries(live.per_sku_daily)) {
  let r = 0, u = 0
  for (const dk of ['16', '17', '18', '19']) {
    if (days[dk]) {
      r += days[dk].r
      u += days[dk].u  // sum (matches existing cumulativeSkus convention)
    }
  }
  const name = skuNames[sku] || sku
  totals.push({
    sku: `${name} (${sku})`,
    skuCode: sku,
    rights: r,
    users: u,
    scans: r,
    rightsPerUser: u > 0 ? r / u : 0,
  })
}
totals.sort((a, b) => b.rights - a.rights)

// Update top10
live.snapshot.top10Skus = totals.slice(0, 10).map(t => ({
  sku: t.sku,
  rights: t.rights,
  users: t.users,
  scans: t.scans,
  rightsPerUser: +t.rightsPerUser.toFixed(2),
}))

// Update cumulativeSkus (all 93+)
live.snapshot.cumulativeSkus = totals.map(t => ({
  sku: t.sku,
  rights: t.rights,
  users: t.users,
  scans: t.scans,
}))

// Update totals (sanity check)
const sumRights = totals.reduce((s, t) => s + t.rights, 0)
console.log(`Sum of all SKU rights: ${sumRights}`)
console.log(`Snapshot totals.rights (sum days): ${live.snapshot.totals.rights}`)

fs.writeFileSync(liveDataPath, JSON.stringify(live, null, 2))

console.log(`\n✅ Updated top10Skus (Hero):`)
live.snapshot.top10Skus.slice(0, 5).forEach((s, i) => {
  console.log(`  ${i + 1}. ${s.sku} — ${s.rights.toLocaleString()} rights / ${s.users.toLocaleString()} users`)
})
console.log(`\n✅ Updated cumulativeSkus: ${live.snapshot.cumulativeSkus.length} SKUs`)
