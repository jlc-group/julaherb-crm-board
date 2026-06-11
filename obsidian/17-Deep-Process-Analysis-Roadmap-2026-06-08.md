# 🔬 Deep Process Analysis + Roadmap — 2026-06-08

วิเคราะห์เชิงลึก (ultracode workflow · 6 agents · read-only) สถานะ mock-vs-real ทุก tab, API gaps, ปัญหา credibility, สถาปัตยกรรม → แผนงานต่อจัดลำดับความสำคัญ

> วิธีได้มา: workflow `julaherb-process-deep-analysis` (5 agent อ่านขนาน: tab data-source / API surface / credibility / obsidian plan / architecture → 1 agent สังเคราะห์). ไม่แตะ saversureV2 (อ่านโค้ด + verified API facts จาก session)

---

## 1. ภาพรวม: real / mock / stale

### ✅ Live จริง (เชื่อถือได้)
- **Overview**: total scans, tickets(DB), distinctUsers (~41,974 จาก campaign-report section_01), trend รายวัน + toggle รายเดือน, daily table, members new/old, uptime (monitor/incidents)
- **Customers/CRM/Report**: HeavyUsers (section_20), TopProvinces (section_19), members daily
- **Products**: KPI strip (totalSku/active/dead จาก /products + section_16 snapshot)
- **CRM Center**: ตัวเลข targeting เชิงปริมาณ (live แต่ดู caveat ด้านล่าง)
- **Report tab**: 8 useApi feeds + PPTX export

### 🔴 Mock 100% (มี DemoBanner)
- **ChannelsTab** ทั้งใบ (CHANNEL_DATA + pseudoRand PRNG) — ไม่มี API
- **OperationsTab** winners/burn/forecast (MOCK_WINNERS) — ไม่มี API
- **RiskTab** fraud/velocity/multi-account (mock-data MOCK_USERS) — ไม่มี API
- **ScanBehaviorTab** funnel/heatmap/cohort/TV lift — static
- **PrintListTab** สลิป (ชื่อ/เบอร์/code) สังเคราะห์ด้วย Mulberry32 PRNG

### 🟡 ดูเหมือน live แต่ stale/approximate (อันตรายสุด — ติด badge 🟢 API)
| ตัวเลข | ที่โชว์ | ปัญหา |
|---|---|---|
| Engagement buckets 1/2-5/6-10/10+ | Customers, CRM Center | hardcoded 0.65/0.35 split; 6-10 = top-20 artifact ~0 |
| Repeat Rate % | Customers, CRM hero | มาจาก buckets ปลอม → คงที่ ~65% แต่งเป็น metric วัดได้ |
| Median scans/user | Customers | = tixPerUser × 0.7 (เอา mean คูณค่าเดา ไม่ใช่ median) |
| avgScansPerUser | Customers, CRM | = tix_per_user (เป็น **tickets**/คน ไม่ใช่ scans/คน) → จะ inflate ~36% เมื่อ backend แก้ ticket 1:1 bug |
| Heavy Users count | Customers | = row count ของ list (cap ที่ limit) ไม่ใช่ count คนเกิน threshold; 3 threshold ขัดกัน (30/10/>5) |
| Loyal 14,351 / Champions 4,601 | CRM Center, Report | cached_at **29 เม.ย.** (ก่อน campaign) + **tenant-wide** ไม่ใช่ campaign |
| สิทธิ์ตามสเปก ~214,751 / gap ~48,517 | Overview | blended ×1.3586 จาก SKU mix 16-24 พ.ค. only — estimate ไม่ใช่ deficit แน่นอน |
| Top จังหวัด 'Scans' column | Customers | จริงๆ คือ **tickets**; anomaly 'สงสัย bot >5' fire บน tickets/user → จังหวัดสุจริตถูก flag ก่อนจ่ายรางวัลได้ |
| RFM SegmentMixCard (Champion 1,388...) | Customers | hardcoded ทั้งหมด (base 8,355 ไม่ match อะไรเลย) |
| Cohort Retention W1 45-48% | Customers | hardcoded; ไม่มี data source |

---

## 2. Roadmap (20 work items, จัดลำดับแล้ว)

### 🥇 Foundation (ทำก่อนพึ่ง 'api' mode จริง)
- **W1** Token auto-refresh ใน api-source (กัน 401 cliff ทุก 8 ชม.) — `high·M`
- **W2** Short-TTL cache + request coalescing สำหรับ campaign-report (6 caller ยิงซ้ำ) — `high·M` · **gentle บน prod DB ที่ QR สแกนจริงเขียน**

