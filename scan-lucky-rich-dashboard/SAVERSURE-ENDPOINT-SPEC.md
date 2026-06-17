# 📐 Spec Endpoint ที่ขอจาก Saversure (สำหรับทีม backend)

> อัปเดต: 2026-06-17 · ตรวจสอบกับโค้ด dashboard จริง

## สถานะรวม

| # | Endpoint / Section | Dashboard รองรับแล้ว | Backend พร้อมแล้ว |
|---|---|---|---|
| ① | section_16 / sku-performance + sku-timeseries | ✅ wired | ❓ ตรวจสอบ |
| ② | /dashboard/print-slips | ✅ wired | ❓ ตรวจสอบ |
| ③ | /crm/segments (cached_count จริง) | ✅ wired | ❓ คืน 0 อยู่? |
| ④ | /dashboard/scans-by-hour | ✅ wired | ❓ ตรวจสอบ |
| ⑤ | /dashboard/cohort-retention | ⏳ รอ backend | ❌ ยังไม่มี |
| ⑥ | /dashboard/sku-co-scan | ⏳ รอ backend | ❌ ยังไม่มี |
| ⑦ | field `sku_diversity` ใน section_20 | ⏳ รอ backend | ❌ ยังไม่มี |
| ⑧ | Risk endpoints ×6 | ⏳ รอ backend | ❌ ยังไม่มี |
| ⑨ | draw/winners · draw/claims · appointments | ⏳ รอ backend | ❌ ยังไม่มี |

---

## Context
Dashboard "สแกนลุ้นรวย สวยลุ้นล้าน" ต่อ adapter รอ Saversure ไว้แล้ว
ขาด 5 รายการที่ backend ต้องส่งเพิ่ม (⑤–⑨)

**ข้อตกลงร่วม (ทุก endpoint):**
- Base: `${SAVERSURE_API_BASE_URL}` (ปัจจุบัน `http://localhost:30400/api/v1`)
- Auth: `Authorization: Bearer <token>`
- `campaign_id` ระบุใน query หรือ resolve จาก token ก็ได้
- วันที่: `YYYY-MM-DD` (เวลาไทย `Asia/Bangkok`) · ตัวเลขเป็น number ไม่ใส่ comma

---

## ✅ ①–④ พร้อมแล้ว (dashboard wired แล้ว — ตรวจสอบฝั่ง backend ด้วย)

### ① SKU Performance + Timeseries
Dashboard เรียก 2 endpoint นี้แล้ว — ตรวจสอบว่า backend คืนข้อมูลจริง:

```
GET /dashboard/sku-performance?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=300
→ { "data": [ { "sku": "L3-8G", "name": "ดีดีครีมแตงโม", "scans": 2452 } ] }

GET /dashboard/sku-timeseries?sku=L3-8G&from=YYYY-MM-DD&to=YYYY-MM-DD
→ { "data": [ { "date": "2026-05-16", "scans": 312 }, ... ] }
```

### ② Print Slips (rollup)
Dashboard เรียกแล้ว — **ต้องเป็น rollup ห้าม page scan_history ตรง**:

```
GET /dashboard/print-slips?campaign_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD
→ {
    "total": 63459,
    "rows": [
      {
        "scanner_name": "สมชาย ใจดี",
        "scanner_phone": "0812345678",       // เต็ม (dashboard mask เอง)
        "legacy_qr_code_serial": "353279",   // รหัสสแกน
        "product_name": "ดีดีครีมแตงโม",
        "product_sku": "L3-8G",
        "rights_per_scan": 1                  // dashboard expand 1 row = rights_per_scan ใบ
      }
    ]
  }
```

### ③ CRM Segments
Dashboard เรียกแล้ว — ตรวจสอบ `cached_count` ไม่คืน 0:

```
GET /crm/segments
→ {
    "segments": [
      { "name": "champion", "label": "Champions",  "cached_count": 1388 },
      { "name": "loyal",    "label": "ขาประจำ",     "cached_count": 5210 },
      { "name": "at_risk",  "label": "เริ่มห่าง",    "cached_count": 1959 },
      { "name": "new",      "label": "สมาชิกใหม่",   "cached_count": 3575 },
      { "name": "lost",     "label": "หาย",          "cached_count": 1383 }
    ]
  }
```

### ④ Scans by Hour
Dashboard เรียก `/dashboard/scans-by-hour` — ตรวจสอบว่าคืน 24 buckets ครบ:

```
GET /dashboard/scans-by-hour?from=YYYY-MM-DD&to=YYYY-MM-DD
→ {
    "data": [
      { "hour": 0,  "scans": 548,  "success": 510 },
      { "hour": 1,  "scans": 320,  "success": 298 },
      ...
      { "hour": 23, "scans": 621,  "success": 590 }
    ]
  }
```
> dashboard รวมเป็น 7 buckets เอง (00-06, 06-09, 09-12, 12-15, 15-18, 18-21, 21-24)

---

## ❌ ⑤–⑨ รอ Backend (dashboard พร้อม wire ทันทีที่ endpoint มา)

### ⑤ GET /dashboard/cohort-retention
ปลด: Customers tab · Cohort Retention chart

