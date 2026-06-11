# 📨 ใบสั่งงาน saversureV2 — endpoint ที่เหลือ เพื่อทำ dashboard ครบทุกหน้า

**Created**: 2026-06-04
**สถานะ**: หน้า Scan Overview เสร็จแล้ว (campaign-daily + campaign-report + monitor). ที่เหลือรอ endpoint ด้านล่าง
**กฎ**: ทุก endpoint **read-only** (JWT + tenant เดิม), จำกัด date range, ใช้ cache/rollup ถ้า query หนัก. dashboard เป็น consumer — เมื่อ endpoint มา ผม map ใน `api-source.ts` ไม่กี่บรรทัด

---

## หน้า Products
### 1. SKU ต่อวัน/ต่อช่วง (ตารางหลัก + กราฟ SKU)
```
GET /api/v1/dashboard/sku-daily?campaign_id=&from=&to=
```
คืน array ต่อ (วัน × SKU) หรือสรุปต่อ SKU ในช่วง:
```json
{ "data": [{ "date":"2026-05-16","sku":"L3-40G","scans":1203,"tickets":6015,"unique_users":410 }] }
```
> map → dashboard `getSkuPerDay` + `getSkuTimeseries` (ต้องการ scans, specTickets=scans×rights, uniqueUsers ต่อ SKU)
> ✅ `getSkuList` ใช้ `/products` ที่มีแล้ว — แต่ `/products` **ยังไม่คืน `rights_per_scan`** → ขอเพิ่ม field นี้ใน /products ด้วย

## หน้า Customers
### 2. Engagement distribution (กราฟการมีส่วนร่วม)
```
GET /api/v1/dashboard/engagement-distribution?campaign_id=&from=&to=
```
```json
{ "total_users":22654, "avg_scans":2.8, "median_scans":2, "max_scans":54,
  "buckets":[{"label":"1 scan","users":8000},{"label":"2-5","users":...},{"label":"6-10","users":...},{"label":"10+","users":...}] }
```
> map → dashboard `getEngagement`. (มี `/dashboard/crm/rfm-distribution` + `customer-cohorts` แล้ว แต่คนละ shape — ใช้ทำ retention/segment ได้ ถ้าจะ map เพิ่ม)
> `getRetention` → ใช้ `/dashboard/crm/customer-cohorts` ได้ (มี retention_rate, total/active users)

## หน้า Channels
### 3. ช่องทางการสแกน
```
GET /api/v1/dashboard/channels?campaign_id=&from=&to=
```
คืน scan แยกตาม channel/source + trend + heatmap (source field มีใน scan_history: scan_source)

## หน้า Operations
### 4. ผู้โชคดี (Winners)
```
GET /api/v1/lucky-draw/:id/winners        (list ผู้โชคดี + สถานะ)
GET /api/v1/lucky-draw/:id/prize-allocations
```
> มี lucky_draw module อยู่แล้ว (`/my/lucky-draw/tickets`) — ขอ endpoint ฝั่ง admin สำหรับ winners/prizes

## หน้า Risk Watch
### 5. Fraud / risk
```
GET /api/v1/dashboard/risk?campaign_id=&date=
```
> มี `/scan-history/alerts` (ซ้ำ) + `campaign-report` section_12_velocity_alert + section_22_multi_account แล้ว — อาจรวมเป็น risk endpoint เดียว

## หน้า ScanBehavior
### 6. เวลาที่สแกน (time-of-day)
```
GET /api/v1/dashboard/scan-by-hour?campaign_id=&from=&to=
```
คืน scan count แยกตามชั่วโมง 0-23 → map `getTimeOfDay`

---

## ลำดับความสำคัญแนะนำ
1. **sku-daily** + เพิ่ม `rights_per_scan` ใน /products → Products ครบ
2. **engagement-distribution** → Customers ครบ
3. **scan-by-hour** → ScanBehavior ส่วนใหญ่ครบ
4. channels / winners / risk → 3 หน้าที่เหลือ (ข้อมูลดิบมีใน scan_history/lucky_draw แล้ว แค่ทำ aggregate)
