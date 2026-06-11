# SaversureV2 Dashboard Integration Index

Last updated: 2026-06-11 (Claim checklist + admin pickup calendar)

ไฟล์นี้เป็นจุดเริ่มต้นหลักสำหรับเปิดอ่านสถานะงาน dashboard integration ระหว่าง `julaherb-crm-board` และ `saversureV2`

## Current Truth

- ✅ **2026-06-11**: **รับรางวัล: checklist เอกสาร + ปฏิทินคิวรับรางวัล** — `/claim` เปลี่ยนจากอัปโหลดเอกสารเป็นตรวจสิทธิ์ + checklist เอกสารที่ต้องนำมาแสดงตัวจริง · ปิด `POST /api/claim/submit` เป็น `410 Gone` · หน้า admin `รับรางวัล` เพิ่ม sub-view `ปฏิทินรับรางวัล` สำหรับ Ops monitor Jul-Dec 2569 พร้อม mock occupancy, detail slots, filter, CSV export (ดู [24-Claim-Checklist-and-Pickup-Calendar-2026-06-11.md](24-Claim-Checklist-and-Pickup-Calendar-2026-06-11.md))
- ✅ **2026-06-10**: **วันจับรางวัล + ลูกค้ารับรางวัล + ประกาศผล** — Operations บันทึกผู้ชนะ 7 รอบ + ป้าย "ผู้โชคดีประจำวันที่ X" · `/claim` ลูกค้าส่งเอกสาร (รื้อใหม่ + ตัวอย่าง SVG) · `/winners` ประกาศผลสาธารณะ (gate วันประกาศฝั่ง server + mask `081-123-xxxx`) · cross-tab Operations→รับรางวัล · mobile/LINE OA (viewport+safe-area) · ผ่าน adversarial review (6 fix) (ดู [23-Draw-Claim-Winners-Pages-2026-06-10.md](23-Draw-Claim-Winners-Pages-2026-06-10.md)) — ⚠️ ยังเป็น localhost ต้อง deploy ก่อนใช้ LINE OA จริง
- ✅ **2026-06-09 (PM)**: **Print List พร้อมใช้จับฉลากจริง** — PDF ตรงจอเป๊ะ (Google Fonts Sarabun + line-height 1.5) · ตัดพนักงาน 188 คน (เบอร์+ชื่อ) · แก้ `Page.printToPDF timed out` (protocolTimeout 540s) · **auto-split หลายไฟล์** เมื่อ >15k/วัน · ตรวจ rights logic = **ไม่เบิ้ล** (verified code+data) (ดู [22-PrintList-PDF-Hardening-and-Rights-Audit-2026-06-09.md](22-PrintList-PDF-Hardening-and-Rights-Audit-2026-06-09.md))
- ✅ **2026-06-09 (AM)**: **Print List LIVE** — endpoint `/dashboard/print-slips` deployed, dashboard ดึงของจริง end-to-end (`source:"api"`, `total=65173`); แก้ draw-fairness + campaign-report/daily 500 (/dev/shm) ครบ (ดู [21-PrintList-LIVE-2026-06-09.md](21-PrintList-LIVE-2026-06-09.md))
- ✅ **2026-05-28**: dashboard ดึง **live data** จาก saversureV2 สำเร็จ end-to-end (HTTP verified — ดู [11-Live-Data-Verified-2026-05-28.md](11-Live-Data-Verified-2026-05-28.md))
- dashboard ฝั่ง `julaherb-crm-board` มี data-source แบบ API แล้วใน `scan-lucky-rich-dashboard/src/lib/api/api-source.ts`
- endpoint `campaign-daily` deployed + tested + dashboard ใช้งานจริงแล้ว
- งานส่วนนี้เป็น read-only โดยเจตนา ใช้เพื่ออ่านข้อมูล dashboard เท่านั้น ไม่ควรแตะคะแนน scan ลูกค้า coupon หรือ campaign state
- สถานะ production/live ให้ดูร่วมกับ `C:\projects\Github\saversureV2\docs\PENDING_REBUILD.md` เพราะไฟล์นั้นเก็บ queue deploy และ pending งานของ backend/admin

