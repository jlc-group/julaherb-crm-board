# 📋 API Handoff — Dashboard "สแกนลุ้นรวย สวยลุ้นล้าน"

> เอกสารส่งต่อให้ Dev: สรุปว่า "หน้าไหน/ส่วนไหน ยังไม่มี API จริง" และต้องทำอะไรบ้าง
> อัปเดต: 2026-06-15 · ขอบเขต: `scan-lucky-rich-dashboard/`

---

## 1. ภาพรวมสถาปัตยกรรมข้อมูล (อ่านก่อน)

ทุก API route ภายใน (`src/app/api/**`) ที่เป็น "ข้อมูลวิเคราะห์" จะเรียกผ่าน **data-source adapter** ตัวเดียว:

```
Component → useApi('/api/xxx') → route.ts → ds.method() → [ mock | api | db ]
```

เลือกแหล่งด้วย env `DATA_SOURCE` ใน [src/lib/api/adapter.ts](src/lib/api/adapter.ts):

| ค่า | ความหมาย | สถานะ |
|-----|----------|-------|
| `mock` (ค่าเริ่มต้น) | อ่านจากไฟล์ static ใน `src/lib/` | ✅ ครบ 18/18 method |
| `api` | ยิงไป backend จริง **saversureV2** | ✅ 17/18 (ขาด time-of-day) |
| `db` | ต่อ Postgres ตรง | 🔴 **0/18 — ยังไม่ทำเลย** (มีแต่ comment SQL template ใน [db-source.ts](src/lib/api/db-source.ts)) |

**สรุปหลักการ:** หน้าส่วนใหญ่ "ผูก adapter ไว้แล้ว" — พอ backend มี endpoint ครบ แค่ตั้ง `DATA_SOURCE=api` ก็ใช้ข้อมูลจริงโดยไม่ต้องแก้ component. งานที่เหลือคือ (ก) endpoint ที่ backend ยังไม่ส่ง, (ข) หน้าที่ hardcode ไว้ในตัว component ยังไม่ได้ผูก adapter, (ค) ระบบจับรางวัลที่เป็นไฟล์ local

> 🔌 Backend ปัจจุบัน: `SAVERSURE_API_BASE_URL=http://localhost:30400/api/v1` — endpoint ที่ api-source ใช้แล้ว: `/auth/login`, `/dashboard/campaign-daily`, `/dashboard/campaign-report`, `/dashboard/print-slips`, `/monitor/incidents`, `/crm/segments`, `/products`, `/customers/search`

---

## 2. สรุปสถานะรายหน้า (เร็ว)

| หน้า / แท็บ | สถานะข้อมูล | ต้องทำ |
|------------|------------|--------|
| Overview | 🟢 ผูก API เกือบหมด | ขาด time-of-day (กลุ่ม B) |
| Customers | 🟡 ผูกแล้วบางส่วน | cohort retention ยัง hardcode (กลุ่ม C) |
| Products | 🟡 KPI ผูกแล้ว | SKU รายวันแช่แข็ง 24 พ.ค. + cross-scan/cross-size/rank ยัง mock (B/C) |
| **Channels** | 🔴 **mock ทั้งหน้า** | สร้าง `/api/channels` (กลุ่ม A) |
| **Risk** | 🔴 **mock ทั้งหน้า** | สร้าง `/api/customers/risk` (กลุ่ม A) |
| Scan Behavior | 🔴 **ส่วนใหญ่ mock** | TV/funnel/heatmap/cohort ยังไม่มี API (กลุ่ม A) |
| CRM Center | 🟢 ผูก API ครบ | — |
| Report (deck) | 🟢 ผูก API | SKU ใช้ snapshot เดิม |
| Operations (จับรางวัล) | 🟠 ไฟล์ local | ย้ายขึ้น DB (กลุ่ม D) |
| Claims (ตรวจเอกสาร) | 🟠 ไฟล์ local | ย้ายขึ้น DB (กลุ่ม D) |
| Print List (สลิป) | 🟢 ผูก API (saversureV2) | — |
| /winners (public) | 🟠 ไฟล์ local | ย้ายขึ้น DB (กลุ่ม D) |
| /claim (public) | 🟠 ไฟล์ local | ย้ายขึ้น DB (กลุ่ม D) |

---

## 3. 🔴 กลุ่ม A — หน้าที่ "ยังไม่มี API เลย" (สร้าง endpoint ใหม่)

