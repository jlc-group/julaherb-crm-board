# 📨 ใบสั่งงานถึงทีม saversureV2 — endpoint ที่ dashboard ยังขาด

**Created**: 2026-06-03
**เป้าหมาย**: ให้ dashboard "สแกนลุ้นรวย" (julaherb-crm-board) แสดงข้อมูลจริงครบทุกส่วน
**สถานะปัจจุบัน**: KPI หลัก + จังหวัด + heavy users + สถานะ = ดึงจริงได้แล้ว (ผ่าน api-source.ts)
**ที่ยังขาด**: ข้อมูล "รายวันย้อนหลังแบบละเอียด" — saversureV2 มีแต่ snapshot รายวันเดียว (campaign-report)

---

## endpoint ที่ขอให้ saversureV2 เพิ่ม

### 1. ⭐ Daily rollup (สำคัญสุด) — ขับเคลื่อนตารางรายวัน + กราฟแนวโน้ม
```
GET /api/v1/dashboard/campaign-daily?campaign_id=&from=YYYY-MM-DD&to=YYYY-MM-DD
```
คืน array 1 row/วัน:
```json
[{
  "date": "2026-05-16",
  "success": 7163,            // สแกนสำเร็จ
  "duplicate_self": 660,
  "duplicate_other": 78,
  "not_found": 181,
  "tickets": 9871,            // สิทธิ์ที่ออกวันนั้น (จาก lucky_draw_tickets)
  "unique_users": 5234,
  "member_new": 320,          // สมัครใหม่+สแกนวันนั้น
  "member_old": 4914          // เก่าที่กลับมาสแกน
}]
```
> ที่มา: GROUP BY DATE(scanned_at) จาก scan_history + lucky_draw_tickets + users.created_at
> map ตรงกับ dashboard type `DailyRow` (src/lib/api/types.ts) — ใช้ขับ getDailyRows + getScansTimeseries

### 2. Members daily — การ์ดสมาชิก
```
GET /api/v1/dashboard/members-daily?campaign_id=&from=&to=
```
คืน member_new / member_old / signed_not_scanned ต่อวัน (ถ้า #1 รวมให้แล้วก็ไม่ต้องแยก)

### 3. Time-of-day — กราฟช่วงเวลา (optional)
```
GET /api/v1/dashboard/scan-by-hour?campaign_id=&from=&to=
```
คืน scan count แยกตามชั่วโมง (0-23) เพื่อทำ heatmap ช่วงเวลา

---

## หมายเหตุ
- ทุก endpoint ใช้ JWT auth + tenant_id เดิม (เหมือน campaign-report)
- ถ้าทำ #1 ได้ → dashboard ครบ ~90% (ตาราง + กราฟ + KPI ทั้งหมดเป็นจริง)
- dashboard ฝั่ง consumer พร้อมแล้ว — แค่เติม mapping ใน `api-source.ts` เมื่อ endpoint มา
- contract shape เต็มดูที่ `scan-lucky-rich-dashboard/src/lib/api/types.ts`
