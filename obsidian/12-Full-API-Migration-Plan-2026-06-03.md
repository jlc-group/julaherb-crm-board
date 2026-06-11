# 📋 Full API Migration Plan — เลิก mock ทุกจุด

**Created**: 2026-06-03
**Goal**: ทุก tab ทุก section ดึง data จาก API จริง ถึงวันที่ล่าสุด (3 มิ.ย. 2569) ไม่มี mockup เหลือ
**Constraint**: ตาม [00-RULES.md](00-RULES.md) — ห้ามแตะ saversureV2 (read-only consumer pattern เท่านั้น)

---

## 🔥 Root Cause: ทำไม data ค้างวันที่ 24 พ.ค.

**พบ hardcoded date ใน 4 tabs**:
```ts
// OverviewTab.tsx:31, 102
// CustomersTab.tsx:30, 105
// ProductsTab.tsx:47, 109
// PrintListTab.tsx:95, 127
today: new Date('2026-05-24')   // ← ค้างวันที่นี้
```

→ Date picker default range = 16-24 พ.ค.
→ ส่งไป API: `from=2026-05-16&to=2026-05-24`
→ Backend คืน data แค่ 9 วัน (ไม่ใช่ bug — เป็น query ที่ตั้งไว้ขีดจำกัดเอง)

**Fix แรกสุด**: แทนที่ด้วย `new Date()` (today) → range เป็น 16 พ.ค. - **วันนี้**

---

## 📊 Current State (จาก audit 2026-06-03)

### ✅ Live API แล้ว (8 endpoints mapped)

| Endpoint | saversureV2 source | Tab |
|---|---|---|
| `/api/scans/totals` | `/dashboard/campaign-daily` | Overview KPI |
| `/api/scans/timeseries` | `/dashboard/campaign-daily` | Overview trend |
| `/api/daily` | `/dashboard/campaign-daily` | Overview scan table |
| `/api/members/daily` | `/dashboard/campaign-daily` | Overview members table |
| `/api/customers/heavy-users` | `/dashboard/campaign-report` section_20 | Customers heavy users |
| `/api/customers/provinces` | `/dashboard/campaign-report` section_19 | Customers + Overview provinces |
| `/api/system/uptime` | `/monitor/incidents` | Overview status |
| `/api/sku/list` | `/products` | Products master |

### ❌ NOT_IMPLEMENTED (api-source throws error)

| Endpoint | ใช้ใน | Blocking section |
|---|---|---|
| `/api/scans/time-of-day` | Overview C | ⛔ Time of day chart |
| `/api/baseline/compare` | Overview D + ScanBehavior B/C | ⛔ **Section D (ทั้งหมด)** |
| `/api/customers/engagement` | Customers B/E | ⛔ Segment mix, engagement dist |
| `/api/customers/retention` | ScanBehavior G | ⛔ Cohort table |
| `/api/sku/per-day` | Products A/B/C/E | ⛔ Hero/Top5/Matrix/Master |
| `/api/sku/[sku]/timeseries` | Products D | ⛔ SKU trend chart |

### 🔴 NO API ENDPOINT (saversureV2 ยังไม่มี)

| Section | สถานะ |
|---|---|
| ChannelsTab ทั้ง tab | Channel breakdown / trend / heatmap |
| OperationsTab ทั้ง tab | Winner CRUD + prize burn |
| RiskTab ทั้ง tab | Velocity / multi-account / geo mismatch |
| ScanBehavior: heatmap, TV lift, funnel | Hardcoded |
| PrintListTab data | ต้องการ `/api/v1/scan-history` |

---

## 🎯 Execution Plan — 5 Phase

### Phase 1: Fix date hardcode (5 นาที — huge impact)

**Files**: OverviewTab, CustomersTab, ProductsTab, PrintListTab (4 ไฟล์)

```diff
- today: new Date('2026-05-24')
+ today: new Date()
```

หรือดีกว่า — สร้าง helper `getCampaignToday()` ใน `src/lib/utils.ts`:
```ts
export function getCampaignToday(): Date {
  // ใช้ today จริง แต่ clamp ไม่เกิน campaign end (18 ธ.ค. 2569)
  const now = new Date()
  const end = new Date('2026-12-18')
  return now > end ? end : now
}
```

**Result**: ทันที — ทุก tab จะดึง data ถึงวันนี้ (3 มิ.ย.) แทน 24 พ.ค.

---

### Phase 2: Implement NOT_IMPLEMENTED endpoints ใน api-source.ts

ทุก endpoint นี้ derive ได้จาก `/dashboard/campaign-daily` หรือ `/dashboard/campaign-report` ที่ saversureV2 มีอยู่แล้ว — ไม่ต้องขอ backend ใหม่

