# 📇 API Inventory + Print List Match — 2026-06-08

รีวิว read-only ทั้งโปรเจกต์ (ultracode workflow · 4 agents) — inventory ทุก API ที่ wire แล้ว + จับคู่กับความต้องการของ Tab Print List เพื่อหา reuse และระบุชิ้นที่ขาด

> ⚖️ **Rule-compliant**: read-only consume :30400 · port 3100 · ไม่แตะ saversureV1/V2 · ไม่ page scan_history ดิบ (HOT write-table)

---

## 1. API ที่ wire แล้ว = 17 internal routes

ทุก route ใช้ helper `sv<T>()` เดียวกัน (api-source.ts L58 · Bearer auth · timeout 8s · `cache:'no-store'`)
ทุก route cache ระดับ HTTP: `s-maxage=60, stale-while-revalidate=300` (_utils.ts L13)

| Route | feeds (tab) | upstream saversureV2 | สถานะ | fields สำคัญ |
|---|---|---|---|---|
| `/api/scans/totals` | Overview KPI | campaign-daily + campaign-report | 🟢 live | success, tickets, **expectedTickets**, distinctUsers |
| `/api/scans/timeseries` | Trend chart | campaign-daily | 🟢 live | points[]{date,success,tickets,expectedTickets} |
| `/api/scans/time-of-day` | ScanBehavior | (ไม่มี upstream) | ⚪ stub | 7 buckets = 0 |
| `/api/daily` | Overview table | campaign-daily | 🟢 live | DailyRow[] |
| `/api/daily/[date]` | drilldown | campaign-daily (1 row) | 🟢 live | DailyRow\|null |
| `/api/members/daily` | Member chart | campaign-daily | 🟡 derived | memberNew/memberOld |
| `/api/customers/engagement` | Engagement bucket | campaign-report sec01+sec20 | 🟡 derived | buckets[4] (0.65 approx) |
| **`/api/customers/heavy-users`** | Fraud card | campaign-report **section_20_top_scanners** | 🟢 live | rank, **userHash**, province, scans, flag (**ไม่มี name/phone**) |
| `/api/customers/provinces` | Top จังหวัด | campaign-report section_19 | 🟢 live | name, scans, users, avgPerUser |
| `/api/customers/retention` | Retention split | campaign-daily | 🟡 derived | firstTime, returning |
| `/api/customers/segments` | CRM Center | /crm/segments | 🟢 live | name, count (cached, stale 29เม.ย.) |
| `/api/sku/list` | Products master | /products (limit=200) | 🟢 live | sku, displayName, **rightsPerScan** |
| `/api/sku/per-day` | Top SKU | campaign-report section_16 | 🟡 derived | sku, **perScan**, scans, specTickets |
| `/api/sku/[sku]/timeseries` | SKU drill | campaign-report section_16 | ⚪ stub | 1 point เท่านั้น |
| `/api/baseline/compare` | Baseline | campaign-daily | 🟡 derived | Mar/Apr=0 (ก่อน campaign) |
| `/api/system/uptime` | AlertBar | /monitor/incidents | 🟢 live | uptimePct, outages[] |

**Auth**: `SAVERSURE_API_TOKEN` จาก env (server-only) · **ไม่มี refresh logic** (manual, JWT ~8h) → 401 = route คืน 500 (W1 ใน roadmap 17)

---

## 2. จับคู่กับ Print List — API ไหนใกล้สุด

### Print List ต้องการ (1 right = 1 slip):
`name` · `phone` (mask) · `scan_code` (legacy_qr_code_serial) · `product_name_short`
ทั้งหมด **255,446 ใบ** (16พค-7มิย) = Σ(scans × rights_per_scan)

### ranking ความใกล้

| อันดับ | Route | ใกล้เพราะ | ทำไมยังไม่พอ |
|---|---|---|---|
| 🥇 สูง | **`/api/customers/heavy-users`** (section_20) | endpoint **เดียว**ที่คืน **per-user row** (ไม่ใช่ aggregate รายวัน) · มี scans/คน + province + rank · โครง array-of-user ใกล้ที่สุด | คืนแค่ **Top-N** scanners (fraud) · `userHash` ไม่มี **name/phone/scan_code/product** จริง · **ไม่ expand by rights** → ทำ 255k ใบไม่ได้ |
| 🥈 กลาง | `/api/sku/per-day` (section_16) | มี `perScan` (=rightsPerScan) × scans = specTickets → **logic เดียวกับ 1 right = 1 slip** · ใช้ PRODUCTS_MASTER lookup เหมือนกัน | aggregate ระดับ SKU/วัน · ไม่มี name/phone → ใช้แค่ verify ยอด |
| 🥉 ต่ำ | `/api/scans/totals` + `/api/daily` | `expectedTickets`=255,446 ตรงยอดที่ต้องผลิต | ตัวเลขรวม ไม่มี row-level → ใช้ **verify จำนวน slip รวม** |

