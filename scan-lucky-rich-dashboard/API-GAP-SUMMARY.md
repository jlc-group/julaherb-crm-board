# สรุป API ที่ยังต้องต่อเพิ่ม — Dashboard "สแกนลุ้นรวย สวยลุ้นล้าน"

> สำหรับทีม DEV (saversureV2) · อัปเดต 2026-06-22
> Dashboard อ่านข้อมูลผ่าน adapter → saversureV2 (`DATA_SOURCE=api`) แต่ **บางฟีเจอร์ยังไม่มี endpoint** เลยเก็บเป็นไฟล์ JSON บนเครื่อง dashboard ชั่วคราว (`data/*.json`) — รายการด้านล่างคือสิ่งที่ต้องทำเป็น API จริง

---

## 🔴 กลุ่ม 1 — ระบบ "รับรางวัล / จองคิว" (สำคัญสุด · ยังไม่มี API เลย)
ตอนนี้เก็บเป็นไฟล์ local บน dashboard server (`data/*.json`) → ข้อมูลไม่ sync, หายเมื่อย้ายเครื่อง, ไม่ปลอดภัย (มี PII)

### 1.1 ผู้ชนะรางวัล (draw-winners)
- **ตอนนี้:** `data/draw-winners.json` ผ่าน `POST/GET/DELETE /api/draw/winners` (local)
- **ใช้ที่:** แท็บ Operations (บันทึกผู้ชนะ 7 รอบ) + เป็นฐานให้หน้า /claim ตรวจสิทธิ์
- **endpoint ที่ต้องการ:**
  - `GET  /draw/winners?campaign=` — ดึงผู้ชนะทั้งหมด
  - `POST /draw/winners` — บันทึก/แก้ผู้ชนะ 1 ช่อง (upsert by slotId · กันเบอร์ซ้ำในรอบเดียวกัน)
  - `DELETE /draw/winners?slotId=`
- **data shape:**
  ```ts
  { round, slotId, tier, prizeLabel, name, phone,
    scanCode?, productSku?, productName?,   // จากใบที่จับได้ (print-slip)
    address?,                                // ที่อยู่ (ดูกลุ่ม 2)
    rightsCount?, assignedAt }
  ```

### 1.2 การจองคิวเข้ารับรางวัล (draw-appointments) ⭐ ของที่เพิ่งทำ
- **ตอนนี้:** `data/draw-appointments.json` ผ่าน `POST/GET /api/draw/appointments` (local) + localStorage บนมือถือลูกค้า
- **ใช้ที่:** หน้า /claim (ลูกค้าจองวัน+ช่วงเช้า/บ่าย) + แท็บ Claim (แอดมินเช็คอินหน้างาน เปลี่ยนสถานะ)
- **ปัญหาปัจจุบัน:** การจองผูกกับ localStorage ต่อเครื่อง → ลูกค้าเปลี่ยนมือถือจะไม่เห็นนัดเดิม
- **endpoint ที่ต้องการ:**
  - `GET  /draw/appointments?phone=` — ดึงนัดของเบอร์นั้น (ให้ /claim เช็คย้อนหลังได้ทุกเครื่อง)
  - `GET  /draw/appointments` — ทั้งหมด (แอดมิน)
  - `POST /draw/appointments` — จอง/อัปเดต (ควร**เช็คโควตา**: 6 วัน/เดือน · เช้า 3 / บ่าย 5 คน/วัน)
  - `POST /draw/appointments` (status only) — แอดมินเปลี่ยนสถานะ
- **data shape:**
  ```ts
  { phoneLast9, phone, name, date /*YYYY-MM-DD*/, slotId:'morning'|'afternoon',
    pickupMode?:'self'|'proxy', prizes:string[], rounds:number[],
    status:'booked'|'done'|'no_show', bookedAt?, updatedAt? }
  ```

### 1.3 ตรวจสิทธิ์ผู้โชคดี (claim verify)
- **ตอนนี้:** `POST /api/claim/verify` อ่านจาก `draw-winners.json` (local) → ตัดสินว่าเบอร์นี้เป็นผู้โชคดีไหม
- **ต้องการ:** ให้ backend เป็นแหล่งความจริงของ "ผู้ชนะ" (ผูกกับ 1.1) แล้ว verify ดึงจาก backend แทนไฟล์ local
- **คืนค่า/เบอร์:** isWinner, name, prizes[] (prizeLabel, announce, productName, productSku, scanCode)