## Active Documents

1. `24-Claim-Checklist-and-Pickup-Calendar-2026-06-11.md` ⭐ **NEWEST — รับรางวัล checklist + admin calendar**
   - `/claim` = ตรวจสิทธิ์ + รายการเอกสารที่ต้องเตรียม ไม่รับ upload แล้ว · `claim/submit` ตอบ 410 · `รับรางวัล` มี sub-view `รายชื่อผู้โชคดี` / `ปฏิทินรับรางวัล` · calendar ใช้ mock data inline, Jul-Dec 2569, 7 slots/day, holiday/substitute/draw markers, CSV export

1. `23-Draw-Claim-Winners-Pages-2026-06-10.md` ⭐ **NEWEST — วันจับรางวัล + รับรางวัล + ประกาศผล**
   - Operations บันทึกผู้ชนะ + "ผู้โชคดีประจำวันที่ X" · `/claim` รื้อใหม่ + ตัวอย่างเอกสาร SVG · `/winners` ประกาศผลสาธารณะ (gate วันประกาศ + mask 081-123-xxxx) · cross-tab flow + adversarial review (6 fix) · viewport/safe-area mobile · กฎวันประกาศ: รอบจับปลายเดือน→ผู้โชคดีรายวันเดือนถัดไป

2. `22-PrintList-PDF-Hardening-and-Rights-Audit-2026-06-09.md` — PDF เป๊ะ + auto-split + rights audit
   - PDF=จอ (Sarabun) · ตัดพนักงาน 188 (เบอร์+ชื่อ) · protocolTimeout 540s · แบ่งไฟล์ >15k · ยืนยันไม่เบิ้ล + 2 ปม backend (unique constraint, draw fairness)

2. `21-PrintList-LIVE-2026-06-09.md` — Print List endpoint LIVE (verified)
   - print-slips endpoint + draw-fairness fix + /dev/shm fix · deployed · ทุก dashboard endpoint 200 · board `source:"api"`

2. `20-Backend-Handoff-PrintSlips-2026-06-08.md` — spec/handoff เดิม (ทำเสร็จตาม 21 แล้ว)
   - โค้ด Go จริง (route/handler/service) + SQL + spec endpoint `/dashboard/print-slips`
   - วิธีทำงาน 5 ขั้น (ส่งทีม → deploy → test → ผม wire) + จุดที่ทีมต้องยืนยัน (rights field, 207k vs 255k)

2. `19-PrintList-Rights-Status-and-Remaining-2026-06-08.md`
   - logic สิทธิ์ที่ยืนยันแล้ว (Σ สแกนสำเร็จ × สิทธิ์ต่อสินค้า · success only · 1 สิทธิ์=1 ใบ)
   - สรุป "เหลืออะไร": ข้อมูลครบใน DB แล้ว เหลือเปิด API ที่ saversureV2 (ก/ข)
   - endpoint spec + ขั้นต่อไป

2. `18-API-Inventory-and-PrintList-Match-2026-06-08.md`
   - inventory 17 internal API routes (live/derived/stub) + auth pattern
   - จับคู่ Print List → API ที่ใกล้สุด (heavy-users) + ชิ้นที่ขาด (backend slip endpoint)
   - reuse plan + design การ์ดใหม่ 8×2.5cm + ตัวเลขจริง 255,446 สิทธิ์

2. `17-Deep-Process-Analysis-Roadmap-2026-06-08.md`
   - วิเคราะห์ mock-vs-real ทุก tab · 18 credibility issues · roadmap 20 งาน · 10 backend asks

3. `16-Report-Deck-and-Fixes-2026-06-04.md`
   - เด็คนำเสนอเจ้านาย (PPTX 15 สไลด์) + วิธี regenerate
   - แก้ "คนจริง distinct" (41,316 แทน 51,944 sum-of-daily)
   - Forecast/Pacing · ปุ่มรายเดือน · token refresh procedure

