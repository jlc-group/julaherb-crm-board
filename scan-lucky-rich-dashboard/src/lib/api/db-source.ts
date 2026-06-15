// ════════════════════════════════════════════════════════════════
// 🗄️  REAL DB Data Source — V2 Postgres / Prisma
// ════════════════════════════════════════════════════════════════
//
// 🔧 Wire-up checklist for backend dev:
//
// 1. Install driver:
//    npm i pg          (raw)
//    OR
//    npm i prisma @prisma/client && npx prisma init
//
// 2. Add env to .env.local:
//    DATABASE_URL="postgresql://user:pass@host:5432/v2_db"
//    DATA_SOURCE=db
//
// 3. Replace each `TODO` block below with actual query call.
//    Each function MUST return the exact shape declared in types.ts
//    (same as mock-source.ts already does).
//
// 4. Tables expected in V2 schema:
//    - scan_history        (scanned_at, user_id, sku, scan_type)
//    - users               (id, created_at, province, phone_hash)
//    - lucky_draw_tickets  (id, user_id, sku, created_at)
//    - lucky_draw_campaigns (sku list with rights_per_scan)
//    - system_outages      (start, end, cause)  — optional, can compute from gaps
//
// 5. Note: scan_type enum values used:
//    'success' | 'duplicate_self' | 'duplicate_other' | 'not_found'
//    (V1 uses status 2/4/5/6 — V1→V2 sync maps these)
//
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

// ════════════════════════════════════════════════════════════════
// 🛡️  CONNECTION SAFETY — กัน dashboard ทำ production (การสแกน QR จริง) ล่ม
// ════════════════════════════════════════════════════════════════
//
// หลักการ: read ของ dashboard ต้องห้ามไปแย่ง resource กับ write-path ของการสแกนจริง
//
// เปิดใช้ตอนต่อ DB จริง (หลัง `npm i pg`) — ปัจจุบันเป็น scaffolding รอ backend:
//
//   import { Pool } from 'pg'
//
//   // ⚠️ Pool แยกสำหรับ "อ่านเพื่อ dashboard" โดยเฉพาะ — เล็ก + มีเพดาน
//   //    ห้ามใช้ pool เดียวกับฝั่งที่เขียน scan_history
//   export const readPool = new Pool({
//     connectionString: process.env.DASHBOARD_DATABASE_URL,  // ⭐ ชี้ไป read-replica ไม่ใช่ primary
//     max: 3,                                  // เพดาน connection ต่ำ — dashboard ดูด conn จนสแกนจริงไม่มีเหลือไม่ได้
//     idleTimeoutMillis: 10_000,               // ปล่อย conn ที่ว่างเร็ว
//     connectionTimeoutMillis: 5_000,          // ขอ conn ไม่ได้ใน 5 วิ → fail เร็ว ไม่ค้าง
//     statement_timeout: 5_000,                // ⭐ query เกิน 5 วิ → ถูกตัดทิ้ง กัน query หนักล็อกตาราง
//     idle_in_transaction_session_timeout: 10_000,
//   })
//
//   // wrapper เดียวที่ทุกฟังก์ชันด้านล่างเรียกใช้ — รวมจุดคุม timeout/log ไว้ที่เดียว
//   async function q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
//     const res = await readPool.query(sql, params)
//     return res.rows as T[]
//   }
//
// 📌 หมายเหตุสำคัญสำหรับ backend:
//   - query ด้านล่างถูกปรับให้อ่านจาก rollup table (`daily_rollup` / `analytics_scan_rollups`)
//     แทน `scan_history` ดิบ → เปลี่ยนการนับ 10 ล้านแถว เป็นอ่าน ~217 แถว
//   - ตั้ง batch job รีเฟรช rollup ทุก X นาที (ฝั่ง DB) — dashboard อ่านของที่ pre-aggregate แล้ว
//   - ส่วนที่ยังต้องแตะ scan_history ดิบ (heavy users / engagement รายคน) ให้ยิงเฉพาะช่วงวันเดียว
//     และพึ่ง statement_timeout + read-replica เป็นเบรกสุดท้าย

// ─── HELPER: convert DB row to DailyRow shape ──────────────────────
// function rowToDaily(r: any): DailyRow { ... }

