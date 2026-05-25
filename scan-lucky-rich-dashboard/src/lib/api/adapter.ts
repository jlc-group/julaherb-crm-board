// ════════════════════════════════════════════════════════════════
// 🔌 Data Source Adapter — swap mock ↔ real DB in 1 place
// ════════════════════════════════════════════════════════════════
//
// HOW TO HOOK REAL DB:
//   1. Set env var:   DATA_SOURCE=db
//   2. Fill TODO blocks in `src/lib/api/db-source.ts` with your SQL/Prisma calls
//   3. No other file in the codebase needs to change ✨
//
// Both sources implement the same `DataSource` interface below.
// ════════════════════════════════════════════════════════════════

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

import * as mock from './mock-source'
// import * as db from './db-source'  // ← uncomment when DB driver ready

export interface DataSource {
  // Daily
  getDailyRows(from: DateString, to: DateString): Promise<DailyRow[]>
  getDailyByDate(date: DateString): Promise<DailyRow | null>

  // Scans
  getScansTotals(from: DateString, to: DateString): Promise<ScansTotalsResponse>
  getScansTimeseries(from: DateString, to: DateString): Promise<ScansTimeseriesResponse>
  getTimeOfDay(from: DateString, to: DateString): Promise<TimeOfDayResponse>

  // Members
  getMembersDaily(from: DateString, to: DateString): Promise<MembersDailyResponse>

  // Customers
  getHeavyUsers(date: DateString, limit?: number): Promise<HeavyUsersResponse>
  getEngagement(from: DateString, to: DateString): Promise<EngagementResponse>
  getProvinces(date: DateString, limit?: number): Promise<ProvincesResponse>
  getRetention(date: DateString): Promise<RetentionResponse>

  // SKU
  getSkuList(): Promise<SkuListResponse>
  getSkuPerDay(from: DateString, to: DateString): Promise<SkuPerDayResponse>
  getSkuTimeseries(sku: string, from: DateString, to: DateString): Promise<SkuTimeseriesResponse>

  // Baseline
  getBaselineCompare(from: DateString, to: DateString): Promise<BaselineCompareResponse>

  // System
  getUptime(from: DateString, to: DateString): Promise<UptimeResponse>
}

const SOURCE = process.env.DATA_SOURCE ?? 'mock'

export const ds: DataSource =
  SOURCE === 'db'
    ? (() => { throw new Error('DB source not wired yet — fill src/lib/api/db-source.ts') })()
    // ? (db as DataSource)
    : (mock as unknown as DataSource)
