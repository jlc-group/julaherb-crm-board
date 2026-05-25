// Aggregate 5-day campaign data per user's spec:
// - Success scans: from "daily - saversure line push" (authoritative daily totals)
// - Per-SKU scans:  from "daily - from db" txt files (DB shows 1:1, so DB tickets = scans)
// - Tickets:        CALCULATED = scans × rightsPerScan from products-real.ts
//
// Run: node aggregate-from-sources.js
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const DB_DIR = path.join(ROOT, 'Final Data daily update', 'daily - from db')

// ─── 1. Per-day stats from "from db" txt files (V2 authoritative) ─────────────────────
// NOTE: saversure line push deprecated — V1/V2 mapping mismatch
// from-db Day 17-21: "Duplicate other" already includes not_found
// from-db Day 16: separate (dup_other=78, not_found=181)
const FROMDB_DAILY = {
  '16': { dow: 'เสาร์',     scans: 7160, dupSelf: 660, dupOther: 78,  notFound: 181, totalAttempts: 8079, uniqueUsers: 2624, newMembers: 440 },
  '17': { dow: 'อาทิตย์',   scans: 8713, dupSelf: 755, dupOther: 304, notFound: 0,   totalAttempts: 9772, uniqueUsers: 2968, newMembers: 460 },
  '18': { dow: 'จันทร์',    scans: 6459, dupSelf: 639, dupOther: 260, notFound: 0,   totalAttempts: 7358, uniqueUsers: 2509, newMembers: 480 },
  '19': { dow: 'อังคาร',    scans: 5707, dupSelf: 588, dupOther: 326, notFound: 0,   totalAttempts: 6621, uniqueUsers: 1929, newMembers: 308, outage: '6 ชม. 02:49-09:00' },
  '20': { dow: 'พุธ',       scans: 7669, dupSelf: 654, dupOther: 271, notFound: 0,   totalAttempts: 8594, uniqueUsers: 2618, newMembers: 413 },
  '21': { dow: 'พฤหัสบดี',  scans: 6590, dupSelf: 617, dupOther: 245, notFound: 0,   totalAttempts: 7452, uniqueUsers: 2470, newMembers: 403, outage: '2 ชม. 03:00-04:59' },
}
const SAVERSURE_DAILY = FROMDB_DAILY  // alias for backward compatibility in script below

// ─── 2. Read products-real.ts → build SKU → rightsPerScan map ────────────────────────
const productsFile = fs.readFileSync(
  path.join(ROOT, 'scan-lucky-rich-dashboard', 'src', 'config', 'products-real.ts'),
  'utf8'
)
const skuPerScan = {}        // sku → rightsPerScan
const skuDisplayName = {}    // sku → displayName (short)
{
  const re = /sku:\s*'([^']+)'[^}]*?displayName:\s*'([^']+)'[^}]*?rightsPerScan:\s*(\d+)/g
  let m
  while ((m = re.exec(productsFile)) !== null) {
    const [, sku, displayName, perScan] = m
    skuPerScan[sku] = parseInt(perScan, 10)
    skuDisplayName[sku] = displayName.replace(/\s*\([^)]+\)$/, '')
  }
}
console.log(`📦 Loaded ${Object.keys(skuPerScan).length} SKUs from products-real.ts`)

// ─── 3. Parse each daily txt file → per-SKU scans ─────────────────────────────────────
// Each row in txt:  | # | SKU | Tickets | per_scan | % share |
// or:               | rank | SKU name (CODE) | tickets |
// We use regex to extract any "(CODE)" + a number.

function parseDay(file) {
  const content = fs.readFileSync(file, 'utf8')
  const skuMap = {}  // sku → scans
  // Match patterns:
  //   "L3-8G ดีดีครีมแตงโม | 2,699"
  //   "| **ดีดีครีมแตงโม (L3-8G)** | **2,452** |"
  // Strategy: line-by-line, find rows with a SKU token + integer ticket count
  const lines = content.split('\n')
  for (const line of lines) {
    // Try several patterns
    // Pattern A: | # | SKU NAME | tickets | per_scan | %  (from day 19/20)
    // Pattern B: | # | SKU **NAME (CODE)** | tickets |  (from day 16-18)
    // Pattern C: | NAME (CODE) | tickets |
    let mc
    // Pattern A — pipe-separated row starting with rank
    mc = line.match(/^\|\s*\d+\s*\|\s*([A-Z][A-Z0-9-]+)\s+[^|]+\|\s*([\d,]+)\s*\|/)
    if (mc) {
      const sku = mc[1]
      const tickets = parseInt(mc[2].replace(/,/g, ''), 10)
      if (skuPerScan[sku] !== undefined && tickets > 0) {
        skuMap[sku] = (skuMap[sku] || 0) + tickets
      }
      continue
    }
    // Pattern B/C — "(CODE)" then "| number |"
    mc = line.match(/\(([A-Z][A-Z0-9-]+)\)[^|]*\|\s*\*?\*?([\d,]+)/)
    if (mc) {
      const sku = mc[1]
      const tickets = parseInt(mc[2].replace(/,/g, ''), 10)
      if (skuPerScan[sku] !== undefined && tickets > 0) {
        skuMap[sku] = (skuMap[sku] || 0) + tickets
      }
      continue
    }
    // Pattern D — plain "| SKU NAME | tickets" (for Mid/Low tables)
    mc = line.match(/^\|\s*([A-Z][A-Z0-9-]+)\s+[^|]+\|\s*([\d,]+)\s*\|/)
    if (mc) {
      const sku = mc[1]
      const tickets = parseInt(mc[2].replace(/,/g, ''), 10)
      if (skuPerScan[sku] !== undefined && tickets > 0) {
        skuMap[sku] = (skuMap[sku] || 0) + tickets
      }
    }
  }
  return skuMap
}