2. `15-rights-calculation.md`
   - สูตร "สิทธิ์ตามสเปก" = สแกน × max_tickets_per_user (blended ×1.36)

3. `13-Migration-Progress-2026-06-04.md`
   - สถานะ migration mock→API ทุก tab + Report tab

4. `11-Live-Data-Verified-2026-05-28.md`
   - milestone — dashboard ดึง live data จาก saversureV2 สำเร็จ
   - HTTP smoke test + architecture diagram + token refresh procedure

2. `10-remaining-endpoints-all-pages.md`
   - รายการ endpoint ที่ยังต้อง map ต่อสำหรับทุก tab ใน dashboard
   - ใช้ track scope งานที่เหลือ

3. `09-saversureV2-endpoints-needed.md`
   - สถานะ endpoint `campaign-daily` (deployed + verified ✅)
   - contract API ที่ dashboard ใช้

4. `08-saversureV2-API-analysis.md`
   - วิเคราะห์แหล่งข้อมูล API เดิมของ saversureV2
   - ใช้เป็น rationale ว่าทำไมต้องมี endpoint daily เพิ่ม

5. `07-Migration-Status.md`
   - บันทึก migration เดิมของ dashboard (ก่อน live data)

6. `00-RULES.md`
   - guardrail สำหรับทำงาน dashboard แบบ read-only
   - ห้ามแตะ saversureV1/V2 code/DB/config
   - ✅ Read-only HTTP consumer pattern (เช่น `/auth/login` + GET endpoints) อนุญาตแล้ว

## Working With Other IDEs

- ก่อนแก้โค้ด ให้เช็ก `git status` ของทั้งสอง repo เสมอ เพราะมีงานจาก IDE อื่นร่วมอยู่
- ห้าม revert หรือ reset งานที่ไม่ได้ทำเอง
- ถ้าไฟล์เดียวกันถูกแก้จาก IDE อื่น ให้เปิดอ่าน diff ก่อน แล้ว patch เฉพาะส่วนที่เกี่ยวข้อง
- ทุกสถานะที่เปลี่ยนจริงควรอัปเดตในไฟล์ index/status ก่อนจบงาน เพื่อให้ IDE อื่นอ่านต่อได้

## Current Handoff

ขั้นตอน 1-4 **เสร็จเมื่อ 2026-05-28** ✅ (ดู [11-Live-Data-Verified-2026-05-28.md](11-Live-Data-Verified-2026-05-28.md))

1. ✅ deploy endpoint `GET /api/v1/dashboard/campaign-daily` — running ที่ port 30400
2. ✅ test API ด้วย JWT token จริง — refresh ผ่าน `/auth/login` สำเร็จ
3. ✅ ตั้ง dashboard เป็น `DATA_SOURCE=api`
4. ✅ ตรวจหน้า dashboard ว่า daily table, timeseries และ members daily แสดงข้อมูลจริงครบ — verified 13 วัน (16-28 พ.ค.)

ขั้นถัดไป:

5. ⏳ ถ้าตัวเลข invalid/not_found ต้องแยก campaign-scoped ให้ถูก ให้เพิ่ม source field หรือ endpoint เฉพาะเพิ่มเติม
6. ⏳ ทำ auto-refresh token (ตอนนี้ใช้ JWT exp ~8 ชม. — หมดต้อง manual login ใหม่)
7. ⏳ Map endpoint ที่ยัง `NOT_IMPLEMENTED` ใน api-source.ts (time-of-day, engagement, retention, sku/*, baseline) ตามที่ saversureV2 ทำ endpoint รองรับ

## Stale / Historical Notes

ไฟล์ incident/test ใน Obsidian Vault ยังมีประโยชน์เป็นหลักฐาน timeline แต่ไม่ควรใช้เป็นสถานะล่าสุดโดยตรง ให้เปิด `00-INDEX - SaversureV2.md` ใน vault ก่อน แล้วค่อยไล่ไปยัง incident note ที่เกี่ยวข้อง