### 1.4 เอกสารรับรางวัล + ไฟล์บัตร (draw-claims)
- **ตอนนี้:** `data/draw-claims.json` + ไฟล์รูปใน `data/claims/<เบอร์>/` (local · เป็น PII)
- **ใช้ที่:** หน้า /claim (อัปโหลดเอกสาร) + แท็บ Claim (แอดมินตรวจ/อนุมัติ/มอบของ)
- **endpoint ที่ต้องการ:**
  - `POST /draw/claims` — บันทึก metadata + สถานะตรวจเอกสาร
  - `POST /draw/claims/<phone>/upload` — อัปโหลดบัตร/หนังสือมอบอำนาจ (multipart)
  - `GET  /draw/claims/<phone>/file?type=` — ดึงไฟล์ (แอดมิน)
  - ต้องมี**นโยบายลบไฟล์ PII** เมื่อสถานะ = มอบของแล้ว
- **data shape:**
  ```ts
  { phoneLast9, phone, name, rounds, prizes, hasProxy,
    files:{idCard?,poa?,proxyIdCard?}, status:'submitted'|'approved'|'rejected'|'handed_over',
    submittedAt?, reviewedAt?, reviewNote? }
  ```

---

## 🟡 กลุ่ม 2 — ฟิลด์ที่ขาดจาก API ที่มีอยู่แล้ว

### 2.1 ที่อยู่ลูกค้า (ที่อยู่จัดส่ง default) ✅ แก้แล้ว — ไม่ต้องแก้ backend
- **ใช้ที่:** หน้า Operations — บันทึกผู้โชคดี (ช่อง "ที่อยู่ (ติดต่อ/ส่งรางวัล)")
- **วิธีที่ใช้:** ดึงจาก endpoint ที่ **มีอยู่แล้ว** — ไม่ต้องแก้ saversureV2
  1. `GET /customers/search?q=<เบอร์>` → ได้ `id`
  2. `GET /customers/{id}/detail` → คืน `addresses[]` (มี `address_line1, sub_district, district, province, postal_code, is_default`)
  3. dashboard เลือกแถว `is_default = true` → รวมเป็นข้อความ → auto-fill
- **ฝั่ง dashboard:** route ใหม่ `GET /api/customers/address?phone=` + `getCustomerAddress()` ใน api-source · WinnerPicker เรียกตอนเลือกผู้ชนะ (commit `9cd733d`)
- **เหลือแค่:** deploy dashboard (pull+build+restart) → ที่อยู่ขึ้นเอง (เฉพาะลูกค้าที่ตั้งที่อยู่ default ไว้)

---

## 🟢 กลุ่ม 3 — หน้าที่ยัง mock / hardcode (มี API ค่อยต่อ)

| หน้า | ส่วนที่ยัง mock | endpoint ที่ต้องการ |
|------|----------------|---------------------|
| **Risk Watch** | fraud scoring, multi-account, geo-mismatch, velocity (ใช้ข้อมูลสุ่ม) | `GET /customers/risk?date=` · `GET /analytics/flags-trend?from=&to=` |
| **Scan Behavior** | TV airtime impact, scan funnel, retention cohort | `GET /analytics/scan-funnel` · `GET /analytics/retention-cohort` · `GET /analytics/tv-airtime` |

---

## ✅ ภาคผนวก — ส่วนที่ "มี API แล้ว" (อ้างอิง · ไม่ต้องทำ)
ทำงานผ่าน saversureV2 ครบ:
`/dashboard/campaign-daily` · `/dashboard/campaign-report` · `/dashboard/sku-performance` · `/dashboard/sku-timeseries` · `/dashboard/sku-daily-matrix` · `/dashboard/sku-co-scan` · `/dashboard/scans-by-hour` · `/dashboard/scans-by-day-hour` · `/dashboard/verification-stats` · `/dashboard/engagement-distribution` · `/dashboard/crm/rfm-distribution` · `/dashboard/print-slips` · `/crm/segments` · `/products` · `/customers/search` · `/monitor/incidents` · `/auth/login`

→ ครอบคลุม: ภาพรวมสแกน, สินค้า/SKU, ลูกค้า/engagement/RFM, heatmap, ระบบ uptime, print-slip (รหัสสแกน + สินค้า)

---

## สรุปลำดับความสำคัญสำหรับ DEV
1. **ด่วน (ระบบรับรางวัลใช้งานจริง):** draw-winners, draw-appointments, draw-claims + ที่อยู่ลูกค้า (กลุ่ม 1 + 2.1)
2. **รอง:** Risk fraud API, analytics เพิ่มเติม (กลุ่ม 3)

> หมายเหตุ: ของกลุ่ม 1 ตอนนี้ dashboard ทำงานได้ด้วยไฟล์ local ชั่วคราว — พอ backend มี endpoint แล้วเปลี่ยนให้ adapter ชี้ไป saversureV2 แทน (โครงสร้าง data shape ด้านบนออกแบบให้ map ตรงได้เลย)
