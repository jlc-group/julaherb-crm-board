# 📦 Backend Handoff — endpoint "print-slips" สำหรับทีม saversureV2 (2026-06-08)

เอกสารนี้ = **ส่งให้ทีม saversureV2** เพื่อสร้าง API สำหรับหน้า Print List (สลิปจับฉลาก)
เขียนโดยอ้างอิง source จริงของ saversureV2 (read-only) — โค้ดตรงกับ pattern ที่ทีมใช้อยู่

> dashboard (julaherb-crm-board) ฝั่ง consumer พร้อมหมดแล้ว เหลือแค่ endpoint นี้

---

## 🔆 STATUS UPDATE (2026-06-09) — โค้ดเสร็จ แต่ยังไม่ live

ทีม saversure **เขียนโค้ดเสร็จแล้ว + คุณภาพดีมาก** (ตรง contract เป๊ะ):
- `cmd/api/main.go:764` route `/print-slips` ✓ · `internal/dashboard/print_slips.go` ✓ · `handler.go:245` ✓
- query = scan_history (success) + expand `generate_series(1, rights)` · rights จาก `lucky_draw_campaigns.tickets_per_scan` × `legacy_v1_product_ids` · response `{total, rows:[{scanner_name, scanner_phone, legacy_qr_code_serial, product_name, product_sku}]}` — ตรงที่เราออกแบบ

**🔴 แต่ยังเรียกใช้ไม่ได้ — 2 ปัญหาฝั่ง saversureV2 (ทีมต้องแก้):**
1. **ยังไม่ rebuild/restart container** → binary ที่รันอยู่เป็นตัวเก่า
   - หลักฐาน: `/dashboard/print-slips` → 404 (route ไม่มีใน binary) · ขณะที่ route เก่า `/dashboard/summary` → 200
   - แก้: ทีม **rebuild + restart container saversureV2** ให้โค้ดใหม่ทำงาน
2. **`/dashboard/campaign-report` + `/dashboard/campaign-daily` ตอนนี้ 500 ทุกวัน** (เมื่อก่อน 200)
   - `summary` ยัง 200 → เฉพาะ endpoint ที่ query campaign-scoped (scan_history/lucky_draw) พัง
   - อาจเป็น DB/timeout/migration → **print-slips ใช้ query หนักบน scan_history เหมือนกัน ถ้าไม่แก้ root cause นี้ print-slips อาจ 500 ตาม**
   - ขอทีม saversure เช็ค log ตอน 500 (น่าจะเป็น query error / statement timeout บน scan_history 12M แถว)

> ผม consume read-only เท่านั้น (ไม่ได้ทำให้ 500 — เป็น server-side ของ saversureV2)

**เมื่อทีมแก้ 2 ข้อ + redeploy แล้ว** → บอกผม → ผม wire dashboard (swap 1 บรรทัด) → verify ทันที

### 🔄 UPDATE รอบ 2 (2026-06-09 บ่าย) — deploy แล้ว แต่ 500
- ✅ **route ขึ้นแล้ว** — `/dashboard/print-slips` เปลี่ยนจาก 404 → **500** = ทีม rebuild/restart container แล้ว binary ใหม่มี route
- 🔴 **แต่ 500 (internal_error)** — เหมือน `/dashboard/campaign-daily` + `/dashboard/campaign-report` ที่ก็ 500 (ส่วน `/dashboard/summary` ยัง 200)
- ✅ เช็คแล้ว: คอลัมน์ `tickets_per_scan` **มีจริง** (migration 071, default 0) → **500 ไม่ใช่ปัญหาคอลัมน์**
- 🎯 **สรุปต้นเหตุ**: error ร่วมของ "campaign-scoped query บน scan_history" (campaign-daily/report/print-slips ใช้ path เดียวกัน) — `summary` ไม่กระทบ
  - สมมติฐานหลัก: **statement_timeout / DB error บน scan_history (12M แถว)** — campaign-daily เคย 200 เมื่อก่อน แต่ตอนนี้ 500 → ข้อมูลโตจนชน timeout? หรือ index/stats/lock
  - **ขอทีม saversure ดู server log ตอน 500** (API ซ่อน error จริงเป็น "internal_error") — ต้องเห็น SQL error/timeout จริง
