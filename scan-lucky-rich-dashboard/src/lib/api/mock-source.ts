// ════════════════════════════════════════════════════════════════
// 🎭 MOCK Data Source — wraps existing static data files
// Reads from daily-update-data.ts + per-sku-daily.ts + products-real.ts
// ════════════════════════════════════════════════════════════════

import { DAILY_ENTRIES } from '@/lib/daily-update-data'
import { PER_SKU_DAILY, DAY_KEYS, type DayKey } from '@/lib/per-sku-daily'
import { PRODUCTS_MASTER } from '@/config/products-real'

import type {
  DateString,
  DailyRow,
  ScansTotalsResponse,
  ScansTimeseriesResponse,
  TimeOfDayResponse,
  MembersDailyResponse,
  HeavyUsersResponse,
  EngagementResponse,
  ProvincesResponse,
  RetentionResponse,
  SkuListResponse,
  SkuPerDayResponse,
  SkuTimeseriesResponse,
  BaselineCompareResponse,
  UptimeResponse,
} from './types'

// ─── Helpers ───────────────────────────────────────────────────────
function entriesInRange(from: DateString, to: DateString) {
  return DAILY_ENTRIES.filter(d => d.date >= from && d.date <= to)
}

function dateToDayKey(date: DateString): DayKey {
  return date.split('-')[2] as DayKey
}

const skuPerScan = new Map<string, number>()
const skuName = new Map<string, string>()
for (const p of PRODUCTS_MASTER) {
  skuPerScan.set(p.sku, p.rightsPerScan)
  skuName.set(p.sku, p.displayName.replace(/\s*\([^)]+\)$/, ''))
}

// ════════════════════════════════════════════════════════════════
// Daily
// ════════════════════════════════════════════════════════════════
export async function getDailyRows(from: DateString, to: DateString): Promise<DailyRow[]> {
  return entriesInRange(from, to).map(e => ({
    date: e.date,
    weekday: e.weekday,
    success: e.success,
    dupSelf: e.dupSelf,
    dupOther: e.dupOther,
    notFound: e.notFound,
    totalAttempts: e.success + e.dupSelf + e.dupOther + e.notFound,
    successRate: e.successRate,
    tickets: e.tickets,
    expectedTickets: e.expectedTickets ?? e.tickets,
    memberNew: e.memberNew ?? e.newSignup,
    memberOld: e.memberOld ?? (e.uniqueUsers - e.newScanned),
    memberTotal: e.memberTotal,
    uniqueUsers: e.uniqueUsers,
    signedNotScanned: e.signedNotScanned,
    outage: e.outage,
  }))
}

export async function getDailyByDate(date: DateString): Promise<DailyRow | null> {
  const rows = await getDailyRows(date, date)
  return rows[0] ?? null
}

// ════════════════════════════════════════════════════════════════
// Scans
// ════════════════════════════════════════════════════════════════
export async function getScansTotals(from: DateString, to: DateString): Promise<ScansTotalsResponse> {
  const rows = await getDailyRows(from, to)
  const success = rows.reduce((s, r) => s + r.success, 0)
  const dupSelf = rows.reduce((s, r) => s + r.dupSelf, 0)
  const dupOther = rows.reduce((s, r) => s + r.dupOther, 0)
  const notFound = rows.reduce((s, r) => s + (r.notFound ?? 0), 0)
  const totalAttempts = success + dupSelf + dupOther + notFound
  const tickets = rows.reduce((s, r) => s + r.tickets, 0)
  const expectedTickets = rows.reduce((s, r) => s + r.expectedTickets, 0)
  const uniqueUsersSum = rows.reduce((s, r) => s + r.uniqueUsers, 0)

  return {
    from, to, days: rows.length,
    success, dupSelf, dupOther, notFound, totalAttempts,
    successRate: totalAttempts ? (success / totalAttempts) * 100 : 0,
    tickets, expectedTickets,
    ticketGap: expectedTickets - tickets,
    uniqueUsers: uniqueUsersSum,
    avgScansPerDay: rows.length ? success / rows.length : 0,
  }
}

export async function getScansTimeseries(from: DateString, to: DateString): Promise<ScansTimeseriesResponse> {
  const rows = await getDailyRows(from, to)
  return {
    from, to,
    points: rows.map(r => ({
      date: r.date,
      success: r.success,
      tickets: r.tickets,
      expectedTickets: r.expectedTickets,
      uniqueUsers: r.uniqueUsers,
    })),
  }
}

