# API Audit — สแกนลุ้นรวย สวยลุ้นล้าน Dashboard
> สรุปฉบับละเอียด: API ที่มีแล้ว vs ยังไม่มี · อัปเดต 1 ก.ค. 2026 หลังตรวจ repo `julaherb-crm-board`
> ตัวเลขอ้างอิงแคมเปญ (16 พ.ค.–30 มิ.ย.): success **368,123** · distinct **82,479 คน**

## TL;DR
- **มี internal Next.js API route แล้ว 38 route** — build ผ่านและหน้า dashboard เรียกผ่าน `useApi` / `fetch` ได้
- **แยก source ให้ชัด:** บาง route เป็น backend saversureV2 จริง, บาง route เป็น internal/local JSON, บาง widget ยัง static/mock
- **ยังไม่มี backend หลัก:** Explorer รายคน/cross-filter, Risk fraud, อายุ/เพศ, channel/source, cohort/funnel/TV-lift
- **ต้องแก้ scope:** `engagement` / `segments` / `rfm` ตอนนี้ยังเป็น **ทั้งระบบ saversure (~783k)** ไม่ใช่ **เฉพาะแคมเปญ (~82k)**

---

## 0) Legend — สถานะข้อมูลในเอกสารนี้
| สัญลักษณ์ | ความหมาย | ตัวอย่าง |
|---|---|---|
| 🟢 Backend real | route ภายใน dashboard map ไป saversureV2 จริงผ่าน `DATA_SOURCE=api` | `/api/scans/totals`, `/api/sku/per-day` |
| 🟡 Internal real/local | route ใช้งานจริง แต่ source เป็นไฟล์ local/dashboard server ไม่ใช่ saversureV2 source of truth | `/api/draw/winners`, `/api/draw/appointments`, `/api/draw/claims` |
| 🟠 Static snapshot | ตัวเลข/ตาราง hardcode จากสไลด์หรือไฟล์ snapshot ใน repo | `MONTHLY_ALL_SCAN`, `PER_SKU_DAILY`, `FIRST_SCAN_SKUS` |
| 🔴 Mock/demo | ข้อมูลตัวอย่างเพื่อ demo เท่านั้น | Risk multi-account/geo/risk-score, ScanBehavior TV/funnel/cohort |
| 🔒 Waiting backend | UI เตรียมไว้แล้ว แต่ต้องมี endpoint ใหม่ก่อน | Explorer zone D, age/gender, `/customers/risk` |
| ⚠️ Scope issue | ข้อมูลจริงแต่ scope ไม่ตรงแคมเปญ | engagement/rfm/segments = ทั้งระบบ |

---

## 1) ✅ API ที่มีแล้ว (38 internal route)

### แคมเปญ / สแกน
| route | ใช้ทำอะไร | สถานะ / หมายเหตุ |
|---|---|---|
| `/api/scans/totals` | success/attempts/distinct/tickets | 🟢 source of truth ระดับแคมเปญ |
| `/api/scans/timeseries` | สแกนรายวัน | 🟢 มี route จริง แต่บาง widget ใช้ `/api/daily` แทน |
| `/api/scans/time-of-day` | 7 ช่วงเวลา + พีค | 🟢 |
| `/api/scans/day-hour` | heatmap วัน×ชั่วโมง | 🟢 ใช้ใน Overview/Explorer |
| `/api/scans/verification` | success/dupSelf/dupOther/notFound + เหตุผล | 🟢 route มีจริง · บาง panel ยังใช้ static mock อยู่ |
| `/api/daily` · `/api/daily/[date]` | รายวัน (success/dup/tickets/members) | 🟢 ใช้เป็น base หลายการ์ด |
| `/api/members/daily` | สมาชิกใหม่/เก่า รายวัน | 🟢 |
| `/api/system/uptime` | outage/uptime | 🟢 |
| `/api/baseline/compare` | เทียบ มี.ค./เม.ย./พ.ค. | 🟡 ก่อนแคมเปญคืน 0 เพราะยังไม่มีข้อมูลย้อนหลัง |

