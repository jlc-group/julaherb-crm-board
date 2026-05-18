// One-shot Excel ingestion: 97-SKU master → TS file
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')

const XLSX_PATH = path.resolve(__dirname, '..', '..', 'สินค้าร่วมแคมเปญไทยรัฐ_97SKU.xlsx')
const OUT_PATH  = path.resolve(__dirname, '..', 'src', 'config', 'products-real.ts')

const wb = XLSX.readFile(XLSX_PATH)
const ws = wb.Sheets[wb.SheetNames[0]]
const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

// Data rows start at row 5 (1-indexed) → index 4
const rows = []
for (let i = 4; i < aoa.length; i++) {
  const r = aoa[i]
  if (!r || !r[2]) continue
  rows.push({
    seq:           Number(r[0]),
    priceCategory: String(r[1] || '').trim(),
    sku:           String(r[2] || '').trim(),
    fullName:      String(r[3] || '').trim(),
    displayName:   String(r[4] || '').trim(),
    price:         Number(r[5]) || 0,
    pointsPerScan: Number(r[6]) || 0,
    rightsPerScan: Number(r[7]) || 0,
  })
}

console.log(`Ingested ${rows.length} SKUs`)

// Escape for TS string literal
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

const lines = rows.map(r =>
  `  { seq: ${r.seq}, sku: '${esc(r.sku)}', priceCategory: '${esc(r.priceCategory)}', fullName: '${esc(r.fullName)}', displayName: '${esc(r.displayName)}', price: ${r.price}, pointsPerScan: ${r.pointsPerScan}, rightsPerScan: ${r.rightsPerScan} },`
)

const tsContent = `// AUTO-GENERATED from สินค้าร่วมแคมเปญไทยรัฐ_97SKU.xlsx
// Run: node scripts/ingest-products.js to regenerate

export interface ProductMaster {
  seq: number
  sku: string
  priceCategory: string
  fullName: string
  displayName: string
  price: number
  pointsPerScan: number
  rightsPerScan: number
}

export const PRODUCTS_MASTER: ProductMaster[] = [
${lines.join('\n')}
]

export const TOTAL_SKUS = ${rows.length}
`

fs.writeFileSync(OUT_PATH, tsContent, 'utf8')
console.log(`Wrote ${OUT_PATH}`)