// ════════════════════════════════════════════════════════════════
// Daily
// ════════════════════════════════════════════════════════════════
export async function getDailyRows(from: DateString, to: DateString): Promise<DailyRow[]> {
  /* TODO — อ่านจาก rollup (เบา) ไม่ใช่ scan_history ดิบ:
  SELECT
    date,
    total_scans      AS success,       -- rollup เก็บ scan สำเร็จไว้แล้ว
    total_rights     AS expected_tickets,
    unique_users,
    new_users        AS member_new,
    returning_users  AS member_old
  FROM daily_rollup                     -- = analytics_scan_rollups (pre-aggregated, ~217 แถว)
  WHERE date BETWEEN $1 AND $2
  ORDER BY date;

  -- หมายเหตุ: dupSelf/dupOther/notFound ถ้า rollup ยังไม่เก็บ ให้เพิ่มคอลัมน์ใน batch job
  -- (อย่า fallback ไป COUNT scan_history ดิบ — นั่นคือจุดที่ทำ DB ล่ม)
  -- ใช้ผ่าน wrapper: return (await q<DailyRow>(sql, [from, to])).map(rowToDaily)
  */
  throw new Error('NOT_IMPLEMENTED: getDailyRows')
}

export async function getDailyByDate(date: DateString): Promise<DailyRow | null> {
  const rows = await getDailyRows(date, date)
  return rows[0] ?? null
}

// ════════════════════════════════════════════════════════════════
// Scans
// ════════════════════════════════════════════════════════════════
export async function getScansTotals(from: DateString, to: DateString): Promise<ScansTotalsResponse> {
  /* TODO — aggregate จาก rollup (อ่าน ~217 แถว) ไม่ใช่ COUNT ทั้ง scan_history:
  SELECT
    SUM(total_scans)   AS success,
    SUM(total_rights)  AS expected_tickets,
    SUM(unique_users)  AS unique_users_sum,   -- ⚠️ sum-of-daily (ดู note ใน types.ts)
    COUNT(*)           AS days
  FROM daily_rollup
  WHERE date BETWEEN $1 AND $2;

  -- ถ้าต้อง distinctUsers จริง (ทั้งช่วง) — เป็น query เดียวที่ยังต้องแตะ scan_history:
  --   SELECT COUNT(DISTINCT user_id) FROM scan_history
  --   WHERE scan_type='success' AND scanned_at BETWEEN $1 AND $2;
  -- ⚠️ ยิงได้แต่ต้องผ่าน read-replica + statement_timeout เท่านั้น และ cache ผลให้นาน
  --    (หรือให้ batch job เก็บ distinct รายช่วงไว้ใน rollup แยก เพื่อเลี่ยงโดนตารางร้อน)
  */
  throw new Error('NOT_IMPLEMENTED: getScansTotals')
}

export async function getScansTimeseries(from: DateString, to: DateString): Promise<ScansTimeseriesResponse> {
  /* TODO — จาก rollup ตรงๆ (total_rights มี expected_tickets อยู่แล้ว ไม่ต้อง JOIN scan_history):
  SELECT date, total_scans AS success, total_rights AS expected_tickets, unique_users
  FROM daily_rollup
  WHERE date BETWEEN $1 AND $2
  ORDER BY date;
  */
  throw new Error('NOT_IMPLEMENTED: getScansTimeseries')
}

export async function getTimeOfDay(from: DateString, to: DateString): Promise<TimeOfDayResponse> {
  /* TODO:
  SELECT
    EXTRACT(HOUR FROM scanned_at AT TIME ZONE 'Asia/Bangkok') AS hour,
    COUNT(*) AS scans
  FROM scan_history
  WHERE scan_type = 'success' AND scanned_at BETWEEN $1 AND $2
  GROUP BY hour
  ORDER BY hour;
  -- then bucket into 00-06, 06-09, 09-12, 12-15, 15-18, 18-21, 21-24
  */
  throw new Error('NOT_IMPLEMENTED: getTimeOfDay')
}

