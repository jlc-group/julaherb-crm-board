#!/usr/bin/env node
// ───────────────────────────────────────────────────────────────
// daily-print-export.mjs
// ดึง PDF "รายชื่อสิทธิ์ลูกค้า" (Print List) รายวันจาก prod → เซฟลงโฟลเดอร์ เดือน/วัน
//
// โหมดการทำงาน:
//   (ไม่มี flag)                = catch-up อัตโนมัติ: ดึงทุกวันตั้งแต่ startDate..เมื่อวาน เฉพาะวันที่ยังไม่มี
//   --date=YYYY-MM-DD          = ดึงวันเดียว
//   --from=YYYY-MM-DD --to=... = ดึงเป็นช่วง
//   --force                    = โหลดซ้ำแม้วันนั้นมี _summary.txt แล้ว
//
// catch-up logic นี้ครอบคลุมเคส "จันทร์โหลด ศ+ส+อา" เอง (เครื่องปิดวันหยุด) — รันซ้ำได้ไม่โหลดซ้ำ
//
// config: scripts/daily-print-export.config.local.json (gitignored — มี admin key)
// ───────────────────────────────────────────────────────────────
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.join(__dirname, 'daily-print-export.config.local.json')

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const RETRIES = 3
const FETCH_TIMEOUT_MS = 600_000 // 10 นาที (route maxDuration=600)

// ── config ──
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('❌ ไม่พบไฟล์ config: ' + CONFIG_PATH)
    console.error('สร้างไฟล์นี้ก่อน เนื้อหาตัวอย่าง:')
    console.error(JSON.stringify({
      baseUrl: 'https://scanlucky.wejlc.com',
      adminKey: '<ADMIN_KEY>',
      outputDir: 'C:/My GitHub/julaherb-crm-board-final/รายชื่อสิทธิ์ลูกค้า สแกนลุ้นรวย',
      startDate: '2026-06-29',
    }, null, 2))
    process.exit(1)
  }
  const c = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  for (const k of ['baseUrl', 'adminKey', 'outputDir', 'startDate']) {
    if (!c[k]) { console.error('❌ config ขาด field: ' + k); process.exit(1) }
  }
  return c
}

// ── date helpers (ใช้เวลาเครื่อง = Asia/Bangkok บนเครื่องผู้ใช้) ──
const pad = (n) => String(n).padStart(2, '0')
const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseISO = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd) }
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const ddmmyyyy = (iso) => { const [y, m, dd] = iso.split('-'); return `${dd}-${m}-${y}` }
const monthDir = (iso) => MONTHS[Number(iso.split('-')[1]) - 1]

// ── fetch แบบมี retry + timeout ──
async function fetchBuf(url, headers) {
  let lastErr
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal })
      clearTimeout(timer)
      if (res.status === 401) throw new Error('401 unauthorized — admin key ผิด/ขาด (ตรวจ config)')
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const buf = Buffer.from(await res.arrayBuffer())
      return { buf, headers: res.headers }
    } catch (e) {
      clearTimeout(timer)
      lastErr = e
      if (String(e.message).startsWith('401')) throw e // auth ผิด ไม่ต้อง retry
      if (attempt < RETRIES) {
        console.log(`   ⚠️  ล้มเหลว (ครั้ง ${attempt}/${RETRIES}): ${e.message} — ลองใหม่...`)
        await new Promise((r) => setTimeout(r, 3000 * attempt))
      }
    }
  }
  throw lastErr
}

