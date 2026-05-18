import type { Customer, Winner, ScanEntry } from '@/types'
import { PRODUCTS } from '@/config/products'
import { maskPhone } from '@/lib/utils'

// ============================
// Constants
// ============================

export const PROVINCES = [
  'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'ชลบุรี',
  'เชียงใหม่', 'นครราชสีมา', 'ขอนแก่น', 'อุดรธานี', 'เชียงราย',
  'สงขลา', 'นครศรีธรรมราช', 'สุราษฎร์ธานี', 'ภูเก็ต', 'ระยอง',
  'พิษณุโลก', 'อุบลราชธานี', 'ร้อยเอ็ด', 'สกลนคร', 'นครปฐม',
  'สมุทรสาคร', 'ราชบุรี', 'กาญจนบุรี', 'ลำปาง', 'ตรัง',
  'ปราจีนบุรี', 'ฉะเชิงเทรา', 'ลพบุรี', 'สระบุรี', 'พระนครศรีอยุธยา',
]

export const THAI_FIRST_NAMES = [
  'สมชาย', 'สมหญิง', 'สุภาพร', 'วิทยา', 'พรทิพย์', 'ประเสริฐ', 'นิภา', 'สมศักดิ์', 'วรรณา', 'ชัยวัฒน์',
  'จิราพร', 'ธนากร', 'สุดา', 'เกษม', 'อรุณ', 'มาลี', 'ศิริ', 'ประภา', 'ณัฐพล', 'กาญจนา',
  'วิภา', 'ธีรศักดิ์', 'รัตนา', 'สุรชัย', 'พัชรี', 'อนุชา', 'วราภรณ์', 'สมบัติ', 'นารี', 'เสกสรร',
  'ปรียา', 'วีระ', 'จันทร์', 'ภูมิ', 'แก้ว', 'สุนทร', 'ลัดดา', 'มนตรี', 'ดวงใจ', 'ไพศาล',
  'ปราณี', 'วิชัย', 'สายฝน', 'เกียรติ', 'นภา', 'ธวัช', 'รุ่งนภา', 'ประยุทธ', 'ศศิธร', 'วัฒนา',
  'อัจฉรา', 'สุทัศน์', 'พิมพ์', 'เอกชัย', 'กมล', 'สุวิทย์', 'น้ำฝน', 'ธนวัฒน์', 'พรพิมล', 'วิเชียร',
  'จุฬาลักษณ์', 'อำนาจ', 'สุพรรณ', 'พิทักษ์', 'รัศมี', 'บุญเลิศ', 'เพ็ญ', 'ชาตรี', 'อารีย์', 'มงคล',
  'กิตติ', 'สุชาดา', 'วินัย', 'พัฒนา', 'จำนง', 'เรณู', 'นิพนธ์', 'ศรีสุดา', 'สุริยะ', 'พจนา',
  'กรรณิกา', 'ทวี', 'สำราญ', 'ดารา', 'ชูชาติ', 'สุรีย์', 'วิไล', 'อุดม', 'พิศมัย', 'วิรัตน์',
  'อมรรัตน์', 'ศุภชัย', 'รจนา', 'กำธร', 'ทัศนีย์', 'ศรัณย์', 'อรทัย', 'ปิยะ', 'มยุรี', 'ชนะ',
]

export const THAI_LAST_NAMES = [
  'สุขสม', 'รักดี', 'ใจดี', 'มั่นคง', 'ศรีสุข', 'วงษ์สุวรรณ', 'แก้วมณี', 'ทองดี', 'พรหมมา', 'จันทร์เพ็ง',
  'ปัญญา', 'เจริญศรี', 'สมบูรณ์', 'ประสาท', 'วิไลลักษณ์', 'สุวรรณ', 'นิลวรรณ', 'ชัยรัตน์', 'ศรีวิชัย', 'พิทักษ์',
  'ดวงดี', 'มีสุข', 'ยอดดี', 'ทิพย์', 'สุทธิ', 'แซ่ลิ้ม', 'แซ่ตัน', 'แซ่อึ้ง', 'พงษ์พันธ์', 'ธรรมรัตน์',
  'ศิริพร', 'กุลวงศ์', 'ชาติวงศ์', 'เทพนิมิต', 'วิเศษ', 'อุดมศักดิ์', 'พลอยงาม', 'นาคสกุล', 'เกตุแก้ว', 'ภูวนาท',
  'สิทธิโชค', 'อนันต์', 'มหาชัย', 'จิรวัฒน์', 'ประดิษฐ์', 'สายทอง', 'ศิลป์', 'บุญมา', 'เอี่ยมสะอาด', 'ดีเลิศ',
]

