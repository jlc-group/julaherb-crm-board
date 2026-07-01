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

# CRM Brief — segment / funnel / one-shot (จากบทวิเคราะห์ CRM)
> แปลงกลยุทธ์ CRM เป็น query สเปกที่สั่งงานได้ · ปลดล็อกการ์ด "รอ backend" ในหน้า Explorer

## ⚠️ กติกาการนับ (สำคัญมาก)
ทุกตัวเลข CRM ต้องนับจาก **ผู้ใช้แคมเปญนี้เท่านั้น** (distinct ≈ **82,479 คน** ช่วง 16 พ.ค.–30 มิ.ย.)
**ห้าม**ใช้ snapshot `customer_rfm_snapshots` / engagement ระดับแพลตฟอร์ม (≈ 783,000 คน · พอง ~9.5×)
> อ้างอิงสเกลจริง: success 368,123 ÷ distinct 82,479 ≈ **4.5 สแกน/คน** (ไม่ใช่ 14.38 แบบ platform)

---

## Endpoint 3 — `GET /dashboard/crm/segments` (นับขนาด 7 เซกเมนต์ · campaign-scoped)
พารามิเตอร์เกณฑ์ปรับได้ (default ในวงเล็บ) · นับจาก scan ในแคมเปญ

| key | label | นิยาม (เป็นเกณฑ์ SQL ได้เลย) |
|---|---|---|
| `first_scan` | ลูกค้าใหม่ | สแกนครั้งแรกในแคมเปญ ภายใน `recentDays` (7) วันล่าสุด |
| `one_shot` | สแกนครั้งเดียวแล้วหาย | สแกนรวม = 1 **และ** `daysSinceLast ≥ dropDays` (14) |
| `light_repeat` | ซ้ำเบา | สแกนรวม 2–5 |
| `mid_repeat` | ซ้ำกลาง | สแกนรวม 6–10 |
| `heavy` | สแกนหนัก | สแกนรวม ≥ `heavyMin` (10) |
| `l3_loyalist` | L3-8G Loyalist | สแกน `L3-8G` ≥ `loyalMin` (3) ครั้ง |
| `at_risk` | เสี่ยงหลุด | สแกนรวม ≥ 2 **และ** `daysSinceLast` อยู่ 7–14 |

```jsonc
// response
{ "distinctUsers": 82479, "asOf": "2026-06-30",
  "segments": [
    { "key": "one_shot", "label": "สแกนครั้งเดียวแล้วหาย", "users": 18234, "definition": "scans=1 & daysSinceLast>=14" }
    // …ครบ 7
  ] }
```
> 1 user นับได้หลาย segment (overlap ได้) · ส่ง `definition` มาด้วยเพื่อโปร่งใส

**Endpoint 3b — `GET /dashboard/crm/segments/{key}/members`** (ดึงรายชื่อไปยิง CRM)
params: `limit`, `cursor` → `rows[]{ userHash, totalScans, firstScan, lastScan, daysSinceLast, topSku }` + `nextCursor` (PII-safe)

---

## Endpoint 4 — `GET /dashboard/crm/funnel` (upsell funnel เช่น L3-8G → L3-40G)
params: `entrySku` (L3-8G), `upsizeSku` (L3-40G), `repeatMin` (2), `from`, `to`
```jsonc
{ "entrySku": "L3-8G", "upsizeSku": "L3-40G",
  "stages": [
    { "key": "scanned_entry",     "label": "สแกน L3-8G",              "users": 40120 },
    { "key": "repeat_entry",      "label": "สแกน L3-8G ซ้ำ (≥2)",     "users": 21030 },
    { "key": "also_upsize",       "label": "สแกน L3-40G ด้วย",         "users": 3120 },
    { "key": "upsell_target",     "label": "ยังไม่เคยสแกน L3-40G",     "users": 17910 }  // = repeat_entry − also_upsize
  ] }
```
> `upsell_target` = กลุ่มที่ควรยิง "อัปไซส์ 40G" · เรียก 3b-style เพื่อดึง userHash ของ stage นี้

---

## Endpoint 5 — `GET /dashboard/crm/one-shot` (recovery cohort)
จัดกลุ่มตาม "สัปดาห์ที่สแกนครั้งแรก" → กลับมาภายใน 3/7/14 วันไหม
```jsonc
{ "cohorts": [
    { "firstScanWeek": "2026-05-16", "newUsers": 5745,
      "returnedWithin3d": 0.41, "within7d": 0.58, "within14d": 0.66 }
  ],
  "currentOneShotNotReturned": 18234   // = เป้า win-back ตอนนี้
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
