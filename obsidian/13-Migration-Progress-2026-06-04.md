# 🚀 Migration Progress — 2026-06-04

**Reference plan**: [12-Full-API-Migration-Plan-2026-06-03.md](12-Full-API-Migration-Plan-2026-06-03.md)
**Status**: Phase 1 + 2 ✅ ส่วน Phase 3 partial

---

## 🆕 Report Tab (เพิ่ม 2026-06-04)

Tab "Report" ใต้ Print List — สไลด์นำเสนอ 11 หน้าจาก data จริง + โหลด PDF/PPTX

| ไฟล์ | หน้าที่ |
|---|---|
| `src/components/tabs/ReportTab.tsx` | 11 สไลด์ (cover, exec summary, overview, trend, rights, customers, provinces, SKU, risk, uptime, findings) + ปุ่ม PDF/PPTX |
| `src/lib/report-pptx.ts` | generate `.pptx` ด้วย pptxgenjs (client-side, snapshot) |
| `src/app/globals.css` | `@page reportPage` (A4 landscape) แยกจาก PrintList portrait |
| `next.config.js` | webpack: handle `node:fs` ของ pptxgenjs (fs:false ฝั่ง client) |
| sidebar/page/types | register tab `'report'` |

- PDF = `window.print()` (live), PPTX = pptxgenjs (snapshot ณ เวลากด)
- สไลด์ 8 (Top SKU) = snapshot ถึง 24 พ.ค. (saversureV2 ยังไม่ส่ง per-SKU live)
- รายละเอียดสิทธิ์: ดู [15-rights-calculation.md](15-rights-calculation.md)

---

## ✅ Phase 1 — Date hardcode fix (DONE)

แก้ `today: new Date('2026-05-24')` → `getCampaignToday()` ใน 4 tabs

**Files**:
- ✅ `src/lib/utils.ts` — เพิ่ม `getCampaignToday()`, `CAMPAIGN_START`, `CAMPAIGN_END`
- ✅ `src/components/tabs/OverviewTab.tsx`
- ✅ `src/components/tabs/CustomersTab.tsx`
- ✅ `src/components/tabs/ProductsTab.tsx`
- ✅ `src/components/tabs/PrintListTab.tsx`

**Verified**: API calls ตอนนี้ใช้ `to=2026-06-04` (today) แทน `to=2026-05-24`

---

## ✅ Phase 2 — Implement NOT_IMPLEMENTED endpoints (DONE)

แทนที่ TODO throws ใน `src/lib/api/api-source.ts` ด้วย implementation จริง

| Function | Strategy | Status |
|---|---|---|
| `getBaselineCompare` | Derive from `/campaign-daily` — mar/apr=0 (no pre-campaign data) | ✅ HTTP 200 |
| `getTimeOfDay` | Return 7 empty buckets (saversureV2 no hour breakdown) | ✅ HTTP 200 |
| `getEngagement` | Derive from `/campaign-report` section_01 + section_20 | ✅ HTTP 200 |
| `getRetention` | Derive from `/campaign-daily` memberNew/memberOld | ✅ HTTP 200 |
| `getSkuPerDay` | Derive from `/campaign-report` section_16 + `/products` | ✅ HTTP 200 |
| `getSkuTimeseries` | Single point per SKU from `getSkuPerDay` | ✅ HTTP 200 |

**Smoke test results**:
```http
GET /api/baseline/compare?from=2026-05-16&to=2026-06-04 → 200 (20 rows, May data filled, Mar/Apr=0)
GET /api/customers/engagement?from=...&to=...           → 200 (totalUsers=40970, 4 buckets)
GET /api/customers/retention?date=2026-06-04            → 200 (firstTime=201, returning=1026)
GET /api/sku/per-day?from=...&to=...                    → 200 (176 SKUs from /products)
GET /api/sku/L3-40G/timeseries?from=...&to=...          → 200 (1 data point)
GET /api/scans/time-of-day?from=...&to=...              → 200 (7 zero buckets)
```

---

## ✅ Phase 3 — Wire components to API (รอบที่ 2)

### ✅ DONE — รอบแรก (Section D + Customers leaderboards)
| Component | Tab | Endpoint | Notes |
|---|---|---|---|
| BaselineComparison.tsx | Overview D + ScanBehavior | `/api/baseline/compare` | รับ `from/to` props |
| HeavyUsersCard.tsx | Customers D | `/api/customers/heavy-users?date=&limit=` | รับ `date` prop |
| TopProvincesCard.tsx | Customers D | `/api/customers/provinces?date=&limit=` | รับ `date` prop |

