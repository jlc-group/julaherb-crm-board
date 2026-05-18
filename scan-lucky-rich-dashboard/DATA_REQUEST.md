# 📊 Data Request — สแกนลุ้นรวย สวยลุ้นล้าน Dashboard

> ส่งข้อมูลกลับมาเป็นไฟล์ Excel (`.xlsx`) **1 ไฟล์ หลาย sheet** ตามรายการด้านล่าง
> วันที่ snapshot: ใส่ใน sheet `_meta` หรือชื่อไฟล์ (เช่น `scan_data_2026-05-18.xlsx`)

---

## 📁 โครงสร้างไฟล์ Excel ที่อยากได้

| Sheet name | ใช้ในส่วนไหน | ความถี่ที่อัปเดต |
|------------|------------|-------------------|
| `_meta` | metadata | ทุกครั้ง |
| `scans` | ทุกหน้า (Overview, Customers, Products, Channels) | ทุกวัน |
| `users` | Customers, Risk | ทุกวัน |
| `winners` | Operations | ทุกวัน |
| `daily_rollup` | Trend charts | ทุกวัน |
| `hourly_today` | Overview (hourly chart) | ทุกชั่วโมง |
| `product_master` | Products tab (filter/join) | ตอนเริ่มแคมเปญ + เมื่อมี SKU ใหม่ |
| `channels` | Channels tab | ทุกวัน |
| `partner_shops` | Channels tab (drill-down) | สัปดาห์ละครั้ง |
| `flags_risk` | Risk tab | ทุกวัน |
| `prizes_inventory` | Operations tab | ทุกวัน |

---

## 1️⃣ Sheet: `_meta`

| field | example |
|-------|---------|
| snapshot_date | 2026-05-18 |
| snapshot_time | 23:59:00 |
| campaign_start | 2026-05-16 |
| campaign_end | 2026-12-18 |
| db_source | production / staging |
| notes | (optional) |

---

## 2️⃣ Sheet: `scans` ⭐ สำคัญที่สุด

**1 row = 1 scan event** (ทุก scan ในแคมเปญ)

| column | type | required | description |
|--------|------|----------|-------------|
| scan_id | string/uuid | ✅ | PK ของ scan |
| user_id | string | ✅ | FK → users.id |
| product_sku | string | ✅ | FK → product_master.sku |
| scan_code | string | ✅ | QR code ที่สแกน (8-char) |
| rights_earned | int | ✅ | สิทธิ์ที่ได้จาก scan นี้ |
| scanned_at | datetime | ✅ | ISO 8601 (รวม timezone) |
| channel | string | ✅ | '7-Eleven' / 'Watson' / 'Shopee' / 'Lazada' / 'TikTok Shop' / 'ตัวแทน' |
| partner_shop_id | string | ⚪ | สาขา/ร้านที่ scan เกิด (ถ้ามี) |
| province | string | ✅ | จังหวัดของ user หรือ shop ตอน scan |
| device_type | string | ⚪ | 'iOS' / 'Android' / 'Web' |
| ip_address | string | ⚪ | สำหรับ fraud detection |
| is_valid | boolean | ⚪ | scan ผ่าน verify หรือไม่ |
| is_duplicate | boolean | ⚪ | duplicate flag |

**SQL ตัวอย่าง:**
```sql
SELECT
  scan_id,
  user_id,
  product_sku,
  scan_code,
  rights_earned,
  scanned_at,
  channel,
  partner_shop_id,
  province,
  device_type,
  ip_address,
  is_valid,
  is_duplicate
FROM scan_history
WHERE scanned_at >= '2026-05-16'
ORDER BY scanned_at DESC;
```

---

## 3️⃣ Sheet: `users`

**1 row = 1 customer** (ทุกคนที่ลงทะเบียน/scan แล้ว)

| column | type | required | description |
|--------|------|----------|-------------|
| user_id | string | ✅ | PK |
| display_name | string | ✅ | ชื่อ-สกุล (อนุญาตแสดงในตาราง) |
| phone | string | ✅ | เบอร์เต็ม (จะ mask ที่ frontend) |
| email | string | ⚪ |  |
| line_user_id | string | ⚪ |  |
| registered_at | datetime | ✅ | วันลงทะเบียน |
| first_scan_at | datetime | ⚪ | scan ครั้งแรก |
| last_scan_at | datetime | ⚪ | scan ล่าสุด |
| total_scans | int | ✅ | จำนวน scan สะสม |
| total_rights | int | ✅ | สิทธิ์สะสม |
| province | string | ✅ | จังหวัดลงทะเบียน |
| reg_province | string | ⚪ | (ถ้าต่างจาก province) — สำหรับ geo mismatch |
| age | int | ⚪ |  |
| gender | string | ⚪ | 'M' / 'F' / 'O' |
| is_new_customer | boolean | ✅ | ลูกค้าใหม่จากแคมเปญนี้ |
| customer_tier | string | ⚪ | 'Heavy' / 'Mid' / 'Light' |
| rfm_segment | string | ⚪ | 'Champion' / 'Loyal' / 'At Risk' / etc. |
| risk_score | int (0-100) | ⚪ | คะแนน fraud risk |
| is_flagged | boolean | ⚪ | ถูก flag แล้ว |
| acquisition_source | string | ⚪ | 'ThairathTV' / 'LINE' / 'FB' / 'TikTok' / 'KOL' / 'Organic' |

