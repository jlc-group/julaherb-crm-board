'use client'
import { numFmt } from '@/lib/utils'
import { HERO_SKU, HERO_SHARE_PCT, REAL_CAMPAIGN, TOP3_SHARE, TOP10_SHARE } from '@/lib/real-data'
import type { SkuRow } from '@/lib/sku-redemption'

interface Props {
  /** Optional pre-computed rows for date range. Falls back to all-time HERO_SKU constants */
  rows?: SkuRow[]
  rangeLabel?: string
  dayCount?: number
}

export default function HeroSkuCard({ rows, rangeLabel, dayCount }: Props = {}) {
  // Derive from rows if provided, else use all-time constants
  let heroSku = HERO_SKU
  let heroShare = HERO_SHARE_PCT
  let top3Share = TOP3_SHARE
  let top10Share = TOP10_SHARE
  let activeSkus: number = REAL_CAMPAIGN.activeSkus
  let deadSkus: number = REAL_CAMPAIGN.deadSkus
  let totalSkus: number = REAL_CAMPAIGN.totalSkus

  if (rows && rows.length > 0) {
    const sorted = [...rows].filter(r => r.rightsRedeemed > 0).sort((a, b) => b.rightsRedeemed - a.rightsRedeemed)
    if (sorted.length > 0) {
      const top = sorted[0]
      const total = rows.reduce((s, r) => s + r.rightsRedeemed, 0) || 1
      heroSku = {
        sku: top.sku,
        name: top.displayName.replace(/\s*\([^)]+\)$/, ''),
        tier: top.rightsPerScan === 1 ? 'ซอง' : 'หลอด',
        size: '',
        productGroup: '',
        rights: top.rightsRedeemed,
        users: top.users,
        rightsPerUser: top.rightsPerUser,
      }
      heroShare  = (top.rightsRedeemed / total) * 100
      top3Share  = (sorted.slice(0, 3).reduce((s, r) => s + r.rightsRedeemed, 0) / total) * 100
      top10Share = (sorted.slice(0, 10).reduce((s, r) => s + r.rightsRedeemed, 0) / total) * 100
      activeSkus = sorted.length
      deadSkus   = rows.length - sorted.length
      totalSkus  = rows.length
    }
  }

  const days = dayCount && dayCount > 0 ? dayCount : 2
  const dailyVelocity = Math.round(heroSku.rights / days)
  const concentrationRisk = heroShare > 30 ? 'HIGH' : heroShare > 20 ? 'MEDIUM' : 'LOW'
  const riskClass = concentrationRisk === 'HIGH' ? 'chip-red' : concentrationRisk === 'MEDIUM' ? 'chip-yellow' : ''
  const riskColor = concentrationRisk === 'HIGH' ? 'var(--red)' : concentrationRisk === 'MEDIUM' ? '#ca8a04' : 'var(--primary)'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Hero SKU spotlight — green gradient */}
      <div className="card card-hero p-5 relative overflow-hidden">
        {/* Decorative icon background */}
        <i className="ti ti-flame absolute -right-6 -bottom-6 text-[180px] text-white/10 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="chip chip-yellow" title="Boss SKU = SKU ที่มียอดสแกนมากที่สุดในแคมเปญ — ตัวที่ลูกค้าซื้อเยอะที่สุด"><i className="ti ti-crown" /> Boss SKU</span>
            <span className="rank rank-1">1</span>
            <span className="ml-auto live-dot" title="Live" />
          </div>

          <div className="text-[17px] font-extrabold leading-tight">{heroSku.name}</div>
          <div className="text-[11px] text-white/75 mb-3">
            <i className="ti ti-tag" /> {heroSku.sku}{heroSku.tier ? ` • ${heroSku.tier}` : ''}{heroSku.size ? ` ${heroSku.size}` : ''}
            {rangeLabel && <span className="ml-2 opacity-70">• {rangeLabel}</span>}
          </div>

          {/* 3 metrics: สิทธิ์ / สแกน / Users  (drop confusing ratio) */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <HeroStat
              label="สิทธิ์"
              value={numFmt(heroSku.rights)}
              tip={`จำนวนสิทธิ์ที่ลูกค้าได้รับจาก SKU นี้ (รวม)`}
            />
            <HeroStat
              label="สแกน"
              value={numFmt(heroSku.rights)}
              tip={`จำนวน QR ที่ถูกสแกน (SKU นี้ให้ 1 สิทธิ์/scan)`}
            />
            <HeroStat
              label="Users"
              value={numFmt(heroSku.users)}
              tip={`ผู้ใช้ที่สแกน SKU นี้ (sum across days — อาจมี overlap)`}
            />
          </div>

          <div className="bg-white/15 rounded-lg px-3 py-2.5 backdrop-blur-sm">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="font-semibold uppercase tracking-wide text-white/85">ส่วนแบ่ง Campaign</span>
              <span className="font-extrabold num text-[14px]">{heroShare.toFixed(1)}%</span>
            </div>
            <div className="progress" style={{ background: 'rgba(255,255,255,0.20)', border: 'none' }}>
              <div className="progress-fill" style={{ width: `${heroShare}%`, background: 'linear-gradient(90deg, #fde047, #facc15)' }} />
            </div>
            <div className="mt-2 flex justify-between text-[10.5px] text-white/80">
              <span><i className="ti ti-bolt" /> {numFmt(dailyVelocity)} สิทธิ์/วัน</span>
              <span><i className="ti ti-target" /> Velocity HIGH</span>
            </div>
          </div>
        </div>
      </div>

      {/* Concentration Risk — light card */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="ti ti-shield-exclamation text-lg" style={{ color: riskColor }} />
          <h3 className="text-[13px] font-bold text-[var(--dark)]">SKU Concentration Risk</h3>
          <span className={`chip ${riskClass} ml-auto`}>⚠ {concentrationRisk}</span>
        </div>

        <div className="space-y-3">
          <RiskRow label="Top 1 SKU"   pct={heroShare}  threshold={30} />
          <RiskRow label="Top 3 SKUs"  pct={top3Share}  threshold={50} />
          <RiskRow label="Top 10 SKUs" pct={top10Share} threshold={70} />
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-soft)] grid grid-cols-2 gap-2">
          <MiniStat icon="ti-checks" label="SKU มียอด" value={`${activeSkus}/${totalSkus}`} variant="green" />
          <MiniStat icon="ti-skull"  label="Dead SKU"  value={String(deadSkus)} variant="red" />
        </div>

        <div className="mt-3 text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
          <i className="ti ti-info-circle mt-0.5 text-[var(--primary)]" />
          <span>หาก Boss SKU หยุดสแกน จะกระทบ <b className="text-[var(--dark)]">{heroShare.toFixed(0)}%</b> ของแคมเปญ — ตรวจ stock + POSM ด่วน</span>
        </div>
      </div>
    </div>
  )
}

