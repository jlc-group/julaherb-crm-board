# 📊 Dashboard Data Requirements — สแกนลุ้นรวย สวยลุ้นล้าน

> **เอกสารนี้ใช้ส่งทีม DB/Backend** เพื่อขอข้อมูล + ตั้ง pipeline รายวัน
> Repo: `julaherb-crm-board/scan-lucky-rich-dashboard`

---

## 🎯 Part 1: ภาพรวมแต่ละหน้า

| Tab | Purpose | คำถามที่ตอบ | Data ที่ใช้จริง |
|-----|---------|------------|----------------|
| **📊 Scan Overview** | ภาพรวมแคมเปญรายวัน + lift analysis | "วันนี้เป็นยังไง? แคมเปญ work เปล่า?" | scans aggregate / baseline 3 เดือน |
| **👥 Customers** | RFM + cohort + retention | "ใครคือลูกค้าหลัก? กลับมาไหม?" | users + user-level scans |
| **📦 Products** | SKU performance ทุกระดับ | "SKU ไหนดี/ตาย? hero ดูแลยังไง?" | scans × product |
| **🏆 Operations** | จัดการรางวัล + winners workflow | "ใครชนะ? ของจะหมดเมื่อไหร่?" | winners + prizes |
| **🛡️ Risk Watch** | Fraud + verification + anomaly | "มีโกงไหม? scan ผิดธรรมชาติ?" | flags + scan verification |

---

## 📊 Part 2: Data Requirement ต่อหน้า (Schema spec)

### 2.1 📊 **Scan Overview**

**Widgets:**
- KPI Strip (สิทธิ์/Users/Attempts/สิทธิ์ต่อคน)
- Daily Momentum gauge
- Baseline Comparison (3-month: มี.ค./เม.ย./พ.ค.)
- Apple-to-Apple weekday-matched
- Scan Heatmap (วัน × ชั่วโมง)
- Daily Trend chart
- Scan Log

**Required data:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `daily_aggregate` | `date, total_scans, valid_scans, unique_users, new_users, rights_granted` | KPI strip + Momentum + Trend |
| `daily_aggregate_baseline` | `date (3 months back), total_scans, valid_scans, unique_users` | Baseline comparison |
| `hourly_scan_count` | `date, hour, scans` | Heatmap (last 7 days) |
| `scan_history` (sample) | `scan_id, user_name, phone, product_sku, product_name, scan_code, scanned_at, province` | Scan log |

**SQL ตัวอย่าง:**
```sql
-- Daily aggregate (ใช้ทำ Momentum + KPI strip)
SELECT
  DATE(scanned_at) AS date,
  COUNT(*) AS total_scans,
  SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) AS valid_scans,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT CASE WHEN u.is_new_customer THEN user_id END) AS new_users,
  SUM(rights_earned) AS rights_granted
FROM scan_history s
JOIN users u ON u.id = s.user_id
WHERE scanned_at >= '2026-05-16'
GROUP BY DATE(scanned_at)
ORDER BY date;

-- Hourly heatmap (ใช้ทำ heatmap วัน × ชม.)
SELECT
  DATE(scanned_at) AS date,
  EXTRACT(HOUR FROM scanned_at) AS hour,
  COUNT(*) AS scans
FROM scan_history
WHERE scanned_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date, hour;
```

---

### 2.2 👥 **Customers**

**Widgets:**
- RFM Segmentation (Champion/Loyal/At Risk/Lost)
- RetentionCohort (1/2/3/4+ scans distribution)
- ScanFunnel (open → register → submit → verified)
- Cohort Retention table (W0 → W1 → W2 by acquisition month)
- Top 20 Scanners
- Top 10 จังหวัด
- Engagement Decay

**Required data:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | `user_id, name, phone, province, created_at, customer_segment, is_new` | Profile data |
| `user_scan_summary` | `user_id, total_scans, total_rights, first_scan_at, last_scan_at, days_since_last_scan` | Top scanners + decay |
| `rfm_snapshot` | `user_id, r_score, f_score, m_score, segment` | RFM segmentation |
| `cohort_retention` | `cohort_month, week_offset, retained_users, total_users` | Cohort table |
| `scan_funnel_daily` | `date, step_name, count` | 4-step funnel |
| `province_scan_count` | `province, scans, unique_users` | Top จังหวัด |

