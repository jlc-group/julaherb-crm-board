# 🎟️ สิทธิ์ + Print List — สรุปสถานะ & เหลืออะไรบ้าง (2026-06-08)

สรุปหลังเคลียร์ logic "สิทธิ์" กับเจ้าของงานครบทุกจุด — บันทึกไว้ใช้ทำงานต่อ

---

## 1. ✅ Logic สิทธิ์ (ยืนยันกับเจ้าของงานแล้ว — ห้ามเข้าใจผิด)

**กติกาแกน:**
1. ลูกค้าสแกนสินค้า 1 ชิ้น (สำเร็จ) → ได้ **แต้ม (pointsPerScan)** + **สิทธิ์จับฉลาก (rightsPerScan)**
2. **สิทธิ์ต่อสินค้า** กำหนดรายสินค้า (ดูหน้า lucky-draw คอลัมน์ "สิทธิ์ต่อสแกน") ค่า **1–11 สิทธิ์**
   - เช่น เรตินอล ขวด `R1-30G` = **11 สิทธิ์** · กันแดดทานตะวัน 30ก `L20-30G` = 5 · ดีดีครีมซอง `L3-8G` = 1
3. **สิทธิ์รวม = Σ ทุกการสแกนสำเร็จ (สิทธิ์ต่อสินค้าของชิ้นนั้น)**
   - ❗ นับ **"สิทธิ์"** — ไม่ใช่นับ "คน" และไม่ใช่นับ "ครั้งสแกนเฉยๆ"
   - 2 คนสแกนเรตินอลคนละครั้ง = 11+11 = **22 สิทธิ์** (ไม่ใช่ 2)
4. **ได้สิทธิ์เฉพาะ "สแกนสำเร็จ"** เท่านั้น
   - ✅ success (สแกนโค้ดใหม่ครั้งแรก) → ได้สิทธิ์
   - ❌ duplicate_self (สแกนโค้ดเดิมตัวเองซ้ำ) → 0
   - ❌ duplicate_other (สแกนโค้ดที่คนอื่นสแกนแล้ว) → 0
   - 1 ชิ้นสินค้า = 1 QR code = สแกนสำเร็จได้ครั้งเดียว
   - มี 3 ขวดจริง (3 โค้ด) → 33 สิทธิ์ · มี 1 ขวดสแกนซ้ำ 3 ครั้ง → 11 สิทธิ์
5. **1 สิทธิ์ = 1 ใบในกล่องจับฉลาก** (Print List)

**ยึด "สิทธิ์ตามกติกา" (Σ สแกนสำเร็จ × สิทธิ์ต่อสินค้า) เป็นความจริง** — เจ้าของงานเลือกแล้ว

---

## 2. ✅ ทำเสร็จแล้ว (ฝั่ง dashboard — julaherb-crm-board)

- **Print List tab redesign:** การ์ด 8×2.5ซม. · 3 คอลัมน์ · A4 แนวนอน · ข้อความกึ่งกลาง · 4 บรรทัด (ชื่อใหญ่ / เบอร์ `081-123-xxxx` / รหัสสแกน / ชื่อสินค้า) · expand by rights (1 สิทธิ์=1 ใบ)
- **Pipeline พร้อม:** `/api/print-slips` route + `getPrintSlips()` (api-source เรียก backend rollup, mock fallback) + types + adapter
- **ความปลอดภัยข้อมูล:** ซ่อน mock เป็น default · banner แดง "ยังไม่มีข้อมูลจริง" · ปุ่มปริ้น disabled ตอน mock (กันพิมพ์ของปลอม) · toggle ดูตัวอย่าง layout
- **กัน browser ค้าง:** soft cap 8,000 ใบ + warning
- code review (ultracode) ผ่าน · ไม่มี rule violation

---

## 3. 🔴 เหลืออะไร (ตัวบล็อกจริง)

> **ข้อมูลดิบครบ 100% อยู่ใน DB saversureV2 แล้ว — เหลือแค่ "เปิดประตู API"**

| ต้องการ | data มีไหม | API มีไหม |
|---|---|---|
| **สิทธิ์รวมเป๊ะ** (แทนค่าประมาณ ×1.36) | ✅ มี — `scan_history` มี product_sku + scan_type ต่อสแกน → นับแยกราย SKU ได้ | ❌ ไม่มี endpoint per-SKU daily |
| **รายชื่อสลิปจริง** (พิมพ์จับฉลาก) | ✅ มี — `lucky_draw_tickets` (1 ตั๋ว=1 ใบ + user_id) | ❌ ไม่มี admin endpoint list tickets+ชื่อ |

**ทั้ง 2 อย่างติดประตูเดียวกัน = ต้องเพิ่ม API ที่ saversureV2**