const CHANNELS = ['7-Eleven', 'Watson', 'Shopee', 'Lazada', 'TikTok Shop', 'ตัวแทนจำหน่าย']

// ============================
// Helpers
// ============================

// Seeded PRNG (mulberry32) so server-rendered HTML matches client hydration
let _seed = 0x9e3779b9
function seededRandom(): number {
  _seed |= 0
  _seed = (_seed + 0x6d2b79f5) | 0
  let t = _seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const Math_random = seededRandom

function randInt(min: number, max: number): number {
  return Math.floor(Math_random() * (max - min + 1)) + min
}

function randItem<T>(arr: T[]): T {
  return arr[Math.floor(Math_random() * arr.length)]
}

function randPhone(): string {
  return '08' + randInt(0, 9) + String(randInt(1000000, 9999999))
}

function randDate(startDays: number, endDays: number): string {
  const now = new Date()
  const offset = randInt(startDays, endDays)
  const d = new Date(now.getTime() - offset * 86400000)
  return d.toISOString().split('T')[0]
}

function randScanCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math_random() * chars.length)]
  return code
}

// ============================
// Generators
// ============================

export function generateUsers(count: number): Customer[] {
  const users: Customer[] = []
  for (let i = 1; i <= count; i++) {
    const scans = randInt(1, 45)
    const prodCount = randInt(1, Math.min(5, scans))
    const selectedProducts = []
    const usedSkus = new Set<string>()
    for (let p = 0; p < prodCount; p++) {
      let prod = randItem(PRODUCTS)
      let attempts = 0
      while (usedSkus.has(prod.sku) && attempts < 20) {
        prod = randItem(PRODUCTS)
        attempts++
      }
      if (!usedSkus.has(prod.sku)) {
        usedSkus.add(prod.sku)
        selectedProducts.push({ sku: prod.sku, name: prod.name, qty: randInt(1, Math.max(1, Math.floor(scans / prodCount))) })
      }
    }
    const codes: string[] = []
    for (let c = 0; c < scans; c++) codes.push(randScanCode())

    users.push({
      id: i,
      name: `${randItem(THAI_FIRST_NAMES)} ${randItem(THAI_LAST_NAMES)}`,
      phone: randPhone(),
      province: randItem(PROVINCES),
      isNewCustomer: Math_random() < 0.35,
      scans,
      rights: scans * randInt(1, 5),
      lastScan: randDate(0, 60),
      products: selectedProducts,
      scanCodes: codes,
      riskScore: Math_random() < 0.08 ? randInt(70, 99) : randInt(0, 40),
    })
  }
  return users
}

export function generateWinners(users: Customer[]): Winner[] {
  const winners: Winner[] = []
  const tiers: Array<{ tier: '10K' | '100K' | '1M'; label: string }> = [
    { tier: '10K', label: 'ทองคำ 1 สลึง (10,000 บาท)' },
    { tier: '100K', label: 'ทองคำ 10 บาท (100,000 บาท)' },
    { tier: '1M', label: 'เงินสด 1,000,000 บาท' },
  ]
  const statuses: Array<'confirmed' | 'pending' | 'forfeited' | 'unannounced'> = ['confirmed', 'pending', 'forfeited', 'unannounced']

  for (let i = 0; i < 50; i++) {
    const user = users[randInt(0, users.length - 1)]
    const tierInfo = i < 45 ? tiers[0] : i < 49 ? tiers[1] : tiers[2]
    const status = i < 30 ? statuses[randInt(0, 1)] : i < 45 ? statuses[randInt(0, 2)] : statuses[3]

    winners.push({
      id: i + 1,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      province: user.province,
      tier: tierInfo.tier,
      prizeLabel: tierInfo.label,
      status,
      date: randDate(0, 90),
      products: user.products.slice(0, 2),
    })
  }
  return winners
}