**SQL ตัวอย่าง:**
```sql
-- RFM snapshot (รายเดือน)
WITH rfm AS (
  SELECT
    user_id,
    NTILE(5) OVER (ORDER BY MAX(scanned_at) DESC) AS r_score,
    NTILE(5) OVER (ORDER BY COUNT(*) DESC) AS f_score,
    NTILE(5) OVER (ORDER BY SUM(rights_earned) DESC) AS m_score
  FROM scan_history
  GROUP BY user_id
)
SELECT
  user_id, r_score, f_score, m_score,
  CASE
    WHEN r_score >= 4 AND f_score >= 4 THEN 'Champion'
    WHEN r_score >= 4 AND f_score >= 2 THEN 'Loyal'
    WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
    ELSE 'Other'
  END AS segment
FROM rfm;

-- Top 20 Scanners
SELECT u.name, u.phone, u.province, s.total_scans, s.total_rights, s.last_scan_at
FROM user_scan_summary s
JOIN users u ON u.id = s.user_id
ORDER BY s.total_rights DESC
LIMIT 20;

-- Top 10 จังหวัด
SELECT u.province, COUNT(DISTINCT s.user_id) AS users, COUNT(*) AS scans, SUM(s.rights_earned) AS rights
FROM scan_history s
JOIN users u ON u.id = s.user_id
GROUP BY u.province
ORDER BY scans DESC LIMIT 10;
```

---

### 2.3 📦 **Products**

**Widgets:**
- KPI Strip (Total SKU / สิทธิ์แลก / 3 tier breakdown)
- HeroSkuCard + Concentration Risk
- Pareto Chart
- Tier Funnel + Donut
- FirstScanCard (entry product สำหรับ new users)
- CrossSizeMatrix
- DailyCampaignBreakdown (3-day per-day Top 15 + Rank movement + Dead 3-day + High velocity)
- ProductMasterTable (97 SKU + day filter + Users + สิทธิ์/คน)

**Required data:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `products_master` | `sku, name, price, points_per_scan, rights_per_scan, tier, size, product_group` | 97 SKU master (มีแล้วใน Excel) |
| `sku_daily_aggregate` | `date, sku, scans, unique_users, rights_granted` | ทุก widget ที่ split รายวัน |
| `sku_cumulative` | `sku, total_scans, total_users, total_rights` | Hero + Pareto + Master Table all-time |
| `first_scan_sku` | `user_id, first_sku, first_scan_at` | FirstScanCard attribution |

**SQL ตัวอย่าง:**
```sql
-- SKU daily aggregate (สำคัญที่สุด — ขับ Products tab ทั้งหมด)
SELECT
  DATE(s.scanned_at) AS date,
  p.sku,
  p.name,
  COUNT(*) AS scans,
  COUNT(DISTINCT s.user_id) AS unique_users,
  SUM(s.rights_earned) AS rights_granted
FROM scan_history s
JOIN products_master p ON p.sku = s.product_sku
WHERE s.scanned_at >= '2026-05-16'
  AND s.is_valid = TRUE
GROUP BY DATE(s.scanned_at), p.sku, p.name
ORDER BY date, rights_granted DESC;

-- First-scan SKU (entry product)
SELECT
  first_sku AS sku,
  p.name,
  COUNT(*) AS new_users
FROM (
  SELECT user_id, product_sku AS first_sku,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY scanned_at) AS rn
  FROM scan_history
) t
JOIN products_master p ON p.sku = t.first_sku
WHERE rn = 1
GROUP BY first_sku, p.name
ORDER BY new_users DESC LIMIT 10;
```

---

### 2.4 🏆 **Operations**

**Widgets:**
- เพิ่ม/รายชื่อผู้โชคดี table
- Prize Burn Rate (ของแจกไปกี่ % แล้ว)
- Prize Depletion Forecast (ที่ rate ปัจจุบัน หมดเมื่อไหร่)

**Required data:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `winners` | `winner_id, user_id, draw_date, tier (10K/100K/1M), prize_label, status (confirmed/pending/forfeited/unannounced), prize_value_thb, announcement_channel` | Winner list + manage |
| `prizes_inventory` | `tier, total_count, awarded, confirmed, pending, forfeited, remaining, value_per_unit` | Prize burn |