### ทำไมผมเพิ่มเองไม่ได้ (กฎ 00-RULES)
- ❌ ห้าม Edit ไฟล์ saversureV2 (ต้องแก้ 3 ไฟล์: `cmd/api/main.go` route, `internal/dashboard/handler.go`, `internal/dashboard/service.go`)
- ❌ ห้าม docker restart container saversureV2 (ต้อง rebuild ให้ endpoint มีชีวิต)
- ❌ ห้าม DB direct

### ⚠️ หมายเหตุข้อมูล (ไม่ใช่ปัญหา แค่ต้องรู้)
- "สิทธิ์ที่ควรได้ตามกติกา" (Σ สแกนสำเร็จ × สิทธิ์ต่อสินค้า) ≈ **255k**
- "ตั๋วที่ระบบออกจริงใน DB" (`lucky_draw_tickets`) ≈ **207k** → ต่างกัน ~48k (ระบบอาจออกตั๋วไม่ครบสิทธิ์)
- เจ้าของงานเลือกยึด **255k (ตามกติกา)** → ต้องคำนวณจาก scan_history × rights (ไม่ใช่อ่าน lucky_draw_tickets ตรงๆ ถ้ามันออกไม่ครบ)
- 🔎 ต้องให้ backend ช่วยยืนยัน: ทำไม lucky_draw_tickets ถึงน้อยกว่าสิทธิ์ที่ควรได้

---

## 4. 📋 ขั้นต่อไป (รอเจ้าของงานเลือก)

**Step 1 — เปิด API ที่ saversureV2** ← **ติดตรงนี้ ต้องเลือก:**
- **(ก) ทีม saversure เปิด** — ผมเขียนโค้ด Go + spec ครบให้ paste (ตามกฎ 100%)
- **(ข) อนุญาตให้ผมแก้ saversureV2 + restart เอง** — ยกกฎเฉพาะ endpoint read-only นี้ (เร็วสุด)

**endpoint ที่ต้องมี (ออกแบบไว้แล้ว):**
1. `GET /dashboard/print-slips?campaign_id=&from=&to=&cursor=` → รายตั๋ว/สิทธิ์ (ชื่อ/เบอร์/รหัสสแกน/สินค้า) — สำหรับ Print List
2. `GET /dashboard/sku-daily` (หรือ per-SKU scan count) → สิทธิ์รวมเป๊ะ (แทน ×1.36)
   - SQL: `SELECT product_sku, COUNT(*) FROM scan_history WHERE scan_type='success' AND campaign_id=? AND created_at BETWEEN ? AND ? GROUP BY product_sku` → คูณ rightsPerScan แต่ละ SKU แล้วบวก
   - ต้องอ่านจาก replica/rollup + cache (ไม่กระแทก hot table)

**Step 2** — ผม swap 1 บรรทัดใน `api-source.getPrintSlips` (throw → เรียก endpoint จริง) + ปรับ getScansTotals ใช้ per-SKU
**Step 3** — โชว์สิทธิ์จริง + verify (เคส R1-30G ต้องออก 11 ใบ, สแกนซ้ำต้องไม่นับ)
**Step 4** (เสริม) — server-side PDF export สำหรับปริ้นครบ (255k ใบ เบราว์เซอร์ปริ้นไม่ไหว)

---

## 7. 📥 Server-side PDF download (2026-06-09) — โหลดได้เลย ครบทั้งวัน ตัดพนักงาน
แก้ปัญหา "เบราว์เซอร์พิมพ์ทั้งวัน (11k ใบ) ไม่ไหว/PDF เสีย" + "ตัด cap 5,000" → สร้าง PDF ฝั่ง **dashboard server เอง**
- **route ใหม่:** `src/app/api/print-slips-pdf/route.ts` (runtime nodejs) — `pdfkit` + ฟอนต์ไทย `src/assets/fonts/Sarabun-{Regular,Bold}.ttf`
  - ดึง `ds.getPrintSlips(from,to,50000)` = เต็มช่วง (ตัดพนักงานแล้ว) + retry 3 ครั้งเผื่อ backend timeout
  - วาดการ์ด 80×30mm · 3 คอลัมน์ชิดกัน (gap 0) · 4 บรรทัด center · A4 แนวนอน
  - คืน `application/pdf` (attachment) → ดาวน์โหลดทันที · cap 30,000 ใบ