### 🥈 Credibility quick-fixes (S — relabel ก่อนเข้า exec)
- **W3** เลิก label engagement/repeat/median/avgScan เป็น 🟢 API; avgScan = sum(success)/distinct, ลบ median, ลบ 0.65 split — `high·S`
- **W5** โชว์ cached_at + 'ทั้ง tenant' ข้าง Loyal/Champions; ลบ footer 'live ทั้งหมด' — `high·S`
- **W4** bind/relabel RFM SegmentMixCard + Action Items + Cohort hardcoded — `high·M`
- **W12** เลิก silent fallback distinctUsers→sum-of-daily (กันเลขเบิ้ล ~26%) — `med·S`
- **W6** แก้ Top จังหวัด column = Tickets + ย้าย fraud language ออกจาก threshold ผิด — `med·S`
- **W7** Heavy Users = 'Top N' ไม่ใช่ 'count' + รวมนิยาม threshold เดียว — `med·S`
- **W13** label สิทธิ์ตามสเปก = ESTIMATE + recompute factor เต็ม window — `med·S`
- **W11** DEFAULT_RANGE.to derive จาก getCampaignToday() แทน hardcoded 24 พ.ค. — `med·S`
- **W14** meta envelope {approximated, source} + เลิก leak error string — `med·M`

### 🥉 Wire real data (quick-wins, พึ่ง W1/W2)
- **W8** Wire PrintList → /api/scan-history (client-side date filter, page newest→oldest) — `high·M`
- **W16** Wire RiskTab จาก campaign-report section_12 (velocity) + section_22 (multi-account) — `med·M`
- **W15** DemoBanner → EmptyState+ETA บน blocked tabs + label ~20 static component — `med·M`
- **W10** Real engagement histogram + repeat rate จาก /scan-history GROUP BY phone (cached) — `high·L`
- **W9** Real time-of-day histogram จาก created_at (cached) — `med·L`

### 🧹 Cleanup / health (ท้าย)
- **W18** Extract shared aggregation helpers + แก้ db-source ขาด getSegments — `low·M`
- **W17** Code-split pptxgenjs + narrow node: strip — `low·S`
- **W19** Phase 5: tag static @deprecated + flip adapter default mock→api (พึ่ง W1/W2/W11/W14/W15) — `med·M`
- **W20** นำ unused endpoints มาใช้ (customer-cohorts/broadcasts/tags/triggers) — `low·M`

---

## 3. Backend asks (ส่ง contract ให้ทีม saversure — dashboard ห้าม hack เอง)
1. **GET /dashboard/engagement-distribution** — per-user scan histogram (1/2-5/6-10/10+) + repeat_rate + median, campaign-scoped → ปลด W10 โดยไม่ต้อง page 12.5M rows
2. **date/campaign filter ที่ใช้งานได้จริงบน /scan-history** — ตอนนี้ param ไม่ honored → ต้อง page หนัก
3. **GET /dashboard/scan-by-hour** — hour aggregate → ปลด W9
4. **GET /dashboard/sku-daily** — section_16 เต็มทุกวัน (ตอนนี้ snapshot เดียว) → Products live + exact rights
5. **products.ticket_per_scan** field จริง — เลิกพึ่ง max_tickets_per_user ที่ repurposed
6. **refresh /crm/segments campaign-scoped** หรือ expose customer_rfm_snapshots (RFM 404) → ปลด W4/W5
7. **sku_diversity ใน section_20** → fraud heuristic ทำงาน
8. **GET /dashboard/channels** → ปลด ChannelsTab
9. **GET /lucky-draw/:id/winners + /prize-allocations** (read) → ปลด OperationsTab
10. **COUNT(DISTINCT user) range-scoped** → distinct จริงทุก sub-range

---

## 4. Risks หลัก
- ⚠️ **prod = QR สแกนจริง**: page /scan-history (12.5M, date filter พัง) สำหรับ W8/W9/W10 ถ้าไม่มี cache(W2)+page limit อาจกระแทก DB ตอนพีค → ต้อง cached batch เสมอ
- ⚠️ **polling**: Overview 4 endpoint/30s, Report 8 useApi/render, 6 ฟังก์ชันยิง campaign-report ซ้ำ × ทุก browser tab → ต้อง W2 + ขยับ poll 60-120s ก่อนเปิดแท็บ live เพิ่ม
- ⚠️ **token 8h cliff**: ห้าม flip adapter default → 'api' ก่อนทำ W1 ไม่งั้น dashboard ตายเงียบหลัง ~8 ชม.
- ⚠️ **stale segment หน้า exec**: Loyal/Champions ก่อน campaign + tenant-wide → อาจตั้ง target/broadcast ผิด (W5 ก่อนนำเสนอ)
- ⚠️ **fraud false-positive**: จังหวัดสุจริตถูก flag bot เพราะ threshold บน tickets/user (W6)

---

**Last Updated**: 2026-06-08
**Related**: [16-Report-Deck-and-Fixes](16-Report-Deck-and-Fixes-2026-06-04.md) · [13-Migration-Progress](13-Migration-Progress-2026-06-04.md) · [15-rights-calculation](15-rights-calculation.md)
**Compliance**: read-only consume :30400 · port 3100 · ไม่แตะ saversureV1/V2 · DB direct ยัง denied
