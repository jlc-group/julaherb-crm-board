# Migration Status — Static → Internal API

> Status note 2026-06-04: ไฟล์นี้เป็น history ของ migration ช่วง mock/db-source เดิม ไม่ใช่สถานะล่าสุดของ API integration ให้เริ่มจาก `00-INDEX.md` และ `09-saversureV2-endpoints-needed.md`

**Updated**: 2026-05-28
**Architecture**: Component → `fetch('/api/*')` → `adapter.ts` → `mock-source.ts` (default) / `db-source.ts` (stub)

---

## ✅ ทำเสร็จแล้ว (Migrated to Internal API)

### Infrastructure
- ✅ [`src/lib/hooks/useApi.ts`](../scan-lucky-rich-dashboard/src/lib/hooks/useApi.ts) — fetching hook พร้อม loading/error state
- ✅ [`src/components/ui/DemoBanner.tsx`](../scan-lucky-rich-dashboard/src/components/ui/DemoBanner.tsx) — banner สำหรับ tab ที่ยังไม่มี API
- ✅ `npm install` — `chartjs-plugin-datalabels` ติดตั้งแล้ว build error หาย

### OverviewTab — 6 endpoints wired ✅
| Section | API Endpoint | สถานะ |
|---|---|---|
| KPI Card 1: สแกนสำเร็จ | `/api/scans/totals` | ✅ 🟢 API |
| KPI Card 2: สิทธิ์ตามสเปก | `/api/scans/totals` | ✅ 🟢 API |
| KPI Card 3: สมาชิก | `/api/members/daily` | ✅ 🟢 API |
| KPI Card 4: สถานะระบบ | `/api/system/uptime` | ✅ 🟢 API |
| ตาราง สถิติสแกน รายวัน | `/api/daily?from=&to=` | ✅ 🟢 API |
| ตาราง สมาชิก รายวัน | `/api/daily?from=&to=` | ✅ 🟢 API |
| Trend chart | static (รอ component refactor) | ⏳ |
| TimeOfDay chart | static (รอ component refactor) | ⏳ |
| BaselineComparison + WeekdayMatched | static (มี `/api/baseline/compare` พร้อม) | ⏳ |

### CustomersTab — 4 endpoints wired ✅
| Section | API Endpoint | สถานะ |
|---|---|---|
| KPI: ลูกค้าทั้งหมด | `/api/scans/totals` | ✅ 🟢 API |
| KPI: Repeat Rate | `/api/customers/engagement` | ✅ 🟢 API |
| KPI: Heavy Users | `/api/customers/heavy-users` | ✅ 🟢 API |
| KPI: Signup Δ | `/api/members/daily` | ✅ 🟢 API |
| SegmentMixCard | static | ⏳ |
| EngagementDistribution | static (มี `/api/customers/engagement`) | ⏳ |
| CohortRetentionCard | static (ไม่มี API — hardcoded) | ❌ |
| HeavyUsersCard | static (มี `/api/customers/heavy-users`) | ⏳ |
| TopProvincesCard | static (มี `/api/customers/provinces`) | ⏳ |

### ProductsTab — 2 endpoints wired ✅
| Section | API Endpoint | สถานะ |
|---|---|---|
| KPI: SKU ทั้งหมด | `/api/sku/list` | ✅ 🟢 API |
| KPI: Top 1 share | `/api/sku/per-day` | ✅ 🟢 API |
| KPI: Top 10 share | `/api/sku/per-day` | ✅ 🟢 API |
| KPI: สิทธิ์ที่แลก | `/api/sku/per-day` → `total.specTickets` | ✅ 🟢 API |
| HeroSkuCard | static | ⏳ |
| Top5SkuCard | static | ⏳ |
| SkuTrendLineChart | static (มี `/api/sku/[sku]/timeseries`) | ⏳ |
| CrossSizeMatrix | static (ไม่มี API) | ❌ |
| RankMovementTable | static (ไม่มี API) | ❌ |
| FirstScanCard | static | ⏳ |
| ProductMasterTable | static | ⏳ |

### Tabs with Demo Banner (ไม่มี API พร้อม)
| Tab | Banner | สาเหตุ |
|---|---|---|
| **ChannelsTab** | 🟡 Demo Mode | ไม่มี `/api/channels` ใน adapter |
| **OperationsTab** | 🟡 Demo Mode | ไม่มี `/api/winners` CRUD + prize-allocations |
| **RiskTab** | 🟡 Demo Mode | ไม่มี `/api/customers/risk` ส่วนใหญ่เป็น hardcoded |
| **ScanBehaviorTab** | 🟡 Demo Mode | บางส่วนมี API (`baseline/compare`, `scans/time-of-day`) แต่ component ใช้ static |

### PrintListTab — ยังไม่ migrate
ใช้ `DAILY_ENTRIES` static — ไม่มี `/api/scan-history` ใน internal adapter (Layer 1 ไม่ครอบคลุม scan-by-scan)
ถ้าจะดึงรายชื่อจริง — ต้องใช้ Layer 2 (`getScanHistory` จาก saversure-api.ts) หรือเพิ่ม endpoint ใหม่