### ลูกค้า
| route | ใช้ทำอะไร | สถานะ / หมายเหตุ |
|---|---|---|
| `/api/customers/engagement` | บัคเก็ต 1 / 2-5 / 6-10 / 10+ สแกน | ⚠️ ข้อมูลจริงแต่เป็น **ทั้งระบบ** ต้องแก้ scope เป็นแคมเปญ |
| `/api/customers/heavy-users` | ผู้สแกนหนัก top-N รายวัน | 🟢 แต่ `skuDiversity=0` เพราะ backend ยังไม่ส่ง |
| `/api/customers/provinces` | จังหวัด top-N รายวัน | 🟢 มี “ไม่ระบุ” เยอะ = data-quality |
| `/api/customers/retention` | ครั้งแรก vs กลับมา (วันเดียว) | 🟢 derive จาก campaign daily |
| `/api/customers/segments` | จำนวนต่อ segment | ⚠️ ข้อมูลจริงแต่เป็น **ทั้งระบบ** |
| `/api/customers/rfm` | RFM risk level | ⚠️ ข้อมูลจริงแต่เป็น **ทั้งระบบ** |
| `/api/customers/search` · `/api/customers/address` | ค้นหา / ที่อยู่รายคน | 🟢 read-only ผ่าน saversureV2 customer search/detail |

### สินค้า / SKU
| route | ใช้ทำอะไร | สถานะ / หมายเหตุ |
|---|---|---|
| `/api/sku/list` | แคตตาล็อก SKU + rightsPerScan | 🟢 |
| `/api/sku/per-day` | ยอดต่อ SKU ตามช่วงวัน (normalize SCH-/TUB-) | 🟢 ใช้ Hero/Top/Tier/Dead count |
| `/api/sku/[sku]/timeseries` | เทรนด์ราย SKU | 🟢 |
| `/api/sku/daily-matrix` | SKU × วัน สำหรับ sparkline/growth | 🟢 |
| `/api/sku/co-scan` | คู่ SKU ที่สแกนด้วยกัน | 🟢 |
| `/api/sku/rank-history` | อันดับ SKU รายวัน | 🟢 fallback static ถ้า API ว่าง |

### รางวัล / รับรางวัล / print
| route | ใช้ทำอะไร | สถานะ / หมายเหตุ |
|---|---|---|
| `/api/draw/winners` | อ่าน/บันทึก/ลบผู้ได้รางวัล | 🟡 internal real แต่เก็บ `draw-winners.json` ใน `DATA_DIR` |
| `/api/draw/winners/export` | export ผู้ได้รางวัล | 🟡 internal real |
| `/api/draw/pool` | pool ผู้มีสิทธิ์ตามรอบ | 🟢/🟡 ดึงจาก print-slips ได้ แต่ ranking logic บางส่วนยังเป็น logic ฝั่ง dashboard |
| `/api/draw/appointments` | จอง/ดูคิวรับรางวัล | 🟡 internal real แต่เก็บ `draw-appointments.json` |
| `/api/draw/claims` | แอดมินดู/อัปเดต claim | 🟡 internal real แต่เก็บ `draw-claims.json` + files local |
| `/api/draw/resolve-code` | resolve รหัส/เบอร์ผู้ชนะ | 🟢/🟡 ใช้ print-slips index + local winner flow |
| `/api/claim/verify` · `/submit` · `/file` | ฝั่งลูกค้า claim/อัปโหลดเอกสาร | 🟡 internal real · มี PII ใน local files ต้องดูแล retention |
| `/api/winners/public` | หน้า public winners | 🟡 อ่านจาก local winners |
| `/api/print-slips` · `/api/print-slips-pdf` | รายชื่อสิทธิ์พิมพ์ / PDF | 🟢 route ต่อ backend rollup + internal PDF generation |
| `/api/export` | export dashboard | 🟡 internal route |

### ระบบ
| route | ใช้ทำอะไร | สถานะ / หมายเหตุ |
|---|---|---|
| `/api/auth/refresh` | refresh token saversureV2 | 🟢 |

---

## 2) 📋 สถานะรายหน้าแบบละเอียด (sidebar 10 หน้า)