export async function getTimeOfDay(from: DateString, to: DateString): Promise<TimeOfDayResponse> {
  // Normalize to fixed 7 buckets (same logic as TimeOfDayChart component)
  const BUCKETS = [
    { label: '00-06', from: 0, to: 6 },
    { label: '06-09', from: 6, to: 9 },
    { label: '09-12', from: 9, to: 12 },
    { label: '12-15', from: 12, to: 15 },
    { label: '15-18', from: 15, to: 18 },
    { label: '18-21', from: 18, to: 21 },
    { label: '21-24', from: 21, to: 24 },
  ]
  const bucketScans = new Array(BUCKETS.length).fill(0)
  const hourMap = new Map<string, number>()

  for (const e of entriesInRange(from, to)) {
    for (const t of e.timeOfDay || []) {
      const m = t.range.match(/(\d{1,2})\s*-\s*(\d{1,2})/)
      if (!m || t.scans <= 0) continue
      const f = parseInt(m[1]), tt = parseInt(m[2])
      const span = Math.max(tt - f, 1)
      const perHour = t.scans / span
      for (let i = 0; i < BUCKETS.length; i++) {
        const b = BUCKETS[i]
        const overlap = Math.max(0, Math.min(tt, b.to) - Math.max(f, b.from))
        if (overlap > 0) bucketScans[i] += perHour * overlap
      }
    }
    for (const h of e.peakHours || []) {
      hourMap.set(h.hour, (hourMap.get(h.hour) || 0) + h.scans)
    }
  }

  const total = bucketScans.reduce((s, v) => s + v, 0)
  const peakHours = Array.from(hourMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, scans], i) => ({ rank: (i + 1) as 1 | 2 | 3, hour, scans }))

  return {
    from, to,
    buckets: BUCKETS.map((b, i) => ({
      range: b.label,
      scans: Math.round(bucketScans[i]),
      pct: total ? +(bucketScans[i] / total * 100).toFixed(1) : 0,
    })),
    peakHours,
  }
}

// ════════════════════════════════════════════════════════════════
// Members
// ════════════════════════════════════════════════════════════════
export async function getMembersDaily(from: DateString, to: DateString): Promise<MembersDailyResponse> {
  const entries = entriesInRange(from, to)
  const rows = entries.map(e => {
    const memberNew = e.memberNew ?? e.newSignup
    const memberOld = e.memberOld ?? (e.uniqueUsers - e.newScanned)
    const activated = memberNew - (e.signedNotScanned ?? 0)
    return {
      date: e.date,
      weekday: e.weekday,
      memberNew,
      memberOld,
      total: memberNew + memberOld,
      signedNotScanned: e.signedNotScanned,
      activationRate: memberNew > 0 ? activated / memberNew : 0,
      memberTotal: e.memberTotal,
    }
  })
  const sumNew = rows.reduce((s, r) => s + r.memberNew, 0)
  const sumOld = rows.reduce((s, r) => s + r.memberOld, 0)
  return {
    from, to, rows,
    totals: { memberNew: sumNew, memberOld: sumOld, avgNewPerDay: rows.length ? sumNew / rows.length : 0 },
  }
}

// ════════════════════════════════════════════════════════════════
// Customers
// ════════════════════════════════════════════════════════════════
export async function getHeavyUsers(date: DateString, limit = 10): Promise<HeavyUsersResponse> {
  const e = DAILY_ENTRIES.find(d => d.date === date)
  if (!e) return { date, users: [] }
  return {
    date,
    users: (e.heavyUsers || []).slice(0, limit).map(u => ({
      rank: u.rank,
      userHash: u.userHash,
      province: u.province,
      scans: u.scans,
      skuDiversity: u.skuDiversity,
      age: u.age,
      flag: u.scans >= 50 ? 'fraud' : u.skuDiversity <= 2 && u.scans >= 20 ? 'reseller' : 'normal',
    })),
  }
}

export async function getEngagement(from: DateString, to: DateString): Promise<EngagementResponse> {
  const entries = entriesInRange(from, to)
  // Aggregate buckets
  const bucketMap = new Map<string, number>()
  let users = 0, avgSum = 0, maxOverall = 0
  for (const e of entries) {
    users += e.uniqueUsers
    avgSum += e.avgScansPerUser * e.uniqueUsers
    maxOverall = Math.max(maxOverall, e.maxScansPerUser)
    for (const b of e.engagementBuckets || []) {
      bucketMap.set(b.label, (bucketMap.get(b.label) || 0) + b.users)
    }
  }
  const buckets = Array.from(bucketMap.entries()).map(([label, u]) => ({
    label,
    users: u,
    pct: users > 0 ? +(u / users * 100).toFixed(1) : 0,
  }))
  return {
    from, to,
    totalUsers: users,
    avgScansPerUser: users ? +(avgSum / users).toFixed(2) : 0,
    medianScansPerUser: entries[entries.length - 1]?.medianScansPerUser ?? 0,
    maxScansPerUser: maxOverall,
    buckets,
  }
}

export async function getProvinces(date: DateString, limit = 10): Promise<ProvincesResponse> {
  const e = DAILY_ENTRIES.find(d => d.date === date)
  if (!e) return { date, provinces: [] }
  return {
    date,
    provinces: (e.topProvinces || []).slice(0, limit).map(p => {
      const avg = p.users > 0 ? +(p.scans / p.users).toFixed(2) : 0
      return {
        rank: p.rank,
        name: p.name,
        scans: p.scans,
        users: p.users,
        avgPerUser: avg,
        flag: avg >= 10 ? 'fraud' : avg >= 5 ? 'watch' : 'normal',
      }
    }),
  }
}

