// ════════════════════════════════════════════════════════════════
// 🌐 API Data Source — เชื่อม dashboard กับ API ของ saversureV2 (Go/Gin)
// ════════════════════════════════════════════════════════════════
//
// สถาปัตยกรรม: dashboard เป็นแค่ "consumer" เรียก HTTP GET ไป saversureV2
//   - ห้ามเข้า DB saversure โดยตรง (คุยผ่าน API นี้เท่านั้น)
//   - ห้ามแตะโค้ด/โฟลเดอร์ saversureV2 (เรียก endpoint อย่างเดียว)
//
// เปิดใช้: ตั้ง env แล้ว `DATA_SOURCE=api`
//   SAVERSURE_API_BASE_URL=http://localhost:30400/api/v1   (port 30400, base /api/v1)
//   SAVERSURE_API_TOKEN=<JWT bearer token>                 (จาก backend — มี tenant_id ใน claim)
//   SAVERSURE_CAMPAIGN_ID=<uuid>            (ถ้าไม่ใส่ จะ lookup จากชื่อแคมเปญอัตโนมัติ)
//   SAVERSURE_CAMPAIGN_NAME=สแกนลุ้นรวย สวยลุ้นล้าน
//
// ⚠️ ข้อมูล saversureV2 พูดคนละ shape กับ dashboard → ไฟล์นี้คือ "mapping layer" ที่แปลงให้
//    (อ้างอิงผลวิเคราะห์: obsidian/08-saversureV2-API-analysis.md)
//
// 📌 endpoint ที่ map แล้ว: getScansTotals, getScansTimeseries, getProvinces,
//    getHeavyUsers, getUptime. ที่เหลือยัง NOT_IMPLEMENTED (saversureV2 ยังไม่มี endpoint
//    ที่ตรง granularity — ต้องให้ทีม saversureV2 เพิ่ม หรือ map เพิ่มภายหลัง).
// ════════════════════════════════════════════════════════════════

import type {
  DateString,
  DailyRow,
  ScansTotalsResponse,
  ScansTimeseriesResponse,
  TimeseriesPoint,
  TimeOfDayResponse,
  MembersDailyResponse,
  HeavyUsersResponse,
  HeavyUser,
  EngagementResponse,
  ProvincesResponse,
  ProvinceRow,
  RetentionResponse,
  SegmentsResponse,
  SkuMaster,
  SkuRow,
  SkuListResponse,
  SkuPerDayResponse,
  SkuTimeseriesResponse,
  BaselineCompareResponse,
  BaselineCompareRow,
  UptimeResponse,
  OutageInfo,
  PrintSlipsResponse,
  CustomerSearchResponse,
} from './types'
import { scansToSpecRights } from '@/lib/rights-multiplier'
import { matchExcluded } from '@/config/employee-exclude'
import { stripProductSuffix } from '@/lib/utils'

// ─── Config (server-only env — ปลอดภัย ไม่หลุดไป client) ────────────
const BASE = process.env.SAVERSURE_API_BASE_URL ?? 'http://localhost:30400/api/v1'
const TOKEN = process.env.SAVERSURE_API_TOKEN ?? ''
const CAMPAIGN_ID_ENV = process.env.SAVERSURE_CAMPAIGN_ID ?? ''
const CAMPAIGN_NAME = process.env.SAVERSURE_CAMPAIGN_NAME ?? 'สแกนลุ้นรวย สวยลุ้นล้าน'
const TIMEOUT_MS = 8_000