- **dep:** `pdfkit` + `next.config.js` → `experimental.serverComponentsExternalPackages:['pdfkit']` (กัน bundle .afm พัง)
- **getPrintSlips** เพิ่ม param `limit?` (adapter/api-source/mock-source)
- **ปุ่ม:** "ดาวน์โหลด PDF (ตัดพนักงานแล้ว)" (handler `downloadPdf` → fetch blob → download) + "พิมพ์จอ" (เดิม window.print จำกัด 5k)
- **verified:** 1 วัน (8มิย) → PDF **630 หน้า = ~11,340 ใบ ครบทั้งวัน** · 2.1MB · ฟอนต์ไทยฝัง · employee leak = 0 · valid PDF เปิดได้
- ✅ **rule-safe:** สร้างที่ dashboard server · read-only consume · ไม่แตะ saversureV2 · ไม่ page scan_history ดิบ
- caveat: ชื่ออังกฤษ ("Ngam Sriwili") ยังไม่ match (ตัดด้วยชื่อไทย) · pdfkit shape ไทยผ่าน fontkit (ดูจริงควรเปิด PDF เช็ค)
- **fix 2026-06-09 รอบ 2:** ข้อความ **ชิดบน (top-anchored)** ทั้งบนจอ (`justifyContent: flex-start`) และ PDF → ความสูง 30mm ที่เพิ่มไป เป็น "ที่ว่างด้านล่าง" ใต้ชื่อสินค้า (~10mm) เผื่อระยะตัด · **คง A4 แนวนอน · 3 คอลัมน์**
- **fix 2026-06-09 รอบ 3 (สำคัญ): เปลี่ยน PDF engine `pdfkit` → `Puppeteer` (headless Chrome)**
  - ปัญหา: pdfkit **เรนเดอร์ภาษาไทยเพี้ยน** (สระ/วรรณยุกต์ซ้อน · pdfkit/fontkit shape ไทยไม่ได้) — บนจอ (เบราว์เซอร์) ไทยสวยแต่ PDF เพี้ยน
  - แก้: route สร้าง HTML การ์ด (mirror หน้าจอ + ฝังฟอนต์ Sarabun base64) แล้วให้ **Puppeteer (Chrome) เรนเดอร์ → PDF** = หน้าจอเป๊ะ (ไทยถูก 100% · ชื่อสินค้ายาวได้ ตัดแค่ท้ายด้วย … ตามที่เจ้าของต้องการ)
  - dep: `puppeteer` (ดาวน์โหลด Chromium) · `next.config` external: `['puppeteer']` · `page.pdf({timeout:0})` (630 หน้าใช้นาน) · launch `--no-sandbox`
  - verified: 1 วัน → **200 · 630 หน้า · 20MB · แนวนอน · valid** · ตัดพนักงานแล้ว
  - ⚠️ **tradeoff: 1 วัน (~11k ใบ) ใช้เวลา ~130 วิ + ไฟล์ ~20MB** (Chrome เรนเดอร์ 630 หน้า) → ช่วงแคบลง = เร็ว/เล็กกว่า · MAX_SLIPS cap 30,000
  - หมายเหตุ: ตรวจ visual ไทยจริงต้องเปิด PDF ดู (Chrome engine = เดียวกับบนจอที่ไทยสวยแล้ว → มั่นใจสูง) · pdfkit ยังติดตั้งอยู่แต่ไม่ใช้แล้ว

## 6. 🚫 ตัดพนักงานออกจากจับฉลาก (2026-06-09)
- พนักงานบริษัท (ทีมจุฬาเฮิร์บ) ไม่มีสิทธิ์เข้าร่วม → ตัดออกจาก Print List
- ลิสต์ 55 ชื่อ: `src/config/employee-exclude.ts` (`EMPLOYEE_EXCLUDE_NAMES` + `isExcludedScannerName`)
- กรองที่ `api-source.getPrintSlips` — filter ก่อน map (normalize: ตัดคำนำหน้า + ยุบช่องว่าง)
- verified: 10/10 ชื่อตัวอย่างถูกตัด, 0 หลุด
- ⚠️ caveat: กรองเฉพาะชุดที่ fetch (5,000 แถวแรก) + จับคู่จาก display_name ไทย (ถ้าสมัครชื่อเล่น/อังกฤษจะไม่ match)
- 🔜 ควรขอ backend ตัดที่ source ด้วย (ให้ total 269k + ทุกหน้า exclude) — เพิ่มใน [20](20-Backend-Handoff-PrintSlips-2026-06-08.md)

---

**Last Updated**: 2026-06-09
**Related**: [18-API-Inventory-and-PrintList-Match](18-API-Inventory-and-PrintList-Match-2026-06-08.md) · [15-rights-calculation](15-rights-calculation.md) · [00-RULES](00-RULES.md)
**สถานะ**: ⏳ รอเจ้าของงานเลือกวิธีเปิด API (ก/ข) — ฝั่ง dashboard พร้อมหมดแล้ว
