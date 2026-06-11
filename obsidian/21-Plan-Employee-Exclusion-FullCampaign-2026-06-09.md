# 🚫 แผน: ตัดพนักงานออกจากจับฉลากให้ครบทั้งแคมเปญ (16 พค 69 → ปัจจุบัน) — rule-safe

วิเคราะห์ด้วย ultracode workflow (สำรวจ กฎ obsidian + saversureV2 + dashboard ขนานกัน → สังเคราะห์)

---

## 1. ปัญหา — ทำไม dashboard นับ/ตัดครบเองไม่ได้
- **5,000 cap:** `getPrintSlips` ดึง backend `limit:5000` ครั้งเดียว แล้วกรองชื่อเฉพาะใน 5k → แคมเปญมี **269,439 ใบ** ตกหล่นชุดอื่น
- **กฎห้าม page scan_history ดิบ:** จะ loop ดึง 269k เอง (≈54 รอบ) = กระแทก HOT table 12M แถว ที่ลูกค้าสแกน QR สด → เสี่ยง prod ล่ม (ผิดกฎ realtime safety)
- **total ยังนับพนักงาน:** `total: r.total - removed` หักแค่ที่เจอใน 5k → draw pool จริง (269k) ยังรวมสิทธิ์พนักงาน = **จับฉลากไม่เป็นธรรม**

→ ต้องตัดที่ **source (backend SQL)** เท่านั้นถึงจะครบ + total ถูก

---

## 2. 🎯 เจอจุดสำคัญ: saversureV2 มีตัวระบุพนักงานอยู่แล้ว

| ลำดับ | วิธี match | ที่อยู่ในระบบ | ความแม่น | หมายเหตุ |
|---|---|---|---|---|
| **1** | **`user_roles.role`** (role-based) | ตาราง `user_roles` (มี user แยก staff/customer) | **สูง** | system of record · deterministic · ตัด staff **ทุกคน** อัตโนมัติ |
| 2 | phone blocklist 55 เบอร์ | array ส่งเข้า backend | กลาง | ตัด **เฉพาะ 55 คนเป๊ะ** แต่ phone ไม่มี index → ช้ากว่านิด |
| 3 (ปัจจุบัน) | name blocklist 55 ชื่อ | dashboard config | ต่ำ | ชื่ออังกฤษ/ชื่อเล่นหลุด + กรองได้แค่ 5k |

⚠️ **ต่าง:** role-based ตัด "staff ทุกคน" (อาจเกิน 55) · phone ตัด "55 คนจุฬาเฮิร์บเป๊ะ" → **user ต้องเลือก**

---

## 3. สถาปัตยกรรม — Recommended: **A (ตัดที่ backend SQL)**

### A) Backend exclude ที่ source ✅ แนะนำ
- ตัด**ก่อน expand-by-rights** ครบทั้ง 269k → `total`/draw pool ถูก + คืน `excluded_count`
- **ปลอดภัย (สำคัญ):** `NOT IN (subquery user_roles)` บน scan_history 12M = **ลดผลลัพธ์ ~0.5-2% → ลดโหลด ไม่เพิ่ม** (user_roles เล็ก, ใช้ index เดิม `(tenant_id, scanned_at)` + `(user_id,...)`)
- Accuracy: ครบแคมเปญ · Safety: สูง · Effort: กลาง

### B) Interim ฝั่ง dashboard (loop หลายหน้า) ❌ ไม่แนะนำ
- page 269k/5k ≈ 54 รอบ = กระแทก hot table (ผิดกฎ) + total ไม่มีทางถูก 100% + ตอนนี้ /print-slips ก็ 500 (timeout) อยู่แล้ว

### C) เบาสุด: backend คืนแค่ `excluded_count`+`eligible_count` (ไม่เปลี่ยน rows)
- ใช้เป็น phase 1 เร็ว ระหว่างรอ A เต็ม

---

## 4. ขั้นตอนลงมือ (A)

### 4.1 Backend — `internal/dashboard/print_slips.go` (HANDOFF ทีม saversure · ผมแก้เองไม่ได้)
เพิ่มใน WHERE ของทั้ง COUNT + pagination query:
```sql
-- role-based (แม่น+ครบ+ลดโหลด)
AND sh.user_id NOT IN (
  SELECT ur.user_id FROM user_roles ur
  WHERE ur.tenant_id = $2 AND ur.role NOT IN ('customer','api_client')
)
-- หรือ phone-based (ตัด 55 คนเป๊ะ)
AND u.phone <> ALL($n::text[])   -- $n = array 55 เบอร์
```
+ เพิ่มฟิลด์ใน `PrintSlipsResult`:
```go
ExcludedCount int64 `json:"excluded_count"`  // ใบพนักงานที่ตัด (ทั้งแคมเปญ)
EligibleCount int64 `json:"eligible_count"`  // total หลังตัด = draw pool จริง
```

### 4.2 Dashboard — ผมทำได้เลย (read-only consume)
- `types.ts`: เพิ่ม `excludedCount?`, `eligibleTotal?` ใน PrintSlipsResponse
- `api-source.getPrintSlips`: ส่ง `exclude_phones` (ถ้า phone route) · รับ `excluded_count`/`eligible_count` · ใช้ `eligible_count` เป็น total (แทน `r.total - removed`) · เก็บ `matchExcludedName` เป็น fallback
- `PrintListTab`: chip "🎟️ สิทธิ์ทั้งหมด" → ใช้ `eligibleTotal` (draw pool จริง) · panel เปลี่ยนเป็น **"🚫 ตัดพนักงาน {excludedCount} ใบ ตั้งแต่ 16 พค 69"** (ครบแคมเปญ แทน "พบในช่วงนี้ X" ที่จำกัดแค่ 5k)

