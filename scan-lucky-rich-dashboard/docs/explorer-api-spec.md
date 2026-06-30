# Explorer API Spec — สำหรับทีม Backend (saversureV2)

> **เป้าหมาย:** ปลดล็อกหน้า **Explorer** ในแดชบอร์ดให้ฟิลเตอร์ cross หลายมิติได้จริง
> (ตอนนี้ทุก endpoint เป็น aggregate มิติเดียว pre-computed → cross ไม่ได้)
> ฝั่ง dashboard เตรียม UI ไว้แล้ว (ปุ่มฟิลเตอร์ที่ยังไม่มีข้อมูลเป็น greyed "รอ backend") — เปิด endpoint นี้แล้วเสียบได้ทันที

---

## สิ่งที่ต้องเตรียมก่อน (data layer)
| มิติ | สถานะปัจจุบัน | ต้องทำ |
|---|---|---|
| **อายุ** | `dob` มีใน `users` แล้ว · `db-source` คำนวณ `EXTRACT(YEAR FROM AGE(dob))` | **expose `age`** ผ่าน API (อย่าส่ง dob ดิบ — ส่งเป็น age/ช่วงอายุ) |
| **เพศ** | ❌ ไม่มีใน schema | **เพิ่มคอลัมน์ `gender`** ใน `users` แล้วเริ่มเก็บ |
| **ไซส์ (ซอง/หลอด)** | มีใน product master (gram) | ส่ง `size_tier` ใน `/products` (option) |
| **per-customer / churn** | อ่านได้จาก rollup/snapshot | aggregate จาก rollup — **ห้ามแตะ `scan_history` ดิบ** (hot table) |

---

## Endpoint 1 — `GET /dashboard/explore` (filtered aggregates)
ฟิลเตอร์ทุกตัว **optional** และ **AND-combined** · อ่านจาก rollup/snapshot + cache

### Query params
```
from, to            : ISO date (default = ทั้งแคมเปญ)
sku[]               : รหัส SKU (base code · หลัง normalize SCH-/TUB-)  เช่น sku=L3-8G&sku=L4-8G
sizeTier            : sachet | tube
province[]          : ชื่อจังหวัด
segment             : champion | loyal | potential | at_risk | hibernating | lost | normal
ageFrom, ageTo      : ช่วงอายุ (ปี)
gender              : male | female | unknown
hourFrom, hourTo    : 0-23 (ช่วงเวลาในวัน)
```

### Response
```jsonc
{
  "filtersApplied": { "ageFrom": 18, "ageTo": 25, "sizeTier": "sachet" },
  "totalScans": 12345,
  "distinctUsers": 8123,
  "avgScansPerUser": 1.52,
  "topSkus":     [{ "sku": "L3-8G", "name": "ดีดีครีมแตงโม 8g", "scans": 4200, "size": "sachet" }],
  "byHour":      [{ "hour": 20, "scans": 1800 }],          // 0-23
  "byDay":       [{ "date": "2026-06-15", "scans": 900 }],
  "byProvince":  [{ "name": "กรุงเทพฯ", "scans": 3000, "users": 2100 }],
  "byAgeBucket": [{ "label": "18-24", "users": 1200, "scans": 2600 }],
  "byGender":    [{ "gender": "female", "users": 5000, "scans": 9000 }],
  "sizeMix":     [{ "size": "sachet", "scans": 9000 }, { "size": "tube", "scans": 3345 }],
  "coScan":      [{ "skuA": "L3-8G", "skuB": "L4-8G", "bothScanned": 320 }],
  "retention":   { "firstTime": 4000, "returning": 4123, "churnedAfterFirst": 1800 }
}
```
> ทุก array section คือ "ภายใต้ฟิลเตอร์ที่ส่งมา" — เช่น ส่ง `ageFrom=18&ageTo=25&sizeTier=sachet` แล้ว `topSkus` = SKU ที่กลุ่มอายุ 18-25 สแกนแบบซองมากสุด

---

## Endpoint 2 — `GET /dashboard/explore/customers` (drill-down รายคน — "หา Royalty")
ใช้ฟิลเตอร์ชุดเดียวกับข้อ 1 + pagination · **PII ปลอดภัย** (ส่ง `userHash` ไม่ส่งเบอร์/ชื่อ)

### Query params
```
(ฟิลเตอร์เหมือน Endpoint 1) + limit (default 50), cursor, sortBy (totalScans | lastScan | daysSinceLast)
```

### Response
```jsonc
{
  "rows": [{
    "userHash": "a1b2c3d4",
    "age": 23, "gender": "female", "province": "กรุงเทพฯ",
    "segment": "loyal",
    "totalScans": 47, "skuDiversity": 12,
    "firstScan": "2026-05-18", "lastScan": "2026-06-28",
    "daysSinceLast": 2,
    "royaltyFlag": "vip"          // vip | regular | at_risk | churned
  }],
  "nextCursor": "eyJvZmZzZXQiOjUwfQ=="
}
```

---

## หมายเหตุการ implement
- **อ่านจาก rollup/snapshot tables** (`daily_product_summary`, `daily_scan_hour_summary`, `customer_rfm_snapshots`, `analytics_*`) + cache — ห้าม query `scan_history` ดิบแบบ realtime
- รหัส SKU ที่รับ/ส่ง = **base code** (รวม variant `SCH-`/`TUB-` แล้ว — dashboard ทำ `normalizeSku()` ฝั่ง client ด้วย แต่ถ้า backend รวมให้เลยจะตรงกว่า)
- ถ้าทำ Endpoint 1 ได้ก่อน dashboard ก็ปลดฟิลเตอร์ greyed (จังหวัด/เซกเมนต์/cross) ได้ทันที · Endpoint 2 + age/gender ตามมาทีหลังได้

---

## Dashboard ฝั่งที่พร้อมแล้ว (รออันนี้)
- หน้า **Explorer** (`/jlc-console` → Analytics → Explorer): filter panel + result zones (Top SKU/เทรนด์/co-scan/heatmap/heavy-users/จังหวัด) ใช้ข้อมูลที่มีอยู่
- ปุ่มฟิลเตอร์ **อายุ/เพศ/จังหวัด/เซกเมนต์** เป็น greyed "🔒 รอ backend" — ชี้มาที่เอกสารนี้
- เปิด Endpoint 1 เมื่อไหร่ → wire filter panel เข้ากับ result ได้เลย (Phase 1)