### 💡 ข้อสรุป
- **ไม่มี API ปัจจุบันที่ทำ Print List ได้** — ทุกตัวคืน aggregate หรือ top-N hashed users
- ชิ้นที่ขาด **มีชิ้นเดียว** = endpoint ใหม่ฝั่ง backend (slip-level, expanded by rights)
- เพราะ **dashboard ห้าม page scan_history ดิบ** (กฎ HOT table)
- แต่ **ฝั่ง dashboard reuse ของเดิมได้เกือบหมด** → ไม่ซับซ้อน

---

## 3. Reuse ได้เลย (ไม่เขียนใหม่)

| Component | ใช้ทำอะไร | effort |
|---|---|---|
| `sv<T>()` api-source.ts L58 | เรียก endpoint ใหม่ (auth+timeout+error พร้อม) | 0 |
| `_utils.ok()/fail()` + Cache-Control | route handler ใหม่ copy 5 บรรทัด | 0 |
| `@media print` CSS + `.slip-card`/`.print-area` globals.css L430-471 | การ์ดใหม่ใช้ class เดิม | 0 |
| PRODUCTS_MASTER + skuPerScan lookup (daily-update-data.ts L38-43) | map sku→ชื่อ + verify rights | 0 |
| DataSource interface + mock-source pattern (entriesInRange) | เพิ่ม getPrintSlips() dev offline | low |
| `maskPhone()` PrintListTab L31-37 | ปรับ regex → `081-123-xxxx` | low |
| Mulberry32 generateSlips() L43-91 | เก็บเป็น fallback offline — ปลด cap 25 | low |
| `useApi()` (CustomersTab/HeavyUsersCard) | useMemo → useApi | low |

---

## 4. What to Build (net-new · ทั้งหมดใน julaherb-crm-board)

| ไฟล์ | เพิ่มอะไร |
|---|---|
| `src/lib/utils.ts` | `maskPhone6()` + `stripProductSuffix()` |
| `src/lib/api/types.ts` | `PrintSlipRow` + `PrintSlipsResponse` |
| `src/lib/api/api-source.ts` | `getPrintSlips()` — เรียก backend endpoint ใหม่ (ไม่ page scan_history เอง) |
| `src/lib/api/mock-source.ts` | `getPrintSlips()` — ย้าย generateSlips + ปลด cap + expand by rights |
| `src/lib/api/db-source.ts` | stub NOT_IMPLEMENTED |
| `src/lib/api/adapter.ts` | + getPrintSlips ใน interface |
| `src/app/api/print-slips/route.ts` | NEW (pattern จาก segments/route.ts) |
| `src/components/tabs/PrintListTab.tsx` | useApi + redesign การ์ด 8×2.5cm 4บรรทัด + grid 3×8 |
| `src/components/ui/SlipCard.tsx` (optional) | แยกการ์ด test ง่าย |
| `src/app/globals.css` | ปรับ grid/card size ใน @media print |

---

## 5b. 🎯 แหล่งสิทธิ์จริง = ตาราง `lucky_draw_tickets` (สำรวจ saversureV2 read-only 2026-06-08)

**สิทธิ์จริงของลูกค้าอยู่ในตาราง `lucky_draw_tickets`** (ดีกว่า expand scan_history มาก):
- 1 row = 1 สิทธิ์/ตั๋ว · fields: `id, campaign_id, user_id, ticket_number, points_spent, created_at`
- UNIQUE `(campaign_id, user_id, ticket_number)` · มี idx_campaign, idx_user → **ไม่ใช่ hot table อ่านปลอดภัย**
- แคมเปญนี้ ~207,439 ตั๋วจริง (= เลข tickets ใน DB)
- grant ตอนสแกนสำเร็จผ่าน `grantLegacyLuckyDrawTickets()` (N = `lucky_draw_campaigns.tickets_per_scan`)

