# 🎁 วันจับรางวัล + รับรางวัล + ประกาศผล (Operations / Claims / Winners) — 2026-06-10

## ภาพรวม
ทำชุดฟีเจอร์ "วันจับฉลากจริง → ลูกค้ารับรางวัล → ประกาศผลสาธารณะ" ครบวงจร บน dashboard (port 3100)
ทั้งหมด **rule-safe**: ไฟล์อยู่ใน `scan-lucky-rich-dashboard` ล้วน · อ่าน/เขียนเฉพาะ `data/*.json` local · ไม่แตะ saversure / DB / ports ต้องห้าม · ทุกครั้งที่ restart server ตรวจ PID = julaherb ก่อน kill

> ⚠️ ทุกหน้านี้รันบน `localhost:3100` → เปิดได้แค่เครื่อง dev · **ส่งลูกค้าจริง (LINE OA) ต้อง deploy ก่อน** (ยังไม่ทำ — ตัดสินใจ deploy ทีหลังตามเดิม)

---

## 🔑 กฎสำคัญ: "วันประกาศผล" ของแต่ละรางวัล (business rule — non-obvious)
รอบจับ **ปลายเดือน → ออกรางวัล "รายวัน" ของเดือนถัดไป** · ช่องรางวัลที่ N = ผู้โชคดีประจำวันที่ N
(ยืนยันจากตัวอย่างเจ้าของงาน: รอบ 1 = "ผู้โชคดีประจำวันที่ 1 ก.ค.")

| รอบ | วันจับ (drawDate) | เดือนออกรางวัล (prizeMonthISO) | รางวัล |
|---|---|---|---|
| 1 | 24 มิ.ย. | ก.ค. (2026-07) | 10K×30 (1–30 ก.ค.) + 100K×5 |
| 2 | 22 ก.ค. | ส.ค. (2026-08) | 10K×30 + 100K×5 |
| 3 | 26 ส.ค. | ก.ย. (2026-09) | 10K×29 + 100K×5 |
| 4 | 23 ก.ย. | ต.ค. (2026-10) | 10K×30 + 100K×5 |
| 5 | 21 ต.ค. | พ.ย. (2026-11) | 10K×29 + 100K×5 |
| 6 | 25 พ.ย. | ธ.ค. (2026-12) | 10K×19 (รายวัน ธ.ค.) |
| 7 | 18 ธ.ค. | ธ.ค. (2026-12) | 100K×5 (รายเดือน ธ.ค.) + **1M×1** |

**helper ใน `src/config/draw-rounds.ts`:**
- `prizeAnnounce(round, tier, index)` → ป้ายความหมาย: `ผู้โชคดีประจำวันที่ {N} {เดือนย่อ}` (10K) / `รางวัลประจำเดือน{เดือน}` (100K) / `รางวัลใหญ่ท้ายแคมเปญ` (1M)
- `winnerAnnounceISO(round, tier, index)` → **วันที่ประกาศจริง ISO** สำหรับ gate หน้าสาธารณะ: 10K = `{prizeMonthISO}-{วันที่}` · 100K = วันสุดท้ายของเดือน · 1M = `drawDate`
- เพิ่ม field `prizeMonthName` / `prizeMonthShort` / `prizeMonthISO` ใน `DrawRound`
- `slotParts(slotId)` / `prizeAnnounceBySlot` / `winnerAnnounceISOBySlot` (แยก tier+index จาก `r1-10K-3`)

---

## 🧩 ฟีเจอร์ที่ทำ

### 1. แก้ Operations search "ไม่ขึ้นผลลัพธ์"
- ต้นเหตุจริง = พูลค้นใช้เวลาโหลด ~3.7 วิ · ช่องผลลัพธ์ว่างเปล่าไม่บอกสถานะ → ดูเหมือนพัง
- แก้: `WinnerPicker.tsx` บอกสถานะชัดเสมอ (กำลังโหลด / พิมพ์เพื่อค้น+จำนวนในพูล / ผลลัพธ์ / ไม่พบ)
- ข้อจำกัดเดิม: พูล cap ~12,400/53k (50k สลิปแรก) → ไม่เจอใช้ "กรอกเอง"

