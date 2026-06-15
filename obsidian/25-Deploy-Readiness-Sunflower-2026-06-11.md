# 🚀 เตรียม deploy ไปเครื่อง sunflower (192.168.0.60) — 2026-06-11

## ภาพรวม
ตรวจ + เตรียมโค้ดให้เครื่องอื่น clone ไปรันได้ (`git push` → sunflower pull) — **ผ่านครบ พร้อม deploy**

## ✅ สิ่งที่ตรวจ/ทำ

### 1. Audit ความพร้อม
- **Secret ไม่หลุด git**: `.env.local` (token + login password) gitignored ✅ · มี `.env.example` ให้ copy
- **PII ไม่หลุด**: `data/` (draw-winners, draw-claims, claims/บัตร ปชช.) gitignored ✅
- **API URL ไม่ hardcode ตาย**: `SAVERSURE_API_BASE_URL ?? localhost:30400` — override ด้วย env ได้
- พบ `data/scan_data_2026-05-1*.json` เก่า 3 ไฟล์ถูก track อยู่ก่อนแล้ว (snapshot เก่า ไม่ใช่ความลับ — ปล่อยไว้)

### 2. แก้ 8 TypeScript errors → `next build` ผ่าน
เดิม `npm run dev` รันได้แต่ `npm run build` (production) fail — แก้ 5 ไฟล์ (เป็น error เก่าในโค้ด ไม่ใช่จากงานรอบนี้):
| ไฟล์ | ปัญหา → วิธีแก้ |
|---|---|
| `api/print-slips-pdf/route.ts` | puppeteer `waitUntil:'networkidle0'` type → `as any` |
| `ui/ParetoChart.tsx` | mixed bar+line dataset ใน `<Bar>` → `data as any` |
| `ui/TvAirtimeChart.tsx` | `parsed.x` เป็น `number\|null` → `?? 0` |
| `ui/SupportCasesPanel.tsx` | `[...map.entries()]` (target ต่ำ) → `Array.from()` |
| `lib/real-data.ts` | `for..of map.entries()` → `Array.from()` |

ผล: `tsc --noEmit` = **0 errors** · `npm run build` = **สำเร็จ 21 หน้า** (/, /claim, /winners + ทุก API route)

### 3. กันขยะ/PII เข้า git (root `.gitignore` เพิ่ม)
```
.report_tmp/ · *.pptx · *.pdf · *.xlsx · campaign-repo/ · รายชื่อ*
```
⚠️ สำคัญ: โฟลเดอร์ `รายชื่อลูกค้า รอบ 1/2/` + `รายชื่อพนักงาน*.xlsx` (PII จริง) เกือบหลุด — กันแล้ว

### 4. Commit + Push
- commit `08ddfaa` — 85 ไฟล์ (โค้ด dashboard 65 + obsidian 19 + .gitignore) · ตรวจ staging แล้วไม่มี PII/secret
- push ขึ้น `origin/feat/saversure-api-integration` (ครั้งแรกของ branch นี้)

### 5. คู่มือ deploy
สร้าง **`scan-lucky-rich-dashboard/DEPLOY.md`** — ขั้นตอนเต็ม: clone → npm install → สร้าง .env.local → รัน dev/production + ตารางหน้าเว็บ + จุดพลาดบ่อย

## 🔴 จุดที่ sunflower ต้องระวังที่สุด
1. **`.env.local` ต้องสร้างเองบนเครื่องปลายทาง** (ไม่มากับ git) — copy จาก `.env.example` ใส่ token + login creds
2. **`SAVERSURE_API_BASE_URL`** — `localhost:30400` หมายถึงเครื่องตัวเอง:
   - saversureV2 อยู่บน sunflower เอง → ใช้ `localhost` ได้
   - อยู่คนละเครื่อง → ชี้ IP เครื่องที่รัน V2 + เปิด firewall 30400 · **sunflower (192.168.0.60) อยู่คนละ subnet กับเครื่อง dev (10.10.10.4)** ต้องเช็ค route ถึงกัน
3. `data/` เริ่มว่าง (winner เทสต์ไม่ตามไป — ถ้าต้องการ copy `data/draw-winners.json` ด้วยมือ)
4. Node 18.17+ (แนะนำ 20/22 LTS) · puppeteer โหลด Chromium ตอน `npm install`
5. ก่อนเปิด public ให้ลูกค้า → ตั้ง `ADMIN_KEY` (กันหน้าแอดมิน + ไฟล์บัตร ปชช.)

## ✅ กฎ obsidian
ทุกอย่างอยู่ฝั่ง julaherb-crm-board · ไม่แตะ saversureV1/V2 · sunflower ก็ต้องทำตามกฎเดียวกัน (consumer read-only ผ่าน HTTP)
