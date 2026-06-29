#!/usr/bin/env node
// คัดลอกรูปสินค้า → dashboard public/products/{SKU}.png + สร้าง config map SKU→รูป/หมวด
// แมพ SKU จาก "(...)" ในชื่อไฟล์ · หมวด = ชื่อโฟลเดอร์แม่
// รัน: node scripts/ingest-product-images.mjs
import fs from 'node:fs'
import path from 'node:path'

const SRC = process.argv[2]
  || 'C:/Users/chadt/OneDrive/เดสก์ท็อป/JLC/JH รูปสินค้าแลกแต้ม/รูปสินค้าจุฬาเฮิร์บ - ฉบับแยกหมวด'
const DASH = path.join(process.cwd(), 'scan-lucky-rich-dashboard')
const OUT_DIR = path.join(DASH, 'public', 'products')
const CONFIG = path.join(DASH, 'src', 'config', 'product-images.ts')

const IMG_RE = /\.(png|jpe?g|webp)$/i
const SKU_RE = /\(([^)]+)\)\s*\.(?:png|jpe?g|webp)$/i

if (!fs.existsSync(SRC)) { console.error('❌ ไม่พบโฟลเดอร์ต้นทาง: ' + SRC); process.exit(1) }
fs.mkdirSync(OUT_DIR, { recursive: true })

// เดินทุกหมวด (โฟลเดอร์ชั้นเดียว)
const entries = [] // { sku, category, file }
for (const cat of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (!cat.isDirectory()) continue
  const catDir = path.join(SRC, cat.name)
  for (const f of fs.readdirSync(catDir)) {
    if (!IMG_RE.test(f)) continue
    const m = f.match(SKU_RE)
    if (!m) continue
    const sku = m[1].trim()
    entries.push({ sku, category: cat.name, src: path.join(catDir, f) })
  }
}

// SKU ซ้ำ (เช่นมีหลายไฟล์) → เก็บอันแรก
const seen = new Set()
const map = {}
let copied = 0
for (const e of entries) {
  if (seen.has(e.sku)) continue
  seen.add(e.sku)
  const dest = path.join(OUT_DIR, `${e.sku}.png`)
  fs.copyFileSync(e.src, dest)
  map[e.sku] = { img: `/products/${e.sku}.png`, category: e.category }
  copied++
}

// เขียน config
const lines = [
  '// AUTO-GENERATED โดย scripts/ingest-product-images.mjs — อย่าแก้มือ',
  '// แมพ SKU → รูปสินค้า (public/products) + หมวด',
  'export interface ProductImage { img: string; category: string }',
  'export const PRODUCT_IMAGES: Record<string, ProductImage> = {',
  ...Object.keys(map).sort().map((sku) => `  '${sku}': { img: '${map[sku].img}', category: ${JSON.stringify(map[sku].category)} },`),
  '}',
  '',
  '// หมวดทั้งหมด (จากโฟลเดอร์)',
  `export const PRODUCT_CATEGORIES = ${JSON.stringify(Array.from(new Set(Object.values(map).map((v) => v.category))).sort())} as const`,
  '',
  'export const productImage = (sku: string): string | null => PRODUCT_IMAGES[sku]?.img ?? null',
  'export const productCategory = (sku: string): string | null => PRODUCT_IMAGES[sku]?.category ?? null',
  '',
]
fs.writeFileSync(CONFIG, lines.join('\n'), 'utf-8')

console.log(`✅ คัดลอก ${copied} รูป → public/products/`)
console.log(`✅ เขียน config: ${CONFIG} (${Object.keys(map).length} SKU)`)
console.log(`   หมวด: ${Array.from(new Set(Object.values(map).map((v) => v.category))).join(', ')}`)
