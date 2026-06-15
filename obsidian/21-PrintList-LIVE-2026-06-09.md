# Print List — LIVE ✅ (2026-06-09)

หน้า **Print List** ดึงข้อมูลจริงจาก saversureV2 ได้แล้ว (end-to-end) + แก้บั๊ก/ปัญหาที่เจอระหว่างทางครบ

## ผลลัพธ์ (verified)
- `localhost:3100/api/print-slips` → `source:"api"`, ของจริง (เช่น `total=65173` ช่วง 16–22 พ.ค.)
- 1 สิทธิ์ = 1 ใบ (สแกนเดียว product rights=N → ออก N แถวเหมือนกันเป๊ะ)
- field ครบ: `name / phone / scanCode / productName / productSku`
- endpoint dashboard ทั้งหมด 200: summary / print-slips / campaign-daily / campaign-report

## สิ่งที่ทำ (ฝั่ง saversureV2 — branch `cutover-prep-20260520`)
1. **สร้าง `GET /dashboard/print-slips`** (`internal/dashboard/print_slips.go` + handler + route)
   - อ่าน `scan_history` (success) → expand ตาม `lucky_draw_campaigns.tickets_per_scan` ด้วย `generate_series`
   - คืน `{ total, rows:[{scanner_name, scanner_phone, legacy_qr_code_serial, product_name, product_sku}] }`
   - bound ด้วย campaign + `from/to` + `limit` (ไม่ page scan_history ดิบ — realtime-safe)
2. **แก้ความเป็นธรรมการจับรางวัล** (`internal/luckydraw/service.go` `DrawWinners`)
   - เดิมสุ่มจาก "แถว" → ตั๋ว V1 (สิทธิ์เยอะ/แถวเดียว) เสียเปรียบ
   - แก้: expand `GREATEST(points_spent,1)` ก่อนสุ่ม (เฉพาะแคมเปญ legacy)
3. **แก้ 500 ของ campaign-report/daily** (`/dev/shm` เต็ม, SQLSTATE 53100)
   - postgres container `/dev/shm` (64MB) ไม่พอสำหรับ parallel aggregate ที่ข้อมูลโต
   - แก้: `beginNoParallel` → `SET LOCAL max_parallel_workers_per_gather=0` ใน query หนัก (ไม่ restart postgres)

## สิ่งที่ทำ (ฝั่งบอร์ด — branch `feat/saversure-api-integration`)
- `src/lib/api/api-source.ts` `getPrintSlips`: แทน `throw NOT_IMPLEMENTED` → เรียก `/dashboard/print-slips` จริง + map → PrintSlip shape
- `.env.local`: `DATA_SOURCE=api`, base `localhost:30400/api/v1` (ตั้งไว้แล้ว)

## หมายเหตุ / งานต่อ
- **207k vs 255k = ไม่ใช่ข้อมูลหาย** — V1 นับ "สิทธิ์", V2 (sync) นับ "ครั้งสแกน" (count ซ่อนใน `points_spent`)
- ปริ้นตอนนี้ทีละ `limit=5000` ใบ → ปริ้นครบ 1.7 แสนใบต้องทำ **pagination/cursor** เพิ่ม
- ทางแก้ /dev/shm ระยะยาว (ถ้าต้องการ parallel กลับมา): `shm_size: 1g` บน postgres ใน docker-compose (ต้อง recreate postgres)
- gotcha: ภาษาไทยใน query param จาก **Git Bash curl** ถูกส่งเป็น TIS-620 → `invalid byte sequence UTF8 0xca 0xe1` (เทสด้วย `campaign_id` หรือ client ที่เป็น UTF-8)

## อ้างอิง
- saversureV2 audit เต็ม: `saversureV2/docs/LUCKY_DRAW_TICKETS_AUDIT_PRINT_PLAN_20260608.md`
- deploy log + verify: `saversureV2/docs/PENDING_REBUILD.md`
- [[20-Backend-Handoff-PrintSlips-2026-06-08]] · [[19-PrintList-Rights-Status-and-Remaining-2026-06-08]] · [[18-API-Inventory-and-PrintList-Match-2026-06-08]]
