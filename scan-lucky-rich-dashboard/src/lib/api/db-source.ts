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

// import { Pool } from 'pg'
// const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// ─── HELPER: convert DB row to DailyRow shape ──────────────────────
// function rowToDaily(r: any): DailyRow { ... }

// ════════════════════════════════════════════════════════════════
// Daily
// ════════════════════════════════════════════════════════════════
export async function getDailyRows(from: DateString, to: DateString): Promise<DailyRow[]> {
  /* TODO:
  SELECT
    DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok')   AS date,
    SUM(CASE WHEN sh.scan_type = 'success'         THEN 1 ELSE 0 END) AS success,
    SUM(CASE WHEN sh.scan_type = 'duplicate_self'  THEN 1 ELSE 0 END) AS dup_self,
    SUM(CASE WHEN sh.scan_type = 'duplicate_other' THEN 1 ELSE 0 END) AS dup_other,
    SUM(CASE WHEN sh.scan_type = 'not_found'       THEN 1 ELSE 0 END) AS not_found,
    COUNT(DISTINCT sh.user_id)                       AS unique_users
  FROM scan_history sh
  WHERE sh.scanned_at >= $1 AND sh.scanned_at < $2 + INTERVAL '1 day'
  GROUP BY DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok')
  ORDER BY date;
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
  /* TODO:
  SELECT
    SUM(CASE WHEN scan_type = 'success' THEN 1 ELSE 0 END) AS success,
    SUM(CASE WHEN scan_type = 'duplicate_self' THEN 1 ELSE 0 END) AS dup_self,
    SUM(CASE WHEN scan_type = 'duplicate_other' THEN 1 ELSE 0 END) AS dup_other,
    SUM(CASE WHEN scan_type = 'not_found' THEN 1 ELSE 0 END) AS not_found,
    COUNT(DISTINCT user_id) AS distinct_users
  FROM scan_history
  WHERE scanned_at BETWEEN $1 AND $2;

  -- For expected_tickets:
  SELECT SUM(sh_count.scans * ldc.rights_per_scan) AS expected_tickets
  FROM (
    SELECT sku, COUNT(*) AS scans
    FROM scan_history
    WHERE scan_type = 'success' AND scanned_at BETWEEN $1 AND $2
    GROUP BY sku
  ) sh_count
  JOIN lucky_draw_campaigns ldc USING (sku);
  */
  throw new Error('NOT_IMPLEMENTED: getScansTotals')
}

export async function getScansTimeseries(from: DateString, to: DateString): Promise<ScansTimeseriesResponse> {
  /* TODO: similar to getDailyRows but include expected_tickets via JOIN */
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
  /* TODO:
  WITH scans_by_day AS (
    SELECT
      DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok') AS day,
      sh.user_id,
      u.created_at::date AS signup_date
    FROM scan_history sh
    JOIN users u ON u.id = sh.user_id
    WHERE sh.scan_type = 'success' AND sh.scanned_at BETWEEN $1 AND $2
  )
  SELECT
    day,
    COUNT(DISTINCT CASE WHEN signup_date = day THEN user_id END) AS member_new,
    COUNT(DISTINCT CASE WHEN signup_date < day THEN user_id END) AS member_old
  FROM scans_by_day
  GROUP BY day
  ORDER BY day;

  -- For signedNotScanned (registered today but didn't scan):
  SELECT u.created_at::date AS day, COUNT(*) AS signed_not_scanned
  FROM users u
  WHERE u.created_at BETWEEN $1 AND $2
    AND NOT EXISTS (
      SELECT 1 FROM scan_history sh
      WHERE sh.user_id = u.id
        AND DATE(sh.scanned_at AT TIME ZONE 'Asia/Bangkok') = u.created_at::date
        AND sh.scan_type = 'success'
    )
  GROUP BY day;
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
