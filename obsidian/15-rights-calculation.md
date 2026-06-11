# 🎟️ การคำนวณ "สิทธิ์ตามสเปก" (Rights Calculation)

**Updated**: 2026-06-04
**สถานะ**: ใช้ blended multiplier ชั่วคราว (รอ backend เพิ่ม per-SKU)

---

## ปัญหาเดิม

เส้น/การ์ด "สิทธิ์ตามสเปก" เคยแสดง **DB tickets ดิบ** (`expectedTickets = row.tickets`) ซึ่ง saversureV2 มี bug ออกสิทธิ์ **1:1 ทุก SKU** → บางวันสิทธิ์ < สแกน (เป็นไปไม่ได้ตาม logic เพราะบางสินค้าให้สิทธิ์ > 1)

---

## ที่มาของ "สิทธิ์ต่อสินค้า"

| แหล่ง | ค่า | หมายเหตุ |
|---|---|---|
| **saversureV2** `lucky_draw_campaigns.max_tickets_per_user` | 1-11 | ผูก 1 record ต่อ V1 product (50 campaigns) — ดู `/api/v1/lucky-draw` |
| **dashboard** `PRODUCTS_MASTER.rightsPerScan` | 1-11 | mirror ของค่าข้างบน (มาจาก V1 master เดียวกัน) |

> ⚠️ field ชื่อ "Max Tickets Per User" ความหมายตามชื่อ = สิทธิ์สูงสุดต่อ user แต่จริงๆ ถูกใช้เก็บ **สิทธิ์ต่อสินค้า** (V1→V2 migration) — อนาคต backend จะเพิ่ม `ticket_per_scan` แยกต่างหาก

distribution: `{1:49 SKU, 2:11, 3:4, 4:3, 5:23, 6:5, 7:1, 11:1}`

---

## สูตรที่ใช้ (blended — ชั่วคราว)

เพราะ saversureV2 **ไม่ส่งจำนวนสแกนแยกราย SKU รายวัน** (`/dashboard/top-products` เสีย, campaign-report ไม่มี section_16) → คำนวณ per-SKU รายวันเป๊ะไม่ได้ → ใช้ค่าเฉลี่ย:

```
M (blended) = Σ(scans_per_sku × rightsPerScan_sku) / Σ(scans_per_sku)
            = 48,419 / 35,640
            = 1.3586   (จาก SKU mix จริง 16-24 พ.ค.)

สิทธิ์ตามสเปก (รายวัน) = สแกนสำเร็จ (รายวัน) × 1.3586
```

**Implementation**: [`src/lib/rights-multiplier.ts`](../scan-lucky-rich-dashboard/src/lib/rights-multiplier.ts) → `CAMPAIGN_RIGHTS_MULTIPLIER`, `scansToSpecRights()`
ใช้ใน [`src/lib/api/api-source.ts`](../scan-lucky-rich-dashboard/src/lib/api/api-source.ts) `mapCampaignDailyRow` + `getScansTotals`

---

## ผลลัพธ์ (verified 2026-06-04, ช่วง 16 พ.ค.-4 มิ.ย.)

```
สแกนสำเร็จ        = 158,073
DB ออกจริง        = 166,234   (1:1 bug)
สิทธิ์ตามสเปก     = 214,751   (สแกน × 1.3586)
ขาดหายไป (gap)    =  48,517   (สเปก − DB ≈ 23%)
```

---

## ⚠️ ข้อจำกัด (ต้องรู้)

1. **เป็นค่าประมาณ** — blended avg สมมติ SKU mix คงที่ทุกวัน → เส้นสิทธิ์ขนานกับเส้นสแกน (×1.36 เท่ากันทุกวัน) ไม่สะท้อน mix ที่เปลี่ยนรายวัน
2. **multiplier มาจาก SKU mix ของ 16-24 พ.ค.** — ถ้าพฤติกรรมการสแกนเปลี่ยน ค่าจริงจะเพี้ยน

---

## 🔄 แผนอนาคต (เปลี่ยนเป็น exact)

เมื่อ saversureV2 ทำอย่างใดอย่างหนึ่ง:
- เพิ่ม `products.ticket_per_scan` (per-SKU rights field จริง) **และ**
- เปิด per-SKU daily scans (`/dashboard/top-products` ใช้ได้ หรือ populate `section_16_sku_daily_matrix`)

→ เปลี่ยน `rights-multiplier.ts` ให้ดึง per-SKU จริงมาคูณรายวัน (เลิกใช้ค่า blended)

---

**Related**: [12-Full-API-Migration-Plan](12-Full-API-Migration-Plan-2026-06-03.md), [13-Migration-Progress](13-Migration-Progress-2026-06-04.md)
