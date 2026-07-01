# API Audit — สแกนลุ้นรวย สวยลุ้นล้าน Dashboard
> สรุปฉบับเต็ม: API ที่มีแล้ว vs ยังไม่มี · อัปเดต 1 ก.ค. 2026
> ตัวเลขอ้างอิงแคมเปญ (16 พ.ค.–30 มิ.ย.): success **368,123** · distinct **82,479 คน**

## TL;DR
- **มี API จริงแล้ว 38 route** — 7 หน้าใช้งานได้เต็ม (Overview · Products · Print List · Operations · Claim · CRM Center · Report)
- **ยังไม่มี** — โซน CRM รายคน (Explorer), Risk, มิติ อายุ/เพศ, channel
- **ต้องแก้ scope** — segments/engagement/rfm ตอนนี้เป็น "ทั้งระบบ 783k" ต้องเป็น "แคมเปญ 82k"

---

## 1) ✅ API ที่มีแล้ว (38 route)

### แคมเปญ / สแกน
| route | ใช้ทำอะไร | หมายเหตุ |
|---|---|---|
| `/api/scans/totals` | success/attempts/distinct/tickets | 🟢 source of truth ระดับแคมเปญ |
| `/api/scans/timeseries` | สแกนรายวัน | 🟢 |
| `/api/scans/time-of-day` | 7 ช่วงเวลา + พีค | 🟢 |
| `/api/scans/day-hour` | heatmap วัน×ชั่วโมง | 🟢 |
| `/api/scans/verification` | success/dupSelf/dupOther/notFound + เหตุผล | 🟢 |
| `/api/daily` · `/api/daily/[date]` | รายวัน (success/dup/tickets/members) | 🟢 |
| `/api/members/daily` | สมาชิกใหม่/เก่า รายวัน | 🟢 |
| `/api/system/uptime` | outage/uptime | 🟢 |
| `/api/baseline/compare` | เทียบ มี.ค./เม.ย./พ.ค. | 🟡 ก่อนแคมเปญคืน 0 (ยังไม่มีข้อมูลย้อนหลัง) |

### ลูกค้า
| route | ใช้ทำอะไร | หมายเหตุ |
|---|---|---|
| `/api/customers/engagement` | บัคเก็ต 1 / 2-5 / 6-10 / 10+ สแกน | ⚠️ **ทั้งระบบ** (ต้องแก้ scope) |
| `/api/customers/heavy-users` | ผู้สแกนหนัก top-N รายวัน | 🟢 (แต่ `skuDiversity=0` backend ยังไม่ส่ง) |
| `/api/customers/provinces` | จังหวัด top-N รายวัน | 🟢 (มี "ไม่ระบุ" เยอะ = data-quality) |
| `/api/customers/retention` | ครั้งแรก vs กลับมา (วันเดียว) | 🟢 |
| `/api/customers/segments` | จำนวนต่อ segment | ⚠️ **ทั้งระบบ** |
| `/api/customers/rfm` | RFM risk level | ⚠️ **ทั้งระบบ** |
| `/api/customers/search` · `/address` | ค้นหา / ที่อยู่รายคน | 🟢 |

### สินค้า / SKU
| route | ใช้ทำอะไร | หมายเหตุ |
|---|---|---|
| `/api/sku/list` | แคตตาล็อก SKU + rightsPerScan | 🟢 |
| `/api/sku/per-day` | ยอดต่อ SKU (normalize SCH-/TUB-) | 🟢 L3-8G = 126,579 |
| `/api/sku/[sku]/timeseries` | เทรนด์ราย SKU | 🟢 |
| `/api/sku/daily-matrix` | SKU × วัน (sparkline) | 🟢 |
| `/api/sku/co-scan` | คู่ที่สแกนด้วยกัน | 🟢 |
| `/api/sku/rank-history` | อันดับ SKU รายวัน | 🟢 |

### รางวัล / รับรางวัล
`/api/draw/winners` · `/winners/export` · `/pool` · `/appointments` · `/claims` · `/resolve-code` · `/api/claim/verify` · `/submit` · `/file` · `/api/winners/public` · `/api/print-slips` · `/print-slips-pdf` · `/api/export` — 🟢 ใช้งานจริงทั้งหมด (draw/pool ranking บางส่วนเป็น logic mock)

### ระบบ
`/api/auth/refresh` — 🟢

---

## 2) ❌ API ที่ยังไม่มี (เรียงตามความสำคัญ)