**SQL ตัวอย่าง:**
```sql
SELECT
  u.id AS user_id,
  u.display_name,
  u.phone,
  u.email,
  u.created_at AS registered_at,
  MIN(s.scanned_at) AS first_scan_at,
  MAX(s.scanned_at) AS last_scan_at,
  COUNT(s.scan_id) AS total_scans,
  COALESCE(SUM(s.rights_earned), 0) AS total_rights,
  u.province,
  u.is_new_customer,
  -- ใส่ join risk/RFM ถ้ามี
  COALESCE(rf.risk_score, 0) AS risk_score,
  COALESCE(rf.is_flagged, FALSE) AS is_flagged
FROM users u
LEFT JOIN scan_history s ON s.user_id = u.id
LEFT JOIN user_flag_histories rf ON rf.user_id = u.id
GROUP BY u.id, rf.risk_score, rf.is_flagged;
```

---

## 4️⃣ Sheet: `winners`

**1 row = 1 ผู้โชคดี** (จาก daily / monthly / final draws)

| column | type | required | description |
|--------|------|----------|-------------|
| winner_id | string | ✅ |  |
| user_id | string | ✅ | FK → users |
| draw_date | date | ✅ | วันจับรางวัล |
| tier | string | ✅ | '10K' / '100K' / '1M' |
| prize_label | string | ✅ | 'ทองคำ 1 สลึง' / 'ทองคำ 10 บาท' / 'เงินสด 1,000,000' |
| prize_value_thb | int | ✅ | มูลค่าเงินบาท |
| status | string | ✅ | 'confirmed' / 'pending' / 'forfeited' / 'unannounced' |
| announced_at | datetime | ⚪ | เวลาประกาศ (เช็ค SLA 15:00) |
| contacted_at | datetime | ⚪ |  |
| confirmed_at | datetime | ⚪ |  |
| forfeited_reason | string | ⚪ |  |
| announcement_channel | string | ⚪ | 'ThairathOnline' / 'LINE_OA' / 'Both' |
| product_sku_at_win | string | ⚪ | scan ที่ทำให้ชนะ |

---

## 5️⃣ Sheet: `daily_rollup`

**1 row = 1 day** — pre-aggregated สำหรับ trend chart

| column | type | description |
|--------|------|-------------|
| date | date | ✅ |
| total_scans | int |  |
| total_rights | int |  |
| unique_users | int |  |
| new_users | int |  |
| returning_users | int |  |
| flagged_users_added | int | risk flags ที่เพิ่มวันนี้ |
| announced_winners | int | จำนวนคนที่ประกาศวันนี้ |
| top_channel | string | channel ที่ scan สูงสุดวันนี้ |
| top_province | string |  |

**SQL ตัวอย่าง:**
```sql
SELECT
  DATE(scanned_at) AS date,
  COUNT(*) AS total_scans,
  SUM(rights_earned) AS total_rights,
  COUNT(DISTINCT user_id) AS unique_users,
  COUNT(DISTINCT CASE WHEN u.is_new_customer THEN s.user_id END) AS new_users,
  COUNT(DISTINCT CASE WHEN NOT u.is_new_customer THEN s.user_id END) AS returning_users
FROM scan_history s
JOIN users u ON u.id = s.user_id
WHERE scanned_at >= '2026-05-16'
GROUP BY DATE(scanned_at)
ORDER BY date;
```

---

## 6️⃣ Sheet: `hourly_today`

**1 row = 1 hour (today)** — 24 rows (00:00 → 23:00)
+ เพิ่ม 24 rows สำหรับเมื่อวานเพื่อเปรียบเทียบ

| column | type | description |
|--------|------|-------------|
| date | date | วันนี้ / เมื่อวาน |
| hour | int (0-23) |  |
| scans | int |  |
| rights | int |  |
| unique_users | int |  |

---

## 7️⃣ Sheet: `product_master`

**1 row = 1 SKU** (97 rows)