หน้าพวกนี้ hardcode ข้อมูลไว้ในตัว component (มี `DemoBanner` เตือนอยู่) ต้องสร้าง endpoint ใหม่ + ผูก adapter

### A1. Channels — [ChannelsTab.tsx](src/components/tabs/ChannelsTab.tsx)
ข้อมูลช่องทางขาย (7-Eleven, Watson, Shopee, Lazada, TikTok, ตัวแทน) เป็น array hardcode + เลขสุ่ม
- **ต้องการ:** `GET /api/channels?from=&to=`
- **Response ที่หน้าใช้:** ต่อช่องทาง → `{ channel, scans, users, tickets, trend: [{date, scans}], hourly: [{hour, scans}] }`
- ⚠️ ต้องเช็คก่อนว่า backend "เก็บ channel/source ของแต่ละ scan ไหม" — ถ้าไม่มี field นี้ ทำ endpoint ไม่ได้

### A2. Risk / Fraud — [RiskTab.tsx](src/components/tabs/RiskTab.tsx)
ตาราง velocity / multi-account / geo-mismatch / risk-score เป็น `MOCK_USERS` + array hardcode
- **ต้องการ:** `GET /api/customers/risk?date=` → `{ velocityAlerts[], multiAccount[], geoMismatch[], riskRanking[] }`
- ระยะสั้นใช้ `/api/customers/heavy-users` (มีแล้ว) ต่อบางส่วนได้ แต่ fraud scoring ต้องคำนวณฝั่ง backend

### A3. Scan Behavior (รายละเอียด) — [ScanBehaviorTab.tsx](src/components/tabs/ScanBehaviorTab.tsx)
ผูก `/api/baseline/compare` แล้วส่วนเดียว ที่เหลือ mock หมด:
- TV airtime/lift, funnel, scan heatmap (hour×weekday), retention cohort
- **ต้องการ:** `/api/scans/heatmap?from=&to=`, `/api/scans/funnel?from=&to=`, ข้อมูล TV airtime (อาจ config ภายนอก), `/api/customers/retention-cohort`

---

## 4. 🟡 กลุ่ม B — มี route แล้ว แต่ backend ยังไม่ส่งข้อมูล (เป็น stub/snapshot)

route ฝั่ง dashboard มีแล้วและผูก adapter แล้ว แต่ `api-source` คืนค่าว่าง/ไม่ครบ เพราะ **backend ยังไม่มี endpoint รองรับ**

| รายการ | route dashboard | ปัญหา | สิ่งที่ backend ต้องเพิ่ม |
|--------|-----------------|-------|--------------------------|
| **Time of Day** (Overview peak hours) | `/api/scans/time-of-day` | api-source คืน buckets ว่าง ([adapter stub](src/lib/api/api-source.ts)) | endpoint แจกแจงตามชั่วโมง `[{hour, scans}]` |
| **SKU รายวัน** (Products: Hero/Top5/Master) | `/api/sku/per-day` | ข้อมูล SKU รายวัน **แช่แข็งที่ 24 พ.ค.** เพราะ `campaign-report` ไม่ส่ง `section_16_sku_daily_matrix` | ใส่ section_16 (เมทริกซ์ SKU×วัน) ใน campaign-report |
| **SKU timeseries** (กราฟเทรนด์ราย SKU) | `/api/sku/[sku]/timeseries` | คืนแค่ snapshot วันเดียว ไม่ใช่ราย day | endpoint trend ราย SKU ราย day |
| **skuDiversity** (Risk/Customers) | `/api/customers/heavy-users` | field ไม่มาจาก backend → เป็น 0 | เพิ่ม field จำนวน SKU ที่ผู้ใช้สแกน |
| **distinctUsers** (KPI หลายหน้า) | `/api/scans/totals` | ต้องนับ distinct ทั้งช่วง backend ยังให้ total | query distinct users ต่อช่วง |

---

## 5. 🟡 กลุ่ม C — ยัง hardcode/static ในตัว component (ต้องผูก API ภายหลัง)

ส่วนเหล่านี้ "ใช้ได้ดูสวย" แต่เป็นเลขนิ่งฝังในไฟล์ ไม่อัปเดตตามจริง:

| รายการ | ที่อยู่ | แหล่งข้อมูลปัจจุบัน |
|--------|--------|---------------------|
| Cohort retention (Customers) | [CustomersTab.tsx](src/components/tabs/CustomersTab.tsx) | ตัวเลข hardcode ในไฟล์ |
| **Cross-scan pairs (SKU สแกนคู่กัน)** | [cross-scan-data.ts](src/lib/cross-scan-data.ts) | **mock** ที่เพิ่งทำ — มี `TODO(api)` ในไฟล์ ชี้ให้ทำ `GET /api/sku/co-scan` (group `scan_log`/scan_history ตาม user แล้วนับคู่ SKU) |
| Cross-size matrix | `CROSS_SIZE_GROUPS` ใน [real-data.ts](src/lib/real-data.ts) | static |
| Rank movement (Top10 ขยับ) | `RANK_MOVEMENT` ใน [daily-sku-data.ts](src/lib/daily-sku-data.ts) | static 6 วัน (16–21 พ.ค.) |
| Engagement buckets / daily rollup fallback | `DAILY_ENTRIES` ใน [daily-update-data.ts](src/lib/daily-update-data.ts) | static 16–24 พ.ค. (ใช้เป็น fallback ตอน mock) |

> หมายเหตุ: ถ้า backend ส่งข้อมูลครบ (กลุ่ม B) ส่วนใหญ่ของกลุ่ม C จะหายไปเอง เหลือที่ต้องผูก API เพิ่มจริง ๆ คือ cohort retention + cross-scan pairs

---

## 6. 🟠 กลุ่ม D — ระบบจับรางวัล/รับรางวัล: ตอนนี้เป็นไฟล์ JSON local (ต้องย้ายขึ้น DB จริง)

flow จับรางวัล → ประกาศ → ตรวจสิทธิ์ → ตรวจเอกสาร **ทั้งหมดเก็บเป็นไฟล์** ใน `data/` ของเครื่อง dashboard ผ่าน [claims-store.ts](src/lib/claims-store.ts) (ใช้ `fs` ตรง ไม่ผ่าน adapter)

| ไฟล์ปัจจุบัน | เก็บอะไร | route ที่อ่าน/เขียน |
|--------------|----------|---------------------|
| `data/draw-winners.json` | รายชื่อผู้โชคดีที่จับได้ | `/api/draw/winners` (GET/POST/DELETE), `/api/claim/verify`, `/api/winners/public` |
| `data/draw-claims.json` | สถานะการรับรางวัล + เอกสาร | `/api/draw/claims` (GET/POST), `/api/claim/verify` |
| `data/claims/{phone9}/...` | ไฟล์บัตร ปชช./มอบอำนาจ (PII) | `/api/claim/file` |

**สิ่งที่ต้องทำ (เรียงตามลำดับ):**
1. สร้างตารางจริงใน DB: `draw_winners`, `draw_claims`, `claim_documents` (โครง field ดูภาคผนวก/ใน claims-store.ts)
2. แก้ [claims-store.ts](src/lib/claims-store.ts) ให้เรียก backend API แทน `fs.readFileSync/writeFileSync` (จุดเปลี่ยนรวมศูนย์อยู่ไฟล์เดียว)
3. ย้ายไฟล์เอกสาร PII จาก disk → cloud storage (S3/GCS) + signed URL (ตอนนี้อ่านจาก path ตรง เสี่ยง path traversal)
4. **ความปลอดภัย concurrency:** ตอนนี้เขียนไฟล์แบบ sync ไม่มี lock — แอดมิน 2 คนกดพร้อมกันทับกันได้ → DB transaction แก้
5. **Auth:** ตอนนี้ป้องกันด้วย `ADMIN_KEY` ตัวเดียว (header `x-admin-key`) → ควรอัปเป็น JWT/session + audit log
6. **Persistence:** `data/` อยู่ใน app folder จะโดนลบตอน deploy (`robocopy /PURGE`) — ระหว่างยังเป็นไฟล์ ให้ตั้ง env `DATA_DIR` ชี้นอก app folder
7. **Scheduler ประกาศผล:** ยังไม่มี cron อ่าน winners แล้วส่ง LINE OA/ไทยรัฐ — ทำเพิ่มถ้าต้องการ auto

> หมายเหตุ: `/api/claim/submit` ถูกปิดไว้ (คืน 410) ตั้งใจให้ลูกค้าเอาเอกสารตัวจริงมาแสดงเอง ไม่อัปโหลดออนไลน์ — ถ้าจะเปิดอัปโหลดต้องทำ flow + storage เพิ่ม

---

## 7. 📦 สเปก endpoint ที่ขอให้ backend ทำเพิ่ม (รวมรายการ)

ลำดับความสำคัญ:

**P1 — ปลดล็อกข้อมูลจริงของหน้าหลัก**
- [ ] `campaign-report` เพิ่ม `section_16_sku_daily_matrix` (ปลด SKU รายวันที่แช่แข็ง)
- [ ] `GET /scans/time-of-day` (หรือใส่ใน campaign-report) → แจกแจงรายชั่วโมง
- [ ] เพิ่ม `distinctUsers` ต่อช่วง + `skuDiversity` ใน heavy-users

**P2 — เปิดหน้าที่ยังมืดทั้งหน้า**
- [ ] `GET /api/channels?from=&to=` (Channels) — *ต้องยืนยันว่า scan เก็บ channel ไหม*
- [ ] `GET /api/customers/risk?date=` (Risk: velocity/multi-account/geo/score)
- [ ] `GET /api/sku/co-scan?from=&to=` (cross-scan pairs — ปัจจุบัน mock)

**P3 — รายละเอียดเสริม**
- [ ] `GET /api/sku/{sku}/timeseries` ราย day จริง
- [ ] heatmap / funnel / retention-cohort (Scan Behavior)

**P-DB — ระบบรางวัล (กลุ่ม D)**
- [ ] ย้าย winners/claims/เอกสาร ขึ้น DB + storage + auth

---

## 8. 🔧 Environment variables

| ตัวแปร | ใช้ทำอะไร | หมายเหตุ |
|--------|-----------|----------|
| `DATA_SOURCE` | `mock`(default) / `api` / `db` | ตั้ง `api` เพื่อใช้ backend จริง |
| `SAVERSURE_API_BASE_URL` | URL backend | default `http://localhost:30400/api/v1` |
| `SAVERSURE_API_TOKEN` | JWT (อ่าน/รีเฟรชจาก `.env.local`) | auto-refresh ผ่าน `/api/auth/refresh` |
| `SAVERSURE_CAMPAIGN_ID` / `_NAME` | ระบุแคมเปญ | ถ้าไม่ใส่ ID จะ lookup ด้วยชื่อ |
| `SAVERSURE_LOGIN_EMAIL` / `_PASSWORD` | ขอ token (dev) | ใช้ตอน refresh |
| `ADMIN_KEY` | gate API ที่มี PII (claims/file/winners?all=1) | ถ้าไม่ตั้ง = เปิดหมด (local dev) |
| `DATA_DIR` | ที่เก็บไฟล์ draw/claims | ตั้งให้อยู่นอก app folder ใน production |
| `DATABASE_URL` / `DASHBOARD_DATABASE_URL` | สำหรับ db-source (ยังไม่ใช้) | ใช้เมื่อจะทำ DB-direct |

---

## 9. ภาคผนวก — ตาราง route ทั้งหมด

**ผ่าน adapter (วิเคราะห์):** `/api/daily`, `/api/daily/[date]`, `/api/scans/totals`, `/api/scans/timeseries`, `/api/scans/time-of-day`*, `/api/members/daily`, `/api/customers/{heavy-users,engagement,provinces,retention,segments,search}`, `/api/sku/{list,per-day,[sku]/timeseries}`, `/api/baseline/compare`, `/api/system/uptime`, `/api/print-slips`
(*time-of-day = stub ฝั่ง api)

**ไม่ผ่าน adapter (ไฟล์ local / logic ตรง):** `/api/draw/{winners,claims,pool}`, `/api/claim/{verify,submit(410),file}`, `/api/winners/public`, `/api/print-slips-pdf`, `/api/auth/refresh`
(`/api/draw/pool` อ่าน pool จาก saversureV2 ผ่าน `getPrintSlips`; ที่เหลือเป็นไฟล์)

**ไฟล์สำคัญสำหรับ dev:**
- [src/lib/api/adapter.ts](src/lib/api/adapter.ts) — interface + ตัวสลับ source
- [src/lib/api/api-source.ts](src/lib/api/api-source.ts) — client ต่อ saversureV2 (ตัวอย่างการ map)
- [src/lib/api/mock-source.ts](src/lib/api/mock-source.ts) — รูปแบบ response ที่ทุก method ต้องคืน
- [src/lib/api/types.ts](src/lib/api/types.ts) — contract ของแต่ละ response
- [src/lib/api/db-source.ts](src/lib/api/db-source.ts) — โครง SQL template (ยังไม่ทำ)
- [src/lib/claims-store.ts](src/lib/claims-store.ts) — จุดเดียวที่ต้องแก้เพื่อย้าย draw/claims ขึ้น DB
- [src/config/draw-rounds.ts](src/config/draw-rounds.ts) — โครงสร้างรอบ/รางวัล/วันประกาศ
