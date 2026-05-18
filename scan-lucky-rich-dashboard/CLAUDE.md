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
- `src/config/` — Static campaign config, 89 product SKUs, prize tiers
- `src/lib/` — Utilities, mock data generators
- `src/components/ui/` — Reusable components (KpiCard, ChartCard, InsightInline, etc.)
- `src/components/tabs/` — 6 tab views (Overview, Customers, Products, Channels, Operations, Risk)
- `src/components/layout/` — Sidebar navigation

## API Integration
All data is currently mocked in `src/lib/mock-data.ts`.
TODO comments mark where to replace with API calls.
API base URL configured via `NEXT_PUBLIC_API_BASE_URL` env var.

Key endpoints to implement:
- GET /api/campaigns/{id} — Campaign details
- GET /api/scans — Scan data with date filters
- GET /api/users — Customer data
- GET /api/winners — Winner management
- GET /api/products — Product catalog
- GET /api/stats/provinces — Province aggregation
- POST /api/winners — Add winner

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
