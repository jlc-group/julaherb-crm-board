// Daily JSON ingestion (v2) — reads scan_data_YYYY-MM-DD.json files from DB team
// → updates src/lib/real-data-live.ts (NEW) which the dashboard imports
//
// Run: node scripts/ingest-daily.js
//   (reads all files in ./data/ matching scan_data_*.json)
//
// Or:  node scripts/ingest-daily.js data/scan_data_2026-05-18.json
//   (single file)

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve(__dirname, '..', 'data')
const LIB_DIR  = path.resolve(__dirname, '..', 'src', 'lib')

// ─── collect files ───
function listFiles() {
  if (process.argv[2]) return [path.resolve(process.argv[2])]
  return fs.readdirSync(DATA_DIR)
    .filter(f => /^scan_data_\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map(f => path.join(DATA_DIR, f))
    .sort()
}

const files = listFiles()
if (files.length === 0) {
  console.error('❌ No scan_data_*.json files found in data/')
  process.exit(1)
}

console.log(`📥 Found ${files.length} daily file(s)`)

// ─── load all ───
const days = files.map(f => {
  const raw = JSON.parse(fs.readFileSync(f, 'utf8'))
  return { file: path.basename(f), date: raw._meta?.date, data: raw }
})

// ─── derive aggregates ───
function dayKey(date) { return date.split('-')[2] }  // "18"
function weekdayTH(date) {
  const map = ['อา','จ','อ','พ','พฤ','ศ','ส']
  return ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'][new Date(date).getDay()]
}

// ─── 1. Build live snapshot (cumulative across all days) ───
function buildSnapshot() {
  const totals = days.reduce((acc, d) => ({
    rights: acc.rights + (d.data.section_01_kpi_strip?.tickets || 0),
    users:  acc.users  + (d.data.section_01_kpi_strip?.users   || 0),
  }), { rights: 0, users: 0 })

  // Cumulative SKU stats (sum across days)
  const skuMap = new Map()
  for (const d of days) {
    for (const row of (d.data.section_16_sku_daily_matrix || [])) {
      const existing = skuMap.get(row.sku) || { sku: row.sku, rights: 0, users: 0, scans: 0 }
      existing.rights += row.rights || 0
      existing.users  += row.users  || 0
      existing.scans  += row.scans  || 0
      skuMap.set(row.sku, existing)
    }
  }
  const skus = [...skuMap.values()].sort((a, b) => b.rights - a.rights)
  const top10 = skus.slice(0, 10).map(s => ({
    ...s,
    rightsPerUser: s.users > 0 ? +(s.rights / s.users).toFixed(2) : 0,
  }))

  return {
    days: days.map(d => ({
      date: d.date,
      weekday: weekdayTH(d.date),
      rights: d.data.section_01_kpi_strip.tickets,
      users:  d.data.section_01_kpi_strip.users,
      skuActive: d.data.section_01_kpi_strip.sku_active,
    })),
    totals,
    top10Skus: top10,
    cumulativeSkus: skus,
  }
}

const snapshot = buildSnapshot()

// ─── 2. Per-SKU per-day matrix ───
function buildPerSkuDaily() {
  const map = {}  // sku → { '16': {r,u}, '17': {r,u}, '18': {r,u} }
  for (const d of days) {
    const dk = dayKey(d.date)
    for (const row of (d.data.section_16_sku_daily_matrix || [])) {
      // extract SKU code from "name (SKU)" pattern
      const m = row.sku.match(/\(([^)]+)\)/)
      const skuCode = m ? m[1] : row.sku
      if (!map[skuCode]) map[skuCode] = {}
      if (row.rights > 0 || row.users > 0) {
        map[skuCode][dk] = { r: row.rights, u: row.users }
      }
    }
  }
  return map
}

const perSkuDaily = buildPerSkuDaily()