**Query ที่ต้องใช้** (join users + product):
```sql
SELECT t.ticket_number, u.display_name, u.phone, p.sku, p.name, t.created_at
FROM lucky_draw_tickets t
JOIN users u ON u.id = t.user_id
LEFT JOIN products p ON p.id = (SELECT product_id FROM lucky_draw_campaigns WHERE id = t.campaign_id)
WHERE t.campaign_id = $1 AND t.created_at >= $2 AND t.created_at < $3
ORDER BY t.created_at DESC LIMIT $4 OFFSET $5
```

**ติดอะไร:** ไม่มี admin endpoint ดึง tickets+user (มีแค่ /lucky-draw/:id/winners = หลังจับ, /my/... = user-scope)
→ ต้องเพิ่ม endpoint ใหม่ แก้ 3 ไฟล์ saversureV2: `cmd/api/main.go` (~745 route), `internal/dashboard/handler.go`, `internal/dashboard/service.go`
→ 🔴 **กฎห้ามแตะ saversureV2 (edit + docker restart)** = blocker เดียวที่เหลือ

**ทางเลือก deploy:** A) เขียนโค้ด Go ให้ทีม saversure เอาไป deploy (rule-safe) · B) user อนุญาตยกกฎให้ผมแก้+restart saversureV2 เอง (เร็วสุด)

---

## 5. 🔧 Backend Ask (ชิ้นเดียวที่ขาด — ส่งทีม saversure)

**`GET /api/v1/dashboard/print-slips?campaign_id=&from=&to=&cursor=&limit=`**
- คืน slip-level rows **ขยายตาม rights แล้ว** (1 right = 1 row):
  `{ scanner_name, scanner_phone, legacy_qr_code_serial, product_name, product_sku, created_at }` + cursor pagination
- **ต้องอ่านจาก rollup/snapshot ไม่ใช่ scan_history สด** + cache + replica + statement timeout (กฎ realtime safety)
- เหตุผล: rollup endpoints ที่มี (campaign-daily/report/section_20) คืนแค่ aggregate หรือ top-N hashed → ทำ 255k slip ไม่ได้ และ dashboard ห้าม page hot table

> เพิ่มลง `10-remaining-endpoints-all-pages.md` ด้วย (รายการ endpoint ที่ขอ backend)

---

## 6. 🎨 Design การ์ดใหม่ (จากภาพผู้ใช้ 8 มิ.ย.)
- ขนาด **8 × 2.5 cm** → A4 landscape 3 col × 8 row = **24 ใบ/หน้า** (~10,644 หน้าทั้งช่วง)
- 4 บรรทัด: **ชื่อ-นามสกุล** (ใหญ่กว่าเพื่อน) → **เบอร์** (081-123-xxxx · 6หน้า mask 4หลัง) → **รหัสสแกน** (DCB7F401) → **ชื่อสินค้า** (ตัด " - หลอด (L21-100G)" เหลือ "กันแดดทานตะวันทาตัว")
- ลบบรรทัด SKU เดิมออก
- **1 สิทธิ์ = 1 ใบ:** rights=5 → 5 ใบเหมือนกันเป๊ะทุกฟิลด์ (หลักจับฉลาก)

---

## 7. ตัวเลขจริง (verified live 8 มิ.ย. ผ่าน /api/scans/totals 16พค-7มิย)
| | ค่า |
|---|---|
| สิทธิ์ตามสเปก (= จำนวนใบสลิป) | **255,446** |
| ตั๋วใน DB | 207,439 (bug 1:1 หาย ~48k) |
| Distinct users | 47,592 |

---

---

## 8. ✅ Phase B IMPLEMENTED (2026-06-08) — dashboard side

ทำฝั่ง dashboard เสร็จ (รอแค่ backend endpoint สำหรับข้อมูลจริง):

| ไฟล์ | ทำอะไร |
|---|---|
| `src/lib/utils.ts` | + `maskPhone6()` ("0811234567"→"081-123-xxxx") + `stripProductSuffix()` |
| `src/lib/api/types.ts` | + `PrintSlipRow` + `PrintSlipsResponse` |
| `src/lib/api/mock-source.ts` | + `getPrintSlips()` — expand by rights (1 สิทธิ์=1 ใบ) · preview sample 8/วัน |
| `src/lib/api/api-source.ts` | + `getPrintSlips()` — **throw NOT_IMPLEMENTED** (รอ backend · ไม่ page scan_history) + comment สำหรับ swap เมื่อ backend ship |
| `src/lib/api/adapter.ts` | + getPrintSlips ใน DataSource interface |
| `src/app/api/print-slips/route.ts` | NEW — try ds.getPrintSlips → catch → fallback `mock.getPrintSlips` (rule-safe) |
| `src/components/tabs/PrintListTab.tsx` | rewrite: useApi + การ์ด 8×2.5cm · 4 บรรทัด (ชื่อใหญ่/เบอร์/รหัสสแกน/สินค้า) · 2 คอลัมน์ · banner mock |