| Priority | Endpoint | ปลดล็อกหน้า | ต่อแล้วเห็นอะไร |
|---|---|---|---|
| **P0** | `/dashboard/explore` + `/explore/customers` | Explorer โซน D | ฟิลเตอร์ cross มิติ (อายุ×จังหวัด×SKU) + ตารางลูกค้ารายคน + royalty flag |
| **P0** | `/crm/segments` (campaign) + `/crm/funnel` + `/crm/one-shot` | Explorer / CRM | 7 เซกเมนต์จำนวนจริง · L3-8G→40G upsell · one-shot cohort → ดึงรายชื่อยิง LINE |
| **P0** | expose **`age`** + เพิ่ม **`gender`** | Customers, Explorer | การ์ดกลุ่มอายุจริง + แยกเพศ |
| **P1** | `/customers/risk` | Risk Watch | จับ fraud จริง (velocity/หลายบัญชี/geo ไม่ตรง) |
| **P2** | `/retention/cohort` · `/funnel` · `/tv-lift` | (Scan Behavior) | cohort retention จริง · scan funnel · ผลออกทีวี |
| **P2** | `channel/source` | (ช่องทางขาย) | สแกนมาจาก 7-11/Shopee/TikTok/ตัวแทน — **ต้องให้ backend เก็บ `channel` ตอนสแกนก่อน** |

รายละเอียด query สเปกของ P0 อยู่ใน [`explorer-api-spec.md`](./explorer-api-spec.md)

---

## 3) ⚠️ ต้องแก้ scope (ไม่ใช่ endpoint ใหม่ แต่สำคัญ)
`engagement` / `segments` / `rfm` ตอนนี้นับ **ทั้งระบบ saversure (~783,000 คน)** → ต้องนับ **เฉพาะแคมเปญ (~82,479 คน)**
- กระทบหน้า **Customers · CRM Center · Report** (ตัวเลขพองไป ~9.5 เท่า)
- อ้างอิง: success 368,123 ÷ distinct 82,479 ≈ **4.5 สแกน/คน** (ไม่ใช่ 14.38 แบบ platform)

---

## 4) 🔧 เตรียม data layer (สำหรับ backend)
| มิติ | สถานะ | ต้องทำ |
|---|---|---|
| **อายุ** | `dob` อยู่ใน `users` · ⚠️ ต้องเช็คว่าเก็บ dob เต็มหรือแค่**ปีเกิด** | คำนวณเอง **age = ปีปัจจุบัน − ปีเกิด** แล้ว expose `age`/ช่วงอายุ (ถ้าแค่ปีเกิด คลาด ±1 ปี — โอเค) |
| **เพศ** | ❌ ไม่มีใน schema | เพิ่มคอลัมน์ `gender` แล้วเริ่มเก็บ |
| **channel** | ❌ ไม่มี | เก็บ `channel` ตอนสแกน (7-11/Shopee/…) |
| **per-customer / cohort** | อ่านจาก rollup | aggregate จาก rollup — **ห้ามแตะ `scan_history` ดิบ** (hot table) |

---

## 5) 📄 สถานะรายหน้า
| หน้า | สถานะ | ยังขาด |
|---|---|---|
| CRM Center | ✅ | ⚠️ segments scope |
| Scan Overview | ✅ | ม.ค.–พ.ค. static · baseline ก่อนแคมเปญ |
| Customers | 🟡 | 🔒 อายุ/เพศ · ⚠️ engagement/rfm/segments scope |
| Products | ✅ | — |
| Explorer | 🟡 | 🔒 โซน D (อายุ/เพศ/segments/funnel/one-shot/royalty) |
| Operations | ✅ | pool ranking บางส่วน mock |
| Claim | ✅ | — |
| Print List | ✅ | — |
| Risk Watch | 🔴 | ❌ `/customers/risk` (mock เยอะ) |
| Report | ✅ | ⚠️ segments scope |
| ~~Channels~~ | ลบแล้ว | (mock 100% · orphan) |
| Scan Behavior 👻 | 🔴 | orphan · mock funnel/cohort/tv-lift |

---

## หมายเหตุ
- **DATA_SOURCE**: `api` = saversureV2 จริง (prod) · `mock`/local = ข้อมูลนิ่ง (บาง endpoint ว่าง) · `db` = ห้ามใช้
- ทุก endpoint ผ่าน `useApi` → `adapter.ts` → `api-source.ts`
- SKU ที่รับ/ส่ง = base code (รวม variant SCH-/TUB- แล้ว)