---

## ❌ ยังไม่ได้ทำ — แยกตามประเภท

### A. Component-level refactor (component คาด static, ต้องเปลี่ยน signature)
มี API พร้อมแต่ component ยังไม่ใช้:
- `HeavyUsersCard` ← `/api/customers/heavy-users`
- `TopProvincesCard` ← `/api/customers/provinces`
- `EngagementDistribution` ← `/api/customers/engagement`
- `TrendLineChart` ← `/api/scans/timeseries`
- `TimeOfDayChart` ← `/api/scans/time-of-day`
- `BaselineComparison` ← `/api/baseline/compare`
- `WeekdayMatchedCard` ← `/api/baseline/compare`
- `SkuTrendLineChart` ← `/api/sku/[sku]/timeseries`
- `Top5SkuCard`, `HeroSkuCard` ← `/api/sku/per-day`
- `ProductMasterTable` ← `/api/sku/per-day`

**Effort**: medium — ต้องแก้ component ให้รับ props จาก parent (parent fetch + pass down) แต่บางตัวใช้ใน tab อื่นด้วย (เช่น BaselineComparison ใช้ทั้ง Overview + ScanBehavior) ต้องระวัง

### B. ไม่มี API ใน adapter (ต้องเพิ่ม endpoint ก่อน)
- ❌ Channels (summary / trend / heatmap)
- ❌ Operations (winners CRUD / prize allocations / scan-log export)
- ❌ Risk (risk scoring / fraud detection dedicated)
- ❌ Cohort Retention (hardcoded weeks)
- ❌ Cross-Size Matrix (Products)
- ❌ Rank Movement (Products)
- ❌ TV Airtime / Lift (ScanBehavior)
- ❌ Scan Funnel / Heatmap (ScanBehavior)
- ❌ Scan history per-scan (PrintList)

**Action**: เพิ่ม endpoint ใน `src/lib/api/types.ts` + `mock-source.ts` + `db-source.ts` (มี SQL comment พร้อม)

### C. db-source.ts ยังเป็น stub
ทุก endpoint ใน `/api/*` ตอนนี้คืน data จาก mock-source (อ่าน static file)
ถ้าจะดึง data จริง:
1. เติม SQL queries ใน `src/lib/api/db-source.ts` (มี SQL comment ใส่ไว้แล้ว)
2. Install pg/prisma driver
3. ตั้ง `.env.local`: `DATA_SOURCE=db` + `DATABASE_URL=...`
4. Component code **ไม่ต้องแก้** — adapter จะ route ไป db-source อัตโนมัติ

---

## 🎯 สถานะภาพรวม

| ระดับ | ตัวเลข |
|---|---|
| Tab ที่ wire API ครบ (KPIs) | **3** — Overview, Customers, Products |
| Tab ที่มี Demo Banner | **4** — Channels, Operations, Risk, ScanBehavior |
| Tab ที่ยังเป็น static อย่างเดียว | **1** — PrintList |
| Internal API routes | **15** routes |
| Routes ที่ component เรียกใช้จริง | **9** routes (scans/totals, members/daily, system/uptime, daily, customers/engagement, customers/heavy-users, sku/list, sku/per-day) |
| Child UI components ที่ยังใช้ static import | ~15 ไฟล์ |

---

## 🔌 วิธีตรวจสอบว่า migration ทำงานจริง

1. เปิด http://localhost:3100
2. ไปที่ tab Overview → DevTools Network tab → กรอง `api/`
3. ควรเห็น 4 requests:
   - `GET /api/scans/totals?from=...&to=...`
   - `GET /api/members/daily?from=...&to=...`
   - `GET /api/system/uptime?from=...&to=...`
   - `GET /api/daily?from=...&to=...`
4. KPI cards 4 ใบแรกจะมีป้าย **🟢 API** สีเขียวมุมขวาบน
5. ตาราง 2 อันด้านล่างก็มาจาก `/api/daily`
6. ไป Customers + Products เห็น 🟢 API badge ทำนองเดียวกัน

## 📋 Next Steps (ถ้าจะทำต่อ)

1. **High Priority** (Component refactor — มี API พร้อมแล้ว):
   - HeavyUsersCard + TopProvincesCard (Customers leaderboards)
   - SkuTrendLineChart + Top5SkuCard (Products charts)
   - BaselineComparison (shared with ScanBehavior)
2. **Medium Priority** (เพิ่ม endpoint):
   - `/api/channels?from=&to=` สำหรับ ChannelsTab
   - `/api/winners` CRUD สำหรับ OperationsTab
3. **Backend wire DB** (เมื่อพร้อม):
   - เติม SQL ใน `db-source.ts`
   - ตั้ง `DATA_SOURCE=db` → live data ทันที

---

**Last Updated**: 2026-05-28
**Migration Confidence**: HIGH — verified via dev server log + DevTools Network tab
