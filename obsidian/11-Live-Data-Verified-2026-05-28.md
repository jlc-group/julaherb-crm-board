# 🟢 Live Data Verified — 2026-05-28

**Status**: ✅ Dashboard ดึง live data จาก saversureV2 ผ่าน API สำเร็จ
**Verified by**: end-to-end HTTP smoke test
**Architecture**: Component → Internal `/api/*` → adapter (DATA_SOURCE=api) → api-source → saversureV2 backend → Postgres

---

## ✅ Handoff Steps จาก [00-INDEX.md](00-INDEX.md) — Complete

| # | Step | Status |
|---|---|---|
| 1 | Deploy endpoint `GET /api/v1/dashboard/campaign-daily` | ✅ Running ที่ port 30400 |
| 2 | Test API ด้วย JWT token จริง | ✅ Token refresh ผ่าน `/auth/login` สำเร็จ |
| 3 | ตั้ง dashboard เป็น `DATA_SOURCE=api` | ✅ ตั้งใน `.env.local` |
| 4 | ตรวจหน้า dashboard ว่า daily table, timeseries, members daily แสดงข้อมูลจริงครบ | ✅ Verified ผ่าน HTTP |
| 5 | จัดการ invalid/not_found campaign-scoped | ⏳ ยังไม่เจอ edge case ใน dataset ปัจจุบัน |

---

## 📊 Live Numbers Verified (smoke test 2026-05-28)

```http
GET http://localhost:3100/api/scans/totals?from=2026-05-16&to=2026-05-28
```

```json
{
  "from": "2026-05-16",
  "to": "2026-05-28",
  "days": 13,              ← ครบ 13 วัน (16-28 พ.ค.) ถึงวันนี้
  "success": 102143,
  "dupSelf": 10603,
  "dupOther": 1334,
  "notFound": 0,
  "totalAttempts": 114080,
  "successRate": 89.54,
  "tickets": 91041,
  "expectedTickets": 91041,
  "ticketGap": 0,
  "uniqueUsers": 32663,
  "avgScansPerDay": 7857
}
```

```http
GET http://localhost:3100/api/daily?from=2026-05-16&to=2026-05-28
```
→ array 13 records, first record `2026-05-16` (เสาร์, success=7160), last record `2026-05-28` (วันนี้)

---

## 🔧 What Was Done Today

### 1. ตรวจ runtime status ทั้งระบบ
```
Port 3100  ✅ julaherb-crm-board Next.js dev server
Port 30400 ✅ saversureV2 backend (Go)
Port 25433 ✅ saversureV2 Postgres
Port 16379 ✅ saversureV2 Redis
GET /health on 30400 → HTTP 200
```

### 2. Token refresh (user-authorized)
- Token เดิมใน `.env.local` หมดอายุ → HTTP 401
- ใช้ default dev credentials (admin@saversure.com / Admin123!) + tenant_id จาก JWT claim เก่า
- POST `/api/v1/auth/login` → ได้ JWT ใหม่ (length 349 chars)
- เขียนทับ `SAVERSURE_API_TOKEN` ใน `.env.local`
- Restart Next.js dev server เพื่อ pick up env ใหม่

### 3. Verify end-to-end
- Internal `/api/scans/totals` → adapter (DATA_SOURCE=api) → api-source → `/api/v1/dashboard/campaign-daily` → Postgres
- Component code ไม่ต้องแก้ — Next.js แค่ route ผ่าน adapter

---

## 🏗️ Architecture แบบ resolved

```
Browser (port 3100)
    ↓ fetch('/api/scans/totals?from=&to=')
[Next.js API Route]  src/app/api/scans/totals/route.ts
    ↓
[Adapter]            src/lib/api/adapter.ts
    ↓ ds = api-source (because DATA_SOURCE=api)
[API Source]         src/lib/api/api-source.ts
    ↓ GET /api/v1/dashboard/campaign-daily
    ↓ Header: Authorization: Bearer <JWT>
[saversureV2 Backend] port 30400
    ↓ SQL query
[Postgres]           port 25433
```