#### 2.1 `getBaselineCompare` — ใช้ section D
**Strategy**: ดึง `/campaign-daily` ของ May + ของ Mar + ของ Apr → จัดรูป BaselineCompareResponse
**Note**: ถ้า saversureV2 ไม่มี data Mar/Apr (campaign เริ่ม 16 พ.ค.) → return empty หรือ derive จาก uniform avg

#### 2.2 `getTimeOfDay` — Overview C
**Strategy**: ถ้า `/campaign-daily` ไม่มี hour bucket → ส่ง 7 buckets ที่ uniformly distribute success rate (ชั่วคราว) + flag `_estimated=true`

#### 2.3 `getEngagement` — Customers B, E
**Strategy**: `/campaign-report` section ที่บอก users by scan count — bucket เป็น 1 / 2-5 / 6-10 / 10+

#### 2.4 `getRetention` — ScanBehavior G
**Strategy**: ขอ saversureV2 ทำเพิ่ม (หรือ derive จาก campaign-report ถ้าแยก first-time vs returning ได้)

#### 2.5 `getSkuPerDay` + `getSkuTimeseries` — Products
**Strategy**: ใช้ `/dashboard/campaign-report` section_16 (sku_daily_matrix) ที่มีอยู่แล้ว

---

### Phase 3: Wire components ที่ยังใช้ static → useApi

#### 3.1 Section D — BaselineComparison + WeekdayMatchedCard + AppleToAppleComparison
**Current**: import `DAILY_ENTRIES` ตรงๆ ไม่รู้เรื่อง date range
**Target**: รับ `range` ผ่าน props + useApi `/api/baseline/compare?from=&to=`
**Files**:
- `BaselineComparison.tsx` — เปลี่ยน signature: `({ range }: { range: DateRangeV2 })`
- `WeekdayMatchedCard.tsx` — เหมือนกัน
- `AppleToAppleComparison.tsx` — เหมือนกัน
- `OverviewTab.tsx` D zone — ส่ง `<BaselineComparison range={range} />`

#### 3.2 CustomersTab — SegmentMix, EngagementDistribution
**Current**: `DAILY_ENTRIES.engagementBuckets`
**Target**: useApi `/api/customers/engagement?from=&to=`
**Files**: SegmentMixCard.tsx, EngagementDistribution.tsx

#### 3.3 ProductsTab — Hero, Top5, Matrix, Trend, Master
**Current**: `buildSkuTable()` from static
**Target**: useApi `/api/sku/per-day?from=&to=` + `/api/sku/[sku]/timeseries`
**Files**: HeroSkuCard, Top5SkuCard, CrossSizeMatrix, SkuTrendLineChart, ProductMasterTable

#### 3.4 Overview C — TimeOfDayChart
**Current**: ใช้ `DAILY_ENTRIES.timeOfDay`
**Target**: useApi `/api/scans/time-of-day?from=&to=`

---

### Phase 4: Blocked tabs — เปลี่ยน mock เป็น "ยังไม่มี data"

User กำหนดชัด: **ไม่เอา mockup แล้ว**

#### 4.1 ChannelsTab
- ลบ `CHANNEL_DATA` + `genTrend()` + `HEATMAP_DATA` ออก
- แสดง `<EmptyState>` พร้อมข้อความ "รอ backend ทำ `/api/channels`"
- เก็บ tab ไว้ใน sidebar (พร้อม badge "Coming Soon")

#### 4.2 OperationsTab
- ลบ `MOCK_WINNERS` + `PRIZE_BURN`
- แสดง `<EmptyState>` "รอ backend ทำ `/api/winners`"
- Form ปุ่ม "เพิ่มผู้ชนะ" disabled พร้อม tooltip

#### 4.3 RiskTab
- ลบ mock arrays ทั้งหมด
- แสดง `<EmptyState>` "รอ backend ทำ `/api/customers/risk`"

#### 4.4 ScanBehaviorTab — partial
- เก็บ BaselineComparison / AppleToApple (ทำ API ใน Phase 2)
- ส่วน heatmap, TV lift, funnel, cohort → `<EmptyState>` "รอ endpoint"

#### 4.5 PrintListTab
- เก็บ UI layout
- ปุ่ม "Generate List" disabled พร้อมข้อความ "รอ `/api/v1/scan-history` endpoint"

---

### Phase 5: ลบ static data files ที่ไม่จำเป็น (cleanup)

**ระวัง**: บางไฟล์ใช้ใน mock-source.ts → ลบไม่ได้ถ้ายังต้องการ `DATA_SOURCE=mock` mode

**Strategy แทน**:
- เก็บไฟล์ไว้แต่ tag `@deprecated` ใน JSDoc
- เพิ่ม warning ใน mock-source.ts ว่า "ใช้แค่ dev fallback"
- เปลี่ยน default ใน adapter.ts: `process.env.DATA_SOURCE ?? 'api'` (เดิม `?? 'mock'`)