- ⚠️ **กระทบทั้งระบบ**: ตอนนี้ campaign-daily 500 → dashboard live-data ทุกหน้า (Overview ฯลฯ) ก็ error ด้วย ไม่ใช่แค่ print-slips
- หมายเหตุ data: `tickets_per_scan` default 0 → ถ้ายังไม่ backfill ค่า 1-11 จริง โค้ดจะ floor เป็น 1 (GREATEST(...,1)) → ได้ 1 สิทธิ์/สแกนทุกตัว (= สาเหตุ 207k ที่ขาด) ต้อง backfill ด้วย

**dashboard ฝั่งผมยังไม่ wire** (api-source.getPrintSlips ยัง throw→mock) — รอ endpoint คืน 200 ก่อนถึง wire+verify (wire ตอน 500 ก็ไม่เห็น data อยู่ดี)

---

## 🆕 ROUND 3 (2026-06-09) — ขอ 2 อย่าง: แก้ 500 + ตัด staff (role-based)

> เจ้าของงานเลือก: ตัด **staff ทุกคน (role-based)** · ทำแบบ rule-safe (dashboard ไม่แตะ saversureV2 — งาน backend นี้ทีม saversure ทำ)

### A. แก้ `/dashboard/print-slips` (และ campaign-daily/report) ที่ตอนนี้ 500
- อาการ: query บน `scan_history` (12M แถว) ชน **statement_timeout** → 500
- ขอ: ดู server log หา SQL/timeout จริง → optimize (index / ลด scan / ขยาย timeout / อ่าน replica) ให้กลับมา **200**
- ต้องแก้ข้อนี้ก่อน ไม่งั้น exclusion verify ไม่ได้

### B. เพิ่ม name-based exclusion (ตัด 55 ชื่อ ครบทั้งแคมเปญ + คืนจำนวน)
> ⚠️ **ไม่ใช้ role/user_roles** — พนักงาน 55 คนสแกนผ่าน **consumer account (role=customer)** → role-based ตัดไม่ได้ (ยืนยันแล้ว: ชื่อโผล่เป็น scanner). **ต้องอิง "ชื่อ" เท่านั้น** (เจ้าของงานยืนยัน: เจอชื่อในลิสต์ = ตัด+นับหมด)

- เป้า: ตัดสลิปที่ `scanner_name` (display_name) ตรงกับ **ลิสต์ 55 ชื่อ** (จุฬาเฮิร์บ) ออกทั้งแคมเปญ
- dashboard ส่ง param **`exclude_names[]`** = 55 ชื่อ (normalize แล้ว: ตัดคำนำหน้า นาย/นาง/นางสาว + ยุบช่องว่าง) — มาจาก `src/config/employee-exclude.ts`
- ใส่ใน WHERE ของ **ทั้ง COUNT query และ pagination query** ใน `internal/dashboard/print_slips.go`:
```sql
-- normalize display_name ฝั่ง DB ให้ตรงกับฝั่ง dashboard แล้วเทียบ
AND regexp_replace(
      regexp_replace(
        trim(COALESCE(NULLIF(u.display_name,''), trim(CONCAT(u.first_name,' ',u.last_name)))),
        '^(นางสาว|นาง|นาย|น\.ส\.)\s*', ''
      ),
      '\s+', ' ', 'g'
    ) <> ALL($n::text[])   -- $n = array 55 ชื่อ normalized ที่ dashboard ส่งมา
```
- เพิ่มฟิลด์ใน `PrintSlipsResult` (คืนจำนวนตัดทั้งแคมเปญ):
```go
ExcludedCount int64 `json:"excluded_count"`  // ใบที่ตัด (ชื่อตรงลิสต์ · 16พค→ปัจจุบัน)
EligibleCount int64 `json:"eligible_count"`  // = total หลังตัด (draw pool จริง)
```
- รัน COUNT แยกด้วย WHERE [exclusion] เดียวกัน → ได้ `excluded_count`
- ⚠️ caveat: จับด้วยชื่อ → พนักงานที่สมัครชื่ออังกฤษ/ชื่อเล่น (เช่น "Ngam Sriwili") จะไม่ match (เจ้าของงานยอมรับ — ถ้าต้องการครบ 100% ภายหลังค่อยเสริม phone)

