# Print List — PDF Hardening + Daily Export + Rights Logic Audit

**Date:** 2026-06-09
**Scope:** ทำบน `julaherb-crm-board` (dashboard, port 3100) อย่างเดียว · consume saversureV2 read-only · ไม่แตะ saversureV2 code/DB/ports — ตามกฏ [00-RULES](00-RULES.md)
**Status:** ✅ เสร็จ + verified (code + ข้อมูลจริง)
**Related:** [21-PrintList-LIVE](21-PrintList-LIVE-2026-06-09.md), [19-PrintList-Rights-Status](19-PrintList-Rights-Status-and-Remaining-2026-06-08.md), [15-rights-calculation](15-rights-calculation.md)

---

## 0. TL;DR

วันนี้ทำให้ Print List พร้อมใช้จริงสำหรับจับฉลาก: **PDF ตรงกับจอเป๊ะ · ตัดพนักงานครบ · โหลดได้ทุกวันแม้สลิปเยอะ** + ตรวจ logic การได้สิทธิ์ทั้งระบบ (ยืนยัน **ไม่เบิ้ล**).

1. **ตัดพนักงาน v2** — เบอร์+ชื่อ (188 ชื่อ + 168 เบอร์) จับชื่ออังกฤษได้
2. **PDF = จอเป๊ะ** — Google Fonts Sarabun ชุดเดียวกับจอ + line-height 1.5 (สระล่างไม่ตก)
3. **ชื่อไฟล์ง่าย** — `สลิปจับฉลาก_{from}_ถึง_{to}.pdf` + rename ไฟล์เก่า 11 ไฟล์
4. **แก้ PDF timeout** — `protocolTimeout` 180→540s + `maxDuration` 300→600s
5. **Auto-split** — สลิป >15,000 แบ่งหลายไฟล์อัตโนมัติ (ส่วนX-จากY)
6. **Rights audit** — อ่าน backend จริง: ได้สิทธิ์ยังไง + ยืนยันไม่เบิ้ล + เจอ 2 ปมฝั่ง backend

---

## 1. ตัดพนักงานออกจากสิทธิ์ (เบอร์ + ชื่อ)

- `src/config/employee-exclude.ts` — regenerate จาก Excel `รายชื่อพนักงาน 09-06-26.xlsx` (4 sheet ACT/ASC/JLC/TAN) + 9 ชื่อใหม่ → **188 ชื่อ + 168 เบอร์ (last-9-digit)**
- helper: `matchExcluded(name, phone)` = จับทั้งจากชื่อ (normalize ตัดคำนำหน้า) **และ** เบอร์ (9 หลักท้าย)
  - จับ**พนักงานที่ลงทะเบียนด้วยชื่ออังกฤษ**ได้ (เช่น "Chayanut Nimisil" = ชยณัฐ นิมิศิลป์ — name-match ไม่เจอ แต่ phone-match เจอ)
- `src/lib/api/api-source.ts` `getPrintSlips` — เปลี่ยน `matchExcludedName(name)` → `matchExcluded(row.scanner_name, row.scanner_phone)`
- ทำบน **ชุดเต็มที่ดึงมา** (ไม่ใช่แค่ 5,000 preview บนจอ)

---

## 2. PDF ให้ตรงกับจอเป๊ะ (font + สระล่าง)

**ปัญหา:** PDF หน้าตาไม่ตรงจอ (ระยะบรรทัดกระจาย / สระล่างตก)

**Root cause (พิสูจน์ด้วยการวัดพิกเซล):**
- การ์ดบนจอกับ HTML ของ route เรนเดอร์ในเบราว์เซอร์เดียวกัน **เท่ากันเป๊ะทุกพิกเซล** (cardH 113.38, gap 3.02px) → CSS ไม่ใช่ปัญหา
- จอใช้ **Sarabun (Google Fonts @import ใน globals.css)** แต่ PDF (headless Chrome) ใช้ `sans-serif` default คนละตัว → ascent/descent ต่าง → ระยะบรรทัดต่าง
- + ที่ user เห็น "ไม่เปลี่ยน" เพราะเปิด**ไฟล์เก่าใน Downloads** (ชื่อซ้ำเดิม)

**แก้ที่ `src/app/api/print-slips-pdf/route.ts`:**
- ใส่ `<link>` Google Fonts Sarabun ชุดเดียวกับ globals.css + `font-family:'Sarabun',sans-serif`
- `setContent waitUntil:'networkidle0'` + `await document.fonts.load('… Sarabun')` จริงก่อน `page.pdf()` (กัน `display=swap` แสดง fallback)
- `line-height: 1.15 → 1.5` ทั้ง PDF route + `PrintListTab.tsx` (สระล่างมีที่พอ ไม่ถูก overflow:hidden ตัด)

