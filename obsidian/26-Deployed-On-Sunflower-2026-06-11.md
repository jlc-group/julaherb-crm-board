# 🌻 Deploy จริงบน sunflower (192.168.0.60) สำเร็จ — 2026-06-11

## ผลลัพธ์
Dashboard **รันแล้วบน sunflower** ผ่าน PM2 → `http://192.168.0.60:3101` (⚠️ **ไม่ใช่ 3100** — ดูเหตุผลข้างล่าง)

- `/` `/winners` `/claim` ตอบ HTTP 200 ครบ (ทดสอบทั้ง localhost และ LAN IP)
- PM2 process: `scan-lucky-rich-prod` (fork · `next start -p 3101`) · `pm2 save` แล้ว รอดข้าม reboot
- path บนเครื่อง: `D:\AI_WORKSPACE\AI_Project\Github\julaherb-crm-board\scan-lucky-rich-dashboard`
- branch: `feat/saversure-api-integration` (HEAD = `1759217`)
- Node v25.9.0 · `npm install` + `npm run build` ผ่าน 21 หน้า (ตรงกับ doc 25)

## 🔴 ทำไมเปลี่ยน port 3100 → 3101
**3100 บน sunflower ถูกใช้อยู่แล้วโดย `wepurchase-frontend-prod`** (PM2 cluster mode · `serve ./dist -l 3100`)
- กับดัก: cluster mode ทำให้ socket ถูกถือโดย PM2 daemon → `Get-NetTCPConnection` หา listener ตาม process ไม่เจอ ดูเผินๆ เหมือน port ว่าง แต่ HTTP ที่ 3100 ตอบเป็นหน้า **We-Purchase** จริง
- ตรงกับ registry กลาง (`APPS_REGISTRY.md` / `config/apps.json` ของเครื่อง): 3100 = we-purchase frontend
- ช่วง 3101–3199 ว่าง → เลือก **3101** · ห้ามย้าย We-Purchase เพราะเป็น production ของทีมอื่น

## ✅ สิ่งที่ตั้งค่าแล้วบน sunflower
1. `.env.local` สร้างแล้ว (`DATA_SOURCE=api` · `SAVERSURE_API_BASE_URL=http://10.10.10.4:30400/api/v1`)
2. Firewall: Node.js มี inbound allow rule อยู่แล้ว — เข้าจาก LAN ได้เลย
3. `data/` เริ่มว่างตามคาด (winner เทสต์ไม่ตามมา)

## ⏳ Blocker ที่เหลือ
1. ~~TCP 30400 จาก sunflower → 10.10.10.4 เข้าไม่ได้~~ ✅ **แก้แล้ว (2026-06-11 เย็น)** — เปิด firewall inbound 30400 บนเครื่อง saversure (scope เฉพาะ `192.168.0.60`) · ทดสอบจาก sunflower: `/api/v1/dashboard/campaign-daily` ตอบ **401** = ถึง backend จริง เหลือแค่ token
   (หมายเหตุ: rule ถูกสร้างซ้ำ 2 อัน ชื่อ "saversureV2 API 30400 (LAN)" — ลบอันเกินได้ ไม่ลบก็ไม่เสียหาย)
2. **`.env.local` ยังไม่มี credentials** — ต้องเติมเอง (ห้าม commit):
   `SAVERSURE_API_TOKEN` · `SAVERSURE_LOGIN_EMAIL` · `SAVERSURE_LOGIN_PASSWORD`
   (อยู่ใน `.env.local` ของเครื่อง dev — copy ค่ามาใส่มือ) → แล้ว `pm2 restart scan-lucky-rich-prod`
3. จนกว่า 2 เสร็จ หน้าที่เรียก API saversureV2 จะ error/ว่าง (หน้าเว็บ render ได้ปกติ)
4. ก่อนเปิด public ให้ลูกค้า (LINE OA) → ตั้ง `ADMIN_KEY` ตาม DEPLOY.md ข้อ 8

## วิธี operate บน sunflower
```bash
pm2 logs scan-lucky-rich-prod      # ดู log
pm2 restart scan-lucky-rich-prod   # restart หลังแก้ .env.local
# update โค้ด: git pull → npm install → npm run build → pm2 restart scan-lucky-rich-prod
```