// ─── typed fetch helper — timeout + auth + error เป็นข้อความ ─────────
async function sv<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(BASE.replace(/\/$/, '') + path)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url.toString(), {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      signal: ctrl.signal,
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`saversureV2 ${path} → HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error(`saversureV2 ${path} → timeout ${TIMEOUT_MS}ms`)
    throw new Error(`saversureV2 ${path} → ${e?.message ?? 'fetch failed'}`)
  } finally {
    clearTimeout(timer)
  }
}

// ─── เลือกแคมเปญ: campaign-report รับ campaign_id หรือ campaign_name (ILIKE) ได้ตรงๆ
//     ไม่ต้อง lookup /public/lucky-draw (ซึ่งต้องการ tenant param เพิ่ม)
function campaignParams(): Record<string, string | undefined> {
  return CAMPAIGN_ID_ENV
    ? { campaign_id: CAMPAIGN_ID_ENV }
    : { campaign_name: CAMPAIGN_NAME }
}

// ─── shapes ของ saversureV2 (เท่าที่ map ใช้) ───────────────────────
interface CampaignReport {
  section_01_kpi_strip: { tickets: number; users: number; sku_active: number; tix_per_user: number; sku_total: number }
  section_02_scan_funnel: { success: number; scans_7d: number; scans_30d: number; duplicate_self: number; duplicate_other: number; total: number; success_rate_pct: number }
  section_19_top_provinces_full: { rank: number; province: string; users: number; tickets: number }[]
  section_20_top_scanners: { rank: number; user_hash: string; name_masked: string; phone_masked: string; province: string; scans_today: number; last_scan_at: string }[]
}
interface CampaignDailyApiRow {
  date: DateString
  success: number
  duplicate_self: number
  duplicate_other: number
  not_found: number
  tickets: number
  unique_users: number
  member_new: number
  member_old: number
}
interface CampaignDailyApiResponse {
  from: DateString
  to: DateString
  data: CampaignDailyApiRow[]
}
interface ScanChart { data: { label: string; count: number }[]; group_by: string }
interface MonitorIncidents { data: { check_name: string; check_target: string; started_at: string; resolved_at: string | null; duration_seconds: number | null; initial_error: string }[]; total: number }

// ─── helpers ────────────────────────────────────────────────────────
function daysBetween(from: DateString, to: DateString): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1
}
// scan-chart label เป็น "MM/DD" → เติมปีจาก `from` ให้เป็น YYYY-MM-DD
function labelToDate(label: string, yearRef: DateString): DateString {
  const [mm, dd] = label.split('/')
  return `${yearRef.slice(0, 4)}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

const WEEKDAYS_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

function weekdayTH(date: DateString): string {
  const d = new Date(`${date}T00:00:00+07:00`)
  return WEEKDAYS_TH[d.getDay()] ?? ''
}

async function getCampaignDaily(from: DateString, to: DateString): Promise<DailyRow[]> {
  const res = await sv<CampaignDailyApiResponse>('/dashboard/campaign-daily', { from, to, ...campaignParams() })
  return (res.data ?? []).map(mapCampaignDailyRow)
}

function mapCampaignDailyRow(row: CampaignDailyApiRow): DailyRow {
  const success = row.success ?? 0
  const dupSelf = row.duplicate_self ?? 0
  const dupOther = row.duplicate_other ?? 0
  const notFound = row.not_found ?? 0
  const totalAttempts = success + dupSelf + dupOther + notFound
  return {
    date: row.date,
    weekday: weekdayTH(row.date),
    success,
    dupSelf,
    dupOther,
    notFound,
    totalAttempts,
    successRate: totalAttempts > 0 ? +((success / totalAttempts) * 100).toFixed(2) : 0,
    tickets: row.tickets ?? 0,                          // DB ออกจริง (มี bug 1:1)
    expectedTickets: scansToSpecRights(success),         // สิทธิ์ตามสเปก = สแกน × สิทธิ์ต่อสินค้า (blended ×1.36)
    memberNew: row.member_new ?? 0,
    memberOld: row.member_old ?? 0,
    uniqueUsers: row.unique_users ?? 0,
  }
}

// ════════════════════════════════════════════════════════════════
// Scans — map จาก campaign-report (per-date) + scan-chart (timeseries)
// ════════════════════════════════════════════════════════════════
export async function getScansTotals(from: DateString, to: DateString): Promise<ScansTotalsResponse> {
  // ยิงขนาน: campaign-daily (รายวัน) + campaign-report (distinct users ณ วัน to)
  const [rows, report] = await Promise.all([
    getCampaignDaily(from, to),
    // best-effort — ถ้า campaign-report ล่ม ก็ยังคืน totals ได้ (distinctUsers = undefined)
    sv<CampaignReport>('/dashboard/campaign-report', { date: to, ...campaignParams() }).catch(() => null),
  ])
  const days = daysBetween(from, to)
  const success = rows.reduce((sum, r) => sum + r.success, 0)
  const dupSelf = rows.reduce((sum, r) => sum + r.dupSelf, 0)
  const dupOther = rows.reduce((sum, r) => sum + r.dupOther, 0)
  const notFound = rows.reduce((sum, r) => sum + (r.notFound ?? 0), 0)
  const tickets = rows.reduce((sum, r) => sum + r.tickets, 0)               // DB ออกจริง (1:1 bug)
  const expectedTickets = rows.reduce((sum, r) => sum + r.expectedTickets, 0) // สิทธิ์ตามสเปก (สแกน × สิทธิ์ต่อสินค้า)
  const uniqueUsers = rows.reduce((sum, r) => sum + r.uniqueUsers, 0)        // ⚠️ sum-of-daily (นับซ้ำคนเดิมหลายวัน)
  const distinctUsers = report?.section_01_kpi_strip?.users                  // ผู้เข้าร่วมจริง (distinct ทั้งแคมเปญ)
  const totalAttempts = success + dupSelf + dupOther + notFound
  return {
    from, to, days,
    success,
    dupSelf,
    dupOther,
    notFound,
    totalAttempts,
    successRate: totalAttempts > 0 ? +((success / totalAttempts) * 100).toFixed(2) : 0,
    tickets,
    expectedTickets,
    ticketGap: expectedTickets - tickets,  // สิทธิ์ที่ DB ขาดไป (สเปก − DB ออกจริง)
    uniqueUsers,
    distinctUsers,
    avgScansPerDay: days > 0 ? Math.round(success / days) : success,
  }
}

export async function getScansTimeseries(from: DateString, to: DateString): Promise<ScansTimeseriesResponse> {
  const rows = await getCampaignDaily(from, to)
  const points: TimeseriesPoint[] = rows.map(d => ({
    date: d.date,
    success: d.success,
    tickets: d.tickets,
    expectedTickets: d.expectedTickets,
    uniqueUsers: d.uniqueUsers,
  }))
  return { from, to, points }
}

// ════════════════════════════════════════════════════════════════
// Customers — provinces + heavy users จาก campaign-report
// ════════════════════════════════════════════════════════════════
export async function getProvinces(date: DateString, limit = 10): Promise<ProvincesResponse> {
  const r = await sv<CampaignReport>('/dashboard/campaign-report', { date, ...campaignParams() })
  const provinces: ProvinceRow[] = r.section_19_top_provinces_full.slice(0, limit).map(p => ({
    rank: p.rank,
    name: p.province,
    scans: p.tickets,            // saversureV2 ให้ tickets ต่อจังหวัด (ใกล้เคียง scans)
    users: p.users,
    avgPerUser: p.users > 0 ? +(p.tickets / p.users).toFixed(2) : 0,
    flag: p.users > 0 && p.tickets / p.users > 5 ? 'watch' : 'normal',
  }))
  return { date, provinces }
}

export async function getHeavyUsers(date: DateString, limit = 10): Promise<HeavyUsersResponse> {
  const r = await sv<CampaignReport>('/dashboard/campaign-report', { date, ...campaignParams() })
  const users: HeavyUser[] = r.section_20_top_scanners.slice(0, limit).map(u => ({
    rank: u.rank,
    userHash: u.user_hash,
    province: u.province,
    scans: u.scans_today,
    skuDiversity: 0, // saversureV2 top-scanners ไม่ให้ sku diversity — ต้อง endpoint เพิ่ม
    flag: 'normal',
  }))
  return { date, users }
}

// ════════════════════════════════════════════════════════════════
// System — uptime/outage จาก monitor/incidents
// ════════════════════════════════════════════════════════════════
export async function getUptime(from: DateString, to: DateString): Promise<UptimeResponse> {
  const inc = await sv<MonitorIncidents>('/monitor/incidents', { limit: 200 })
  const outages: OutageInfo[] = inc.data
    .filter(i => i.started_at >= from && i.started_at <= `${to}T23:59:59Z`)
    .map(i => ({
      start: i.started_at,
      end: i.resolved_at ?? i.started_at,
      durationHours: i.duration_seconds ? +(i.duration_seconds / 3600).toFixed(2) : 0,
      cause: i.initial_error || i.check_name,
    }))
  const totalHours = daysBetween(from, to) * 24
  const outageHours = outages.reduce((s, o) => s + o.durationHours, 0)
  return {
    from, to, totalHours, outageHours,
    uptimePct: totalHours > 0 ? +(((totalHours - outageHours) / totalHours) * 100).toFixed(2) : 100,
    outages,
  }
}

// ════════════════════════════════════════════════════════════════
// Derived endpoints — ใช้ saversureV2 endpoints ที่มีอยู่ + transform
// ════════════════════════════════════════════════════════════════

export async function getDailyRows(f: DateString, t: DateString): Promise<DailyRow[]> { return getCampaignDaily(f, t) }
export async function getDailyByDate(d: DateString): Promise<DailyRow | null> {
  const rows = await getCampaignDaily(d, d)
  return rows[0] ?? null
}

// ─── Time of day — saversureV2 ยังไม่มี hour-level breakdown
//     คืน 7 buckets ว่าง พร้อม note ให้ component ตัดสินใจ render
//     (ไม่ throw error — ดีกว่า fake distribution)
export async function getTimeOfDay(from: DateString, to: DateString): Promise<TimeOfDayResponse> {
  return {
    from, to,
    buckets: [
      { range: '00-06', scans: 0, pct: 0 },
      { range: '06-09', scans: 0, pct: 0 },
      { range: '09-12', scans: 0, pct: 0 },
      { range: '12-15', scans: 0, pct: 0 },
      { range: '15-18', scans: 0, pct: 0 },
      { range: '18-21', scans: 0, pct: 0 },
      { range: '21-24', scans: 0, pct: 0 },
    ],
    peakHours: [],
  }
}

export async function getMembersDaily(f: DateString, t: DateString): Promise<MembersDailyResponse> {
  const daily = await getCampaignDaily(f, t)
  const rows = daily.map(d => ({
    date: d.date,
    weekday: d.weekday,
    memberNew: d.memberNew,
    memberOld: d.memberOld,
    total: d.memberNew + d.memberOld,
    signedNotScanned: d.signedNotScanned,
    activationRate: d.memberNew > 0 && d.signedNotScanned != null
      ? +(((d.memberNew - d.signedNotScanned) / d.memberNew) * 100).toFixed(2)
      : undefined,
    memberTotal: d.memberTotal,
  }))
  const memberNew = rows.reduce((sum, r) => sum + r.memberNew, 0)
  const memberOld = rows.reduce((sum, r) => sum + r.memberOld, 0)
  return {
    from: f,
    to: t,
    rows,
    totals: {
      memberNew,
      memberOld,
      avgNewPerDay: rows.length > 0 ? Math.round(memberNew / rows.length) : 0,
    },
  }
}

// ─── Engagement — derive จาก campaign-report (กำหนดจำนวน users + top scanners)
//     bucket 4 ระดับ: 1 / 2-5 / 6-10 / 10+
//     ใช้ section_01.users (total) + section_20 (top 20 scans/day) แล้ว approximate
export async function getEngagement(from: DateString, to: DateString): Promise<EngagementResponse> {
  // ดึง report ของวันสุดท้าย (snapshot สะสม)
  const r = await sv<CampaignReport>('/dashboard/campaign-report', { date: to, ...campaignParams() })
  const totalUsers = r.section_01_kpi_strip?.users ?? 0
  const tixPerUser = r.section_01_kpi_strip?.tix_per_user ?? 0
  const topScanners = r.section_20_top_scanners ?? []

  // Heavy = scans >= 10 → ใช้จำนวน user ใน top_scanners ที่ scans_today >= 10
  const heavy = topScanners.filter(u => u.scans_today >= 10).length
  // 6-10 = approximation from top scanners 6-9
  const high = topScanners.filter(u => u.scans_today >= 6 && u.scans_today < 10).length
  // ส่วนเหลือ split ระหว่าง 1 vs 2-5 ตาม tixPerUser
  // ถ้า avg = ~3 → ส่วนใหญ่อยู่ใน 2-5
  const remaining = Math.max(0, totalUsers - heavy - high)
  const mid = Math.round(remaining * (tixPerUser >= 2 ? 0.65 : 0.35))
  const low = remaining - mid

  const buckets = [
    { label: '1 scan', users: low, pct: totalUsers > 0 ? +((low / totalUsers) * 100).toFixed(1) : 0 },
    { label: '2-5 scans', users: mid, pct: totalUsers > 0 ? +((mid / totalUsers) * 100).toFixed(1) : 0 },
    { label: '6-10 scans', users: high, pct: totalUsers > 0 ? +((high / totalUsers) * 100).toFixed(1) : 0 },
    { label: '10+ scans', users: heavy, pct: totalUsers > 0 ? +((heavy / totalUsers) * 100).toFixed(1) : 0 },
  ]

  return {
    from, to,
    totalUsers,
    avgScansPerUser: +tixPerUser.toFixed(2),
    medianScansPerUser: Math.max(1, Math.round(tixPerUser * 0.7)), // approx — ไม่มี median จาก backend
    maxScansPerUser: topScanners[0]?.scans_today ?? 0,
    buckets,
  }
}

// ─── Retention — derive จาก campaign-daily (memberNew = firstTime, memberOld = returning)
export async function getRetention(date: DateString): Promise<RetentionResponse> {
  const row = await getDailyByDate(date)
  if (!row) {
    return { date, firstTime: 0, returning: 0, total: 0, firstTimePct: 0, returningPct: 0 }
  }
  const firstTime = row.memberNew
  const returning = row.memberOld
  const total = firstTime + returning
  return {
    date,
    firstTime,
    returning,
    total,
    firstTimePct: total > 0 ? +((firstTime / total) * 100).toFixed(1) : 0,
    returningPct: total > 0 ? +((returning / total) * 100).toFixed(1) : 0,
  }
}

// ─── CRM Segments — saversureV2 /crm/segments (Loyal Scanners, Champions, ...) ─
export async function getSegments(): Promise<SegmentsResponse> {
  const res = await sv<{ data: any[] }>('/crm/segments')
  const segments = (res.data ?? []).map((s: any) => ({
    name: s.name ?? '',
    count: s.cached_count ?? 0,
    description: s.description ?? undefined,
  }))
  return { segments }
}

export async function getSkuList(): Promise<SkuListResponse> {
  const res = await sv<{ data: any[] }>('/products', { limit: 200 })
  const skus: SkuMaster[] = (res.data ?? []).map((p: any) => ({
    sku: p.sku ?? p.id,
    displayName: p.name,
    fullName: p.official_name ?? undefined,
    size: p.size_tier ?? undefined,
    price: p.price ?? 0,
    pointsPerScan: p.points_per_scan ?? 0,
    rightsPerScan: p.rights_per_scan ?? p.tickets_per_scan ?? 1, // /products ยังไม่คืน field นี้ → default 1 (ขอ backend เพิ่ม)
  }))
  return { skus }
}

// ─── SKU per-day — derive จาก campaign-report section_16_sku_daily_matrix (ของวันสุดท้าย)
//     คืน rows ของ SKU ล่าสุด — ไม่ใช่ per-day breakdown จริงๆ แต่ใช้ได้สำหรับ Top SKU table
export async function getSkuPerDay(from: DateString, to: DateString): Promise<SkuPerDayResponse> {
  // ดึง full SKU list ก่อน (สำหรับ displayName, perScan)
  const skuList = await getSkuList()
  const skuMap = new Map(skuList.skus.map(s => [s.sku, s]))

  // ดึง section_16 ของวันสุดท้าย
  const r = await sv<CampaignReport & { section_16_sku_daily_matrix?: any[] }>(
    '/dashboard/campaign-report',
    { date: to, ...campaignParams() }
  )
  const matrix = r.section_16_sku_daily_matrix ?? []

  // ถ้า saversureV2 ไม่คืน section_16 → fallback คืน SKU list พร้อม scans=0
  const rows: SkuRow[] = matrix.length > 0
    ? matrix.map((m: any) => {
        const master = skuMap.get(m.sku)
        const perScan = master?.rightsPerScan ?? 1
        const scans = m.scans ?? 0
        return {
          sku: m.sku,
          displayName: master?.displayName ?? m.sku,
          perScan,
          scans,
          specTickets: scans * perScan,
          uniqueUsers: m.users ?? undefined,
          sharePct: 0, // จะคำนวณข้างล่าง
        }
      })
    : skuList.skus.map(s => ({
        sku: s.sku,
        displayName: s.displayName,
        perScan: s.rightsPerScan,
        scans: 0,
        specTickets: 0,
        sharePct: 0,
      }))

  // คำนวณ sharePct + activeSkus + deadSkus
  const totalSpec = rows.reduce((sum, r) => sum + r.specTickets, 0)
  rows.forEach(r => { r.sharePct = totalSpec > 0 ? +((r.specTickets / totalSpec) * 100).toFixed(2) : 0 })
  rows.sort((a, b) => b.specTickets - a.specTickets)
  const activeSkus = rows.filter(r => r.scans > 0).length
  const deadSkus = rows.length - activeSkus

  return {
    from, to,
    total: {
      scans: rows.reduce((sum, r) => sum + r.scans, 0),
      specTickets: totalSpec,
      activeSkus,
      deadSkus,
    },
    rows,
  }
}

// ─── SKU timeseries — saversureV2 ยังไม่มี per-SKU daily endpoint
//     คืน 1 จุด (วันสุดท้าย) จาก section_16 ที่มีอยู่
export async function getSkuTimeseries(sku: string, from: DateString, to: DateString): Promise<SkuTimeseriesResponse> {
  const perDay = await getSkuPerDay(from, to)
  const row = perDay.rows.find(r => r.sku === sku)
  if (!row) {
    return {
      sku,
      displayName: sku,
      perScan: 1,
      from, to,
      points: [],
    }
  }
  // 1 จุด ณ วันสุดท้าย — เมื่อ saversureV2 มี per-SKU timeseries จริงจะแก้ทีหลัง
  return {
    sku: row.sku,
    displayName: row.displayName,
    perScan: row.perScan,
    from, to,
    points: [{
      date: to,
      scans: row.scans,
      specTickets: row.specTickets,
      uniqueUsers: row.uniqueUsers ?? 0,
    }],
  }
}

// ─── Baseline compare — campaign เริ่ม 16 พ.ค. ไม่มีข้อมูล มี.ค./เม.ย. ใน saversureV2
//     คืน rows ของ พ.ค. จาก campaign-daily + mar/apr = 0 (component ต้อง handle)
export async function getBaselineCompare(from: DateString, to: DateString): Promise<BaselineCompareResponse> {
  const daily = await getCampaignDaily(from, to)
  const rows: BaselineCompareRow[] = daily.map(d => ({
    date: d.date,
    weekday: d.weekday,
    marScans: 0,                                // ไม่มีข้อมูลก่อนแคมเปญ
    marWeekday: '',
    aprScans: 0,                                // ไม่มีข้อมูลก่อนแคมเปญ
    aprWeekday: '',
    mayScans: d.success,
    mayWeekday: d.weekday,
    deltaMar: 0,
    deltaApr: 0,
  }))
  const mayScans = rows.reduce((s, r) => s + r.mayScans, 0)
  return {
    from, to,
    rows,
    totals: {
      marScans: 0,
      aprScans: 0,
      mayScans,
      deltaMar: 0,
      deltaApr: 0,
    },
  }
}

// ════════════════════════════════════════════════════════════════
// Print Slips (จับฉลาก: 1 สิทธิ์ = 1 ใบ)
// ════════════════════════════════════════════════════════════════
// 🔴 กฎ realtime safety: dashboard ห้าม page /scan-history ดิบ (HOT write-table
//    ที่ลูกค้าสแกน QR สดอยู่) → ต้องรอ backend ทำ endpoint สำเร็จรูปที่อ่านจาก rollup
//    + ขยายตาม rights (1 right = 1 row) + cache + cursor pagination
//    (ดู obsidian/18-API-Inventory-and-PrintList-Match)
//
// ✅ saversureV2 ship `GET /dashboard/print-slips` แล้ว (อ่าน scan_history rollup,
//    expand-by-rights, bound ด้วย campaign + [from,to) + limit — ไม่ page ดิบ).
//    Backend คืน { total, rows:[{scanner_name, scanner_phone, legacy_qr_code_serial,
//    product_name, product_sku}] } → map เป็น PrintSlip shape ของ dashboard ตรงนี้.
//    ถ้า backend ยังไม่ deploy/unreachable → sv() throw → route fallback เป็น mock preview.
export async function getPrintSlips(from: DateString, to: DateString, limit = 5000): Promise<PrintSlipsResponse> {
  const r = await sv<{
    total: number
    rows: Array<{
      scanner_name: string
      scanner_phone: string
      legacy_qr_code_serial: string
      product_name: string
      product_sku: string
    }>
  }>('/dashboard/print-slips', { ...campaignParams(), from, to, limit })
  const rows = r.rows ?? []
  // 🚫 ตัดพนักงาน (ทีมจุฬาเฮิร์บ) ออก — ไม่มีสิทธิ์เข้าร่วมจับฉลาก (ดู config/employee-exclude)
  const excluded = new Set<string>()
  const kept = rows.filter((row) => {
    const match = matchExcluded(row.scanner_name, row.scanner_phone)
    if (match) {
      excluded.add(match)
      return false
    }
    return true
  })
  const removed = rows.length - kept.length
  return {
    from,
    to,
    total: Math.max(0, r.total - removed), // หักจำนวนที่ตัดออกจาก total เท่าที่นับได้ในชุดนี้
    slips: kept.map((row) => ({
      name: row.scanner_name ?? '',
      phone: row.scanner_phone ?? '',
      scanCode: row.legacy_qr_code_serial ?? '',
      productName: stripProductSuffix(row.product_name ?? ''),
      productSku: row.product_sku ?? '',
    })),
    excludedNames: Array.from(excluded).sort((a, b) => a.localeCompare(b, 'th')),
    meta: { source: 'api' },
  }
}

// ─── ค้นหาลูกค้า (หน้า Operation: หาผู้ได้รางวัลมาบันทึก) ───────────────
//     GET /customers/search?q= — ค้น users (ชื่อ/นามสกุล/เบอร์/email, ILIKE) คืนเฉพาะที่ตรง
//     เบา · read-only · ไม่แตะ scan_history → ปลอดภัยต่อ prod (realtime-safety)
interface SvUserSearch {
  id?: string
  email?: string
  phone?: string
  display_name?: string
  first_name?: string
  last_name?: string
}
export async function searchCustomers(q: string): Promise<CustomerSearchResponse> {
  const query = (q ?? '').trim()
  if (query.length < 2) return { q: query, results: [] }
  const r = await sv<{ data: SvUserSearch[] }>('/customers/search', { q: query })
  const results = (r.data ?? [])
    .map((u) => ({
      id: String(u.id ?? ''),
      name: (u.display_name?.trim() || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || '').trim(),
      phone: u.phone ?? '',
    }))
    .filter((c) => c.name || c.phone)
  return { q: query, results }
}