// ── ดึงข้อมูล 1 วัน ──
async function exportDay(iso, cfg, { force = false } = {}) {
  const dayName = ddmmyyyy(iso)
  const dayDir = path.join(cfg.outputDir, monthDir(iso), dayName)
  const summaryPath = path.join(dayDir, '_summary.txt')
  const noDataPath = path.join(dayDir, '_no-data.txt')

  if (!force && (fs.existsSync(summaryPath) || fs.existsSync(noDataPath))) {
    console.log(`⏭️  ${dayName} — มีแล้ว (ข้าม)`)
    return { iso, status: 'skip' }
  }

  fs.mkdirSync(dayDir, { recursive: true })
  const headers = { 'x-admin-key': cfg.adminKey, 'User-Agent': UA }

  console.log(`⬇️  ${dayName} — กำลังโหลด...`)
  let part = 1, totalParts = 1, totalSlips = 0
  const savedFiles = []
  do {
    const url = `${cfg.baseUrl}/api/print-slips-pdf?from=${iso}&to=${iso}&part=${part}`
    const { buf, headers: h } = await fetchBuf(url, headers)
    totalParts = Number(h.get('x-total-parts') || 1)
    totalSlips = Number(h.get('x-total-slips') || 0)

    if (totalSlips === 0) {
      fs.writeFileSync(noDataPath, `ไม่มีข้อมูลสิทธิ์สำหรับวันที่ ${dayName} (0 ใบ)\nโหลดเมื่อ: ${new Date().toString()}\n`, 'utf-8')
      console.log(`   ℹ️  ${dayName} — 0 ใบ (เขียน _no-data.txt)`)
      return { iso, status: 'no-data' }
    }

    const fname = `รายชื่อสิทธิ์_${dayName}_part${part}of${totalParts}.pdf`
    fs.writeFileSync(path.join(dayDir, fname), buf)
    savedFiles.push(fname)
    console.log(`   ✓ part ${part}/${totalParts} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`)
    part++
  } while (part <= totalParts)

  const summary = [
    `รายชื่อสิทธิ์ลูกค้า — ${dayName}`,
    `วันที่ข้อมูล: ${iso}`,
    `จำนวนใบสิทธิ์: ${totalSlips.toLocaleString()}`,
    `จำนวนไฟล์ (part): ${totalParts}`,
    `ไฟล์: ${savedFiles.join(', ')}`,
    `โหลดเมื่อ: ${new Date().toString()}`,
  ].join('\n') + '\n'
  fs.writeFileSync(summaryPath, summary, 'utf-8')
  console.log(`   ✅ ${dayName} เสร็จ — ${totalSlips.toLocaleString()} ใบ, ${totalParts} part`)
  return { iso, status: 'ok', totalSlips, totalParts }
}

// ── log รวม ──
function appendLog(cfg, msg) {
  fs.mkdirSync(cfg.outputDir, { recursive: true })
  fs.appendFileSync(path.join(cfg.outputDir, '_log.txt'), `[${new Date().toISOString()}] ${msg}\n`, 'utf-8')
}

// ── คำนวณรายการวันที่ที่จะดึง ──
// --date / --from-to = explicit (honor ตรงๆ, ใช้รันมือ/ทดสอบ) · ไม่มี flag = auto catch-up (startDate..เมื่อวาน)
function datesToRun(cfg, args) {
  if (args.date) return [args.date]
  const from = args.from ? parseISO(args.from) : parseISO(cfg.startDate)
  const to = args.to ? parseISO(args.to) : addDays(new Date(), -1) // auto ดีฟอลต์ = เมื่อวาน
  const out = []
  let d = from
  while (d <= to) { out.push(isoLocal(d)); d = addDays(d, 1) }
  return out
}

// ── main ──
async function main() {
  const args = {}
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    if (m) args[m[1]] = m[2] === undefined ? true : m[2]
  }
  const cfg = loadConfig()
  const force = !!args.force
  const days = datesToRun(cfg, args)

  if (days.length === 0) { console.log('ℹ️  ไม่มีวันที่ต้องดึง (ก่อน startDate หรือยังไม่ถึงเมื่อวาน)'); return }
  console.log(`📋 ตรวจ/ดึง ${days.length} วัน: ${days[0]} → ${days[days.length - 1]}${force ? ' (force)' : ''}`)

  const results = []
  for (const iso of days) {
    try {
      results.push(await exportDay(iso, cfg, { force }))
    } catch (e) {
      console.error(`❌ ${ddmmyyyy(iso)} ล้มเหลว: ${e.message}`)
      results.push({ iso, status: 'error', error: e.message })
      appendLog(cfg, `ERROR ${iso}: ${e.message}`)
    }
  }

  const by = (s) => results.filter((r) => r.status === s)
  const ok = by('ok'), skip = by('skip'), nodata = by('no-data'), err = by('error')
  const msg = `done: ${ok.length} โหลดใหม่, ${skip.length} ข้าม, ${nodata.length} ไม่มีข้อมูล, ${err.length} ล้มเหลว`
  console.log(`\n🏁 ${msg}`)
  appendLog(cfg, msg
    + (ok.length ? ` | ใหม่: ${ok.map((r) => r.iso).join(',')}` : '')
    + (err.length ? ` | ล้มเหลว: ${err.map((r) => r.iso).join(',')}` : ''))

  if (err.length) process.exit(1)
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