**SQL ตัวอย่าง:**
```sql
-- Prize inventory (live)
SELECT
  tier,
  total_count,
  SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
  SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN status = 'forfeited' THEN 1 ELSE 0 END) AS forfeited,
  total_count - COUNT(*) AS remaining
FROM winners
GROUP BY tier, total_count;
```

---

### 2.5 🛡️ **Risk Watch**

**Widgets:**
- KPI: Flagged / Velocity / Geo Mismatch / Total Flagged
- VerificationPanel (Valid rate + 6 failure types)
- Velocity Alerts table
- Multi-Account Suspects
- Geo Mismatch table
- Risk Score Ranking (Top 10)

**Required data:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `user_flags` | `flag_id, user_id, flag_type (velocity/multi_account/geo_mismatch/device_dup), severity (low/mid/high), flagged_at, status (flagged/watching/cleared), detail_json` | All risk widgets |
| `scan_verification_log` | `attempt_id, user_id, scan_code, result (valid/duplicate/invalid_format/expired/not_registered/velocity/network_error), attempted_at, ip_address, device_id` | VerificationPanel |
| `user_risk_score` | `user_id, score (0-100), updated_at` | Risk Score Ranking |
| `geo_mismatch_view` | `user_id, reg_province, scan_province, frequency` | Geo Mismatch |

**SQL ตัวอย่าง:**
```sql
-- Verification breakdown (รายวัน)
SELECT
  result,
  COUNT(*) AS attempts,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS pct
FROM scan_verification_log
WHERE attempted_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY result;

-- Velocity alerts (>5 scans/min same user)
SELECT user_id, COUNT(*) AS scans_per_min, MIN(scanned_at) AS start_time
FROM scan_history
WHERE scanned_at >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY user_id, DATE_TRUNC('minute', scanned_at)
HAVING COUNT(*) > 5
ORDER BY scans_per_min DESC LIMIT 20;
```

---

## 📅 Part 3: Daily Feed Guide

> **เป้าหมาย:** ทีม DB ดึงข้อมูลแล้วส่งให้ทุกวัน → frontend swap mock เป็นจริงทันที

### 🌅 Daily Pipeline (เวลาดี: 06:00 / 07:00)

| ลำดับ | ทำอะไร | Output |
|------|--------|--------|
| 1 | Aggregate scans เมื่อวาน → `daily_aggregate` | 1 row/day |
| 2 | Aggregate SKU เมื่อวาน → `sku_daily_aggregate` | ~78-93 rows/day |
| 3 | Aggregate hourly เมื่อวาน → `hourly_scan_count` | 24 rows/day |
| 4 | Snapshot prizes_inventory | 3 rows (tier breakdown) |
| 5 | Refresh `user_scan_summary` (incremental) | upsert |
| 6 | Run RFM scoring (weekly OK, daily even better) | snapshot |
| 7 | Compute new flags → `user_flags` | append |
| 8 | Export ทั้งหมดเป็น Excel/CSV → ส่งเข้า S3 หรือ shared drive | files |

### 📦 ไฟล์ที่ต้องการรายวัน (priority order)

```
scan_data_YYYY-MM-DD.xlsx
├── _meta                  (1 row: snapshot timestamp)
├── daily_aggregate        (campaign-to-date, 1 row/day)
├── sku_daily_aggregate    (ทุก SKU × ทุกวัน)
├── hourly_scan_count      (last 7 days × 24 hr)
├── verification_breakdown (failure types ของวันล่าสุด)
├── top_scanners           (top 50)
├── province_aggregate     (province × scans)
├── winners                (ทั้งหมด ถ้า volume ไม่ใหญ่)
├── prizes_inventory       (3 rows tier)
├── user_flags             (active flags)
└── new_users_today        (สำหรับ new vs returning)
```

### 🎯 Minimum viable daily file (เริ่มจาก 4 sheet)

ถ้าเริ่มจริง ๆ ให้เริ่มจาก **4 sheets** นี้ก่อน — dashboard 80% ใช้ได้แล้ว:

| Priority | Sheet | ใช้ที่ไหน |
|----------|-------|-----------|
| ⭐ 1 | `daily_aggregate` | Overview KPI + Momentum + Trend |
| ⭐ 2 | `sku_daily_aggregate` | Products ทั้ง tab |
| ⭐ 3 | `winners` + `prizes_inventory` | Operations |
| 4 | `verification_breakdown` | Risk VerificationPanel |

### ⏰ ความถี่ที่แนะนำ

| Data type | Refresh frequency | เพราะ |
|-----------|-------------------|------|
| `daily_aggregate` | ทุก 1 ชม. | KPI หน้า Overview ต้อง fresh |
| `sku_daily_aggregate` | ทุก 1 ชม. | Products tab |
| `hourly_scan_count` | ทุก 1 ชม. | Heatmap |
| `winners` | ทุก 5 นาที (วันประกาศ 15:00) | Operations live |
| `verification_breakdown` | real-time / 5 นาที | Risk alert |
| `rfm_snapshot` | รายสัปดาห์ | ไม่ต้องเร็ว |
| `cohort_retention` | รายสัปดาห์ | ไม่ต้องเร็ว |

---

## 📋 Part 4: Naming Convention + Format

### File naming
```
scan_data_2026-05-19.xlsx
scan_data_2026-05-19_snapshot_0600.xlsx  (multi-snapshot/day)
```

### Sheet headers
- **Row 1:** column names (English snake_case)
- **Row 2+:** data
- **No merged cells, no formatting** — pure data

### Date format
- ISO 8601: `2026-05-19` for dates, `2026-05-19T15:00:00+07:00` for timestamps
- ทุก timestamp ใส่ timezone (Asia/Bangkok = +07:00)

### Number format
- ไม่มี comma separators (raw number)
- Currency: `5670000` ไม่ใช่ `5,670,000`
- Percentages: เก็บเป็น decimal (`0.215` = 21.5%) หรือ integer (`21.5`) — แต่เลือกแบบเดียวสม่ำเสมอ

### Encoding
- UTF-8 with BOM (สำหรับ Excel ภาษาไทย)

---

## 🚀 Part 5: Roadmap ดึงข้อมูล

### Phase 1 — Minimum viable (1 สัปดาห์)
- [ ] `daily_aggregate` (campaign-to-date)
- [ ] `sku_daily_aggregate` (ทุก SKU × ทุกวัน)
- [ ] Validate กับ dashboard ปัจจุบัน (Overview + Products)

### Phase 2 — Operations (2 สัปดาห์)
- [ ] `winners` + workflow update
- [ ] `prizes_inventory` real-time
- [ ] Daily draw automation

### Phase 3 — User analytics (3 สัปดาห์)
- [ ] `user_scan_summary` (incremental refresh)
- [ ] `rfm_snapshot`
- [ ] `cohort_retention`
- [ ] Top scanners + province aggregation

### Phase 4 — Risk & quality (4 สัปดาห์)
- [ ] `scan_verification_log` (real-time)
- [ ] `user_flags` + classification engine
- [ ] Velocity / multi-account / geo detection

### Phase 5 — Advanced (ถ้ามี budget)
- [ ] Hourly scan count (heatmap)
- [ ] Funnel events (open → register → submit → verify)
- [ ] Forecast ML model
- [ ] TV airtime correlation (ถ้าทีมการตลาดส่ง schedule TV ได้)

---

## ❓ คำถามทีม DB ต้องตอบ

1. **DB engine:** PostgreSQL / MySQL / BigQuery / อื่นๆ?
2. **มี table users + scan_history พร้อมแล้วไหม** ในระบบจริง?
3. **มีระบบ verification log** (track ทุก scan attempt — ผ่าน/ไม่ผ่าน) ไหม?
4. **มีระบบ flag fraud อยู่แล้วไหม** หรือต้องสร้างใหม่?
5. **Auto pipeline tool:** Airflow / dbt / cron / manual export?
6. **ส่งเข้า dashboard ทาง:** Excel ผ่าน shared drive / S3 / direct DB connection / REST API?

---

> **Frontend พร้อม swap mock → real data ทันทีเมื่อได้ Excel ตามสเปก**
> Code path: `src/lib/real-data.ts` + `src/lib/daily-sku-data.ts` + `src/lib/per-sku-daily.ts`
