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

import fs from 'fs'
import path from 'path'

// ─── Config (server-only env — ปลอดภัย ไม่หลุดไป client) ────────────
const BASE = process.env.SAVERSURE_API_BASE_URL ?? 'http://localhost:30400/api/v1'
const CAMPAIGN_ID_ENV = process.env.SAVERSURE_CAMPAIGN_ID ?? ''
const CAMPAIGN_NAME = process.env.SAVERSURE_CAMPAIGN_NAME ?? 'สแกนลุ้นรวย สวยลุ้นล้าน'
const TIMEOUT_MS = 8_000
// heavy analytical endpoints (campaign-report/-daily) run 5-8s on a cold cache;
// give them more headroom so a slow first call isn't canceled (would log 500
// backend-side). Pre-aggregated endpoints stay on the fast 8s default.
const HEAVY_TIMEOUT_MS = 20_000
const ENV_PATH = path.join(process.cwd(), '.env.local')
const CAMPAIGN_START: DateString = '2026-05-16'

// ─── Token cache — อ่านจาก .env.local ตอน runtime (ไม่ต้อง pm2 restart หลัง refresh) ─
let _cachedToken = process.env.SAVERSURE_API_TOKEN ?? ''
let _cachedExp = 0  // Unix epoch seconds

function jwtExp(token: string): number {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).exp ?? 0 }
  catch { return 0 }
}

function parseEnv(txt: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function persistToken(rawEnv: string, token: string) {
  const next = /^SAVERSURE_API_TOKEN=.*$/m.test(rawEnv)
    ? rawEnv.replace(/^SAVERSURE_API_TOKEN=.*$/m, `SAVERSURE_API_TOKEN=${token}`)
    : `${rawEnv.trimEnd()}\nSAVERSURE_API_TOKEN=${token}\n`
  fs.writeFileSync(ENV_PATH, next, 'utf-8')
  _cachedToken = token
  _cachedExp = jwtExp(token)
}

function getToken(): string {
  const now = Math.floor(Date.now() / 1000)
  // token cache ยังใช้ได้ (มีเวลาเหลือ > 60 วินาที) → คืนเลย
  if (_cachedToken && _cachedExp > now + 60) return _cachedToken
  // หมดหรือใกล้หมด → อ่านจาก .env.local ใหม่
  try {
    const raw = fs.readFileSync(ENV_PATH, 'utf-8')
    const m = raw.match(/^SAVERSURE_API_TOKEN=(.+)$/m)
    if (m?.[1]) {
      _cachedToken = m[1].trim()
      _cachedExp = jwtExp(_cachedToken)
    }
  } catch { /* ใช้ค่าเดิม */ }
  return _cachedToken
}

// ─── typed fetch helper — timeout + auth + error เป็นข้อความ ─────────
async function refreshToken(): Promise<string> {
  const raw = fs.readFileSync(ENV_PATH, 'utf-8')
  const env = parseEnv(raw)
  const base = (env.SAVERSURE_API_BASE_URL || BASE).replace(/\/$/, '')
  const email = env.SAVERSURE_LOGIN_EMAIL
  const password = env.SAVERSURE_LOGIN_PASSWORD
  const tenant = env.SAVERSURE_TENANT_ID || '00000000-0000-0000-0000-000000000001'
  if (!email || !password) return ''

  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tenant_id: tenant }),
    cache: 'no-store',
  })
  if (!res.ok) return ''

  const body: any = await res.json().catch(() => ({}))
  const token =
    body?.token ?? body?.access_token ?? body?.accessToken ??
    body?.data?.token ?? body?.data?.access_token ?? body?.data?.accessToken
  if (typeof token !== 'string' || !token) return ''

  persistToken(raw, token)
  return token
}

