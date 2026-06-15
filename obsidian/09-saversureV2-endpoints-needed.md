# SaversureV2 Endpoint Needed For Dashboard

Last updated: 2026-05-28 (live verified)

## Status

✅ **VERIFIED LIVE 2026-05-28** — endpoint deployed + tested + dashboard ใช้งานจริงแล้ว
(รายละเอียดการ verify ดู [11-Live-Data-Verified-2026-05-28.md](11-Live-Data-Verified-2026-05-28.md))

ก่อนหน้านี้ไฟล์นี้ใช้เป็นเอกสารส่งให้ทีม `saversureV2` เพื่อเพิ่ม endpoint `campaign-daily` ตอนนี้ endpoint รันอยู่จริง + dashboard เรียกใช้งานจริงผ่าน HTTP

เสร็จแล้ว:

1. ✅ deploy backend — saversureV2 รันอยู่ port 30400
2. ✅ test ด้วย JWT token จริง — login flow ผ่าน `/api/v1/auth/login` สำเร็จ
3. ✅ เปิด dashboard ด้วย `DATA_SOURCE=api`
4. ✅ ตรวจว่าหน้า dashboard แสดง daily table, timeseries และ members daily จากข้อมูลจริงครบ — 13 วัน (16-28 พ.ค.)

## Implemented Locally

Backend `saversureV2`:

- `C:\projects\Github\saversureV2\backend\internal\dashboard\campaign_daily.go`
  - เพิ่ม service `GetCampaignDaily`
  - จำกัดช่วง query สูงสุด 90 วัน
  - aggregate ข้อมูลรายวันจาก campaign reward
- `C:\projects\Github\saversureV2\backend\internal\dashboard\handler.go`
  - เพิ่ม handler `CampaignDaily`
- `C:\projects\Github\saversureV2\backend\cmd\api\main.go`
  - register route `GET /api/v1/dashboard/campaign-daily`

Dashboard `julaherb-crm-board`:

- `C:\projects\Github\julaherb-crm-board\scan-lucky-rich-dashboard\src\lib\api\api-source.ts`
  - เพิ่ม `getCampaignDaily`
  - map daily rows ไปใช้กับ `getDailyRows`
  - map timeseries ไปใช้กับ `getScansTimeseries`
  - map members daily ไปใช้กับ `getMembersDaily`

## Endpoint Contract

```http
GET /api/v1/dashboard/campaign-daily?from=2026-06-01&to=2026-06-30&campaign_id=...
Authorization: Bearer <JWT>
```

`campaign_id` เป็น optional ถ้าไม่ส่งให้ backend ใช้ active/default campaign ตามที่ระบบรองรับ

Expected response:

```json
{
  "success": true,
  "data": {
    "timezone": "Asia/Bangkok",
    "from": "2026-06-01",
    "to": "2026-06-30",
    "rows": [
      {
        "date": "2026-06-03",
        "scans": 1203,
        "uniqueMembers": 410,
        "newMembers": 120,
        "existingMembers": 290,
        "rewarded": 1150,
        "duplicate": 40,
        "notFound": 10,
        "pointsAwarded": 56000
      }
    ]
  }
}
```

## Dashboard Field Mapping

- `date` -> daily table date / timeseries x-axis
- `scans` -> total scans
- `uniqueMembers` -> unique members
- `newMembers` -> new members daily
- `existingMembers` -> existing members daily
- `rewarded` -> valid/rewarded scans
- `duplicate` -> duplicate/invalid bucket เท่าที่ backend แยกได้
- `notFound` -> invalid/not found bucket
- `pointsAwarded` -> total points awarded

## Known Limitation

ตอนนี้ `notFound` หรือ invalid code แบบ campaign-scoped อาจยังไม่แม่น ถ้า backend ไม่มีแหล่งข้อมูลที่บอกว่า scan attempt ใดผูกกับ campaign ไหนโดยตรง

แนวทางแก้ที่ชัดเจนกว่า:

1. เพิ่ม rollup table สำหรับ campaign daily metrics
2. หรือเพิ่ม scan attempt source ที่มี `campaign_id`, `status`, `reason`, `created_at`
3. หรือเพิ่ม endpoint เฉพาะสำหรับ scan attempt aggregate

## Still Needed

1. ให้ทีม backend review query และ index ก่อน deploy
2. deploy route `campaign-daily`
3. test API ด้วย token จริง
4. เปิด `DATA_SOURCE=api` ใน dashboard env
5. ตรวจ dashboard ด้วย range สั้นก่อน เช่น 7 วัน
6. ถ้า query หนัก ให้ใช้ cache/rollup แทน full scan

## Read-Only Rule

endpoint นี้ต้องเป็น read-only 100%

ห้าม:

- เพิ่ม/ลดแต้ม
- เปลี่ยนสถานะ scan
- เปลี่ยนข้อมูลลูกค้า
- เขียน coupon/reward/campaign state

ความเสี่ยงหลักคือ query หนัก ไม่ใช่ business side effect ดังนั้นควรจำกัด date range, ใช้ index ให้ถูก และใช้ cache หรือ rollup ถ้ามี

## Optional Future Endpoints

ถ้าต้องแยกรายละเอียดมากกว่านี้ ค่อยเพิ่มภายหลัง:

- `GET /api/v1/dashboard/members-daily`
- `GET /api/v1/dashboard/scan-by-hour`
- `GET /api/v1/dashboard/scan-attempts-summary`
