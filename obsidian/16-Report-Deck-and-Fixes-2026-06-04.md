# 📑 Report Deck + Dashboard Fixes — 2026-06-04

สรุปงานรอบนี้: สร้างเด็คนำเสนอเจ้านาย (PPTX) + แก้ data credibility + เพิ่มฟีเจอร์ดashboard

---

## 1. 📊 PowerPoint Deck (standalone)

**ไฟล์**: `campaign-report-2026-06-04.pptx` (root ของ repo · 15 สไลด์ · ~777KB)
**สร้างด้วย**: pptxgenjs (Node) — script เก็บที่ `.report_tmp/build.js` + `deck_data.json`
**Palette**: เขียว-ทอง (แบรนด์ Jula's Herb + ทองคำรางวัล) · หมวดสี EXEC/SCAN/CUSTOMER/PRODUCT/INTEGRITY/OPS

### 15 สไลด์
1. ปก · 2. **Health Scorecard (RAG)** · 3. Scan Overview · 4. ตารางรายวัน · 5. Trend ·
6. **Growth WoW** · 7. **Pacing & Forecast** 🆕 · 8. Engagement · 9. Geographic+Fraud ·
10. Pareto · 11. Top10 SKU · 12. Integrity (DB gap) · 13. Uptime · 14. Findings · 15. ปิด

### regenerate เด็ค
```bash
# refetch data → deck_data.json → build
cd scan-lucky-rich-dashboard
export NODE_PATH="$(pwd)/node_modules"
node ../.report_tmp/build.js   # → campaign-report-YYYY-MM-DD.pptx
```

> ⚠️ เครื่องนี้ **ไม่มี LibreOffice/PowerPoint** → render เป็นรูปตรวจ layout ด้วยตาไม่ได้
> ทำได้แค่ content QA (extract-text จาก XML) — ต้องเปิดใน PowerPoint จริงเพื่อยืนยัน visual

---

## 2. 🔑 Token Refresh (saversureV2)

- JWT หมดอายุทุก ~8 ชม. → ต้อง login ใหม่เป็นระยะ
- วิธี: POST `/api/v1/auth/login` (admin@saversure.com / Admin123!, tenant_id 0000...0001)
  → เขียนทับ `SAVERSURE_API_TOKEN` ใน `.env.local` → restart dev server (port 3100)
- **TODO อนาคต**: ทำ auto-refresh ใน proxy/adapter (ดู [13](13-Migration-Progress-2026-06-04.md))

---

## 3. 👥 แก้ "คนจริง (distinct)" — credibility fix

**ปัญหา**: "ผู้เข้าร่วม" เดิมโชว์ sum-of-daily (คนเดิมมาหลายวันนับซ้ำ) → overcount ~26%

| | เดิม | แก้แล้ว |
|---|---|---|
| ผู้เข้าร่วม | 51,944 (sum-of-daily) | **41,316 (distinct จริง)** |

**ที่มา distinct**: `campaign-report` → `section_01_kpi_strip.users` (distinct ทั้งแคมเปญ)

**แก้**:
- [`api-source.ts`](../scan-lucky-rich-dashboard/src/lib/api/api-source.ts) `getScansTotals` — ยิง campaign-report ขนาน → set `distinctUsers` (best-effort, fail→undefined)
- [`CustomersTab.tsx`](../scan-lucky-rich-dashboard/src/components/tabs/CustomersTab.tsx) การ์ด "ลูกค้าทั้งหมด" → ใช้ distinct + label "distinct" + tooltip อธิบาย sum-of-daily แยก
- เด็ค PPTX → ใช้ distinct ทุกจุด

> หมายเหตุ: `summary.users_total` = 842,160 = ทั้ง tenant (ทุกแคมเปญ) **ไม่ใช่**แคมเปญนี้ — อย่าใช้

---

## 4. 📈 Forecast / Pacing (สไลด์ใหม่ในเด็ค)

- เวลาผ่านไป **20/217 วัน (9.2%)** (แคมเปญ 16 พ.ค.–18 ธ.ค. = 217 วัน)
- projection เชิงเส้นจากค่าเฉลี่ยปัจจุบัน ตอนจบ:
  - สแกน ~1.72M · สิทธิ์สเปก ~2.34M · สมาชิกใหม่ ~81k
  - ⚠️ caveat: ช่วงต้น ramp → ตัวเลขจริงอาจต่างมาก

---

## 5. 🗓️ ปุ่ม "รายเดือน" ในกราฟ Trend (ก่อนหน้านี้ในวันเดียวกัน)

- [`period-group.ts`](../scan-lucky-rich-dashboard/src/lib/period-group.ts) 🆕 — `groupByPeriod(rows, 'day'|'month', sumKeys)` (logic กลาง ใช้ได้ทุกหน้า) + `monthLabel()`
- [`TrendLineChart.tsx`](../scan-lucky-rich-dashboard/src/components/ui/TrendLineChart.tsx) — toggle 📆 รายวัน / 🗓️ รายเดือน
  - รายเดือน = พ.ค. เป็น 1 จุด (ผลรวม 125,340 สแกน) แทน 20 จุดรายวัน
- **ยอดเดือน พ.ค. (16-31)**: สแกน 125,340 · สิทธิ์สเปก 170,281 · DB 123,082 · ขาด 47,199 (27.7%)

---

## 6. ❤️ CRM Center Tab + CRM Strategy Deck (เพิ่มล่าสุด)

**Tab ใหม่ "CRM Center"** — บนสุด sidebar (เหนือ Scan Overview) · แผนดูแลลูกค้าเชิงรุก 3 OBJ จาก data จริง

| ไฟล์ | หน้าที่ |
|---|---|
| `src/components/tabs/CrmCenterTab.tsx` 🆕 | 3 ZONE (Acquisition/Engagement/Retention) · hero strip · play cards (target size live) · loop |
| `src/app/api/customers/segments/route.ts` 🆕 + `getSegments()` ใน api-source/adapter/mock + types | ดึง `crm/segments` (Loyal 14,351 · Champions 4,601) live |
| sidebar/page/types | register `'crm-center'` ที่ index 0 |
| `crm-strategy-2026-06-04.pptx` 🆕 (7 สไลด์) | เด็ค CRM 3 OBJ · script `.report_tmp/build-crm.js` |

**3 OBJ (target size = live data)**:
- **1 Acquisition**: First-scan activation (14,473 คนสแกนครั้งเดียว) · Member-get-member · Geographic expansion
- **2 Engagement**: Tier gamification (26,785 กลุ่ม 2-5) · Cross-category quest · 2nd-scan trigger
- **3 Retention+Referral**: VIP retain (Loyal+Champions) · Win-back · Referral loop + UGC
- 🔄 วงจรโต: referral = สะพานเชื่อม retention→acquisition

**CRM infra ใน saversureV2 (พร้อมใช้)**: `crm/segments` · `crm/tags` · `crm/broadcasts` (LINE) · `crm/triggers` (automation) · `dashboard/crm/customer-cohorts`
⚠️ tab แสดงแผน+ตัวเลข targeting เท่านั้น — **ไม่ยิง broadcast/trigger จริง** (ทีม CRM กดใน saversure)
⚠️ data gaps: ไม่มี sales→LTV/ROI ไม่ได้ · RFM ราย user endpoint ยัง 404 (ตาราง customer_rfm_snapshots มี)

---

## ⚖️ Rule Compliance (ทุกงาน)
- ✅ แก้เฉพาะ julaherb-crm-board · consume saversureV2 read-only (GET + auth/login) · ไม่แตะ saversureV2 code/DB · port 3100
- saversureV2 git ที่เห็น modified (.cursor/.env.v2/AGENTS.md) = ของเดิม **ไม่ใช่จากงานนี้**

## 🔜 ที่ยังเหลือ (เสนอไว้ user เลือกทำต่อ)
- Engagement bucket histogram จริง (6-10=0 เพราะ derive จำกัด) — รอ backend
- ROI/cost-per-acquisition · Geographic opportunity (จังหวัด penetration ต่ำ)
- Quick wins: Risk tab wire (campaign-report velocity/multi-account), PrintList wire (/scan-history), ปุ่มรายเดือนหน้าอื่น, Report tab redesign (เอา design เด็คกลับมาใส่ tab)
- Backend-blocked: Channels · Winners · per-SKU daily · time-of-day · weekly cohort · ticket_per_scan จริง

---

**Last Updated**: 2026-06-04
**Related**: [13-Migration-Progress](13-Migration-Progress-2026-06-04.md) · [15-rights-calculation](15-rights-calculation.md)