**Files ที่ต้องดูแล**:
- `src/lib/daily-update-data.ts` — ใช้ใน mock-source → tag deprecated
- `src/lib/daily-sku-data.ts` — เหมือนกัน
- `src/lib/scan-behavior-data.ts` — เหมือนกัน
- `src/lib/real-data.ts` — เหมือนกัน
- `src/lib/per-sku-daily.ts` — เหมือนกัน
- `src/lib/mock-data.ts` — ใช้ใน RiskTab → ลบหลัง Phase 4

---

## 📈 ลำดับการทำ (recommended)

| Phase | Effort | Impact | Blocker |
|---|---|---|---|
| **1. Fix date** | 5 นาที | 🔴 HUGE — ทุก tab update ทันที | — |
| **2. api-source endpoints** | 2-4 ชม. | 🔴 HIGH — section D + customers + products live | — |
| **3. Wire components** | 4-6 ชม. | 🟡 MEDIUM — UI update + props refactor | depends on 2 |
| **4. Empty states** | 1-2 ชม. | 🟢 LOW — UX clarity | — |
| **5. Cleanup** | 1 ชม. | 🟢 LOW — maintainability | depends on 1-4 |

**Total**: ~8-13 ชม. ถ้าทำเอง (ไม่มี blocker จาก saversureV2)

---

## ⚠️ Risk + Mitigation

### Risk 1: saversureV2 ไม่มี data ของ Mar/Apr (campaign เริ่ม 16 พ.ค.)
→ `/api/baseline/compare` คืน empty arrays สำหรับเดือนเก่า
→ Mitigation: BaselineComparison แสดง "ไม่มี baseline data — campaign เริ่ม 16 พ.ค."

### Risk 2: Token หมดอายุระหว่าง refactor
→ Mitigation: รัน `/api/v1/auth/login` refresh ทุกๆ 4 ชม. (ดู [11-Live-Data-Verified-2026-05-28.md](11-Live-Data-Verified-2026-05-28.md))

### Risk 3: Endpoint NOT_IMPLEMENTED ที่ implement Phase 2 อาจ return shape ไม่ตรง
→ Mitigation: เทียบ shape กับ types.ts ทุกตัว + smoke test แต่ละตัวก่อน wire UI

### Risk 4: Empty states ทำให้ dashboard ดู "ขาด" ไป
→ Mitigation: ใส่ illustration + ETA ที่ EmptyState (เช่น "รอ backend sprint หน้า")

### Risk 5: TypeScript จะ break เพราะ static type ≠ API type
→ Mitigation: Phase 3 ทำทีละ component + run tsc หลังทุก commit

---

## 🎯 Acceptance Criteria

หลัง execute ครบทุก Phase:

- [ ] เปิด dashboard วันที่ 3 มิ.ย. → KPI strip ทุก tab แสดง data ถึง 3 มิ.ย.
- [ ] Section D (Overview) เปลี่ยน data ตาม date range
- [ ] CustomersTab segment mix ใช้ API engagement
- [ ] ProductsTab Hero/Top5/Matrix ใช้ API SKU
- [ ] ChannelsTab + OperationsTab + RiskTab แสดง EmptyState (ไม่ใช่ mock)
- [ ] `grep -r "DAILY_ENTRIES\|MOCK_USERS\|MOCK_WINNERS\|CHANNEL_DATA\|HEATMAP_DATA" src/components/` คืน 0 results
- [ ] DevTools Network → ไม่เห็น static import error
- [ ] Production smoke test: ดู `/api/daily?from=2026-05-16&to=2026-06-03` ได้ 19 records

---

## 📋 Files ที่ต้องแก้ (summary)

### Phase 1 (4 ไฟล์):
- OverviewTab.tsx
- CustomersTab.tsx
- ProductsTab.tsx
- PrintListTab.tsx

### Phase 2 (1 ไฟล์ใหญ่):
- `src/lib/api/api-source.ts` — implement 6 functions ที่ throw NOT_IMPLEMENTED

### Phase 3 (~10-12 ไฟล์):
- BaselineComparison.tsx, WeekdayMatchedCard.tsx, AppleToAppleComparison.tsx
- SegmentMixCard.tsx, EngagementDistribution.tsx
- HeroSkuCard.tsx, Top5SkuCard.tsx, CrossSizeMatrix.tsx, SkuTrendLineChart.tsx, ProductMasterTable.tsx
- TimeOfDayChart.tsx
- RetentionCohort.tsx

### Phase 4 (5 ไฟล์):
- ChannelsTab.tsx, OperationsTab.tsx, RiskTab.tsx, ScanBehaviorTab.tsx, PrintListTab.tsx
- + `src/components/ui/EmptyState.tsx` (new)

### Phase 5 (cleanup):
- adapter.ts (default value)
- daily-update-data.ts, etc. (tag deprecated)
- mock-data.ts (consider delete)

---

**Next Action**: Confirm plan → เริ่ม Phase 1 (5 นาที, huge impact) → ตรวจผล → Phase 2-3-4
