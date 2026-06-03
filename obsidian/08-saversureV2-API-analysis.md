# saversureV2 API — ผลวิเคราะห์ (read-only) สำหรับเชื่อม dashboard

**Analyzed**: 2026-06-03 (read-only ตาม 00-RULES ข้อ "ทำได้: Read source saversureV2")
**Source**: `C:\projects\Github\saversureV2\backend` (Go/Gin)

---

## ข้อเท็จจริงหลัก
- **Framework**: Go + Gin, DB = PostgreSQL (pgx), Redis, MinIO
- **Port**: `30400` (env `APP_PORT`) — ⚠️ อยู่ในลิสต์ห้ามแตะ (เรียก GET ได้ แต่ห้าม bind/kill/รัน)
- **Base path**: `/api/v1` (ไม่ใช่ 3001 หรือ /api/v2 ที่ .env.example เดิมเขียนไว้ — ตัวนั้นผิด)
- **Auth**: **JWT Bearer token** + **multi-tenant** (tenant_id จาก JWT claim) + RBAC + rate-limit
  → dashboard ต้องมี service token + tenant_id ถึงจะเรียกได้

## Endpoint ที่เกี่ยวกับ dashboard (เท่าที่เจอใน main.go ~line 745-764, handler ต่างๆ)
| saversureV2 endpoint | คืนอะไร |
|---|---|
| `GET /api/v1/dashboard/summary` | scans_today/7d/30d, points_issued/redeemed, users_total, campaigns, batches, total_codes |
| `GET /api/v1/dashboard/scan-chart?group_by=day` | `[{label, count}]` ต่อวัน |
| `GET /api/v1/dashboard/top-products?limit` | top SKU by scans |
| `GET /api/v1/dashboard/funnel` | scan → redeem funnel |
| `GET /api/v1/dashboard/geo-heatmap` | scan ต่อ province |
| `GET /api/v1/dashboard/recent-activity?limit` | event ล่าสุด |
| `GET /api/v1/scan-history` | รายการ scan (paginate) — มี shape ละเอียด (province, scan_type, product_sku, points_earned ...) |
| `GET /api/v1/scan-history/alerts?days&limit` | scan ต้องสงสัย (ซ้ำ) → ใช้ทำ RiskTab ได้ |
| `GET /api/v1/customers?search&limit&offset` | รายชื่อลูกค้า |
| `GET /health`, `/api/v1/monitor/checks`, `/monitor/incidents` | health + incident timeline → ใช้ทำการ์ด "สถานะ/ล่ม" ได้ |

## ✅ แก้ไข 2026-06-03: "สิทธิ์ลุ้นรางวัล (ticket)" มีในระบบแล้ว (วิเคราะห์รอบแรกผิด)
ทุกการสแกนสำเร็จ (V1 product ผูกแคมเปญลุ้นรางวัล) → สร้าง lucky-draw ticket อัตโนมัติ
- ฟังก์ชัน: `grantLegacyLuckyDrawTickets()` — `saversureV2/backend/internal/code/service.go:1085, 1189`
- ตาราง: **`lucky_draw_tickets`** (campaign_id, user_id, ticket_number, points_spent, created_at) — migration 004
- **`tickets_per_scan`** ใน `lucky_draw_campaigns` = "สิทธิ์ตามสเปก/rights_per_scan" ที่ dashboard ต้องการเป๊ะ (migration 071, แคมเปญ "สแกนลุ้นรวย")
- **มี analytics สำเร็จรูป**: `GetCampaignReport()` — `saversureV2/backend/internal/dashboard/campaign_report.go:105-197`
  → คืน ticket count by date/user/province, COUNT ต่อวัน/7วัน/30วัน, distinct users, top 20 scanners

## ⚠️ GAP ที่เหลือจริง (ลดลงมาก)
- shape ของ saversureV2 (`GetCampaignReport`, `scan-chart`, `summary`) ยัง **ไม่ตรง 1:1** กับ `types.ts` ของ dashboard → ต้องมี **mapping layer** แปลง field (ไม่ใช่ proxy ตรงๆ) แต่ข้อมูลครบแล้ว
- ต้องหา **HTTP route จริง** ของ `GetCampaignReport` (เป็น service method — ต้องดูว่า expose ที่ path ไหน, ต้อง JWT+tenant ไหม)
- Auth: ยังต้องมี JWT token + tenant_id (สำหรับ admin/dashboard endpoint)

## สิ่งที่ map ได้ทันที vs ต้องคุย
| dashboard ต้องการ | map ได้จาก | สถานะ |
|---|---|---|
| สถานะ/ล่ม (uptime) | `/monitor/incidents` + `/health` | ✅ map ได้ |
| สแกนรายวัน (timeseries) | `/dashboard/scan-chart?group_by=day` | ✅ map ได้ (ต้องแปลง label→date) |
| top SKU | `/dashboard/top-products` | ✅ map ได้ |
| heavy users / risk | `/scan-history/alerts` | ✅ map ได้ |
| จังหวัด | `/dashboard/geo-heatmap` | ✅ map ได้ |
| **expectedTickets / tickets (สิทธิ์ลุ้นรางวัล)** | — | ❌ ต้องเพิ่ม endpoint หรือคำนวณเอง |
| **memberNew/memberOld แบบ campaign** | summary ให้ users_total เฉยๆ | ⚠️ ต้องคุย |

## สรุป
- ต่อได้จริง แต่ **ต้องมี mapping layer** (ไม่ใช่ proxy ตรงๆ) + ต้องมี **JWT token + tenant_id**
- บาง field เฉพาะ lucky-draw ยังไม่มีใน API → ต้องตัดสินใจ (เพิ่ม endpoint ฝั่ง saversureV2 หรือคำนวณฝั่ง dashboard)
- ห้ามแตะ saversureV2 — ถ้าต้องเพิ่ม endpoint ให้ทีม saversureV2 ทำเอง (ส่ง contract ให้)
