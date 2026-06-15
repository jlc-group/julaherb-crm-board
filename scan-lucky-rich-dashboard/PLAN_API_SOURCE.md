# 📋 PLAN — เชื่อม Dashboard กับ API ของ saversureV2 (api-source)

> เอกสารนี้เป็น "แผน" สำหรับให้ `/goal` อ่านแล้วเดินงานตามทีละขั้น
> เป้าหมาย: ให้ dashboard ดึงข้อมูลจริงผ่าน **API ของ saversureV2** โดย **ไม่เข้า DB โดยตรง** และ **ไม่กระทบ saversure**

---

## 🎯 เป้าหมาย (Goal)
สร้าง `api-source.ts` ที่ implement `DataSource` interface (15 method) โดยเป็น **HTTP client เรียก API ของ saversureV2**
แล้ว wire เข้า adapter ให้สลับด้วย `DATA_SOURCE=api` — โดย **คง `mock` เป็น default** จนกว่าจะพร้อมจริง

## 🏗️ สถาปัตยกรรม (ห้ามเข้า DB ตรง)
```
Browser → useApi → /api/* (route ของเราเอง, port 3100, server-side)
                      → adapter (ds) → api-source.ts → fetch ไป saversureV2 API
                                                         (read-only GET เท่านั้น)
```
- Browser **ไม่เรียก saversureV2 ตรง** — route ฝั่ง server ของเราเป็น proxy (กัน CORS + เก็บ API key ฝั่ง server)
- saversureV2 เป็นคน expose endpoint ที่ **คืน response ตาม shape ใน `src/lib/api/types.ts`** (contract มีอยู่แล้ว)

---

## 🔒 ข้อจำกัดเหล็ก (ห้ามละเมิด)
1. คง `DATA_SOURCE=mock` เป็น default — ไม่เรียก API จริงจนกว่าจะตั้ง env เอง
2. **ห้ามเข้า DB saversure โดยตรง** — คุยผ่าน API ของ saversureV2 เท่านั้น
3. **ห้ามแตะ saversure**: ห้าม bind/kill/แก้ port 3000/3001/4000/30400, ห้ามแก้โฟลเดอร์/โค้ด saversureV1/V2
   - dashboard เป็นแค่ **client เรียก GET** ไป API ของ saversureV2 (ไม่ใช่การ "แตะ" port ในเชิงรัน/ฆ่า process)
4. ห้ามทำของเดิมพัง: mock source + polling/Live ต้องทำงานเหมือนเดิม
5. จัดการเฉพาะ port 3100 (julaherb)
6. ต้อง verify (tsc + หน้าเว็บ) ก่อนบอกเสร็จ และขอ confirm หลังวางแผน

---

## ✅ Task breakdown (เรียงลำดับ)

| # | Task | ไฟล์ | หมายเหตุ |
|---|------|------|----------|
| 1 | สร้าง typed fetch helper | `src/lib/api/api-source.ts` | base URL จาก env (server-only), timeout ด้วย AbortController (เช่น 5 วิ), แปลง error เป็นข้อความ |
| 2 | implement 15 method ของ `DataSource` | `api-source.ts` | แต่ละ method = `apiGet<T>(path, params)` คืน shape ตาม `types.ts` (proxy บางๆ) |
| 3 | wire adapter เพิ่ม branch `api` | `src/lib/api/adapter.ts` | `SOURCE === 'api' ? (apiSrc as DataSource) : mock` — **default ยัง `mock`** |
| 4 | env scaffolding | `.env.example` | เพิ่ม `DATA_SOURCE=mock` + `SAVERSURE_API_BASE_URL=` (server-only, ไม่ใช่ NEXT_PUBLIC) + คอมเมนต์เตือนเรื่อง port |
| 5 | คง mock ทำงาน | — | ไม่แตะ `mock-source.ts` |

### 15 method ที่ต้อง implement (จาก `DataSource` interface)
`getDailyRows`, `getDailyByDate`, `getScansTotals`, `getScansTimeseries`, `getTimeOfDay`,
`getMembersDaily`, `getHeavyUsers`, `getEngagement`, `getProvinces`, `getRetention`,
`getSkuList`, `getSkuPerDay`, `getSkuTimeseries`, `getBaselineCompare`, `getUptime`

---

## 🔬 Verify (ก่อนบอกเสร็จ)
- `npx tsc --noEmit` → `api-source.ts` ไม่มี type error
- `adapter.ts` default ยัง `mock` (git diff ดูว่าไม่เผลอเปลี่ยน)
- reload หน้าเว็บ → KPI/Live ยังปกติ (เพราะยัง mock)
- saversure ports 3000/3001/4000/30400 ยัง LISTENING ครบ

---

## ❓ จุดต้องยืนยันกับเจ้าของ (ก่อน/ระหว่างทำ)
1. **Base URL จริงของ API saversureV2** — `.env.example` ตอนนี้ชี้ `http://localhost:3001/api` (3001 = port saversure) ใช่ตัวนี้ไหม หรือมี URL อื่น?
2. **Auth** — API ของ saversureV2 ต้องใช้ API key / token ไหม (จะได้ใส่ header ฝั่ง server)
3. **Path mapping** — saversureV2 จะใช้ path เดียวกับ route เรา (เช่น `/scans/totals`) หรือชื่ออื่น?

> ทั้ง 3 ข้อนี้ไม่บล็อกการเขียนโครง — เขียน api-source แบบ proxy ทั่วไปไว้ก่อนได้ แล้วเสียบ URL/auth ทีหลัง

---

## 📌 หมายเหตุ: `db-source.ts`
ไฟล์ `db-source.ts` (pg/direct DB ที่ทำไว้ก่อนหน้า) **ไม่ตรงกับสถาปัตยกรรมนี้** (เพราะห้ามเข้า DB ตรง)
→ ปล่อยไว้เป็นทางเลือกสำรอง (ยังไม่ถูก import) หรือจะลบทีหลังก็ได้ — งานนี้โฟกัสที่ `api-source.ts`