export async function getRetention(date: DateString): Promise<RetentionResponse> {
  const e = DAILY_ENTRIES.find(d => d.date === date)
  if (!e) return { date, firstTime: 0, returning: 0, total: 0, firstTimePct: 0, returningPct: 0 }
  const total = e.uniqueUsers
  const firstTime = Math.round(total * (e.firstTimePct / 100))
  const returning = total - firstTime
  return {
    date,
    firstTime, returning, total,
    firstTimePct: e.firstTimePct,
    returningPct: e.returningPct,
  }
}

// ════════════════════════════════════════════════════════════════
// SKU
// ════════════════════════════════════════════════════════════════
export async function getSkuList(): Promise<SkuListResponse> {
  return {
    skus: PRODUCTS_MASTER.map(p => ({
      sku: p.sku,
      displayName: p.displayName.replace(/\s*\([^)]+\)$/, ''),
      fullName: p.fullName,
      price: p.price,
      pointsPerScan: p.pointsPerScan,
      rightsPerScan: p.rightsPerScan,
    })),
  }
}

export async function getSkuPerDay(from: DateString, to: DateString): Promise<SkuPerDayResponse> {
  const dayKeys = entriesInRange(from, to).map(e => dateToDayKey(e.date))
  const rows = []
  let totalScans = 0
  let totalSpec = 0
  for (const sku of Object.keys(PER_SKU_DAILY)) {
    const perScan = skuPerScan.get(sku) ?? 1
    const days = PER_SKU_DAILY[sku]
    let scans = 0, users = 0
    for (const dk of dayKeys) {
      const d = days[dk]
      if (d) {
        scans += d.r || 0
        users += d.u || 0
      }
    }
    if (scans <= 0) continue
    const spec = scans * perScan
    totalScans += scans
    totalSpec += spec
    rows.push({
      sku,
      displayName: skuName.get(sku) ?? sku,
      perScan,
      scans,
      specTickets: spec,
      uniqueUsers: users,
      sharePct: 0,  // filled below
    })
  }
  rows.sort((a, b) => b.specTickets - a.specTickets)
  for (const r of rows) r.sharePct = totalSpec > 0 ? +(r.specTickets / totalSpec * 100).toFixed(2) : 0

  const activeSkus = rows.length
  const deadSkus = PRODUCTS_MASTER.length - activeSkus

  return {
    from, to,
    total: { scans: totalScans, specTickets: totalSpec, activeSkus, deadSkus },
    rows,
  }
}

export async function getSkuTimeseries(sku: string, from: DateString, to: DateString): Promise<SkuTimeseriesResponse> {
  const perScan = skuPerScan.get(sku) ?? 1
  const days = PER_SKU_DAILY[sku] ?? {}
  const points = entriesInRange(from, to).map(e => {
    const dk = dateToDayKey(e.date)
    const d = days[dk]
    const scans = d?.r ?? 0
    return {
      date: e.date,
      scans,
      specTickets: scans * perScan,
      uniqueUsers: d?.u ?? 0,
    }
  })
  return {
    sku,
    displayName: skuName.get(sku) ?? sku,
    perScan,
    from, to, points,
  }
}

// ════════════════════════════════════════════════════════════════
// Baseline (3-month comparison)
// ════════════════════════════════════════════════════════════════
export async function getBaselineCompare(from: DateString, to: DateString): Promise<BaselineCompareResponse> {
  const entries = entriesInRange(from, to)
  const rows = entries.map(e => {
    const mar = e.baselineMar.scans
    const apr = e.baselineApr.scans
    const may = e.success
    return {
      date: e.date, weekday: e.weekday,
      marScans: mar, marWeekday: e.baselineMar.weekday,
      aprScans: apr, aprWeekday: e.baselineApr.weekday,
      mayScans: may, mayWeekday: e.weekday,
      deltaMar: mar > 0 ? +((may - mar) / mar * 100).toFixed(1) : 0,
      deltaApr: apr > 0 ? +((may - apr) / apr * 100).toFixed(1) : 0,
    }
  })
  const tMar = rows.reduce((s, r) => s + r.marScans, 0)
  const tApr = rows.reduce((s, r) => s + r.aprScans, 0)
  const tMay = rows.reduce((s, r) => s + r.mayScans, 0)
  return {
    from, to, rows,
    totals: {
      marScans: tMar, aprScans: tApr, mayScans: tMay,
      deltaMar: tMar > 0 ? +((tMay - tMar) / tMar * 100).toFixed(1) : 0,
      deltaApr: tApr > 0 ? +((tMay - tApr) / tApr * 100).toFixed(1) : 0,
    },
  }
}

// ════════════════════════════════════════════════════════════════
// System / Uptime
// ════════════════════════════════════════════════════════════════
export async function getUptime(from: DateString, to: DateString): Promise<UptimeResponse> {
  const entries = entriesInRange(from, to)
  const totalHours = entries.length * 24
  const outages = entries.filter(e => e.outage).map(e => e.outage!)
  const outageHours = outages.reduce((s, o) => s + o.durationHours, 0)
  return {
    from, to,
    totalHours,
    outageHours,
    uptimePct: totalHours > 0 ? +(((totalHours - outageHours) / totalHours) * 100).toFixed(2) : 0,
    outages,
  }
}
