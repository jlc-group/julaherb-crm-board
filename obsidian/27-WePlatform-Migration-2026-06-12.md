# 🏭 ย้ายเข้าระบบ we-platform + ADMIN_KEY gate — 2026-06-12

## ผลลัพธ์
Dashboard ย้ายจาก "รันมือจาก Github folder" → **production มาตรฐานเครื่อง sunflower** แล้ว

- PM2 `scan-lucky-rich-prod` (cluster) รันจาก `D:\AI_WORKSPACE\Production\scan-lucky-rich` port **3101** · `pm2 save` แล้ว
- GitHub webhook id `639839273` → push branch `feat/saversure-api-integration` (หรือ main) = **auto-deploy** (git pull → robocopy → build → pm2 restart)
- Cloudflare ingress ใส่แล้ว: `scanlucky.wejlc.com → localhost:3101` — ⏳ **รอ 2 คำสั่ง admin** (DNS route + restart cloudflared) ถึงจะเปิด public ได้
- ทดสอบ gate ครบ: `/winners` `/claim` เปิดได้ไม่ต้อง key · `/` + `/api/print-slips` (PII) ตอบ 401 · ใส่ key ผ่าน · API ดึงข้อมูลจริง saversureV2 ได้

## 🔐 ADMIN_KEY (ปรับนโยบาย 2 รอบ — สุดท้าย: เปิดหน้า ล็อกเฉพาะ PII)
- รอบแรกล็อกทุกหน้า → ผู้ใช้ confused ("เด้งไปอีกหน้า") → **ผู้ใช้ยืนยันเลือก "เปิด public เลย"** (2026-06-12)
- นโยบายปัจจุบัน (`src/middleware.ts`): **หน้าเว็บ + API ตัวเลขรวมเปิด public ทั้งหมด** (เปิด domain เจอ dashboard ทันที) · ADMIN_KEY ล็อกเฉพาะ 5 API PII: `print-slips(-pdf)`, `claim/file` (บัตร ปชช.), `draw/claims`, `draw/winners` (raw ไม่ mask), `customers/search`
- ปลดล็อก PII: เปิด `?key=<ADMIN_KEY>` ครั้งแรก → cookie 30 วัน · หรือ header `x-admin-key` (UI ClaimsTab มีช่องใส่ key)
- `/api/auth/refresh` เรียกได้เฉพาะ localhost · `/winners` ใช้ `/api/winners/public` (mask เบอร์) เหมือนเดิม
- **ค่า key อยู่ใน** `D:\AI_WORKSPACE\Production\scan-lucky-rich\.env.local` (ห้าม commit)
- ไม่ตั้ง ADMIN_KEY = เปิดหมด (dev ในเครื่อง 10.10.10.4 ไม่กระทบ)
- verified ผ่าน domain: หน้าหลัก/winners/ตัวเลขรวม = 200 · print-slips + customers/search = 401

## 📁 DATA_DIR ออกนอก app folder (กัน robocopy /PURGE ลบ PII)
- โค้ดรองรับ env `DATA_DIR` แล้ว (`claims-store.ts` + `api/draw/winners/route.ts`)
- prod ชี้ไป `D:\AI_WORKSPACE\Production\scan-lucky-rich-data\` (สร้าง + ย้ายไฟล์เดิมแล้ว)
- dev ไม่ตั้ง env → ใช้ `<app>/data` เหมือนเดิม

## ⚙️ สิ่งที่แก้ใน we-platform (เครื่อง sunflower — ยังไม่ commit เพราะ repo มีงาน IDE อื่นปนอยู่)
| ไฟล์ | อะไร |
|---|---|
| `main.py` | DEPLOY_OVERRIDES: dev = `julaherb-crm-board/scan-lucky-rich-dashboard` (script เดาผิดเป็น root) · REPO_TO_DEV_FOLDER = `julaherb-crm-board` · REPO_ALLOWED_BRANCHES เพิ่ม `feat/saversure-api-integration` · projects list path |
| `scripts/deploy.ps1` | PM2_MAP `scan-lucky-rich` → `scan-lucky-rich-prod` (script ใส่ให้) |
| `ecosystem.config.cjs` (ทั้ง we-platform + `Production\ecosystem.config.cjs`) | app block `next start -H 0.0.0.0` PORT=3101 |
| `C:\Users\ADMIN\.cloudflared\we-platform-api.yml` | ingress scanlucky.wejlc.com (script ใส่ให้) |
| sync แล้ว | `Production\we-platform\main.py` + restart `we-platform-prod` |

## 🌐 Domain LIVE แล้ว (2026-06-12 — user ยืนยันเปิด public)
- `https://scanlucky.wejlc.com/winners` → **200** ✅ · `https://scanlucky.wejlc.com/` (ไม่มี key) → **401** ✅ gate ทำงานผ่าน tunnel
- DNS route ถูกสร้างไว้แล้วฝั่ง Cloudflare (`cloudflared tunnel route dns` ตอบ already configured) · ไม่ต้อง restart service — tunnel โหลด ingress เอง
- ⚠️ ก่อนแจกลิงก์ลูกค้าจริง: ทดสอบจากมือถือ **4G** (ไม่ใช่ WiFi ออฟฟิศ) อีกครั้ง

## วิธี deploy รอบถัดไป
แค่ `git push` branch `feat/saversure-api-integration` → webhook auto-deploy เอง (~3-5 นาที) · ดู log ที่ we-platform
- `.env.local` + `data/` ฝั่ง prod รอดข้าม deploy (robocopy exclude `.env*` + DATA_DIR อยู่นอก folder)
- token refresh: `POST http://localhost:3101/api/auth/refresh` (localhost เท่านั้น) → hot-reload เอง ไม่ต้อง restart