const days = ['16', '17', '18', '19', '20', '21']
const perDaySku = {}     // day → { sku → scans }
const dayTotal = {}      // day → total parsed from per-SKU
for (const d of days) {
  const file = path.join(DB_DIR, `2026-05-${d}.txt`)
  perDaySku[d] = parseDay(file)
  dayTotal[d] = Object.values(perDaySku[d]).reduce((s, v) => s + v, 0)
  console.log(`📅 Day ${d}: parsed ${Object.keys(perDaySku[d]).length} SKUs · total scans = ${dayTotal[d].toLocaleString()} (saversure says ${SAVERSURE_DAILY[d].scans.toLocaleString()})`)
}

// ─── 4. Aggregate 5-day per-SKU + compute spec tickets ────────────────────────────────
const cumulative = {}  // sku → { scans, perScan, name, specTickets }
for (const d of days) {
  for (const [sku, scans] of Object.entries(perDaySku[d])) {
    if (!cumulative[sku]) {
      cumulative[sku] = {
        sku,
        name: skuDisplayName[sku] || sku,
        perScan: skuPerScan[sku],
        scans: 0,
        specTickets: 0,
      }
    }
    cumulative[sku].scans += scans
  }
}
// Spec tickets per SKU
for (const k of Object.keys(cumulative)) {
  cumulative[k].specTickets = cumulative[k].scans * cumulative[k].perScan
}

// ─── 5. Output totals ──────────────────────────────────────────────────────────────────
const totalScansParsed = Object.values(cumulative).reduce((s, r) => s + r.scans, 0)
const totalSpecTickets = Object.values(cumulative).reduce((s, r) => s + r.specTickets, 0)
const totalScansSaversure = days.reduce((s, d) => s + SAVERSURE_DAILY[d].scans, 0)

console.log('\n══════════════════════════════════════════════════════════════════')
console.log('5-DAY TOTALS')
console.log('══════════════════════════════════════════════════════════════════')
console.log(`Success scans (saversure)  : ${totalScansSaversure.toLocaleString()}`)
console.log(`Success scans (from db sum): ${totalScansParsed.toLocaleString()}`)
console.log(`SPEC tickets (scans × perScan): ${totalSpecTickets.toLocaleString()}`)
console.log(`Multiplier ratio:             ${(totalSpecTickets / totalScansParsed).toFixed(3)}×`)

// ─── 6. Top 10 by spec tickets ─────────────────────────────────────────────────────────
const top = Object.values(cumulative).sort((a, b) => b.specTickets - a.specTickets)
console.log('\n══════════════════════════════════════════════════════════════════')
console.log('TOP 10 SKU (by SPEC tickets — scans × perScan)')
console.log('══════════════════════════════════════════════════════════════════')
console.log('Rank | SKU      | perScan | Scans  | SpecTickets | %share')
console.log('-----+----------+---------+--------+-------------+--------')
top.slice(0, 15).forEach((r, i) => {
  const share = (r.specTickets / totalSpecTickets * 100).toFixed(1)
  console.log(`${String(i+1).padStart(4)} | ${r.sku.padEnd(8)} | ${String(r.perScan).padStart(7)} | ${String(r.scans).padStart(6)} | ${String(r.specTickets).padStart(11)} | ${share.padStart(5)}%`)
})