export function generateScanLog(users: Customer[]): ScanEntry[] {
  const entries: ScanEntry[] = []
  for (let i = 0; i < 200; i++) {
    const user = users[randInt(0, users.length - 1)]
    const prod = randItem(PRODUCTS)
    const hour = randInt(7, 23)
    const minute = randInt(0, 59)
    const dayOffset = randInt(0, 30)
    const d = new Date()
    d.setDate(d.getDate() - dayOffset)
    d.setHours(hour, minute, randInt(0, 59))

    entries.push({
      id: `SCN-${String(i + 1).padStart(5, '0')}`,
      customerId: user.id,
      customerName: user.name,
      phone: maskPhone(user.phone),
      productName: prod.name,
      productSku: prod.sku,
      scanCode: randScanCode(),
      rightsEarned: prod.rightsPerScan,
      scannedAt: d.toISOString(),
      province: user.province,
      channel: randItem(CHANNELS),
    })
  }
  // Sort newest first
  entries.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
  return entries
}

// ============================
// Exported mock datasets
// ============================

export const MOCK_USERS = generateUsers(100)
export const MOCK_WINNERS = generateWinners(MOCK_USERS)
export const MOCK_SCAN_LOG = generateScanLog(MOCK_USERS)

// Province aggregation
export const PROVINCE_SCANS: Array<{ province: string; scans: number; users: number }> = (() => {
  const map = new Map<string, { scans: number; users: number }>()
  for (const u of MOCK_USERS) {
    const entry = map.get(u.province) || { scans: 0, users: 0 }
    entry.scans += u.scans
    entry.users += 1
    map.set(u.province, entry)
  }
  return Array.from(map.entries())
    .map(([province, data]) => ({ province, ...data }))
    .sort((a, b) => b.scans - a.scans)
})()

// ============================
// Chart data
// ============================

const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']

export const HOURLY_TODAY = HOURS.map((h) => ({
  hour: h,
  scans: Math.round(120 + Math_random() * 380 + (h >= '11:00' && h <= '14:00' ? 200 : 0) + (h >= '19:00' && h <= '21:00' ? 250 : 0)),
}))

export const HOURLY_YESTERDAY = HOURS.map((h) => ({
  hour: h,
  scans: Math.round(100 + Math_random() * 350 + (h >= '11:00' && h <= '14:00' ? 180 : 0) + (h >= '19:00' && h <= '21:00' ? 220 : 0)),
}))

// Trend data with multiple view modes
function generateDailyTrend(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    const base = 1200 + Math_random() * 600
    // Weekend dip
    const dayOfWeek = d.getDay()
    const modifier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1.0
    data.push({
      label,
      scans: Math.round(base * modifier),
      rights: Math.round(base * modifier * 2.8),
      newUsers: Math.round(40 + Math_random() * 30),
    })
  }
  return data
}

function generateWeeklyTrend(weeks: number) {
  const data = []
  for (let i = weeks - 1; i >= 0; i--) {
    data.push({
      label: `W${weeks - i}`,
      scans: Math.round(8000 + Math_random() * 4000),
      rights: Math.round(22000 + Math_random() * 10000),
      newUsers: Math.round(250 + Math_random() * 150),
    })
  }
  return data
}

function generateMonthlyTrend() {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.']
  return months.map((label) => ({
    label,
    scans: Math.round(35000 + Math_random() * 15000),
    rights: Math.round(95000 + Math_random() * 40000),
    newUsers: Math.round(1000 + Math_random() * 600),
  }))
}

