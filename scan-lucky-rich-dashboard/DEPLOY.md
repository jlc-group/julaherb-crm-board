# 🚀 Deploy / รันบนเครื่องอื่น (เช่น sunflower 192.168.0.60)

Dashboard "สแกนลุ้นรวย สวยลุ้นล้าน" — Next.js 14 · port **3101**

> ✅ **Deploy บน sunflower แล้ว (2026-06-11)** ที่ `http://192.168.0.60:3101` — รันผ่าน PM2 ชื่อ `scan-lucky-rich-prod` · รายละเอียด [obsidian/26-Deployed-On-Sunflower-2026-06-11.md](../obsidian/26-Deployed-On-Sunflower-2026-06-11.md)
>
> ⚠️ **port มาตรฐานเปลี่ยนจาก 3100 → 3101 แล้ว (2026-06-12)** ใน `package.json` ทั้ง dev/start — เพราะ 3100 บน sunflower เป็นของ `wepurchase-frontend-prod` (PM2 cluster mode — เช็คด้วย `Get-NetTCPConnection` จะดูเหมือนว่าง แต่ HTTP ตอบเป็น We-Purchase) · เครื่อง dev ที่เคยเปิด `localhost:3100` ให้เปลี่ยนเป็น `localhost:3101`

---

## 1) สิ่งที่ต้องมีบนเครื่องปลายทาง
- **Node.js 18.17+** (แนะนำ 20 หรือ 22 LTS) + npm
- เชื่อมต่อ network ที่ **เข้าถึง saversureV2 backend (port 30400) ได้** (ดูข้อ 4)
- พื้นที่ดิสก์เผื่อ Chromium (puppeteer ใช้ทำ PDF Print List ~150MB)

## 2) ดึงโค้ด + ติดตั้ง
```bash
git clone https://github.com/jlc-group/julaherb-crm-board.git
cd julaherb-crm-board
git checkout feat/saversure-api-integration   # branch งานปัจจุบัน
cd scan-lucky-rich-dashboard
npm install                                    # โหลด deps + Chromium ของ puppeteer
```

## 3) สร้างไฟล์ `.env.local` (สำคัญ — ไม่มากับ git)
> `.env.local` ถูก gitignore (มี token/password) → **ต้องสร้างเองบนเครื่องใหม่**

```bash
cp .env.example .env.local   # แล้วแก้ค่าด้านล่าง
```
ใส่ค่า:
```ini
DATA_SOURCE=api
SAVERSURE_API_BASE_URL=http://<HOST-ที่รัน-saversureV2>:30400/api/v1   # ⚠️ ดูข้อ 4
SAVERSURE_API_TOKEN=<JWT token ปัจจุบัน>            # หมดอายุได้ — ระบบ refresh เองถ้าใส่ login ครบ
SAVERSURE_CAMPAIGN_NAME=สแกนลุ้นรวย สวยลุ้นล้าน
SAVERSURE_LOGIN_EMAIL=<email admin>                 # ใช้ /api/auth/refresh ขอ token ใหม่อัตโนมัติ
SAVERSURE_LOGIN_PASSWORD=<password>
SAVERSURE_TENANT_ID=00000000-0000-0000-0000-000000000001
# (ตอน deploy public ค่อยเพิ่ม) ADMIN_KEY=<คีย์ลับ>  # กันหน้าแอดมิน/ไฟล์ PII
```

## 4) ⚠️ จุดที่พลาดบ่อยที่สุด — `SAVERSURE_API_BASE_URL`
`localhost:30400` = saversureV2 บน **เครื่องตัวเอง** เท่านั้น
- ถ้า saversureV2 **รันบน sunflower เอง** → ใช้ `http://localhost:30400/api/v1`
- ถ้า saversureV2 รันบน **เครื่องอื่น** → ใช้ IP เครื่องนั้น เช่น `http://10.10.10.4:30400/api/v1`
  - เครื่องที่รัน V2 ต้อง bind ให้เข้าจาก network ได้ + เปิด firewall port 30400
  - sunflower (192.168.0.60) กับเครื่อง V2 ต้อง routable ถึงกัน (อาจคนละ subnet)

> token หมดอายุ (JWT ~8 ชม.) ระบบเรียก `/api/auth/refresh` ขอใหม่ให้เองด้วย login/password ใน .env.local → ตั้งให้ครบก็ไม่ต้อง refresh มือ

## 5) รัน
**โหมดพัฒนา (แก้โค้ดเห็นทันที):**
```bash
npm run dev          # → http://localhost:3101
```
**โหมด production (เร็วกว่า · ใช้จริง):**
```bash
npm run build
npm start            # → http://localhost:3101
```

## 6) หน้าเว็บ
| URL | ใคร | หมายเหตุ |
|---|---|---|
| `/` | แอดมิน | dashboard (sidebar) — สำหรับคอม |
| `/winners` | ลูกค้า (สาธารณะ) | ประกาศผลผู้โชคดี · mobile-first |
| `/claim` | ลูกค้า (สาธารณะ) | ส่งเอกสารรับรางวัล · mobile-first |

## 7) ข้อมูล local ที่ไม่มากับ git (เริ่มว่างบนเครื่องใหม่)
`data/` ถูก gitignore — บนเครื่องใหม่จะ **ว่าง** แล้วสร้างเองตอนใช้งาน:
- `data/draw-winners.json` — ผู้ชนะที่บันทึกในแท็บ Operations
- `data/draw-claims.json` + `data/claims/<เบอร์>/` — เอกสาร/บัตรลูกค้า (PII)

> ถ้าต้องการย้ายผู้ชนะที่เทสต์ไว้ → copy `data/draw-winners.json` ไปเองด้วยมือ (ห้าม commit เพราะมี PII)

## 8) ก่อนเปิดให้ลูกค้าจริง (LINE OA)
- หน้า `/winners` `/claim` ต้องอยู่ public URL (มือถือเปิด localhost ไม่ได้)
- ตั้ง `ADMIN_KEY` ก่อนเปิด public → กันคนนอกเข้าแท็บแอดมิน + เปิดไฟล์บัตรประชาชน
- ⚠️ **ห้ามแตะ saversureV2** (อ่าน read-only ผ่าน HTTP เท่านั้น) ตามกฏ obsidian/00-RULES.md