| column | type | description |
|--------|------|-------------|
| sku | string | ✅ |
| name | string | ✅ ชื่อสินค้า |
| tier | string | ✅ 'ซอง' / 'หลอด' / 'เซ็ต' |
| price_thb | int |  |
| rights_per_scan | int | สิทธิ์ที่ได้ต่อ 1 scan |
| total_scans_lifetime | int | scan สะสมทั้งแคมเปญ |
| total_rights_lifetime | int | สิทธิ์สะสมจาก SKU นี้ |
| is_dead_sku | boolean | ⚪ ไม่มี scan 14+ วัน |
| stock_remaining | int | ⚪ ของคงเหลือ (ถ้ารู้) |

---

## 8️⃣ Sheet: `channels`

**1 row = 1 channel × 1 day** (สำหรับ channel trend)

| column | type | description |
|--------|------|-------------|
| date | date |  |
| channel | string | '7-Eleven' / 'Watson' / 'Shopee' / 'Lazada' / 'TikTok Shop' / 'ตัวแทน' |
| scans | int |  |
| rights | int |  |
| unique_users | int |  |
| new_users | int |  |

**SQL ตัวอย่าง:**
```sql
SELECT
  DATE(scanned_at) AS date,
  channel,
  COUNT(*) AS scans,
  SUM(rights_earned) AS rights,
  COUNT(DISTINCT user_id) AS unique_users
FROM scan_history
WHERE scanned_at >= '2026-05-16'
GROUP BY DATE(scanned_at), channel
ORDER BY date, channel;
```

---

## 9️⃣ Sheet: `partner_shops`

**1 row = 1 ร้าน/สาขา** (สำหรับ heatmap × shop ranking)

| column | type | description |
|--------|------|-------------|
| shop_id | string | ✅ |
| shop_name | string | ✅ เช่น "7-Eleven สาขาสีลม" |
| channel | string | ✅ '7-Eleven' / 'Watson' |
| province | string | ✅ |
| total_scans | int |  |
| unique_users | int |  |
| last_scan_at | datetime |  |

---

## 🔟 Sheet: `flags_risk`

**1 row = 1 flag event** สำหรับ Risk tab

| column | type | description |
|--------|------|-------------|
| flag_id | string | ✅ |
| user_id | string | ✅ |
| flag_type | string | ✅ 'velocity' / 'multi_account' / 'geo_mismatch' / 'device_dup' |
| severity | string | ✅ 'low' / 'medium' / 'high' |
| flagged_at | datetime | ✅ |
| status | string | ✅ 'flagged' / 'watching' / 'cleared' |
| detail | string/json | ⚪ เช่น "5 scans in 60s" |
| evidence_user_ids | string | ⚪ (csv ของ related users) |

---

## 1️⃣1️⃣ Sheet: `prizes_inventory`

**1 row = 1 prize tier**

| column | type | description |
|--------|------|-------------|
| tier | string | '10K' / '100K' / '1M' |
| tier_label | string | 'ทองคำ 1 สลึง' |
| total_count | int | 167 / 30 / 1 |
| awarded_count | int | ที่แจกไปแล้ว (status != unannounced) |
| confirmed_count | int |  |
| pending_count | int |  |
| forfeited_count | int |  |
| remaining_count | int | total - awarded |
| value_per_unit_thb | int |  |
| total_value_thb | int |  |

---

## 📦 รูปแบบไฟล์ที่อยากได้

```
scan_data_YYYY-MM-DD.xlsx
├── _meta
├── scans              (~ N rows, อาจเยอะมาก)
├── users              (~ 10K rows)
├── winners            (~ 200 rows)
├── daily_rollup       (~ 217 rows สำหรับ 7 เดือน)
├── hourly_today       (48 rows: วันนี้ + เมื่อวาน)
├── product_master     (97 rows)
├── channels           (~ 217 × 6 = 1,302 rows)
├── partner_shops      (~ 200-1000 rows ขึ้นอยู่กับ POS)
├── flags_risk         (~ varies)
└── prizes_inventory   (3 rows)
```

> 💡 **ถ้า `scans` ใหญ่เกินไป** (Excel limit 1M rows) → ส่งเป็น CSV แยกต่างหากแทน sheet
> 💡 **ถ้ายังไม่มีตาราง risk/RFM** → ข้ามไป (dashboard มี fallback)
> 💡 **ขั้นต่ำสุดที่ขับ dashboard ได้** = `scans` + `users` + `product_master` + `winners`

---

## 🎯 Priority — ถ้าทำทุกอันไม่ได้ ส่ง 4 อันนี้ก่อน

1. **`scans`** ⭐ (ขับ chart ทุกอันใน Overview/Channels/Products)
2. **`users`** ⭐ (Customers tab + join กับ scans)
3. **`product_master`** (Products tab + lookup ชื่อ SKU)
4. **`winners`** (Operations tab)

ที่เหลือ derive ได้จาก 4 sheets นี้ที่ frontend