**พิสูจน์:** PDF ฝัง BaseFont `Sarabun-Bold` + `Sarabun-Regular` · render หน้า 1 ด้วย PDF.js เทียบกับการ์ดจอ scale เดียวกัน = เหมือนกันทุกพิกเซล

---

## 3. ชื่อไฟล์ + rename ไฟล์เก่า

- สุดท้าย user เลือกแบบง่ายสุด: **`สลิปจับฉลาก_{from}_ถึง_{to}.pdf`** (ไม่มีวันที่/จำนวนสิทธิ์ — ระบบตัดพนักงานให้อยู่แล้ว)
- `PrintListTab.tsx` `downloadPdf` ตั้งชื่อตามนี้
- rename ไฟล์เดิมในโฟลเดอร์ `รายชื่อลูกค้า รอบ 1` **11 ไฟล์** (05-29 ถึง 06-08) ให้เป็นแพทเทิร์นเดียวกัน (ตัด `_20260609` / `_X สิทธิ์` ออก) — ผ่าน PowerShell regex `^(.*?_\d{4}-\d{2}-\d{2}_.*?_\d{4}-\d{2}-\d{2})_.*\.pdf$`

---

## 4. แก้ "Page.printToPDF timed out" + Auto-split

### 4.1 ต้นเหตุ
Puppeteer มี timeout 2 ชั้น — แก้ `page.pdf({timeout:0})` ไปแล้วชั้นเดียว แต่ **`protocolTimeout` (CDP) ยัง default 180s**. วันที่สลิปเยอะ render เกิน 180s → ตัด
- log จริง: `2026-05-28` → 500 ที่ **188s/190s** · `2026-05-27` → 200 ที่ 142s (เส้น 180s เป๊ะ)

### 4.2 แก้ (`route.ts`)
- `puppeteer.launch({ protocolTimeout: 540000 })` (9 นาที)
- `export const maxDuration = 600`
- **verify:** 05-28 เดิมพัง 188s → ตอนนี้ผ่าน **205s, 200, 24.6MB** ✅

### 4.3 Auto-split (ดีไซน์ที่ user ขอ — หลายไฟล์แยก)
แต่ละ printToPDF ครั้งเดียวหน้าเยอะเกินไป = ตัน → แบ่งเป็นไฟล์ละ `PART_SIZE` ใบ (แต่ละไฟล์ render < ~290s):
- `route.ts`: `PART_SIZE=15000`, `MAX_PARTS=6` · รับ `?part=N` · fetch limit = `PART_SIZE*MAX_PARTS` (90,000) · `total >= 90000` → 413 (กว้างเกินไป) · `slice((part-1)*PART_SIZE, part*PART_SIZE)` · ส่ง header `X-Total-Parts` / `X-Part` / `X-Total-Slips`
- `PrintListTab.tsx` `downloadPdf`: loop โหลดทีละ part → อ่าน `X-Total-Parts` → ตั้งชื่อ `…_ส่วน{n}-จาก{N}.pdf` (ถ้า >1 ส่วน) · ปุ่มโชว์ progress "กำลังสร้างส่วน X/Y…"
- พฤติกรรม: วัน ≤15k = **1 ไฟล์เหมือนเดิม** · วันพีค/หลายวัน = **แบ่งอัตโนมัติ** · >90k = แจ้งให้เลือกแคบลง

**verify:**
- 06-09 (5,976) → `totalParts=1`, 1 ไฟล์ ✅
- 06-06→06-07 (25,594) → `totalParts=2` · part=2 (ส่วนหาง 10,594 การ์ด) render **94s**, 200, 21.8MB ✅

---

## 5. Rights Logic Audit — "ได้สิทธิ์ยังไง / เบิ้ลไหม"

อ่าน saversureV2 จริง (read-only) + ตรวจข้อมูลจริงผ่าน dashboard

### 5.1 กลไกการได้สิทธิ์ (live scan — path หลักของแคมเปญนี้)
- สแกน QR สินค้า → ถ้า QR **ใหม่** → `success` → ได้สิทธิ์ = `lucky_draw_campaigns.tickets_per_scan` (1-11, ขั้นต่ำ 1)
- `scanLegacyV1Code` (saversureV2 `backend/internal/code/service.go:922`) → `grantLegacyLuckyDrawTickets` (`:1148`) วนสร้างตั๋วเท่าจำนวนสิทธิ์
- **dedup ก่อนออกสิทธิ์:** สแกนซ้ำคนเดิม=`duplicate_self` / คนอื่น=`duplicate_other` → reject, 0 สิทธิ์ → **1 QR ใช้ได้ครั้งเดียว**