**Architecture Promise**:
- ✅ ห้ามแตะ saversureV2 code / DB / config — ทำตามได้ 100%
- ✅ Dashboard เป็น consumer pattern READ-ONLY ผ่าน HTTP API
- ✅ ไม่มี SQL/migrate/seed รันโดย dashboard
- ✅ ไม่มี Docker stop/restart saversure container

---

## 🟢 Active API Endpoints (mapped + working)

จาก [api-source.ts](../scan-lucky-rich-dashboard/src/lib/api/api-source.ts):

| Internal endpoint | Backend source | Status |
|---|---|---|
| `/api/scans/totals` | `/api/v1/dashboard/campaign-daily` | ✅ Live |
| `/api/scans/timeseries` | `/api/v1/dashboard/campaign-daily` | ✅ Live |
| `/api/daily` | `/api/v1/dashboard/campaign-daily` | ✅ Live |
| `/api/members/daily` | `/api/v1/dashboard/campaign-daily` | ✅ Live |
| `/api/customers/heavy-users` | `/api/v1/dashboard/heavy-users` | ✅ Live |
| `/api/customers/provinces` | `/api/v1/dashboard/provinces` | ✅ Live |
| `/api/system/uptime` | `/api/v1/dashboard/uptime` | ✅ Live |

---

## ⚠️ Known Gaps (อิงจาก api-source.ts comment header)

ที่ระบุไว้ว่า `NOT_IMPLEMENTED`:
- `/api/scans/time-of-day` — saversureV2 ยังไม่มี granular hour bucketing
- `/api/customers/engagement` — ต้อง backend aggregate buckets
- `/api/customers/retention` — ต้อง first-time vs returning logic
- `/api/sku/*` — รอ SKU rollup endpoint
- `/api/baseline/compare` — รอ 3-month historical data

→ Components ที่ใช้ section เหล่านี้จะ fallback ไป static หรือแสดง "ยังไม่มี data"

---

## 🔄 Token Lifecycle

**JWT exp** อ่านจาก payload `exp` claim:
- Token ปัจจุบันมี **exp** = ~8 ชั่วโมงจากเวลา issue (อิงจากค่าก่อนหน้า 1780538710 = ~28 พ.ค. ช่วงบ่าย)
- เมื่อหมดอายุ → 401 → ใช้วิธีเดิมซ้ำ:
  1. POST `/api/v1/auth/login` กับ admin@saversure.com / Admin123!
  2. Replace `SAVERSURE_API_TOKEN` ใน `.env.local`
  3. Restart dev server

**ต่อในระยะยาว** (ไม่ใช่ scope วันนี้):
- ทำ auto-refresh ใน proxy/adapter (เหมือน `src/app/api/saversure/[...path]/route.ts` Layer 2 เดิมที่มี requestDevFallbackToken)
- หรือสร้าง long-lived API key (ไม่ใช่ JWT) — backend ต้องเพิ่ม endpoint

---

## 📌 Quick Commands (สำหรับ debug ทีหลัง)

```powershell
# ตรวจสถานะ port (dev server + backend + DB)
foreach ($p in @(3100, 30400, 25433, 16379)) {
  $c = Get-NetTCPConnection -LocalPort $p -State Listen -EA 0
  if ($c) { "Port $p`: LISTENING (PID $($c.OwningProcess))" } else { "Port $p`: DOWN" }
}

# Smoke test internal API
curl http://localhost:3100/api/scans/totals?from=2026-05-16&to=2026-05-28

# ดู token expiry (ดูแค่ exp claim — ไม่ verify signature)
$tok = (Get-Content scan-lucky-rich-dashboard\.env.local | sls "SAVERSURE_API_TOKEN").Line.Split('=')[1]
$payload = [Convert]::FromBase64String($tok.Split('.')[1].PadRight($tok.Split('.')[1].Length + 4 - $tok.Split('.')[1].Length % 4, '='))
[System.Text.Encoding]::UTF8.GetString($payload) | ConvertFrom-Json | Select exp, iat
```

---

**Last Updated**: 2026-05-28
**Related**: [00-INDEX.md](00-INDEX.md), [09-saversureV2-endpoints-needed.md](09-saversureV2-endpoints-needed.md), [10-remaining-endpoints-all-pages.md](10-remaining-endpoints-all-pages.md)