| หน้า | สถานะจริง | ยังขาด / ข้อควรระวัง |
|---|---|---|
| **CRM Center** | 🟡 ใช้ API จริงหลายตัว | ⚠️ `engagement` + `segments` ยังเป็นทั้งระบบ ไม่ใช่แคมเปญ |
| **Scan Overview** | ✅ เกือบครบ | 🟠 ม.ค.–พ.ค. static · baseline ก่อนแคมเปญ = 0 · บาง badge อ้าง `/timeseries` แต่กราฟหลักใช้ `/daily` |
| **Customers** | 🟡 ส่วนใหญ่จริง | 🔒 อายุ/เพศ · ⚠️ engagement/rfm/segments scope ทั้งระบบ |
| **Products** | 🟡 API จริงเยอะ | 🟠 `FirstScanCard` + `ProductMasterTable` ยัง static snapshot; Report Top SKU ยัง snapshot |
| **Explorer** | 🟡 A/B/C จริง | 🔒 Zone D ทั้งหมดรอ backend cross-filter/customer drill-down |
| **Operations** | 🟡 ใช้งานจริงใน dashboard | local JSON เป็น source of truth ชั่วคราว; pool ranking บางส่วน logic dashboard |
| **Claim** | 🟡 ใช้งานจริงใน dashboard | local JSON/files เก็บ PII; ต้องระวัง `DATA_DIR` + retention |
| **Print List** | ✅ ครบจริง | คัดพนักงานออกด้วย config `EMPLOYEE_EXCLUDE_NAMES` |
| **Risk Watch** | 🔴 mock/static เยอะ | ยังไม่มี `/api/customers/risk`; tab ยังไม่ได้ wire `/api/customers/heavy-users` โดยตรง |
| **Report** | 🟡 ส่วนใหญ่จริง | ⚠️ engagement/segments scope; Top SKU ยัง snapshot จาก `buildSkuTable('all')` |

### 2.1 CRM Center
- KPI ลูกค้าทั้งหมด: `/api/scans/totals` 🟢
- Repeat / one-time / avg scans: `/api/customers/engagement` ⚠️ ทั้งระบบ
- สมัครใหม่: `/api/members/daily` 🟢
- จังหวัด: `/api/customers/provinces?date&limit` 🟢
- Loyal/Champion: `/api/customers/segments` ⚠️ ทั้งระบบ

### 2.2 Scan Overview
- KPI + สถานะ: `/api/scans/totals`, `/api/members/daily`, `/api/system/uptime`, `/api/daily` 🟢
- ภาพรวมทั้งปี: 🟠 ม.ค.–พ.ค. จาก `MONTHLY_ALL_SCAN`; มิ.ย.+ จาก `/api/daily` 🟢
- Trend line: ใช้ `DailyRow[]` จาก `/api/daily` ใน `OverviewTab` 🟢
- Heatmap: `/api/scans/day-hour` 🟢
- Weekly Momentum / Monthly / Apples-DoW: คำนวณจาก `/api/daily` 🟢
- Baseline: `/api/baseline/compare` 🟡 ก่อนแคมเปญคืน 0

### 2.3 Customers
- Hero ใหม่/เก่า: `/api/scans/totals` + `/api/members/daily` 🟢
- KPI: `/api/scans/totals` + `/api/customers/engagement` + `/api/customers/heavy-users` 🟢/⚠️
- Engagement: `/api/customers/engagement` ⚠️ ทั้งระบบ
- Age Distribution: `/api/customers/age-distribution` 🔒 ยังไม่มี route → แสดง placeholder ชัดเจน
- Value Segments: `/api/customers/rfm` + `/api/customers/segments` ⚠️ ทั้งระบบ
- Heavy Users / Provinces: `/api/customers/heavy-users`, `/api/customers/provinces` 🟢

### 2.4 Products
- KPI + Hero + Tier Mix + Category Mix: `/api/sku/per-day` 🟢
- ตารางจัดอันดับสินค้า + sparkline/growth: `/api/sku/per-day` + `/api/sku/daily-matrix` 🟢
- เทรนด์ราย SKU: `/api/sku/[sku]/timeseries` 🟢
- Cross-scan: `/api/sku/co-scan` 🟢
- Rank Movement: `/api/sku/rank-history` 🟢 พร้อม fallback static
- First Scan / Entry Product: `FIRST_SCAN_SKUS` 🟠 static snapshot
- Master Table: `PRODUCTS_MASTER` + `PER_SKU_DAILY` 🟠 static snapshot 16–24 พ.ค.