### ✅ DONE — รอบที่ 2 (Engagement + Empty states)
| Component | Tab | Endpoint | Notes |
|---|---|---|---|
| EngagementDistribution.tsx | Customers C | `/api/customers/engagement` | รับ `from/to` props — Live data |
| WeekdayMatchedCard.tsx | Overview D | `/api/baseline/compare` | group by weekday — แสดง Mar/Apr = `—` (ไม่มีข้อมูล) |
| TimeOfDayChart.tsx | Overview C | (empty state) | empty state ชัด: "saversureV2 ยังไม่ส่ง hour breakdown" |
| ProductsTab | Products | (indicator) | banner บอก SKU breakdown ใช้ snapshot — section_16 missing |

### ⏳ ยังไม่ migrate (low priority หรือ block)
| Component | Tab | Reason |
|---|---|---|
| SegmentMixCard.tsx | Customers B | RFM segments hardcoded — saversureV2 ไม่มี RFM endpoint |
| HeroSkuCard.tsx | Products A | section_16 missing → fallback static (มี indicator แล้ว) |
| Top5SkuCard.tsx | Products B | เหมือน Hero |
| CrossSizeMatrix.tsx | Products C | เหมือน Hero |
| SkuTrendLineChart.tsx | Products D | timeseries returns 1 point only |
| ProductMasterTable.tsx | Products E | 97 SKUs จาก static |
| AppleToAppleComparison.tsx | ScanBehavior | scan-behavior-data static — เปลี่ยนได้ถ้าเอา API baseline |
| RetentionCohort.tsx | ScanBehavior G | no cohort endpoint |
| CohortRetentionCard (inline) | Customers C | no cohort endpoint |

---

## ✅ Phase 4 — Demo banner for blocked tabs (DONE)

`<DemoBanner />` แสดงอยู่แล้วใน 4 tabs:
- ✅ ChannelsTab.tsx — "ยังไม่มี endpoint channel campaign-scoped"
- ✅ OperationsTab.tsx — "ยังไม่มี endpoint operations"
- ✅ RiskTab.tsx — "ยังไม่มี endpoint customer risk"
- ✅ ScanBehaviorTab.tsx — "ส่วนใหญ่ยังเป็น mock — BaselineComparison ใช้ API ได้"

---

## ⏳ Phase 5 — Cleanup (NOT STARTED)

ไม่จำเป็นเร่งด่วน — ทำหลังจาก Phase 3 เสร็จครบ

---

## 📊 สรุปสถานะ (อัปเดต 2026-06-04)

### Live ผ่าน API ✅
| Tab | Section | Live? |
|---|---|---|
| Overview | A. KPI (สแกน/สิทธิ์/สมาชิก/สถานะ) | ✅ |
| Overview | B. Trend chart | ✅ |
| Overview | B. Scan table | ✅ |
| Overview | B. Member table | ✅ |
| Overview | **D. Baseline Comparison** (ที่ user request) | ✅ |
| Customers | A. KPI | ✅ |
| Customers | D. Heavy Users (เพิ่งทำ) | ✅ |
| Customers | D. Top Provinces (เพิ่งทำ) | ✅ |
| Products | A. KPI strip | ✅ |
| Products | List 176 SKUs | ✅ |

### ยังใช้ static / DAILY_ENTRIES ⏳
| Tab | Section | Reason |
|---|---|---|
| Overview | C. TimeOfDayChart | API return zeros (no backend data) |
| Overview | D. WeekdayMatchedCard | Hardcoded Mar/Apr (no historical) |
| Customers | B. SegmentMixCard donuts | DailyEntry shape; RFM hardcoded |
| Customers | C. EngagementDistribution | DailyEntry shape |
| Customers | C. CohortRetentionCard | hardcoded rows |
| Products | A-E. All SKU components | use `buildSkuTable()` from `DAILY_ENTRIES` |
| Products | Hero/Top5/Matrix/Trend | static |
| ScanBehavior | KPI + Heatmap + TV + Funnel + Cohort | static (no API) |

### Demo banner active 🟡
- Channels, Operations, Risk, ScanBehavior (all tabs blocked by missing endpoints)

---

## 🎯 Next steps (recommended)

1. **Wire SkU components** — ProductsTab จะ live ทั้ง tab
   - HeroSkuCard, Top5SkuCard ใช้ `apiSkuPerDay.data.rows`
2. **Wire EngagementDistribution + SegmentMixCard** — Customers จะ live ส่วน B, C
3. **TimeOfDayChart empty state** — แสดง "saversureV2 ไม่มี hour breakdown" ชัด
4. **WeekdayMatchedCard** — เปลี่ยนเป็น "current week vs prev week" หรือ DemoBanner

---

**Last Updated**: 2026-06-04
**Plan reference**: [12-Full-API-Migration-Plan-2026-06-03.md](12-Full-API-Migration-Plan-2026-06-03.md)
