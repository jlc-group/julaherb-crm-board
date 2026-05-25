# 📡 Dashboard API

ทุก endpoint return JSON ตาม type ใน `src/lib/api/types.ts`
Data source สลับ mock ↔ real DB ในไฟล์เดียว: `src/lib/api/adapter.ts`

## 🔧 Swap to real DB (3 ขั้นตอน)

```bash
# 1. Set env
echo 'DATA_SOURCE=db' >> .env.local
echo 'DATABASE_URL=postgresql://user:pass@host:5432/v2_db' >> .env.local

# 2. Install driver
npm i pg

# 3. Fill TODO blocks in src/lib/api/db-source.ts
#    (SQL queries pre-written as comments — just plug in pool.query)
```

ไม่ต้องแก้ component / page อะไรเลย — adapter จะ route call ไปยัง db-source อัตโนมัติ

---

## 🗂️ Endpoint list

| Method | Path | Description | Query params |
|---|---|---|---|
| GET | `/api/daily` | Daily rows in date range | `from`, `to` |
| GET | `/api/daily/[date]` | Single day full report | (path param) |
| GET | `/api/scans/totals` | Aggregated KPI | `from`, `to` |
| GET | `/api/scans/timeseries` | Chart data (line/bar) | `from`, `to` |
| GET | `/api/scans/time-of-day` | Hour bucket distribution | `from`, `to` |
| GET | `/api/members/daily` | New vs old members | `from`, `to` |
| GET | `/api/customers/heavy-users` | Top users (fraud detection) | `date`, `limit?` |
| GET | `/api/customers/engagement` | Scans/user distribution | `from`, `to` |
| GET | `/api/customers/provinces` | Top จังหวัด with flags | `date`, `limit?` |
| GET | `/api/customers/retention` | First-time vs returning | `date` |
| GET | `/api/sku/list` | 97 SKU master catalog | — |
| GET | `/api/sku/per-day` | Per-SKU aggregated (Top SKU, Tier Mix) | `from`, `to` |
| GET | `/api/sku/[sku]/timeseries` | Single SKU daily trend | `from`, `to` |
| GET | `/api/baseline/compare` | 3-month apples-to-apples | `from`, `to` |
| GET | `/api/system/uptime` | Uptime % + outage events | `from`, `to` |

Default range = `2026-05-16` → `2026-05-22` (full campaign so far) เมื่อไม่ส่ง `from`/`to`

---

## 📐 Response shapes

ดู `src/lib/api/types.ts` — ทุก response มี type definition พร้อมใช้ใน frontend

```ts
import type { ScansTotalsResponse } from '@/lib/api/types'

const res = await fetch('/api/scans/totals?from=2026-05-16&to=2026-05-22')
const data: ScansTotalsResponse = await res.json()
console.log(data.success, data.expectedTickets, data.ticketGap)
```

---

## 🧪 Test

```bash
curl http://localhost:3000/api/scans/totals?from=2026-05-16&to=2026-05-22 | jq
curl http://localhost:3000/api/sku/per-day?from=2026-05-16&to=2026-05-22 | jq '.total'
curl http://localhost:3000/api/customers/heavy-users?date=2026-05-22 | jq
curl http://localhost:3000/api/system/uptime?from=2026-05-16&to=2026-05-22 | jq
```

---

## 🔐 PII / Security

- Heavy users endpoint returns **hashed user ID** (`userHash` = `SUBSTRING(MD5(phone), 1, 8)`)
- Never expose raw phone / email / address
- Add auth middleware in `middleware.ts` before production deploy

---

## 📊 SQL Source Reference

แต่ละ function ใน `db-source.ts` มี SQL query เป็น comment พร้อมก่อนแล้ว
ทุก query ใช้ V2 schema:
- `scan_history` (scanned_at, user_id, sku, scan_type)
- `users` (id, created_at, province, phone_hash, dob)
- `lucky_draw_campaigns` (sku, rights_per_scan, display_name, ...)
- `lucky_draw_tickets` (id, user_id, sku, created_at)

> Note V1 vs V2: ตัวเลขจะตรงกัน เพราะ V1→V2 sync continuous
> ใช้ V2 เพราะ JOIN demographics (`users` table) ง่ายกว่า