### 2. แท็บ "รับรางวัล" (ClaimsTab) แสดง รอบ + ป้ายความหมาย
- pill: `รอบ N · ผู้โชคดีประจำวันที่ X · ทองคำ …` · เรียงตามรอบ
- การ์ดลิงก์ `/claim` (เปิด/คัดลอก) ให้แอดมินส่งให้ลูกค้า

### 3. หน้า `/claim` — ลูกค้าส่งเอกสารรับรางวัล (รื้อใหม่ minimal เขียว-ทอง)
- step indicator (ยืนยันสิทธิ์ → แนบเอกสาร → เสร็จ) · prize card ทอง · dropzone แนบไฟล์มี thumbnail/ไอคอน PDF + ขนาดไฟล์
- **ตัวอย่างเอกสาร** `DocExampleModal.tsx` (วาด SVG เลี่ยง PII): ปุ่ม "🔍 ดูตัวอย่าง" ข้างทุกช่อง → บัตร ปชช. (เซ็นสำเนาถูกต้อง) / หนังสือมอบอำนาจ / บัตรผู้รับมอบ + เช็คลิสต์
- verify API (`/api/claim/verify`) คืน `announce` ด้วย

### 4. Flow ข้ามแท็บ Operations → รับรางวัล
- ช่องที่มีผู้ชนะมีปุ่ม **"🏅 รับรางวัล →"** → เด้งไปแท็บรับรางวัล + scroll + ไฮไลต์คนนั้น (เช็คว่าส่งเอกสารยัง)
- สถาปัตยกรรม: ยก state `claimFocus` ขึ้น `page.tsx` (`goToClaim` / `handleTab`) → `OperationsTab` (`onOpenClaim`) · `ClaimsTab` รับ `focusPhone` (remount ทุกครั้งเข้าแท็บ → trigger เสมอ)

### 5. หน้า `/winners` — ประกาศผลผู้โชคดี (สาธารณะ · ใหม่)
- ไฮไลต์ "ผู้โชคดีวันนี้" บนสุด + ผลย้อนหลังไล่ใหม่→เก่า (โผล่เพิ่มเองทุกวัน) · badge ประเภทรางวัล
- **API ใหม่ `/api/winners/public`** — gate ฝั่ง server: เผยเฉพาะ `announceISO ≤ วันนี้ (เวลาไทย Asia/Bangkok)` → **ผลอนาคตไม่ถูกส่งออกเลย** (กัน leak) · เบอร์ mask `maskPhone6` = `081-123-xxxx` (เหมือน Print List) · ไม่มีรหัสสแกน
- `?all=1` (ผ่าน admin gate · local เปิด) = preview เห็นทุกวัน (สำหรับแอดมิน)
- ทางเข้า: การ์ดที่แท็บ **Operations** (เปิด / 👁พรีวิว / คัดลอก) — แยกบทบาทจากลิงก์ `/claim` ที่อยู่แท็บรับรางวัล

### 6. Mobile / LINE OA
- `layout.tsx`: เพิ่ม `viewport` export → `width=device-width` + **theme-color `#15803d`** + `viewport-fit:cover`
- `/claim` + `/winners`: `padding-bottom: max(2rem, env(safe-area-inset-bottom))` (กันโดน home indicator) · จัดแถว `/winners` เป็น 3 บรรทัด (ชื่อไม่ถูกตัด)
- input เบอร์ใน /claim = 16px (กัน iOS zoom)
- **เคลียร์ความเข้าใจผิด:** "เปิดแล้วเหมือนคอม" = เปิดบน localhost (เครื่องคอม) · มือถือเปิด localhost ไม่ได้ → หน้าจริงบนมือถือเต็มจอ (viewport ถูก · ไม่มี overflow ยืนยันแล้ว) · ดูแบบมือถือบนคอม = F12 → device toolbar
- ⛔ การเปิด LAN (`-H 0.0.0.0`) ให้มือถือในวง WiFi เข้า — **ระบบความปลอดภัยบล็อก** เพราะจะเปิดหน้าแอดมิน (ไม่มีรหัส) + ไฟล์บัตร ปชช. ให้ทั้งวง → ต้องตั้ง `ADMIN_KEY` ก่อน หรือ deploy