**Design การ์ด (จากภาพ user):** 8×2.5 ซม. (verified 302×94px เป๊ะ) · ลบบรรทัด SKU · mask เบอร์ 6 หน้า+ปิด 4 ท้าย · ชื่อสินค้าตัด size/SKU
**Verified:** endpoint คืน expand-by-rights ถูก (rights=5 → 5 ใบเหมือนกัน) · compile สะอาด · หน้า render ผ่าน preview

**สถานะ data:** ตอนนี้ **mock-fallback** เพราะ backend ยังไม่มี `/dashboard/print-slips` → เมื่อ ship แล้ว swap throw ใน api-source เป็น sv() call (มี comment ครบ) + DATA_SOURCE=api ก็ใช้ข้อมูลจริง

**อัปเดต layout + ความปลอดภัยข้อมูล (รอบ 2):**
- การ์ด **3 คอลัมน์ · A4 แนวนอน** (8ซม.×3 = 24ซม. ไม่พอดีแนวตั้ง 21ซม. → `@page slipPage { size: A4 landscape }`)
- ข้อความในการ์ด **จัดกึ่งกลาง** (textAlign center)
- 🔴 **ซ่อน mock เป็น default** (ตามที่ user สั่ง "ถ้า mock ห้ามโชว์") → banner แดง "ยังไม่มีข้อมูลจริง" + ปุ่มปริ้น **disabled** ("พิมพ์ไม่ได้ (mock)") กันพิมพ์สลิปปลอมไปจับฉลาก + ปุ่ม toggle "ดูตัวอย่าง layout" (opt-in, มีคำเตือน "ห้ามใช้พิมพ์จริง")
- chip "สิทธิ์ทั้งหมด" = เลขจริงจาก live `/api/scans/totals` (ไม่ใช่ mock)

### 🎯 ข้อเสนอ (อ่านกฎแล้ว) = ทางเลือก A: รอ backend (prod-safe)
B/C (page scan_history เอง) **ขัดกฎ realtime-safety ที่ user ตั้งเอง** (HOT table + priority saversure สูงสุด) → ไม่ทำเองโดยไม่ได้รับ override ชัดเจน. A = backend อ่าน replica/rollup+cache แล้ว dashboard consume = ตรงกฎ. ปัจจุบันปลอดภัยแล้ว (ไม่มีข้อมูลปลอมหลอก) รอแค่ backend ship endpoint.

### Code review (ultracode · 3 มิติ · adversarial verify): 1 confirmed / 11 dismissed
- ✅ **ไม่มี rule violation** — ไม่ page scan_history ดิบ, api throw จริง (ไม่ยิง network), route fallback ไป mock (ไม่แตะ saversure)
- ⚠️ **Confirmed (medium, future):** เมื่อ backend คืน 255k ใบ → render DOM ทั้งหมดรอบเดียว browser ค้าง → **แก้แล้ว:** soft cap `MAX_RENDER=8000` + orange banner แนะนำ narrow ช่วงวันที่ / PDF ฝั่ง server (react-window ใช้ไม่ได้เพราะ window.print ต้องมีทุก node ใน DOM)
- 11 dismissed = false-positive ที่ verify แล้ว by-design (maskPhone6 short input, rights undefined type-guaranteed, index key on stateless leaf, route catch ฯลฯ)

### 🔧 Backend ask ต่อเนื่อง (เพิ่มจากข้อ 5)
- เมื่อ ship `/dashboard/print-slips` ควรรองรับ **cursor/offset pagination** เพื่อให้ dashboard ดึงทีละชุด + **พิจารณา server-side PDF export** สำหรับการปริ้นเต็มแคมเปญ (255k ใบ ≈ 12,000+ หน้า — browser print ไม่ไหว)

---

**Last Updated**: 2026-06-08 (Phase B implemented + reviewed)
**Related**: [17-Deep-Process-Analysis-Roadmap](17-Deep-Process-Analysis-Roadmap-2026-06-08.md) (W8) · [10-remaining-endpoints](10-remaining-endpoints-all-pages.md) · [15-rights-calculation](15-rights-calculation.md)
**Compliance**: read-only · port 3100 · ไม่ page scan_history ดิบ · ไม่แตะ saversureV1/V2
