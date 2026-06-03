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
  SkuListResponse,
  SkuPerDayResponse,
  SkuTimeseriesResponse,
  BaselineCompareResponse,
  UptimeResponse,
  OutageInfo,
} from './types'

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
    tickets: row.tickets ?? 0,
    expectedTickets: row.tickets ?? 0,
    memberNew: row.member_new ?? 0,
    memberOld: row.member_old ?? 0,
    uniqueUsers: row.unique_users ?? 0,
  }
}

// ════════════════════════════════════════════════════════════════
// Scans — map จาก campaign-report (per-date) + scan-chart (timeseries)
// ════════════════════════════════════════════════════════════════
export async function getScansTotals(from: DateString, to: DateString): Promise<ScansTotalsResponse> {
  const rows = await getCampaignDaily(from, to)
  const days = daysBetween(from, to)
  const success = rows.reduce((sum, r) => sum + r.success, 0)
  const dupSelf = rows.reduce((sum, r) => sum + r.dupSelf, 0)
  const dupOther = rows.reduce((sum, r) => sum + r.dupOther, 0)
  const notFound = rows.reduce((sum, r) => sum + (r.notFound ?? 0), 0)
  const tickets = rows.reduce((sum, r) => sum + r.tickets, 0)
  const uniqueUsers = rows.reduce((sum, r) => sum + r.uniqueUsers, 0)
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
    expectedTickets: tickets,  // campaign-daily currently returns DB tickets; spec tickets match generated rights.
    ticketGap: 0,
    uniqueUsers,
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
// ยังไม่ map (saversureV2 ยังไม่มี endpoint ที่ granularity ตรง)
// → ให้ทีม saversureV2 เพิ่ม หรือ map เพิ่มภายหลัง. ระหว่างนี้ใช้ DATA_SOURCE=mock.
// ════════════════════════════════════════════════════════════════
const TODO = (name: string) => { throw new Error(`api-source: ${name} ยังไม่ได้ map กับ saversureV2 — ดู obsidian/08`) }

export async function getDailyRows(f: DateString, t: DateString): Promise<DailyRow[]> { return getCampaignDaily(f, t) }
export async function getDailyByDate(d: DateString): Promise<DailyRow | null> {
  const rows = await getCampaignDaily(d, d)
  return rows[0] ?? null
}
export async function getTimeOfDay(_f: DateString, _t: DateString): Promise<TimeOfDayResponse> { return TODO('getTimeOfDay') }
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
export async function getEngagement(_f: DateString, _t: DateString): Promise<EngagementResponse> { return TODO('getEngagement') }
export async function getRetention(_d: DateString): Promise<RetentionResponse> { return TODO('getRetention') }
export async function getSkuList(): Promise<SkuListResponse> { return TODO('getSkuList') }
export async function getSkuPerDay(_f: DateString, _t: DateString): Promise<SkuPerDayResponse> { return TODO('getSkuPerDay') }
export async function getSkuTimeseries(_s: string, _f: DateString, _t: DateString): Promise<SkuTimeseriesResponse> { return TODO('getSkuTimeseries') }
export async function getBaselineCompare(_f: DateString, _t: DateString): Promise<BaselineCompareResponse> { return TODO('getBaselineCompare') }