### 2.5 Explorer
- A เวลา heatmap: `/api/scans/day-hour` 🟢
- B จังหวัด: `/api/customers/provinces` 🟢
- C Heavy users: `/api/customers/heavy-users` 🟢
- D CRM รายคน: 🔒 รอ `/dashboard/explore` + `/dashboard/explore/customers` + `/dashboard/crm/*`

### 2.6 Operations
- ผู้ได้รางวัล: `/api/draw/winners` 🟡 local JSON
- Pool ผู้มีสิทธิ์: `/api/draw/pool?round` 🟢/🟡
- Export: `/api/draw/winners/export` 🟡
- รอบจับ: `DRAW_ROUNDS` config 🟠
- Address enrichment: `/api/customers/address` 🟢

### 2.7 Claim
- แอดมินนัด/claim: `/api/draw/appointments` + `/api/draw/claims` 🟡 local JSON/files
- ฝั่งลูกค้า `/claim`: `/api/claim/verify`, `/api/claim/submit`, `/api/claim/file` 🟡 local source
- หมายเหตุ: เป็นระบบใช้งานจริงใน dashboard แต่ยังไม่ใช่ backend source of truth ของ saversureV2

### 2.8 Print List
- `/api/print-slips` 🟢
- `/api/print-slips-pdf` 🟢/🟡 PDF generation ฝั่ง dashboard
- `/api/scans/totals` 🟢
- Employee exclude: `EMPLOYEE_EXCLUDE_NAMES` config 🟠

### 2.9 Risk Watch
- Velocity / risk ranking / multi-account / geo mismatch: 🔴 mock/static (`MOCK_USERS` + hardcoded arrays)
- Verification/Heavy panel บางส่วนในหน้านี้ยังใช้ static daily mock ไม่ใช่ live API
- ต้องการ backend: `/api/customers/risk?date=` หรือ upstream `/customers/risk` เพื่อรวม velocity, multi-account, geo mismatch, score ranking

### 2.10 Report
- Campaign KPIs: `/api/scans/totals`, `/api/daily`, `/api/members/daily`, `/api/system/uptime` 🟢
- CRM: `/api/customers/engagement`, `/api/customers/segments` ⚠️ scope ทั้งระบบ
- Provinces / heavy users: `/api/customers/provinces`, `/api/customers/heavy-users` 🟢
- Top SKU slide: `buildSkuTable('all')` 🟠 snapshot ยังไม่ใช้ `/api/sku/per-day`

### 2.11 Orphan — Scan Behavior
- ไม่อยู่ sidebar แล้ว แต่ component ยังมี
- ใช้จริง: `/api/baseline/compare` 🟡
- Mock/static: TV airtime, funnel, heatmap, retention cohort (`scan-behavior-data.ts`) 🔴

---

## 3) ❌ API ที่ยังไม่มี (เรียง priority)

| Priority | Endpoint / capability | ปลดล็อกหน้า | ต่อแล้วเห็นอะไร |
|---|---|---|---|
| **P0** | `/dashboard/explore` + `/dashboard/explore/customers` | Explorer Zone D | cross-filter อายุ×จังหวัด×SKU + drill-down รายคน + royalty flag |
| **P0** | `/dashboard/crm/segments` campaign-scoped + members endpoint | Explorer / CRM / Report | 7 segment จริงในแคมเปญ + ดึงรายชื่อยิง CRM แบบ PII-safe |
| **P0** | `/dashboard/crm/funnel` | Explorer / CRM | L3-8G → L3-40G upsell funnel |
| **P0** | `/dashboard/crm/one-shot` | Explorer / CRM | cohort สแกนครั้งเดียวแล้วหาย + win-back target |
| **P0** | expose `age` / `ageBucket` + เพิ่ม `gender` | Customers / Explorer | age/gender card + cross-filter |
| **P0** | campaign-scoped `engagement` / `rfm` / `segments` | Customers / CRM Center / Report | ตัวเลขไม่พองจากทั้งระบบ 783k |
| **P1** | `/customers/risk` | Risk Watch | fraud/velocity/multi-account/geo mismatch ranking จริง |
| **P2** | `/retention/cohort` · `/funnel` · `/tv-lift` | Scan Behavior / future analytics | cohort retention, scan funnel, TV-lift จริง |
| **P2** | `channel/source` ตอนสแกน | ช่องทางขาย / CRM | แยก 7-11/Shopee/TikTok/ตัวแทนได้จริง |