async function sv<T>(path: string, params: Record<string, string | number | undefined> = {}, timeoutMs: number = TIMEOUT_MS): Promise<T> {
  const url = new URL(BASE.replace(/\/$/, '') + path)
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') url.searchParams.set(k, String(v))

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const request = async (token: string) => fetch(url.toString(), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ctrl.signal,
      cache: 'no-store',
    })

    const res = await request(getToken())
    if (res.status === 401) {
      const freshToken = await refreshToken()
      if (freshToken) {
        const retry = await request(freshToken)
        if (retry.ok) return (await retry.json()) as T
        throw new Error(`saversureV2 ${path} -> HTTP ${retry.status}`)
      }
    }
    if (!res.ok) throw new Error(`saversureV2 ${path} -> HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error(`saversureV2 ${path} -> timeout ${TIMEOUT_MS}ms`)
    throw new Error(`saversureV2 ${path} -> ${e?.message ?? 'fetch failed'}`)
  } finally {
    clearTimeout(timer)
  }
}

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

function campaignDataRange(from: DateString, to: DateString): { from: DateString; to: DateString } | null {
  if (to < CAMPAIGN_START) return null
  return { from: (from < CAMPAIGN_START ? CAMPAIGN_START : from) as DateString, to }
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
  const range = campaignDataRange(from, to)
  if (!range) return []
  const res = await sv<CampaignDailyApiResponse>('/dashboard/campaign-daily', { ...range, ...campaignParams() }, HEAVY_TIMEOUT_MS)
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
    sv<CampaignReport>('/dashboard/campaign-report', { date: to, ...campaignParams() }, HEAVY_TIMEOUT_MS).catch(() => null),
  ])
  const range = campaignDataRange(from, to)
  const days = range ? daysBetween(range.from, range.to) : 0
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
  const r = await sv<CampaignReport>('/dashboard/campaign-report', { date, ...campaignParams() }, HEAVY_TIMEOUT_MS)
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
  const r = await sv<CampaignReport>('/dashboard/campaign-report', { date, ...campaignParams() }, HEAVY_TIMEOUT_MS)
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
      isOngoing: !i.resolved_at,
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

// ─── Time of day — saversureV2 `/dashboard/scans-by-hour` (24 ชม. 0-23, Bangkok,
//     อ่านจาก daily_scan_hour_summary — ไม่แตะ scan_history). รวมเป็น 7 buckets.
interface SvHourRow { hour: number; scans: number; success: number }
export async function getTimeOfDay(from: DateString, to: DateString): Promise<TimeOfDayResponse> {
  const res = await sv<{ data: SvHourRow[] }>('/dashboard/scans-by-hour', { from, to })
  const byHour = new Map((res.data ?? []).map(h => [h.hour, h.scans ?? 0]))
  const hourScans = (h: number): number => byHour.get(h) ?? 0
  const sumRange = (hours: number[]): number => hours.reduce((s, h) => s + hourScans(h), 0)

  const ranges: { range: string; hours: number[] }[] = [
    { range: '00-06', hours: [0, 1, 2, 3, 4, 5] },
    { range: '06-09', hours: [6, 7, 8] },
    { range: '09-12', hours: [9, 10, 11] },
    { range: '12-15', hours: [12, 13, 14] },
    { range: '15-18', hours: [15, 16, 17] },
    { range: '18-21', hours: [18, 19, 20] },
    { range: '21-24', hours: [21, 22, 23] },
  ]
  const allHours = Array.from({ length: 24 }, (_, h) => h)
  const total = sumRange(allHours)
  const buckets = ranges.map(r => {
    const scans = sumRange(r.hours)
    return { range: r.range, scans, pct: total > 0 ? +((scans / total) * 100).toFixed(1) : 0 }
  })
  const peakHours = allHours
    .map(h => ({ hour: `${String(h).padStart(2, '0')}:00`, scans: hourScans(h) }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 3)
    .map((p, i) => ({ rank: (i + 1) as 1 | 2 | 3, hour: p.hour, scans: p.scans }))

  return { from, to, buckets, peakHours }
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

// ─── Engagement — saversureV2 `/dashboard/engagement-distribution` (histogram จริง
//     จาก customer_rfm_snapshots: นับ user ต่อช่วงจำนวนสแกน lifetime + median/avg).
//     max มาจาก `/dashboard/heavy-users` (top scanner lifetime). ทั้งคู่ tenant-wide
//     (snapshot ปัจจุบัน) ไม่ผูก from/to — แต่เป็นเลขจริง ไม่ใช่ approximate.
interface SvEngagement { buckets: { label: string; users: number }[]; median: number; avg: number }
interface SvHeavyUser { user_id: string; scans: number; scans_30d: number; risk_level: string }
export async function getEngagement(from: DateString, to: DateString): Promise<EngagementResponse> {
  const [eng, top] = await Promise.all([
    sv<SvEngagement>('/dashboard/engagement-distribution'),
    sv<{ data: SvHeavyUser[] }>('/dashboard/heavy-users', { limit: 1 }).catch(() => null),
  ])
  // map label "1"/"2-5"/"6-10"/"10+" → "1 scan"/"2-5 scans"/...
  const labelMap: Record<string, string> = { '1': '1 scan', '2-5': '2-5 scans', '6-10': '6-10 scans', '10+': '10+ scans' }
  const rawBuckets = eng.buckets ?? []
  const totalUsers = rawBuckets.reduce((s, b) => s + (b.users ?? 0), 0)
  const buckets = rawBuckets.map(b => ({
    label: labelMap[b.label] ?? b.label,
    users: b.users ?? 0,
    pct: totalUsers > 0 ? +(((b.users ?? 0) / totalUsers) * 100).toFixed(1) : 0,
  }))
  return {
    from, to,
    totalUsers,
    avgScansPerUser: +(eng.avg ?? 0).toFixed(2),
    medianScansPerUser: Math.round(eng.median ?? 0),
    maxScansPerUser: top?.data?.[0]?.scans ?? 0,
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

// ─── SKU per-day — saversureV2 `/dashboard/sku-performance?from=&to=` (รวมราย SKU
//     จาก daily_product_summary ทั้งช่วง — ไม่แตะ scan_history, ไม่ใช่ snapshot วันเดียว)
interface SvSkuPerf { sku: string; name: string; scans: number }
export async function getSkuPerDay(from: DateString, to: DateString): Promise<SkuPerDayResponse> {
  // ดึง full SKU list ก่อน (สำหรับ displayName, perScan/rights)
  const skuList = await getSkuList()
  const skuMap = new Map(skuList.skus.map(s => [s.sku, s]))

  const r = await sv<{ data: SvSkuPerf[] }>('/dashboard/sku-performance', { from, to, limit: 300 })
  const perf = r.data ?? []

  // ถ้า backend ไม่มีข้อมูลในช่วงนี้ → fallback คืน SKU list พร้อม scans=0
  const rows: SkuRow[] = perf.length > 0
    ? perf.map((m) => {
        const master = skuMap.get(m.sku)
        const perScan = master?.rightsPerScan ?? 1
        const scans = m.scans ?? 0
        return {
          sku: m.sku,
          displayName: master?.displayName ?? stripProductSuffix(m.name ?? m.sku),
          perScan,
          scans,
          specTickets: scans * perScan,
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

// ─── SKU timeseries — saversureV2 `/dashboard/sku-timeseries?sku=&from=&to=`
//     (รายวันจริงจาก daily_product_summary — ไม่ใช่จุดเดียว)
interface SvSkuTsRow { date: DateString; scans: number }
export async function getSkuTimeseries(sku: string, from: DateString, to: DateString): Promise<SkuTimeseriesResponse> {
  // perScan + displayName จาก SKU master
  const skuList = await getSkuList()
  const master = skuList.skus.find(s => s.sku === sku)
  const perScan = master?.rightsPerScan ?? 1

  const r = await sv<{ data: SvSkuTsRow[] }>('/dashboard/sku-timeseries', { sku, from, to })
  const points = (r.data ?? []).map(p => ({
    date: p.date,
    scans: p.scans ?? 0,
    specTickets: (p.scans ?? 0) * perScan,
    uniqueUsers: 0, // sku-timeseries ไม่คืน unique users ราย SKU ราย วัน
  }))
  return {
    sku,
    displayName: master?.displayName ?? sku,
    perScan,
    from, to,
    points,
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

// ════════════════════════════════════════════════════════════════
// SKU Co-Scan Pairs — saversureV2 `/dashboard/sku-co-scan`
// Source: analytics_product_affinities (pre-computed, no scan_history)
// ════════════════════════════════════════════════════════════════
export interface CoScanPair {
  rank: number
  productA: string
  productB: string
  skuA: string
  skuB: string
  bothScanned: number
}

export async function getCoScanPairs(limit = 10): Promise<{ pairs: CoScanPair[] }> {
  const r = await sv<{ pairs: Array<{ sku_a: string; name_a: string; sku_b: string; name_b: string; both_users: number }> }>(
    '/dashboard/sku-co-scan', { limit })
  const pairs: CoScanPair[] = (r.pairs ?? []).map((p, i) => ({
    rank: i + 1,
    productA: stripProductSuffix(p.name_a || p.sku_a),
    productB: stripProductSuffix(p.name_b || p.sku_b),
    skuA: p.sku_a,
    skuB: p.sku_b,
    bothScanned: p.both_users,
  }))
  return { pairs }
}

// ════════════════════════════════════════════════════════════════
// SKU Rank History — compute daily rank from sku-performance per day
// Calls `/dashboard/sku-timeseries` for each top SKU within the range
// to get per-day scans, then rank per day.
// ════════════════════════════════════════════════════════════════
export interface SkuRankDay {
  date: DateString
  rank: number
  scans: number
}

export interface SkuRankHistoryRow {
  sku: string
  displayName: string
  days: SkuRankDay[]
  trend: 'up' | 'down' | 'flat' | 'mixed'
}

export async function getSkuRankHistory(from: DateString, to: DateString, top = 10): Promise<{ rows: SkuRankHistoryRow[] }> {
  const perf = await getSkuPerDay(from, to)
  const topSkus = perf.rows.slice(0, top)
  if (topSkus.length === 0) return { rows: [] }

  const tsResults = await Promise.all(
    topSkus.map(s => sv<{ data: Array<{ date: string; scans: number }> }>(
      '/dashboard/sku-timeseries', { sku: s.sku, from, to }
    ).then(r => ({ sku: s.sku, displayName: s.displayName, points: r.data ?? [] })))
  )

  const allDates = new Set<string>()
  for (const ts of tsResults) for (const p of ts.points) allDates.add(p.date)
  const sortedDates = Array.from(allDates).sort()

  const skuDayScans = new Map<string, Map<string, number>>()
  for (const ts of tsResults) {
    const dayMap = new Map<string, number>()
    for (const p of ts.points) dayMap.set(p.date, p.scans)
    skuDayScans.set(ts.sku, dayMap)
  }

  const rows: SkuRankHistoryRow[] = tsResults.map(ts => {
    const days: SkuRankDay[] = sortedDates.map(date => {
      const entries = topSkus.map(s => ({
        sku: s.sku,
        scans: skuDayScans.get(s.sku)?.get(date) ?? 0,
      }))
      entries.sort((a, b) => b.scans - a.scans)
      const rank = entries.findIndex(e => e.sku === ts.sku) + 1
      return { date, rank: rank || topSkus.length, scans: skuDayScans.get(ts.sku)?.get(date) ?? 0 }
    })

    const ranks = days.map(d => d.rank)
    let trend: 'up' | 'down' | 'flat' | 'mixed' = 'flat'
    if (ranks.length >= 2) {
      const first = ranks[0], last = ranks[ranks.length - 1]
      if (last < first) trend = 'up'
      else if (last > first) trend = 'down'
      else {
        const allSame = ranks.every(r => r === first)
        trend = allSame ? 'flat' : 'mixed'
      }
    }

    return { sku: ts.sku, displayName: ts.displayName, days, trend }
  })

  return { rows }
}
