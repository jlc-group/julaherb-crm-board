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
  SegmentsResponse,
  SkuListResponse,
  SkuPerDayResponse,
  SkuTimeseriesResponse,
  BaselineCompareResponse,
  UptimeResponse,
  PrintSlipsResponse,
  CustomerSearchResponse,
  DayHourResponse,
  SkuDailyMatrixResponse,
  RfmDistributionResponse,
  VerificationStatsResponse,
} from './types'

import * as mock from './mock-source'
import * as api from './api-source'   // ← saversureV2 API (เปิดด้วย DATA_SOURCE=api)
// import * as db from './db-source'  // ← (สำรอง) direct DB — ไม่ใช้ตามสถาปัตยกรรม (ห้ามเข้า DB ตรง)

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
  getSegments(): Promise<SegmentsResponse>

  // SKU
  getSkuList(): Promise<SkuListResponse>
  getSkuPerDay(from: DateString, to: DateString): Promise<SkuPerDayResponse>
  getSkuTimeseries(sku: string, from: DateString, to: DateString): Promise<SkuTimeseriesResponse>

  // Baseline
  getBaselineCompare(from: DateString, to: DateString): Promise<BaselineCompareResponse>

  // System
  getUptime(from: DateString, to: DateString): Promise<UptimeResponse>

  // Print Slips (จับฉลาก: 1 สิทธิ์ = 1 ใบ)
  getPrintSlips(from: DateString, to: DateString, limit?: number): Promise<PrintSlipsResponse>

  // ค้นหาลูกค้า (หน้า Operation: หาผู้ได้รางวัลมาบันทึก)
  searchCustomers(q: string): Promise<CustomerSearchResponse>
  // ที่อยู่จัดส่งค่าเริ่มต้นของลูกค้า (จากเบอร์ → /customers/search หา id → /customers/{id}/detail)
  getCustomerAddress(phone: string): Promise<string>

  // NEW — deploy 2026-06-18
  getScansByDayHour(from: DateString, to: DateString): Promise<DayHourResponse>
  getSkuDailyMatrix(from: DateString, to: DateString): Promise<SkuDailyMatrixResponse>
  getRfmDistribution(): Promise<RfmDistributionResponse>
  getVerificationStats(from: DateString, to: DateString): Promise<VerificationStatsResponse>
}

const SOURCE = process.env.DATA_SOURCE ?? 'mock'

export const ds: DataSource =
  SOURCE === 'api'
    ? (api as unknown as DataSource)   // เรียก API ของ saversureV2 (consumer, read-only)
    : SOURCE === 'db'
    ? (() => { throw new Error('DB source ไม่ใช้แล้ว — สถาปัตยกรรมห้ามเข้า DB ตรง ใช้ DATA_SOURCE=api') })()
    : (mock as unknown as DataSource)  // default — ข้อมูล mock (static) ปลอดภัย ไม่เรียกของจริง