---

## 🔍 Adversarial review (multi-agent workflow)
รัน review งาน cross-tab (4 มุม: react/edge/rules/ux → verify ทุก finding) — เจอ 6 ยืนยันจริง ยุบเป็น 4 → **แก้ครบ**:
1. **(medium ×3)** ไฮไลต์ตั้งเวลา 3.2 วิ จาก "ตอนโฟกัส" → โหลดช้ากว่า 3 วิ ไฮไลต์หายก่อนแถวขึ้น (feature เงียบ) → แก้ด้วย flag `readyToClear` (เริ่มจับเวลาหลังเห็นแถวจริง)
   - หมายเหตุ: fix ที่ agent เสนอ (ยัด timer เข้า scroll effect) มี bug ใหม่ — `load()` setWinners/setClaims คนละ tick → `shown` เปลี่ยน 2 ครั้ง → cleanup ล้าง timer แล้วไม่ตั้งใหม่ → ไฮไลต์ค้าง · เลยใช้ `readyToClear` แยก timer ออกจาก `shown`
2. **(low)** `shown` ไม่ memoize → `useMemo([persons, filter])`
3. **(low)** แถว slot ไม่ flex-wrap → ชื่อถูกบีบจอแคบ → `flex-wrap` + winner `basis-[180px]`
4. **(low)** ไฮไลต์ทองจาง → ring เข้ม `#e0a82e` + glow
- มุม **rules: 0 finding** (ไม่มี rule violation)

---

## 📁 ไฟล์ที่แตะ (ทั้งหมดใน scan-lucky-rich-dashboard/src)
**ใหม่:** `components/claim/DocExampleModal.tsx` · `app/winners/page.tsx` · `app/api/winners/public/route.ts`
**แก้:** `config/draw-rounds.ts` · `components/operations/{WinnerPicker,DrawSlotList,DrawRoundSelector}.tsx` · `components/tabs/{ClaimsTab,OperationsTab}.tsx` · `app/claim/page.tsx` · `app/api/claim/verify/route.ts` · `app/page.tsx` · `app/layout.tsx`
**ข้อมูล (gitignore):** `data/draw-winners.json` (ผู้ชนะ) · `data/draw-claims.json` · `data/claims/{phoneLast9}/` (ไฟล์เอกสาร PII)

---

## ⏭️ ค้างไว้ / ขั้นต่อไป
- [ ] **Deploy** หน้าลูกค้า (`/winners`, `/claim`) ขึ้น public สำหรับ LINE OA + ตั้ง `ADMIN_KEY` กันหน้าแอดมิน/ไฟล์ PII ก่อนเปิด public
- [ ] (option) gate เวลา **15:00 น.** บน `/winners` (ตอนนี้เผยตั้งแต่ต้นวันของวันประกาศ)
- [ ] ยืนยัน label 100K/1M กับเจ้าของ ("รางวัลประจำเดือน…" / "รางวัลใหญ่ท้ายแคมเปญ" — ผมตั้งเอง)
- [ ] retention: ลบไฟล์ PII หลัง "มอบของแล้ว" (มีปุ่ม purge อยู่แล้วในแท็บรับรางวัล)

## ✅ กฎ obsidian
อ่าน `00-RULES.md` ก่อนทำทุกครั้ง · ไฟล์ทั้งหมด julaherb dashboard · อ่านเฉพาะ `data/` local · port 3100 (ระบุชัด) · verify PID julaherb ก่อน Stop-Process ทุกครั้ง · LAN binding ถูกบล็อกถูกต้อง — **ไม่ผิดกฎข้อใด**