### 5.2 Print List คำนวณจากอะไร (สิ่งที่ dashboard ใช้ปริ้น)
- `backend/internal/dashboard/print_slips.go` `GetPrintSlips`: ดึงจาก **`scan_history` (scan_type='success')** แล้ว `CROSS JOIN LATERAL generate_series(1, rights)` — **ไม่ได้ใช้ตาราง `lucky_draw_tickets`**
- → 1 สแกนสำเร็จ = สิทธิ์ของสินค้านั้นเป๊ะ · success เท่านั้น · **ไม่เบิ้ลจากการสแกนซ้ำ**

### 5.3 ✅ ยืนยัน "ไม่เบิ้ล" (ข้อมูลจริง)
ดึงสลิป 06-08 (sample 4,999 ใบ / 3,597 serial) เช็ค:
- serial ที่โผล่ใต้**ชื่อคนละคน** = **0** (dedup ไม่หลุด)
- serial เกิน 11 สิทธิ์ = **0** (ไม่ออกเกินสเปก)
- สูงสุด/serial = **7 ใบ** (สินค้า 7 สิทธิ์ — ถูกต้อง)

### 5.4 ⚠️ 2 ปมฝั่ง backend (ส่งทีม saversureV2 — dashboard แก้ไม่ได้)
1. **ไม่มี unique constraint บน `scan_history(tenant_id, legacy_qr_code_id)`** (migration 064 = index ธรรมดา) → dedup เป็น app-level check-then-insert → มี race window: สแกน QR เดียวกัน 2 ครั้งพร้อมกันเป๊ะ (กดรัว/retry) **อาจ**หลุดเป็น 2 success → เบิ้ล. ยังไม่เจอเกิดจริงใน sample. **แนะนำเพิ่ม partial unique index** กันให้สนิท
2. **บั๊กความเป็นธรรมการจับดิจิทัล** — `DrawWinners` (`luckydraw/service.go:538`) สุ่มจาก "แถว" ใน `lucky_draw_tickets` แต่ตั๋ว V1-synced เก็บหลายสิทธิ์ใน 1 แถว (`points_spent`) → กลุ่มนั้นโอกาสน้อยกว่าที่ควร (ดู `saversureV2/docs/LUCKY_DRAW_TICKETS_AUDIT_PRINT_PLAN_20260608.md`).
   - ✅ **ไม่กระทบถ้าจับจากสลิปที่ปริ้น** (Print List แตก 1 สิทธิ์=1 ใบ ครบถูกต้อง) — กระทบเฉพาะถ้าใช้ปุ่มจับในระบบ

### 5.5 หมายเหตุตัวเลข
- "สิทธิ์ทั้งหมด" บน dashboard = **ค่าประมาณ** (สแกน × 1.3586 blended, ดู [15-rights-calculation](15-rights-calculation.md)) · จำนวนสลิปในไฟล์ปริ้น = **ค่าจริงเป๊ะ** (per-สินค้า) → ต่างกันนิดหน่อยได้ (เช่น 06-02: จอ 12,227 vs ไฟล์ 11,651)

---

## 6. ไฟล์ที่แก้วันนี้ (dashboard เท่านั้น)
- `src/config/employee-exclude.ts` (regenerate 188+168)
- `src/lib/api/api-source.ts` — `getPrintSlips` ใช้ `matchExcluded`
- `src/app/api/print-slips-pdf/route.ts` — Google Fonts Sarabun, line-height 1.5, protocolTimeout 540s, maxDuration 600, auto-split (PART_SIZE/MAX_PARTS/part/headers)
- `src/components/tabs/PrintListTab.tsx` — line-height 1.5, downloadPdf loop หลาย part, ชื่อไฟล์ง่าย, progress
- โฟลเดอร์ `รายชื่อลูกค้า รอบ 1` — rename 11 ไฟล์

## 7. เหลือ / ถัดไป
- (ถ้าต้องการ) ส่ง handoff 2 ปม §5.4 ให้ทีม saversureV2 อย่างเป็นทางการ
- watch: วันพีคถ้าเกิน 15k/วัน จะเริ่มแบ่ง 2 ไฟล์อัตโนมัติ (ทำงานแล้ว)
