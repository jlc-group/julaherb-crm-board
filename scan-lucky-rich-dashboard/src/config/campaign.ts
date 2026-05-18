import type { Campaign, PrizeTier, Channel } from '@/types'

export const CAMPAIGN: Campaign = {
  id: 'scan-lucky-rich-2569',
  name: 'สแกนลุ้นรวย สวยลุ้นล้าน',
  status: 'active',
  partner: "Jula's Herb x ไทยรัฐ",
  periodStart: '2569-05-16T07:00:00+07:00',
  periodEnd: '2569-12-18T23:59:00+07:00',
  announceChannel: 'ไทยรัฐออนไลน์ และ LINE OA',
  announceTime: '15:00',
  totalPrizeValue: 5_670_000,
  totalPrizeCount: 198,
}

export const PRIZES: PrizeTier[] = [
  {
    id: 'gold-10k',
    tierLabel: 'ทองคำ 10,000',
    value: 10_000,
    frequency: 'daily',
    totalCount: 167,
    used: 0, // TODO: fetch from API
    monthlyAllocation: { jul: 30, aug: 30, sep: 29, oct: 30, nov: 29, dec: 19 },
  },
  {
    id: 'gold-100k',
    tierLabel: 'ทองคำ 100,000',
    value: 100_000,
    frequency: 'monthly',
    totalCount: 30,
    used: 0,
    monthlyAllocation: { jul: 5, aug: 5, sep: 5, oct: 5, nov: 5, dec: 5 },
  },
  {
    id: 'gold-1m',
    tierLabel: 'ทองคำ 1,000,000',
    value: 1_000_000,
    frequency: 'last_day',
    totalCount: 1,
    used: 0,
    monthlyAllocation: { dec: 1 },
  },
]

export const CHANNELS: Channel[] = [
  { name: '7-Eleven', scans: 0, pct: 0 },
  { name: 'Watson', scans: 0, pct: 0 },
  { name: 'Shopee', scans: 0, pct: 0 },
  { name: 'Lazada', scans: 0, pct: 0 },
  { name: 'TikTok Shop', scans: 0, pct: 0 },
  { name: 'ตัวแทนจำหน่าย', scans: 0, pct: 0 },
]

// Design tokens
export const COLORS = {
  dark: '#085041',
  mid: '#0F6E56',
  primary: '#1D9E75',
  light: '#E1F5EE',
  gold: '#EF9F27',
  danger: '#e74c3c',
  border: '#e5e7eb',
  text: '#334155',
  textSecondary: '#64748b',
} as const
