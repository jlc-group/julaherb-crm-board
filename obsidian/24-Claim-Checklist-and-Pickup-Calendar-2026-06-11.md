# รับรางวัล: checklist เอกสาร + ปฏิทินคิวรับรางวัล — 2026-06-11

## ภาพรวม

ปรับ flow หน้า `รับรางวัล` ให้ตรงกับการทำงานจริงของทีม Ops:

- `/claim` ไม่ใช่หน้าส่ง/อัปโหลดเอกสารแล้ว
- ลูกค้าใช้ `/claim` เพื่อตรวจสิทธิ์และดูรายการเอกสารที่ต้องเตรียมมาแสดงตัวจริง
- หน้า admin `รับรางวัล` มีมุมมองใหม่ `ปฏิทินรับรางวัล` สำหรับ Ops monitor วันเปิดรับลูกค้าและ slot รับรางวัล
- งานทั้งหมดอยู่ใน `julaherb-crm-board` เท่านั้น ไม่แตะ `saversureV1`, `saversureV2`, DB, container, หรือ port ต้องห้าม

## กฎ/ข้อจำกัดที่ยึดไว้

- อ่าน `obsidian/00-RULES.md` ก่อนทำงาน
- แก้เฉพาะไฟล์ใน `scan-lucky-rich-dashboard`
- ไม่เพิ่ม sidebar tab ใหม่ เพราะปฏิทินเป็น workflow ย่อยของหน้า `รับรางวัล`
- ไม่เรียก backend ใหม่และไม่แตะ DB: calendar ใช้ mock data inline
- ไม่ลบไฟล์ PII เดิมใน `data/claims/` อัตโนมัติ

## เปลี่ยนแปลงสำคัญ

### 1. หน้า `/claim`

ไฟล์: `scan-lucky-rich-dashboard/src/app/claim/page.tsx`

เปลี่ยนจาก flow เดิม:

1. ตรวจสิทธิ์
2. แนบไฟล์เอกสาร
3. ส่งเอกสาร

เป็น flow ใหม่:

1. ตรวจสิทธิ์จากเบอร์โทร
2. แสดงรางวัลที่ได้รับ
3. แสดง checklist เอกสารที่ต้องเตรียมมาในวันรับรางวัล

รายการเอกสารหลัก:

- บัตรประชาชนตัวจริงของผู้โชคดี
- สำเนาบัตรประชาชนพร้อมเซ็นรับรอง
- สินค้าจริงหรือหลักฐานสินค้าที่ใช้สแกน
- กรณีมอบอำนาจ: หนังสือมอบอำนาจ + บัตร/สำเนาบัตรผู้รับมอบอำนาจ

ผลลัพธ์ที่ verify แล้ว:

- ไม่มี `input[type=file]`
- ไม่มีปุ่ม/ข้อความ `ส่งเอกสาร` หรือ `แนบเอกสาร`
- มีข้อความชัดว่าไม่ต้องอัปโหลดไฟล์ผ่านหน้านี้

### 2. ปิด endpoint upload

ไฟล์: `scan-lucky-rich-dashboard/src/app/api/claim/submit/route.ts`

ปรับให้ `POST /api/claim/submit` ตอบ `410 Gone` พร้อมข้อความ:

> ระบบไม่รับไฟล์เอกสารออนไลน์ กรุณานำเอกสารตัวจริงและสำเนาที่เซ็นรับรองมาแสดงในวันรับรางวัล

เหตุผล: กันกรณีมีคนยิง endpoint ตรง แม้ UI จะไม่เปิดให้อัปโหลดแล้ว

### 3. Admin tab `รับรางวัล`

ไฟล์: `scan-lucky-rich-dashboard/src/components/tabs/ClaimsTab.tsx`

ปรับ wording ให้ตรงกับ process ใหม่:

- หัวข้อเป็น `รับรางวัล — ตรวจเอกสารหน้างาน`
- ลิงก์ลูกค้าเป็น `ลิงก์ตรวจสิทธิ์และดูเอกสารที่ต้องเตรียม`
- สถานะเปลี่ยนเป็นแนวหน้างาน เช่น `ยังไม่มาติดต่อ`, `เตรียมมาตรวจ`, `เอกสารครบ`, `เอกสารไม่ครบ`, `มอบของแล้ว`
- เพิ่ม sub-view ภายในหน้าเดียวกัน:
  - `รายชื่อผู้โชคดี`
  - `ปฏิทินรับรางวัล`

ยังคงดูไฟล์เดิมได้เฉพาะ legacy claim ที่เคยอัปโหลดไว้ก่อนหน้า โดย label เป็น `ดูไฟล์เดิม`

### 4. ปฏิทินคิวรับรางวัล

ไฟล์ใหม่: `scan-lucky-rich-dashboard/src/components/claim/PickupCalendarPanel.tsx`

เพิ่มปฏิทิน admin-only สำหรับ Ops monitor:

- ช่วงเดือน: กรกฎาคม - ธันวาคม 2569
- ใช้ Buddhist Year และภาษาไทย
- navigation ก่อนหน้า / Today / ถัดไป
- block การนำทางนอก Jul-Dec 2026
- แสดง weekday grid อา-ส
- color legend:
  - วันรับรางวัลปกติ
  - วันทดแทน
  - วันหยุดราชการ
  - วันจับรางวัล
- คลิกวันเพื่อดู detail panel
- วันรับรางวัลแสดง 7 slots:
  - 09:00 - 10:00
  - 10:00 - 11:00
  - 11:00 - 12:00
  - 13:00 - 14:00
  - 14:00 - 15:00
  - 15:00 - 16:00
  - 16:00 - 17:00
- แสดง mock occupancy เช่น `3/7 booked`
- แสดงรายชื่อ mock ต่อ slot
- summary เดือนเป็นระดับ slot: `X/56`
- Export CSV สำหรับ booking mock ของเดือนที่เลือก
- จำเดือนล่าสุดด้วย `localStorage`

## ข้อมูล calendar ที่ hard-code

วันรับรางวัล:

- Jul: 7, 8, 14, 15, 21, 22, 30, 31
- Aug: 4, 5, 11, 13, 18, 19, 25, 26
- Sep: 1, 2, 8, 9, 15, 16, 22, 23
- Oct: 6, 7, 14, 15, 20, 21, 27, 28
- Nov: 3, 4, 10, 11, 17, 18, 24, 25
- Dec: 1, 2, 8, 9, 15, 16, 22, 23

วันทดแทน:

- Jul 30, 31
- Aug 13
- Oct 15

วันหยุดที่มีผล:

- 2026-07-28 วันเฉลิมพระชนมพรรษา
- 2026-07-29 วันอาสาฬหบูชา
- 2026-08-12 วันแม่แห่งชาติ
- 2026-10-13 วันนวมินทรมหาราช

วันหยุดที่บันทึกไว้แต่ไม่กระทบ Tue/Wed:

- 2026-12-07 วันพ่อแห่งชาติ
- 2026-12-10 วันรัฐธรรมนูญ
- 2026-12-31 วันสิ้นปี

วันจับรางวัล:

- 2026-06-24 รอบ 1 (35 ผู้ชนะ)
- 2026-07-22 รอบ 2 (35 ผู้ชนะ)
- 2026-08-26 รอบ 3 (34 ผู้ชนะ)
- 2026-09-23 รอบ 4 (35 ผู้ชนะ)
- 2026-10-21 รอบ 5 (34 ผู้ชนะ)
- 2026-11-25 รอบ 6 (19 ผู้ชนะ)
- 2026-12-18 รอบ 7 (6 ผู้ชนะ)

## Verification

ตรวจใน in-app browser แล้ว:

- เปิด dashboard `http://localhost:3100/`
- เข้า tab `รับรางวัล`
- สลับ sub-view เป็น `ปฏิทินรับรางวัล`
- เห็นเดือน `กรกฎาคม พ.ศ. 2569`
- summary แสดงเป็น `49/56` slots ใน mock เดือนกรกฎาคม
- กด `ถัดไป` ไป `สิงหาคม พ.ศ. 2569` ได้
- เลือก `วันแม่แห่งชาติ` แล้ว detail panel แจ้งว่าเป็นวันหยุด ไม่เปิดรับลูกค้า
- ไปถึง `ธันวาคม พ.ศ. 2569` แล้วปุ่ม `ถัดไป` disabled
- หน้าไม่มี console error จาก calendar

ข้อจำกัด verification:

- `npx.cmd tsc --noEmit` ยัง fail จาก error เก่าในไฟล์อื่นที่ไม่เกี่ยวกับงานนี้:
  - `src/app/api/print-slips-pdf/route.ts`
  - `src/components/ui/ParetoChart.tsx`
  - `src/components/ui/SupportCasesPanel.tsx`
  - `src/components/ui/TvAirtimeChart.tsx`
  - `src/lib/real-data.ts`
- Browser automation จับ download event ของ blob CSV ไม่ได้ แต่ปุ่ม `Export CSV` render และ handler ไม่มี console error

## ไฟล์ที่แตะ

- `scan-lucky-rich-dashboard/src/app/claim/page.tsx`
- `scan-lucky-rich-dashboard/src/app/api/claim/submit/route.ts`
- `scan-lucky-rich-dashboard/src/components/tabs/ClaimsTab.tsx`
- `scan-lucky-rich-dashboard/src/components/claim/DocExampleModal.tsx`
- `scan-lucky-rich-dashboard/src/components/claim/PickupCalendarPanel.tsx`

## Next steps

- เชื่อม calendar กับระบบจองจริงเมื่อ customer LIFF booking page พร้อม
- กำหนด source of truth ของ booking status: pending / confirmed / no-show / completed
- พิจารณา endpoint read-only สำหรับ admin calendar หลัง backend พร้อม
- อัปเดต CSV format ให้ตรงกับฟอร์ม offline ของทีม Ops หากมี template จริง