```
GET /dashboard/cohort-retention?campaign_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD

→ {
    "cohorts": [
      {
        "cohort_date": "2026-05-16",   // วันสแกนครั้งแรก
        "size": 2624,
        "retention": [
          { "week": 0, "users": 2624, "pct": 100.0 },
          { "week": 1, "users": 1260, "pct": 48.0 },
          { "week": 2, "users": 870,  "pct": 33.2 }
          // เท่าที่มี data — ต้องผ่าน ≥2 สัปดาห์ ถึงคำนวณ W2 ได้
        ]
      }
    ]
  }
```

---

### ⑥ GET /dashboard/sku-co-scan
ปลด: Products tab · Cross-Scan Pairs

```
GET /dashboard/sku-co-scan?campaign_id=...&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=10

→ {
    "pairs": [
      {
        "sku_a": "L3-8G", "name_a": "ดีดีครีมแตงโม",
        "sku_b": "L4-8G", "name_b": "เซรั่มลำไย",
        "both_users": 2916   // จำนวน user ที่สแกนทั้งสอง SKU
      }
    ]
  }
```
> Logic: group ตาม user → หาคู่ SKU ที่ user เดียวกันสแกนทั้งคู่ → เรียง both_users มาก→น้อย

---

### ⑦ field `sku_diversity` ใน section_20_top_scanners
ปลด: Customers/Risk tab · รายละเอียด Heavy Users

เพิ่ม field `sku_diversity` ใน response ของ `/dashboard/heavy-users` หรือ `section_20`:

```json
{
  "data": [
    {
      "user_hash": "02854cd3",
      "province": "เชียงราย",
      "scans": 54,
      "scans_30d": 54,
      "risk_level": "low",
      "sku_diversity": 13        // ← เพิ่ม field นี้ (จำนวน SKU ไม่ซ้ำที่ user สแกน)
    }
  ]
}
```

---

### ⑧ Risk Endpoints (×6)
ปลด: Risk Watch tab ทั้งหน้า (ปัจจุบัน mock ทั้งหมด)

```
GET /dashboard/customer-risk?campaign_id=...&date=YYYY-MM-DD
→ {
    "flagged_today": 3,
    "velocity_alerts": 2,
    "geo_mismatches": 5,
    "total_flagged": 18,
    "multi_account": [
      { "name_masked": "สมชาย ใ***", "uid": "...", "account_count": 3, "status": "reviewing" }
    ]
  }

GET /dashboard/risk-scoring?date=YYYY-MM-DD&limit=10
→ {
    "users": [
      { "user_hash": "...", "province": "...", "scans": 201,
        "risk_score": 94, "reasons": ["velocity", "multi_sku"] }
    ]
  }

GET /dashboard/velocity-alerts?date=YYYY-MM-DD&min_rate=20
→ {
    "users": [
      { "user_hash": "...", "province": "...", "scans": 201, "scans_per_hour": 38 }
    ]
  }

GET /dashboard/geo-mismatches?date=YYYY-MM-DD
→ {
    "rows": [
      { "user_hash": "...", "name_masked": "สมชาย ใ***",
        "reg_province": "กรุงเทพ", "scan_province": "สระบุรี", "freq": 12 }
    ]
  }

GET /dashboard/risk-trend?campaign_id=...&days=14
→ {
    "points": [
      { "date": "2026-05-16", "flagged": 8 },
      { "date": "2026-05-17", "flagged": 11 }
    ]
  }

GET /dashboard/verification-stats?from=YYYY-MM-DD&to=YYYY-MM-DD
→ {
    "success": 63763,
    "dup_self": 6025,
    "dup_other": 1725,
    "not_found": 698,
    "by_reason": [
      { "reason": "ซ้ำตัวเอง",      "count": 6025 },
      { "reason": "QR ถูกใช้แล้ว",  "count": 1725 },
      { "reason": "ไม่พบในระบบ",    "count": 698  }
    ]
  }
```

---

### ⑨ Draw & Appointments (DECISION — เมื่อย้ายขึ้น backend)
ปัจจุบัน dashboard อ่านจาก local JSON files — ย้ายเมื่อพร้อม

```
GET  /dashboard/draw/winners
POST /dashboard/draw/winners       // บันทึกผู้ถูกรางวัล

GET  /dashboard/draw/claims
POST /dashboard/draw/claims        // อัปเดตสถานะเอกสาร

GET  /dashboard/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD
POST /dashboard/appointments       // { phone, date, slot } → บันทึก + เช็คโควต้า (5/วัน สามัญ, 10/วัน พีค)
```

---

## Verification Checklist (ฝั่ง Dashboard)
ตั้ง `DATA_SOURCE=api` + `.env.local` ครบ แล้วเช็ค:

- [ ] **Products**: Top SKU table ไม่แสดงข้อมูลค้างวันเก่า
- [ ] **Print List**: badge แสดง `🟢 ข้อมูลจริงจาก saversureV2` (ไม่ใช่ mock)
- [ ] **CRM Center**: การ์ด Champions/Loyal ไม่แสดง 0
- [ ] **Overview**: Time of Day chart มีข้อมูลจริง (ไม่ใช่ 7 buckets ว่าง)
- [ ] **Customers**: Cohort Retention chart แสดงข้อมูล (⑤ พร้อม)
- [ ] **Risk Watch**: KPI ไม่ใช่ค่า demo (⑧ พร้อม)
