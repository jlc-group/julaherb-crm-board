# 📂 Scripts

## `ingest-products.js`
**One-shot:** อ่าน Excel master 97 SKU → generate `src/config/products-real.ts`
```bash
node scripts/ingest-products.js
```

## `ingest-daily.js`
**Daily:** อ่าน JSON ที่ทีม DB ส่งมา → update snapshot ใน `src/lib/`
```bash
node scripts/ingest-daily.js path/to/scan_data_2026-05-18.json
```

### Output
- `src/lib/snapshot-latest.json` — overall KPI + Top SKUs (latest)
- `src/lib/day-YYYY-MM-DD.json` — per-SKU breakdown for that day
- `src/lib/scan-behavior-YYYY-MM-DD.json` — behavioral metrics
- `src/lib/daily-index.json` — list of available dates

### Input JSON spec (22 sections from DB team)
ดูในไฟล์ `ingest-daily.js` ส่วน header comment

### Workflow รายวัน
1. DB team export → `scan_data_YYYY-MM-DD.json`
2. Drop file ลงโฟลเดอร์ `data/`
3. Run `node scripts/ingest-daily.js data/scan_data_2026-05-18.json`
4. Frontend auto-pick up new snapshot (dev server hot reload)