// ─── 3. Hourly heatmap (build matrix) ───
function buildHeatmap() {
  return days.map(d => ({
    date: d.date,
    weekday: weekdayTH(d.date),
    hours: (d.data.section_10_hourly_heatmap || []).map(h => ({
      hour: h.hour,
      scans: h.tickets,
    })),
  }))
}

// ─── 4. Customer mix per day ───
function buildCustomerMix() {
  return days.map(d => ({
    date: d.date,
    newSignup: d.data.section_03_customer_mix?.new_signup || 0,
    existing:  d.data.section_03_customer_mix?.existing   || 0,
    profileCompletionPct: d.data.section_03_customer_mix?.profile_completion_pct || 0,
  }))
}

// ─── 5. Engagement per day ───
function buildEngagement() {
  return days.map(d => ({
    date: d.date,
    returnedCount: d.data.section_04_engagement?.returned_count || 0,
    medianGapMin: d.data.section_04_engagement?.median_gap_min || 0,
    avgGapMin:    d.data.section_04_engagement?.avg_gap_min    || 0,
    totalUsers:   d.data.section_01_kpi_strip?.users || 0,
  }))
}

// ─── 6. Forecast (use latest day) ───
function buildForecast() {
  const latest = days[days.length - 1].data.section_15_cumulative_forecast
  return latest || null
}

// ─── 7. RFM (use latest day) ───
function buildRfm() {
  return days[days.length - 1].data.section_17_rfm_segments || []
}

// ─── 8. Cross-size matrix (use latest, or aggregate) ───
function buildCrossSize() {
  return days[days.length - 1].data.section_11_cross_size_matrix || []
}

// ─── 9. Velocity + Multi-account ───
function buildVelocity() {
  return days.map(d => ({
    date: d.date,
    ...d.data.section_12_velocity_alert,
  }))
}

// ─── 10. Provinces (latest day) ───
function buildProvinces() {
  return days[days.length - 1].data.section_19_top_provinces_full || []
}

// ─── 11. Scan log (latest day) ───
function buildScanLog() {
  return days[days.length - 1].data.section_21_scan_log_latest || []
}

// ─── 12. Top scanners (latest day) ───
function buildTopScanners() {
  return days[days.length - 1].data.section_20_top_scanners || []
}

// ─── 13. Apple-to-apple ───
function buildApple() {
  return days[days.length - 1].data.section_14_apple_to_apple || null
}

// ─── 14. Cohort retention (latest day) ───
function buildCohortRetention() {
  return days[days.length - 1].data.section_18_cohort_retention || []
}

// ─── 15. Multi-account ───
function buildMultiAccount() {
  return days[days.length - 1].data.section_22_multi_account_list || []
}

// ─── Write consolidated live file ───
const liveData = {
  _meta: {
    ingested_at: new Date().toISOString(),
    source_files: files.map(f => path.basename(f)),
    days_count: days.length,
  },
  snapshot,
  per_sku_daily: perSkuDaily,
  heatmap: buildHeatmap(),
  customer_mix: buildCustomerMix(),
  engagement: buildEngagement(),
  forecast: buildForecast(),
  rfm: buildRfm(),
  cross_size: buildCrossSize(),
  velocity: buildVelocity(),
  provinces: buildProvinces(),
  scan_log: buildScanLog(),
  top_scanners: buildTopScanners(),
  apple_to_apple: buildApple(),
  cohort_retention: buildCohortRetention(),
  multi_account: buildMultiAccount(),
}

const OUT = path.join(LIB_DIR, 'live-data.json')
fs.writeFileSync(OUT, JSON.stringify(liveData, null, 2), 'utf8')

console.log(`\n✅ Ingestion complete`)
console.log(`   Days:       ${days.map(d => d.date).join(', ')}`)
console.log(`   Total rights:  ${liveData.snapshot.totals.rights.toLocaleString()}`)
console.log(`   Total users:   ${liveData.snapshot.totals.users.toLocaleString()}`)
console.log(`   Active SKU:    ${liveData.snapshot.cumulativeSkus.length}`)
console.log(`   Output:        ${path.relative(process.cwd(), OUT)}`)