---

## 5. Rule-compliance ✅
- ไม่แตะ saversureV2 เอง → handoff สเปก/โค้ดให้ทีม (หรือ user อนุญาตเป็นกรณีพิเศษ)
- ไม่ page hot table → ใช้ endpoint เดิม + SQL ที่ **ลดผลลัพธ์**
- read-only consume (GET + auth/login) · ไม่ DB direct · ไม่ docker restart เอง · port 3100

---

## 6. Verification
1. **Conservation:** `eligible_count + excluded_count == total ดิบ` → พิสูจน์ตัดครบ 269k
2. spot-check 5k: ไม่มีชื่อ/เบอร์ใน blocklist เหลือ (fallback removed == 0)
3. `excluded_count` สมเหตุผล (55 คน × สิทธิ์เฉลี่ย) — ถ้าน้อยผิดปกติ = match พลาด → ใช้ phone
4. /print-slips กลับมา 200 (ตอนนี้ 500 จาก timeout) + ไม่มี prod impact

---

## 7. ⛔ ต้องตัดสิน/ขอจาก user ก่อนเริ่ม
1. **วิธี match:** role (ตัด staff ทุกคน · ปลอดภัยสุด) หรือ phone (ตัด 55 คนเป๊ะ · ต้องขอเบอร์)?
2. ถ้า phone → **ขอเบอร์โทร 55 เบอร์** (ตอนนี้มีแค่ชื่อ)
3. **backend แก้โดยใคร:** handoff ทีม saversure หรือ user อนุญาตให้ผมแก้ saversureV2 เป็นกรณีพิเศษ
4. **/print-slips ตอนนี้ 500** (statement_timeout) — ต้องแก้ให้ 200 ก่อน ไม่งั้น verify ไม่ได้

---

---

## 8. 🔬 ผลเช็ค API + หาเบอร์พนักงาน (2026-06-09 รอบ 2)

### API ที่ใช้ได้ตอนนี้ (read-only verified)
| endpoint | สถานะ | หมายเหตุ |
|---|---|---|
| `/customers` (limit) | ✅ 200 | มี **phone, display_name, first/last_name** ต่อ user (total 845,219) |
| `/scan-history` (success) | ✅ 200 | มี scanner_name + scanner_phone · tenant-wide · ไม่มี campaign/date filter |
| `/dashboard/summary` | ✅ 200 | |
| `/customers?search=` | 🔴 **500** | timeout (ILIKE บน 845k ไม่มี trigram index) — **ค้นชื่อไม่ได้** |
| `/dashboard/print-slips` | 🔴 **500** | timeout (COUNT 269k บน scan_history 12M) — ดึงไม่เสถียร |
| `/dashboard/campaign-daily / report` | 🔴 500 | timeout เดียวกัน |

→ **เบอร์มีในระบบจริง** แต่ **ดึงเบอร์ของ 55 คนตอนนี้ไม่ได้** เพราะ search/print-slips 500 (timeout) + scan-history หาเฉพาะคนไม่ได้ (15,000 แถวล่าสุด = match 0/55)

### 🔴 ค้นพบสำคัญ: role-based ใช้ไม่ได้กับ 55 คนนี้!
- พนักงานทั้ง 55 **สแกนในฐานะลูกค้าทั่วไป** (ชื่อโผล่เป็น scanner_name = มี consumer account ธรรมดา · ยืนยันจาก 2 คนที่เจอ: ฉัตรธิดา, มธุรส)
- `user_roles` เก็บเฉพาะ **admin/staff ที่ล็อกอินหลังบ้าน** → พนักงานที่สแกนผ่านแอปลูกค้า = role 'customer'/ไม่มี role
- → `role NOT IN ('customer')` **จะไม่ตัด 55 คนนี้** ❌
- **สรุป: ต้องตัดด้วย "ชื่อ หรือ เบอร์" (ลิสต์ 55 เฉพาะ) เท่านั้น** (role ตัดไม่ได้)

### ✅ แผนที่ถูกต้อง (แก้จากข้อ 2-3)
1. **ขอเบอร์โทร 55 คนจาก HR/ต้นทาง** (key ที่แม่นสุด — ชื่ออังกฤษ เช่น "Ngam Sriwili" จับด้วยชื่อไทยไม่ได้)
2. dashboard ส่ง **phone blocklist** → backend filter `WHERE u.phone <> ALL($n)` ตัดครบทั้งแคมเปญ + คืน `excluded_count` (handoff ทีม saversure)
3. fallback: ชื่อ (ที่มีอยู่) สำหรับคนที่ไม่มีเบอร์
4. backend ต้องแก้ 500 (timeout) ก่อนด้วย

→ rule-safe: read-only consume · backend handoff (ไม่แตะ saversureV2 เอง) · ไม่ page scan_history

---

**Last Updated**: 2026-06-09 (รอบ 2 — API check + role-based ใช้ไม่ได้)
**Related**: [20-Backend-Handoff-PrintSlips](20-Backend-Handoff-PrintSlips-2026-06-08.md) · [19-PrintList-Rights-Status](19-PrintList-Rights-Status-and-Remaining-2026-06-08.md) · [00-RULES](00-RULES.md)