function HeroStat({ label, value, tip }: { label: string; value: string; tip?: string }) {
  return (
    <div className={`bg-white/15 rounded-lg p-2 backdrop-blur-sm ${tip ? 'cursor-help' : ''}`} title={tip}>
      <div className="text-[10px] text-white/75 uppercase tracking-wide">{label}</div>
      <div className="text-[18px] num leading-tight">{value}</div>
    </div>
  )
}

function MiniStat({ icon, label, value, variant }: { icon: string; label: string; value: string; variant: 'green' | 'red' }) {
  const styles = variant === 'green'
    ? { bg: 'var(--green-50)', border: 'var(--green-200)', color: 'var(--green-700)' }
    : { bg: 'var(--red-soft)', border: '#fecaca',          color: 'var(--red)' }
  return (
    <div className="rounded-lg p-2 border" style={{ background: styles.bg, borderColor: styles.border }}>
      <div className="text-[10px] uppercase flex items-center gap-1" style={{ color: styles.color }}>
        <i className={`ti ${icon}`} /> {label}
      </div>
      <div className="text-[17px] num font-extrabold" style={{ color: styles.color }}>{value}</div>
    </div>
  )
}

function RiskRow({ label, pct, threshold }: { label: string; pct: number; threshold: number }) {
  const over = pct > threshold
  return (
    <div>
      <div className="flex justify-between text-[11.5px] mb-1.5">
        <span className="text-[var(--text-secondary)] font-medium">{label}</span>
        <span className={`font-extrabold num ${over ? 'text-[var(--red)]' : 'text-[var(--dark)]'}`}>
          {pct.toFixed(1)}%
          <span className="text-[var(--text-muted)] text-[10px] font-normal ml-1">/ {threshold}%</span>
        </span>
      </div>
      <div className="progress relative">
        <div className={`progress-fill ${over ? 'is-red' : ''}`} style={{ width: `${Math.min(100, pct)}%` }} />
        <div className="absolute top-0 h-full w-px bg-[var(--text-muted)]" style={{ left: `${threshold}%` }} />
      </div>
    </div>
  )
}