// ════════════════════════════════════════════════════════════════
// Members
// ════════════════════════════════════════════════════════════════
export async function getMembersDaily(from: DateString, to: DateString): Promise<MembersDailyResponse> {
  /* TODO — rollup มี new_users/returning_users คำนวณไว้แล้ว ใช้ได้เลย:
  SELECT date, new_users AS member_new, returning_users AS member_old
  FROM daily_rollup
  WHERE date BETWEEN $1 AND $2
  ORDER BY date;

  -- signedNotScanned (สมัครวันนี้แต่ไม่สแกน): ถ้าต้องการ ให้เพิ่มเป็นคอลัมน์ใน batch job ของ rollup
  -- (อย่าทำ NOT EXISTS บน scan_history สดทุก request — หนักและล็อกตารางร้อน)
  */
  throw new Error('NOT_IMPLEMENTED: getMembersDaily')
}

// ════════════════════════════════════════════════════════════════
// Customers
// ════════════════════════════════════════════════════════════════
export async function getHeavyUsers(date: DateString, limit = 10): Promise<HeavyUsersResponse> {
  /* TODO:
  SELECT
    SUBSTRING(MD5(u.phone) FROM 1 FOR 8) AS user_hash,  -- hash for PII safety
    u.province,
    EXTRACT(YEAR FROM AGE(u.dob)) AS age,
    COUNT(*) AS scans,
    COUNT(DISTINCT sh.sku) AS sku_diversity
  FROM scan_history sh
  JOIN users u ON u.id = sh.user_id
  WHERE sh.scan_type = 'success'
    AND DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok') = $1
  GROUP BY u.id, u.phone, u.province, u.dob
  ORDER BY scans DESC
  LIMIT $2;
  */
  throw new Error('NOT_IMPLEMENTED: getHeavyUsers')
}

export async function getEngagement(from: DateString, to: DateString): Promise<EngagementResponse> {
  /* TODO:
  WITH user_scans AS (
    SELECT user_id, COUNT(*) AS n
    FROM scan_history
    WHERE scan_type = 'success' AND scanned_at BETWEEN $1 AND $2
    GROUP BY user_id
  )
  SELECT
    AVG(n)::numeric(10,2) AS avg_scans,
    PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY n) AS median_scans,
    MAX(n) AS max_scans,
    SUM(CASE WHEN n = 1 THEN 1 ELSE 0 END) AS bucket_1,
    SUM(CASE WHEN n BETWEEN 2 AND 5 THEN 1 ELSE 0 END) AS bucket_2_5,
    SUM(CASE WHEN n BETWEEN 6 AND 10 THEN 1 ELSE 0 END) AS bucket_6_10,
    SUM(CASE WHEN n > 10 THEN 1 ELSE 0 END) AS bucket_10plus,
    COUNT(*) AS total_users
  FROM user_scans;
  */
  throw new Error('NOT_IMPLEMENTED: getEngagement')
}

export async function getProvinces(date: DateString, limit = 10): Promise<ProvincesResponse> {
  /* TODO:
  SELECT
    u.province AS name,
    COUNT(*) AS scans,
    COUNT(DISTINCT sh.user_id) AS users
  FROM scan_history sh
  JOIN users u ON u.id = sh.user_id
  WHERE sh.scan_type = 'success'
    AND DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok') = $1
  GROUP BY u.province
  ORDER BY scans DESC
  LIMIT $2;
  */
  throw new Error('NOT_IMPLEMENTED: getProvinces')
}

export async function getRetention(date: DateString): Promise<RetentionResponse> {
  /* TODO:
  WITH first_scan AS (
    SELECT user_id, MIN(DATE(scanned_at AT TIME ZONE 'Asia/Bangkok')) AS first_day
    FROM scan_history
    WHERE scan_type = 'success'
    GROUP BY user_id
  )
  SELECT
    SUM(CASE WHEN fs.first_day = $1 THEN 1 ELSE 0 END) AS first_time,
    SUM(CASE WHEN fs.first_day < $1 THEN 1 ELSE 0 END) AS returning
  FROM scan_history sh
  JOIN first_scan fs USING (user_id)
  WHERE sh.scan_type = 'success'
    AND DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok') = $1
  GROUP BY user_id;
  */
  throw new Error('NOT_IMPLEMENTED: getRetention')
}

