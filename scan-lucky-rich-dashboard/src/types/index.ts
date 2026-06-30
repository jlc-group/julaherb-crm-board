// ============================
// Data Models — สแกนลุ้นรวย สวยลุ้นล้าน
// ============================

export interface Campaign {
  id: string
  name: string
  status: 'active' | 'upcoming' | 'ended'
  partner: string
  periodStart: string // ISO date
  periodEnd: string
  announceChannel: string
  announceTime: string
  totalPrizeValue: number
  totalPrizeCount: number
}

export interface Product {
  id: number
  name: string
  sku: string
  price: number
  rightsPerScan: number
  tier: 'ซอง' | 'หลอด' | 'เซ็ต'
  scans: number // aggregated
}

export interface PrizeTier {
  id: string
  tierLabel: string
  value: number // 10000, 100000, 1000000
  frequency: 'daily' | 'monthly' | 'last_day'
  totalCount: number
  used: number
  monthlyAllocation: Record<string, number>
}

export interface Customer {
  id: number
  name: string
  phone: string
  province: string
  isNewCustomer: boolean
  scans: number
  rights: number
  lastScan: string // ISO date
  products: ProductScanSummary[]
  scanCodes: string[]
  riskScore: number
}

export interface ProductScanSummary {
  sku: string
  name: string
  qty: number
}

export interface ScanEntry {
  id: string
  customerId: number
  customerName: string
  phone: string // masked: xxx-xxx-XXXX
  productName: string
  productSku: string
  scanCode: string // 8-char alphanumeric
  rightsEarned: number
  scannedAt: string // ISO datetime
  province: string
  channel?: string
}

export interface Winner {
  id: number
  userId: number
  name: string
  phone: string
  province: string
  tier: '10K' | '100K' | '1M'
  prizeLabel: string
  status: 'confirmed' | 'pending' | 'forfeited' | 'unannounced'
  date: string // ISO date
  products: ProductScanSummary[]
}

export interface Channel {
  name: string
  scans: number
  pct: number
}

// KPI card display
export interface KpiData {
  label: string
  value: string | number
  sub?: string
  badge?: string
  gold?: boolean
}

// RFM Segment
export type RFMSegment = 'Heavy' | 'Medium' | 'Light'

// Insight severity
export type InsightSeverity = 'info' | 'warn' | 'danger'

// Tab IDs
export type TabId = 'crm-center' | 'overview' | 'scan-behavior' | 'customers' | 'products' | 'explorer' | 'channels' | 'operations' | 'risk' | 'print-list' | 'claims' | 'report'