function generateDrawTrend() {
  const draws = ['งวด 1/4', 'งวด 16/4', 'งวด 1/5', 'งวด 16/5']
  return draws.map((label) => ({
    label,
    scans: Math.round(20000 + Math_random() * 10000),
    rights: Math.round(55000 + Math_random() * 25000),
    newUsers: Math.round(500 + Math_random() * 400),
  }))
}

export const TREND_DATA = {
  daily: generateDailyTrend(30),
  weekly: generateWeeklyTrend(12),
  monthly: generateMonthlyTrend(),
  draw: generateDrawTrend(),
}

// Channel data
export const CHANNEL_DATA = [
  { name: '7-Eleven', scans: 12450, pct: 25.7, icon: 'ti-building-store' },
  { name: 'Watson', scans: 8920, pct: 18.4, icon: 'ti-first-aid-kit' },
  { name: 'Shopee', scans: 7680, pct: 15.9, icon: 'ti-shopping-cart' },
  { name: 'Lazada', scans: 6340, pct: 13.1, icon: 'ti-package' },
  { name: 'TikTok Shop', scans: 5890, pct: 12.2, icon: 'ti-brand-tiktok' },
  { name: 'ตัวแทนจำหน่าย', scans: 7090, pct: 14.7, icon: 'ti-truck-delivery' },
]

// Scan decay data (days since first scan vs active %)
export const DECAY_DATA = [
  { day: 1, pct: 100 },
  { day: 3, pct: 78 },
  { day: 7, pct: 62 },
  { day: 14, pct: 48 },
  { day: 21, pct: 38 },
  { day: 30, pct: 29 },
  { day: 45, pct: 21 },
  { day: 60, pct: 16 },
  { day: 90, pct: 11 },
]

// Cohort data
export const COHORT_DATA = [
  { cohort: 'เม.ย. W1', week1: 100, week2: 68, week3: 52, week4: 41, week5: 35, week6: 29 },
  { cohort: 'เม.ย. W2', week1: 100, week2: 72, week3: 55, week4: 44, week5: 37, week6: null },
  { cohort: 'เม.ย. W3', week1: 100, week2: 65, week3: 49, week4: 39, week5: null, week6: null },
  { cohort: 'เม.ย. W4', week1: 100, week2: 70, week3: 53, week4: null, week5: null, week6: null },
  { cohort: 'พ.ค. W1', week1: 100, week2: 74, week3: null, week4: null, week5: null, week6: null },
  { cohort: 'พ.ค. W2', week1: 100, week2: null, week3: null, week4: null, week5: null, week6: null },
]

// Tier distribution for pie/donut charts
export const TIER_DISTRIBUTION = [
  { tier: 'ซอง', scans: 4560, pct: 38.2, color: '#1D9E75' },
  { tier: 'หลอด', scans: 5230, pct: 43.8, color: '#2D7DD2' },
  { tier: 'เซ็ต', scans: 2150, pct: 18.0, color: '#EF9F27' },
]

// RFM segments
export const RFM_SEGMENTS = [
  { segment: 'Heavy (10+ scans)', count: 18, pct: 18, avgScans: 24.5, avgRights: 68 },
  { segment: 'Medium (4-9 scans)', count: 35, pct: 35, avgScans: 6.2, avgRights: 17 },
  { segment: 'Light (1-3 scans)', count: 47, pct: 47, avgScans: 1.8, avgRights: 4 },
]

// Top products by scans
export const TOP_PRODUCTS = PRODUCTS
  .filter((p) => p.scans > 0)
  .sort((a, b) => b.scans - a.scans)
  .slice(0, 10)
  .map((p) => ({ sku: p.sku, name: p.name, tier: p.tier, scans: p.scans, price: p.price }))

// Prize budget usage
export const PRIZE_BUDGET = {
  daily10K: { used: 32, total: 90, label: 'ทองคำ 1 สลึง (รายวัน)' },
  monthly100K: { used: 3, total: 5, label: 'ทองคำ 10 บาท (รายเดือน)' },
  grand1M: { used: 0, total: 1, label: 'เงินสด 1 ล้าน (วันสุดท้าย)' },
}