→ เมื่อ deploy แล้ว บอก dashboard team (ผม) → wire ฝั่ง dashboard (read-only) + verify conservation (`eligible + excluded == total ดิบ`)

---

## A. ต้องการอะไร (สรุปสั้น)

**1 endpoint ใหม่ (read-only GET):** `GET /api/v1/dashboard/print-slips`
คืน **รายการสลิปจับฉลาก** โดย **1 สิทธิ์ = 1 แถว** — แต่ละแถวมี ชื่อ/เบอร์/รหัสสแกน/ชื่อสินค้า ของลูกค้าจริง

**Logic สิทธิ์ (กติกาแคมเปญ "สแกนลุ้นรวย"):**
- ลูกค้าสแกนสินค้า **สำเร็จ** 1 ชิ้น → ได้สิทธิ์ = **"สิทธิ์ต่อสแกน" ของสินค้านั้น** (1–11)
  - เช่น เรตินอล ขวด R1-30G = 11 สิทธิ์ → ออก **11 แถว** (เหมือนกัน)
- ❗ **เฉพาะ `scan_type = 'success'`** — `duplicate_self` / `duplicate_other` = ไม่ได้สิทธิ์
- จำนวนแถวรวม = Σ(สแกนสำเร็จ × สิทธิ์ต่อสินค้า) — **นับสิทธิ์ ไม่ใช่นับคน**

---

## B. Spec — request / response

**Request**
```
GET /api/v1/dashboard/print-slips
  ?campaign_name=สแกนลุ้นรวย สวยลุ้นล้าน   (หรือ campaign_id=<uuid>)
  &from=2026-05-16
  &to=2026-06-07
  &limit=2000        (default 2000, max 5000)
  &offset=0
Header: Authorization: Bearer <JWT>   (tenanted + brand_admin — เหมือน /campaign-report)
```

**Response** `200`
```json
{
  "slips": [
    { "name": "สมชาย ใจดี", "phone": "0811234567", "scan_code": "A6AOZGVC",
      "product_name": "เรตินอล 30 กรัม", "product_sku": "R1-30G" }
    // ... 1 แถว = 1 สิทธิ์ (R1-30G ออก 11 แถวเหมือนกัน)
  ],
  "total": 255446,        // จำนวนสิทธิ์รวมทั้ง campaign+ช่วง (สำหรับ pagination)
  "next_cursor": 2000     // offset ถัดไป (null = หมดแล้ว)
}
```
> หมายเหตุ: ส่ง `phone` แบบ raw — dashboard mask เอง (`081-123-xxxx`)

---

## C. โค้ดอ้างอิง (ตรง pattern saversureV2)

### C1. Route — `cmd/api/main.go` (ต่อท้ายกลุ่ม `dashboardRoutes` ~บรรทัด 763)
```go
dashboardRoutes.GET("/print-slips", dashboardHandler.PrintSlips)
```
(กลุ่มนี้มี tenant + permission middleware อยู่แล้ว — เหมือน `/campaign-report`)

### C2. Handler — `internal/dashboard/handler.go` (เพิ่ม method ใหม่ ตามแบบ `CampaignReport`)
```go
func (h *Handler) PrintSlips(c *gin.Context) {
	tenantID := c.GetString("tenant_id")
	campaignID := c.Query("campaign_id")
	if campaignID == "" {
		campaignID = c.Query("campaign")
	}
	campaignName := c.Query("campaign_name")
	campaignPartner := c.Query("campaign_partner")
	from := c.Query("from")
	to := c.Query("to")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "2000"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	res, err := h.svc.GetPrintSlips(c.Request.Context(),
		tenantID, campaignID, campaignName, campaignPartner, from, to, limit, offset)
	if err != nil {
		apperror.Respond(c, err)
		return
	}
	c.JSON(http.StatusOK, res)
}
```