รายละเอียด query spec ของ P0 อยู่ใน [`explorer-api-spec.md`](./explorer-api-spec.md)

---

## 4) ⚠️ Scope issue สำคัญ
`engagement` / `segments` / `rfm` ตอนนี้นับ **ทั้งระบบ saversure (~783,000 คน)** → ต้องนับ **เฉพาะแคมเปญ (~82,479 คน)**

ผลกระทบ:
- **Customers:** Engagement / RFM / Value Segments อาจทำให้ฐานลูกค้าใหญ่เกินจริง
- **CRM Center:** Repeat%, Loyal, Champions, one-shot sizing อาจเป็น platform-wide ไม่ใช่ campaign-wide
- **Report:** CRM Strategy slides อาจสรุปกลุ่มเป้าหมายผิด scope

อ้างอิงสเกลจริง:
- success 368,123 ÷ distinct 82,479 ≈ **4.5 สแกน/คน**
- ไม่ควรใช้ค่า platform เช่น 14.38 สแกน/คนแทนแคมเปญ

---

## 5) 🔧 เตรียม data layer สำหรับ backend
| มิติ | สถานะ | ต้องทำ |
|---|---|---|
| **อายุ** | `dob` อยู่ใน `users` แต่ต้องเช็คว่าเป็นวัน/เดือน/ปีเต็มหรือแค่ปีเกิด | คำนวณ `age = ปีปัจจุบัน − ปีเกิด` แล้ว expose `ageBucket`; ห้ามส่ง dob ดิบ |
| **เพศ** | ยังไม่มีใน schema | เพิ่ม `gender` และเริ่มเก็บ; ส่ง `unknown` เมื่อไม่มีข้อมูล |
| **channel/source** | ยังไม่เก็บตอนสแกน | เก็บ source เช่น 7-11/Shopee/TikTok/ตัวแทน ตั้งแต่ scan event |
| **per-customer/cohort** | ทำได้จาก rollup/snapshot | aggregate จาก rollup/cache; หลีกเลี่ยง query `scan_history` ดิบแบบ realtime |
| **risk** | heavy users มีบางส่วน | ต้องมี rules/score ที่รวม velocity, multi-account, geo mismatch, SKU diversity |

---

## 6) คำแนะนำการแก้ฝั่ง dashboard ก่อน backend พร้อม
1. ใช้ badge/source label ตาม legend นี้ เพื่อไม่ให้ `local`/`static` ถูกเข้าใจว่าเป็น backend real
2. Products: แยกชัดว่า Top/Trend/Rank ใช้ API แล้ว แต่ First Scan/Master Table ยัง static
3. Risk: คง DemoBanner ไว้จนกว่าจะมี `/customers/risk`
4. CRM Center/Report: ใส่คำเตือน scope issue ในจุดที่ใช้ engagement/segments/rfm
5. Operations/Claim: ระบุ `DATA_DIR` / local persistence ใน runbook เพราะมี PII และไฟล์อัปโหลด

---

## หมายเหตุ implementation
- **DATA_SOURCE**: `api` = saversureV2 จริง · `mock` = ข้อมูลนิ่ง · `db` = ห้ามใช้ตามสถาปัตยกรรมนี้
- ทุก endpoint หลักผ่าน `useApi` → internal `/api/*` → `adapter.ts` → `api-source.ts`
- รหัส SKU ที่รับ/ส่งควรเป็น base code หลัง normalize variant `SCH-`/`TUB-`
- ระบบ draw/claim ใช้งานจริงใน dashboard แต่เป็น **local source** จนกว่าจะย้ายไป backend ถาวร
