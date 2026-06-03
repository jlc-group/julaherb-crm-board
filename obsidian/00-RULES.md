# 🚨 RULES — ห้ามทำเด็ดขาด

> ⚠️ **อ่านก่อนทำงานทุกครั้ง** — กฎเหล่านี้มาจากเหตุการณ์จริงที่เคยผิดพลาด

---

## 🔴 PORT RULES

### ห้ามแตะพอร์ทของ saversureV1 และ saversureV2 ทุกกรณี

**Port ที่ถูกครอง (ห้ามใช้สำหรับโปรเจกต์ julaherb-crm-board)**:

| Port | โปรเจกต์ | Framework |
|---|---|---|
| 3000 | saversureV1 / saversure-frontend | Nuxt |
| 3001 | saversureV1 / saversure-admin-web | Nuxt |
| 4000 | saversureV1 / saversure-dashboard | Next.js |
| 30400 | saversureV2 backend (Docker) | Go |

**ห้าม**:
- ❌ ห้าม `npm run dev` โดยไม่ระบุ port (default 3000 = ชน saversureV1)
- ❌ ห้าม `kill` process บน port 3000, 3001, 4000, 30400 แม้จะคิดว่าเป็นของตัวเอง
- ❌ ห้าม `Stop-Process` PID ที่ฟัง port saversure
- ❌ ห้ามแก้ config saversureV1/V2 ให้ย้าย port (ห้ามแตะโปรเจกต์ saversure เลย)

**ต้องทำ**:
- ✅ ตรวจ port ที่ฟังอยู่ก่อนเสมอ ก่อนสตาร์ท server
- ✅ ใช้ port ของ julaherb-crm-board ที่กำหนดไว้ใน `package.json` เท่านั้น (ปัจจุบัน: **3100**)
- ✅ ถ้า 3100 ไม่ว่าง → หา port อื่นในช่วง 3100-3999 ที่ว่าง (ห้าม 3000, 3001)
- ✅ Verify ด้วย `Get-NetTCPConnection -LocalPort <port> -State Listen` ก่อนสตาร์ท

### คำสั่งตรวจสอบ port ก่อนสตาร์ท

```powershell
# ตรวจว่า port ที่จะใช้ ว่างจริงมั้ย
Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue

# ดูทุก node process + port + cwd
foreach ($id in (Get-Process node -ErrorAction SilentlyContinue).Id) {
  $p = Get-CimInstance Win32_Process -Filter "ProcessId = $id"
  "PID ${id}: $($p.CommandLine)"
}
```

---

## 🔴 saversureV1 / saversureV2 PROJECT RULES

### ห้ามแตะโปรเจกต์ saversure ทั้ง V1 และ V2 ทุกกรณี

**Paths ที่ห้ามแตะ**:
- `C:\projects\Github\saversureV1\` ทั้งโฟลเดอร์
- `C:\projects\Github\saversureV2\` ทั้งโฟลเดอร์

**ห้ามทำ**:
- ❌ ห้าม Edit / Write ไฟล์ใดๆ ใน saversureV1, saversureV2
- ❌ ห้ามรัน command ที่จะแก้ DB, restart container, migrate
- ❌ ห้ามรัน `docker stop`, `docker restart` ของ container saversure
- ❌ ห้าม commit / push บน repo saversure
- ❌ ห้ามแตะ `.env` ของ saversure

**ทำได้**:
- ✅ Read ไฟล์ source code ของ saversureV1/V2 (เพื่อ reference เช่น API/DB schema)
- ✅ ใช้ Explore agent เพื่อวิเคราะห์ structure ของ saversure (read-only)
- ✅ Document ผลการ analyze ของ saversure ใน `obsidian/` folder ของ julaherb-crm-board

---

## 🔴 DATABASE RULES

### ห้ามแตะ DB ของ saversureV1, saversureV2 ทุกกรณี

- ❌ ห้ามรัน SQL migrate / seed
- ❌ ห้ามรัน script ที่ INSERT / UPDATE / DELETE
- ❌ ห้ามใช้ DB tool (psql, DBeaver, pgAdmin) เชื่อม DB saversure
- ❌ ห้ามแก้ไข data ใน DB ผ่าน API call

✅ Read-only query (SELECT) สำหรับ debug → ต้องขออนุญาตก่อนทุกครั้ง

---

## 📋 Checklist ก่อนเริ่มงานทุกครั้ง

- [ ] อ่านไฟล์นี้ (`00-RULES.md`) ก่อน
- [ ] ถ้าจะสตาร์ท server → ตรวจ port ที่จะใช้ ว่าว่างจริง
- [ ] ถ้าจะแก้ไฟล์ → confirm ว่าอยู่ใน `julaherb-crm-board` ไม่ใช่ saversure
- [ ] ถ้าจะ kill process → confirm ว่า PID นั้นเป็นของ julaherb-crm-board เท่านั้น

---

## 🚨 เหตุการณ์ที่เคยเกิด (Reference)

**2026-05-26**:
- ผม (Claude) สตาร์ท `npm run dev` ใน julaherb-crm-board โดยไม่ระบุ port
- Default port 3000 ชนกับ saversureV1/saversure-frontend ที่ฟังอยู่
- ทำให้ saversureV2 ค้าง/error
- User ต้องรีสตาร์ท saversureV2 เอง
- **บทเรียน**: ต้องตรวจ port ก่อนเสมอ ห้าม default

---

**Last Updated**: 2026-05-26
**ระดับความสำคัญ**: 🔴 CRITICAL — ห้ามฝ่าฝืน