### C3. Service — เพิ่มไฟล์ใหม่ `internal/dashboard/print_slips.go`
(reuse `resolveLuckyDrawScope` + `loadLuckyDrawProductIDs` + `mustBKK` + `parseReportDate` ที่มีอยู่แล้วใน `campaign_report.go`)
```go
package dashboard

import (
	"context"
	"fmt"
	"time"

	"saversure/internal/apperror"
)

type PrintSlip struct {
	Name       string `json:"name"`
	Phone      string `json:"phone"`
	ScanCode   string `json:"scan_code"`
	ProductName string `json:"product_name"`
	ProductSKU string `json:"product_sku"`
}

type PrintSlipsResult struct {
	Slips      []PrintSlip `json:"slips"`
	Total      int64       `json:"total"`
	NextCursor *int64      `json:"next_cursor"`
}

func (s *Service) GetPrintSlips(
	ctx context.Context,
	tenantID, campaignID, campaignName, campaignPartner, fromDate, toDate string,
	limit, offset int,
) (*PrintSlipsResult, error) {
	if limit <= 0 || limit > 5000 {
		limit = 2000
	}
	from, err := parseReportDate(fromDate)
	if err != nil {
		return nil, apperror.BadRequest("invalid_from", "from must be YYYY-MM-DD")
	}
	to, err := parseReportDate(toDate)
	if err != nil {
		return nil, apperror.BadRequest("invalid_to", "to must be YYYY-MM-DD")
	}
	startBKK := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, mustBKK())
	endBKK := time.Date(to.Year(), to.Month(), to.Day(), 0, 0, 0, 0, mustBKK()).Add(24 * time.Hour)

	// 1) campaign scope → product ids (legacy v1) — reuse helpers จาก campaign_report.go
	ids, _, err := s.resolveLuckyDrawScope(ctx, tenantID, campaignID, campaignName, campaignPartner)
	if err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return nil, apperror.NotFound("campaign_not_found", "no lucky draw campaign matched")
	}
	productIDs, err := s.loadLuckyDrawProductIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	if len(productIDs) == 0 {
		return &PrintSlipsResult{Slips: []PrintSlip{}}, nil
	}

	// 2) query: success scans → resolve ชื่อ/เบอร์/serial/product → expand ตาม "สิทธิ์ต่อสินค้า"
	//    *** rights ต่อสินค้า: ดู TODO ด้านล่าง — JOIN lucky_draw_campaigns.tickets_per_scan ***
	//    expand 1 scan → N แถว ด้วย generate_series(1, rights)
	q := `