// ════════════════════════════════════════════════════════════════
// SKU
// ════════════════════════════════════════════════════════════════
export async function getSkuList(): Promise<SkuListResponse> {
  /* TODO:
  SELECT sku, display_name, full_name, price, points_per_scan, rights_per_scan
  FROM lucky_draw_campaigns
  ORDER BY seq;
  */
  throw new Error('NOT_IMPLEMENTED: getSkuList')
}

export async function getSkuPerDay(from: DateString, to: DateString): Promise<SkuPerDayResponse> {
  /* TODO:
  SELECT
    sh.sku,
    ldc.display_name,
    ldc.rights_per_scan AS per_scan,
    COUNT(*) AS scans,
    COUNT(DISTINCT sh.user_id) AS unique_users,
    (COUNT(*) * ldc.rights_per_scan) AS spec_tickets
  FROM scan_history sh
  JOIN lucky_draw_campaigns ldc USING (sku)
  WHERE sh.scan_type = 'success' AND sh.scanned_at BETWEEN $1 AND $2
  GROUP BY sh.sku, ldc.display_name, ldc.rights_per_scan
  ORDER BY spec_tickets DESC;
  */
  throw new Error('NOT_IMPLEMENTED: getSkuPerDay')
}

export async function getSkuTimeseries(sku: string, from: DateString, to: DateString): Promise<SkuTimeseriesResponse> {
  /* TODO:
  SELECT
    DATE(scanned_at AT TIME ZONE 'Asia/Bangkok') AS date,
    COUNT(*) AS scans,
    COUNT(DISTINCT user_id) AS unique_users
  FROM scan_history
  WHERE sku = $1 AND scan_type = 'success' AND scanned_at BETWEEN $2 AND $3
  GROUP BY date
  ORDER BY date;
  -- multiply scans × rights_per_scan in app layer
  */
  throw new Error('NOT_IMPLEMENTED: getSkuTimeseries')
}

// ════════════════════════════════════════════════════════════════
// Baseline (3-month comparison)
// ════════════════════════════════════════════════════════════════
export async function getBaselineCompare(from: DateString, to: DateString): Promise<BaselineCompareResponse> {
  /* TODO:
  -- Take each date in [from, to], join with same day-of-month for prev 2 months
  SELECT
    d::date AS date,
    (SELECT COUNT(*) FROM scan_history WHERE scan_type='success'
      AND DATE(scanned_at AT TIME ZONE 'Asia/Bangkok') = (d - INTERVAL '2 months')::date) AS mar_scans,
    (SELECT COUNT(*) FROM scan_history WHERE scan_type='success'
      AND DATE(scanned_at AT TIME ZONE 'Asia/Bangkok') = (d - INTERVAL '1 month')::date) AS apr_scans,
    (SELECT COUNT(*) FROM scan_history WHERE scan_type='success'
      AND DATE(scanned_at AT TIME ZONE 'Asia/Bangkok') = d::date) AS may_scans
  FROM generate_series($1::date, $2::date, '1 day') d
  ORDER BY d;
  */
  throw new Error('NOT_IMPLEMENTED: getBaselineCompare')
}

// ════════════════════════════════════════════════════════════════
// System / Uptime
// ════════════════════════════════════════════════════════════════
export async function getUptime(from: DateString, to: DateString): Promise<UptimeResponse> {
  /* TODO Option 1 — read from system_outages table:
  SELECT start, end, cause, EXTRACT(EPOCH FROM (end - start)) / 3600 AS duration_hours
  FROM system_outages
  WHERE start >= $1 AND end <= $2;

  TODO Option 2 — detect gaps in scan_history (if no outage table):
  WITH hourly AS (
    SELECT date_trunc('hour', scanned_at AT TIME ZONE 'Asia/Bangkok') AS h,
           COUNT(*) AS n
    FROM scan_history WHERE scanned_at BETWEEN $1 AND $2
    GROUP BY h
  )
  SELECT h FROM generate_series(date_trunc('hour', $1::timestamp), $2::timestamp, '1 hour') h
  LEFT JOIN hourly USING (h)
  WHERE hourly.n IS NULL OR hourly.n < 10;  -- threshold for outage detection
  */
  throw new Error('NOT_IMPLEMENTED: getUptime')
}
