# สแกนลุ้นรวย สวยลุ้นล้าน — Dashboard

## Project Context
Campaign monitoring dashboard for "Jula's Herb x ไทยรัฐ TV" QR scanning lucky draw campaign.
Campaign period: 16 May - 18 Dec 2569 (Buddhist Era).

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Chart.js 4.4 + react-chartjs-2
- Noto Sans Thai font + Tabler Icons

## Project Structure
- `src/types/` — TypeScript interfaces (Campaign, Product, Customer, ScanEntry, Winner, etc.)
- `src/config/` — Static campaign config, product metadata, prize tiers
- `src/lib/api/` — Data-source adapter: internal `/api/*` routes → mock/api/db source
- `src/lib/` — Utilities, source snapshots/fallbacks, PDF/PPTX helpers
- `src/components/ui/` — Reusable components (KpiCard, ChartCard, InsightInline, etc.)
- `src/components/tabs/` — Current console tabs (CRM Center, Scan Overview, Customers, Products, Explorer, Operations, Claim, Print List, Risk Watch, Report)
- `src/components/layout/` — Sidebar navigation

## API Integration
Current status is mixed — do **not** assume every chart is live backend data.
The canonical audit is [`docs/api-gap-audit.md`](docs/api-gap-audit.md).

Data-source tiers used in docs/UI:
- 🟢 Backend real — internal route maps to saversureV2 via `DATA_SOURCE=api`
- 🟡 Internal real/local — working dashboard route backed by local JSON/files, not saversureV2 source of truth
- 🟠 Static snapshot — hardcoded/snapshot data in repo
- 🔴 Mock/demo — placeholder/demo only
- 🔒 Waiting backend — UI prepared but endpoint not available yet

Important current gaps:
- `engagement`, `rfm`, `segments` are real but still **system-wide saversure**, not campaign-scoped
- Explorer Zone D waits for `/dashboard/explore` + customer drill-down APIs
- Customers age/gender waits for age bucket + gender exposure
- Risk Watch waits for `/customers/risk`
- Products First Scan / Master Table and Report Top SKU still use static snapshots in some areas
- Draw/claim/winners flows work through dashboard routes but persist to local JSON/files until moved to backend/storage

## Database Schema (V2)
Tables: users, addresses, scan_history, partner_shops, user_flag_histories, customer_rfm_snapshots, analytics_scan_rollups

## Design System
Colors: --dark=#085041, --mid=#0F6E56, --primary=#1D9E75, --light=#E1F5EE, --gold=#EF9F27, --danger=#e74c3c
Sidebar: 220px fixed, dark green background
Font: Noto Sans Thai
Icons: Tabler Icons (@tabler/icons-webfont)

## Campaign Details
- 97 SKUs across 3 tiers: ซอง (sachet), หลอด (tube), เซ็ต (set)
- 198 total prizes: 167 daily ทองคำ 10K, 30 monthly ทองคำ 100K, 1 final ทองคำ 1M
- Total prize value: 5,670,000 baht
- Daily announcement at 15:00 via ไทยรัฐออนไลน์ and LINE OA

## Development
```bash
npm install
npm run dev
```

## Notes for Dev Team
- Phone numbers must be masked: xxx-xxx-XXXX (show last 4 digits only)
- Winner statuses: confirmed, pending, forfeited, unannounced
- Scan log supports A4 landscape export (5x4 grid per page) for lottery draw slips
- Insights are inline analysis blocks placed under each chart section