WITH scoped AS (
  SELECT
    COALESCE(NULLIF(u.display_name,''), NULLIF(TRIM(CONCAT(u.first_name,' ',u.last_name)),''), u.email, '') AS name,
    COALESCE(u.phone, '')                                                   AS phone,
    COALESCE(sh.legacy_qr_code_serial, sh.code_id::text, sh.id::text)        AS scan_code,
    COALESCE(rp.name, bp.name, lp.name, sh.legacy_product_name, '')          AS product_name,
    COALESCE(rp.sku,  bp.sku,  lp.sku,  sh.legacy_product_sku, '')           AS product_sku,
    sh.legacy_product_v1_id                                                  AS product_v1_id
  FROM scan_history sh
  LEFT JOIN users u    ON u.id = sh.user_id
  LEFT JOIN codes c    ON c.id = sh.code_id AND c.tenant_id = sh.tenant_id
  LEFT JOIN batches b  ON b.id = sh.batch_id
  LEFT JOIN rolls r    ON r.batch_id = sh.batch_id AND c.serial_number BETWEEN r.serial_start AND r.serial_end
  LEFT JOIN products rp ON rp.id = r.product_id
  LEFT JOIN products bp ON bp.id = b.product_id
  LEFT JOIN migration_entity_maps lpm ON lpm.tenant_id = sh.tenant_id AND lpm.entity_type='product'
        AND lpm.source_system='v1' AND lpm.source_id = sh.legacy_product_v1_id::text
  LEFT JOIN products lp ON lp.id::text = lpm.target_id AND lp.tenant_id = sh.tenant_id
  WHERE sh.tenant_id = $1
    AND sh.scan_type = 'success'                         -- ❗ เฉพาะสแกนสำเร็จ
    AND sh.scanned_at >= $2 AND sh.scanned_at < $3
    AND sh.legacy_product_v1_id = ANY($4::int[])         -- scope เฉพาะสินค้าในแคมเปญ
)
SELECT sc.name, sc.phone, sc.scan_code, sc.product_name, sc.product_sku
FROM scoped sc
JOIN rights_map rm ON rm.product_v1_id = sc.product_v1_id   -- ⬅️ TODO: ดู C4
CROSS JOIN LATERAL generate_series(1, GREATEST(rm.rights, 1))  -- 1 สิทธิ์ = 1 แถว
ORDER BY sc.scan_code
LIMIT $5 OFFSET $6`
	// (count รวมทำแยก: SELECT SUM(rights) ... — ดู C4)
	_ = q // ใส่จริงในไฟล์
	return nil, fmt.Errorf("see handoff doc")
}
```

### C4. ⚠️ จุดเดียวที่ทีมต้องยืนยัน — "สิทธิ์ต่อสินค้า" (rights_map)
- ผมเห็น `lucky_draw_campaigns.tickets_per_scan` (และ `max_tickets_per_user`) ในโค้ด `grantLegacyLuckyDrawTickets` → **น่าจะเก็บค่า 1–11 ต่อ campaign/สินค้า**
- ขอทีมยืนยัน: rights ต่อสินค้าอ่านจาก field ไหน แล้ว map กับ `scan_history.legacy_product_v1_id` ยังไง
- สร้าง `rights_map(product_v1_id, rights)` จาก `lucky_draw_campaigns` (unnest `legacy_v1_product_ids` + `tickets_per_scan`) แล้ว join ตาม query ข้างบน
- **count รวม:** `SELECT COALESCE(SUM(GREATEST(rm.rights,1)),0) FROM scoped sc JOIN rights_map rm ...`

> ค่า rights ต่อ SKU ที่ dashboard ใช้ (mirror) อยู่ใน julaherb `products-real.ts` ใช้ cross-check ได้: R1-30G=11, L20-30G=5, L21-100G=4, ซอง=1

---

## D. ⚠️ เรื่องต้องตัดสินใจร่วม — 207k vs 255k

| | จำนวน | ที่มา |
|---|---|---|
| สิทธิ์ตามกติกา (Σ สแกนสำเร็จ × สิทธิ์ต่อสินค้า) | **~255,446** | คำนวณจาก scan_history (endpoint นี้) |
| ตั๋วใน `lucky_draw_tickets` ที่ระบบออกจริง | **~207,439** | grant ตอนสแกน |

**ต่างกัน ~48,000** → แปลว่า **ระบบออกตั๋วจริงไม่ครบสิทธิ์ที่ควรได้** (อาจ bug ใน `grantLegacyLuckyDrawTickets`)
- เจ้าของงาน julaherb เลือกยึด **"ตามกติกา 255k"** → endpoint นี้คำนวณจาก scan_history ถูกต้อง
- 🔎 **ขอทีม saversure ช่วยเช็ค**: ทำไม `lucky_draw_tickets` น้อยกว่า? ควร backfill ตั๋วที่ขาดไหม? (กระทบความเป็นธรรมการจับฉลาก — ตั๋วจริงที่จับได้มีแค่ 207k)

---

## E. Performance / Safety (สำคัญ — prod รับสแกนสด)