// ─── 7. Tier breakdown (by perScan group) ──────────────────────────────────────────────
const tierScans = { 1: 0, 2: 0, '3+': 0 }
const tierSpec  = { 1: 0, 2: 0, '3+': 0 }
const tierSkuCount = { 1: 0, 2: 0, '3+': 0 }
for (const r of Object.values(cumulative)) {
  const t = r.perScan === 1 ? 1 : r.perScan === 2 ? 2 : '3+'
  tierScans[t] += r.scans
  tierSpec[t] += r.specTickets
  tierSkuCount[t]++
}
console.log('\n══════════════════════════════════════════════════════════════════')
console.log('TIER MIX (by SPEC tickets)')
console.log('══════════════════════════════════════════════════════════════════')
console.log('Tier   | SKUs | Scans  | SpecTickets | %share')
console.log('-------+------+--------+-------------+--------')
for (const t of [1, 2, '3+']) {
  const share = (tierSpec[t] / totalSpecTickets * 100).toFixed(1)
  console.log(`${String(t).padEnd(6)} | ${String(tierSkuCount[t]).padStart(4)} | ${String(tierScans[t]).padStart(6)} | ${String(tierSpec[t]).padStart(11)} | ${share.padStart(5)}%`)
}

// ─── 8. Pareto ─────────────────────────────────────────────────────────────────────────
const top1Share = (top[0].specTickets / totalSpecTickets * 100).toFixed(1)
const top3Share = (top.slice(0, 3).reduce((s, r) => s + r.specTickets, 0) / totalSpecTickets * 100).toFixed(1)
const top10Share = (top.slice(0, 10).reduce((s, r) => s + r.specTickets, 0) / totalSpecTickets * 100).toFixed(1)
console.log('\n══════════════════════════════════════════════════════════════════')
console.log('PARETO')
console.log('══════════════════════════════════════════════════════════════════')
console.log(`Top 1 (${top[0].sku}) : ${top1Share}%`)
console.log(`Top 3              : ${top3Share}%`)
console.log(`Top 10             : ${top10Share}%`)

// ─── 9. Per-day spec tickets ───────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════')
console.log('PER-DAY (Saversure scans → Spec tickets)')
console.log('══════════════════════════════════════════════════════════════════')
console.log('Day | DoW    | Scans  | Spec tickets (calc)')
console.log('----+--------+--------+--------------------')
const dows = { '16': 'เสาร์', '17': 'อาทิตย์', '18': 'จันทร์', '19': 'อังคาร', '20': 'พุธ', '21': 'พฤหัสบดี' }
for (const d of days) {
  const daySkus = perDaySku[d]
  let specDay = 0
  for (const [sku, scans] of Object.entries(daySkus)) {
    specDay += scans * skuPerScan[sku]
  }
  console.log(`${d}  | ${dows[d].padEnd(6)} | ${String(SAVERSURE_DAILY[d].scans).padStart(6)} | ${String(specDay).padStart(18).padEnd(20)}`)
}

// ─── 10. Output JSON for slide consumption ─────────────────────────────────────────────
const out = {
  summary: {
    totalScansSaversure,
    totalScansParsed,
    totalSpecTickets,
    multiplier: +(totalSpecTickets / totalScansParsed).toFixed(3),
    top1: { sku: top[0].sku, name: top[0].name, scans: top[0].scans, specTickets: top[0].specTickets, share: +top1Share },
    pareto: { top1: +top1Share, top3: +top3Share, top10: +top10Share },
    tierMix: {
      tier1: { skus: tierSkuCount[1], scans: tierScans[1], spec: tierSpec[1], share: +(tierSpec[1] / totalSpecTickets * 100).toFixed(1) },
      tier2: { skus: tierSkuCount[2], scans: tierScans[2], spec: tierSpec[2], share: +(tierSpec[2] / totalSpecTickets * 100).toFixed(1) },
      tier3plus: { skus: tierSkuCount['3+'], scans: tierScans['3+'], spec: tierSpec['3+'], share: +(tierSpec['3+'] / totalSpecTickets * 100).toFixed(1) },
    },
  },
  perDay: days.map(d => {
    const daySkus = perDaySku[d]
    let specDay = 0
    for (const [sku, scans] of Object.entries(daySkus)) {
      specDay += scans * skuPerScan[sku]
    }
    return {
      day: d,
      dow: dows[d],
      scans: SAVERSURE_DAILY[d].scans,
      specTickets: specDay,
      ...SAVERSURE_DAILY[d],
    }
  }),
  top15: top.slice(0, 15).map(r => ({
    sku: r.sku, name: r.name, perScan: r.perScan, scans: r.scans, specTickets: r.specTickets,
    share: +(r.specTickets / totalSpecTickets * 100).toFixed(1),
  })),
}
fs.writeFileSync(path.join(__dirname, 'aggregated-5day.json'), JSON.stringify(out, null, 2))
console.log('\n✅ Saved → aggregated-5day.json')