- `scan_history` = **12M+ แถว (hot table)** → query ต้อง:
  - filter ด้วย `scanned_at` range + `legacy_product_v1_id` (มี index) + `scan_type='success'`
  - **มี LIMIT/OFFSET เสมอ** (หรือ keyset/cursor) — อย่าดึงรวด 255k แถวรอบเดียว
  - พิจารณารันบน **read-replica** + cache ผล (เช่น 5–10 นาที) — เพราะ dashboard จะเรียกซ้ำ
  - count รวมทำครั้งเดียว/แคชไว้ (อย่า COUNT ทุก request)
- endpoint เป็น **read-only** ไม่แตะ write path ของการสแกน

---

## F. วิธีทำงาน (สำหรับเจ้าของงาน julaherb) 🧭

**ขั้นที่ 1 — ส่งให้ทีม saversureV2**
- ส่งไฟล์นี้ (`20-Backend-Handoff-PrintSlips`) ให้ทีม saversure
- บอกเขา 3 อย่าง:
  1. ขอ endpoint `GET /dashboard/print-slips` ตาม spec ข้อ B (โค้ดอ้างอิงข้อ C พร้อม paste)
  2. ช่วยยืนยัน "rights ต่อสินค้า" อ่านจาก field ไหน (ข้อ C4)
  3. ช่วยเช็คทำไม `lucky_draw_tickets` (207k) น้อยกว่าสิทธิ์ตามกติกา (255k) (ข้อ D)

**ขั้นที่ 2 — ทีม saversure ทำ + deploy**
- เขา review + เพิ่ม 3 จุด (route/handler/service) + rebuild + deploy (งานเขา ~30–60 นาที)
- ขอให้เขา deploy ช่วง off-peak + บอก URL ให้เทสต์

**ขั้นที่ 3 — ทดสอบว่า endpoint ใช้ได้ (ทำเองได้ หรือบอกผม)**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:30400/api/v1/dashboard/print-slips?campaign_name=สแกนลุ้นรวย สวยลุ้นล้าน&from=2026-06-07&to=2026-06-07&limit=50"
```
- เช็ค: total ใกล้เคียง "สิทธิ์ตามสเปก" ของวันนั้น · หาคนสแกน R1-30G ต้องเห็น 11 แถวเหมือนกัน

**ขั้นที่ 4 — บอกผม "endpoint พร้อมแล้ว"**
- ผม **swap 1 บรรทัด** ใน `api-source.getPrintSlips` (จาก throw → เรียก `/dashboard/print-slips` จริง)
- ผม wire + verify → **หน้า Print List โชว์สิทธิ์จริงทันที** (mock หาย, ปุ่มปริ้นเปิด)

**ขั้นที่ 5 (เสริม) — ปริ้นครบ 255k ใบ**
- เบราว์เซอร์ปริ้น 2 แสนใบไม่ไหว → ขอทีม saversure ทำ **PDF export ฝั่ง server** หรือผมทำ batch ปริ้นทีละช่วงวันที่

---

## G. ทำไมต้องให้ทีม saversure ทำ (ไม่ใช่ผม)
- กฎ 00-RULES: ผม **ห้าม Edit ไฟล์ saversureV2 + ห้าม restart container** (กัน prod ล่ม — เคยเกิด 26 พ.ค.)
- saversureV2 รับสแกน QR จริงอยู่ → การ rebuild/restart ต้องทำโดยทีมที่รู้ build/test/rollback ของระบบ
- ผมช่วยได้เต็มที่ในส่วน **เขียนโค้ด + spec + consumer ฝั่ง dashboard** (เอกสารนี้คือผลงานนั้น)

---

**Last Updated**: 2026-06-08
**Related**: [19-PrintList-Rights-Status-and-Remaining](19-PrintList-Rights-Status-and-Remaining-2026-06-08.md) · [18-API-Inventory](18-API-Inventory-and-PrintList-Match-2026-06-08.md) · [00-RULES](00-RULES.md)
**อ้างอิง source saversureV2 (read-only)**: `internal/dashboard/campaign_report.go` · `internal/scanhistory/service.go` · `internal/dashboard/handler.go` · `cmd/api/main.go:763`
