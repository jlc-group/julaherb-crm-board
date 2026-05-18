'use client'
import { numFmt } from '@/lib/utils'
import { HERO_SKU, HERO_SHARE_PCT, REAL_CAMPAIGN, TOP3_SHARE, TOP10_SHARE } from '@/lib/real-data'

export default function HeroSkuCard() {
  const dailyVelocity = Math.round(HERO_SKU.rights / 2)
  const concentrationRisk = HERO_SHARE_PCT > 30 ? 'HIGH' : HERO_SHARE_PCT > 20 ? 'MEDIUM' : 'LOW'
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
            <span className="chip chip-yellow"><i className="ti ti-crown" /> Boss SKU</span>
            <span className="rank rank-1">1</span>
            <span className="ml-auto live-dot" title="Live" />
          </div>

          <div className="text-[17px] font-extrabold leading-tight">{HERO_SKU.name}</div>
          <div className="text-[11px] text-white/75 mb-3">
            <i className="ti ti-tag" /> {HERO_SKU.sku} • {HERO_SKU.tier} {HERO_SKU.size}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <HeroStat label="สิทธิ์"     value={numFmt(HERO_SKU.rights)} />
            <HeroStat label="Users"      value={numFmt(HERO_SKU.users)} />
            <HeroStat label="สิทธิ์/คน"  value={HERO_SKU.rightsPerUser.toFixed(2)} />
          </div>

          <div className="bg-white/15 rounded-lg px-3 py-2.5 backdrop-blur-sm">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="font-semibold uppercase tracking-wide text-white/85">ส่วนแบ่ง Campaign</span>
              <span className="font-extrabold num text-[14px]">{HERO_SHARE_PCT.toFixed(1)}%</span>
            </div>
            <div className="progress" style={{ background: 'rgba(255,255,255,0.20)', border: 'none' }}>
              <div className="progress-fill" style={{ width: `${HERO_SHARE_PCT}%`, background: 'linear-gradient(90deg, #fde047, #facc15)' }} />
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
          <RiskRow label="Top 1 SKU"   pct={HERO_SHARE_PCT} threshold={30} />
          <RiskRow label="Top 3 SKUs"  pct={TOP3_SHARE}     threshold={50} />
          <RiskRow label="Top 10 SKUs" pct={TOP10_SHARE}    threshold={70} />
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border-soft)] grid grid-cols-2 gap-2">
          <MiniStat icon="ti-checks" label="SKU มียอด" value={`${REAL_CAMPAIGN.activeSkus}/${REAL_CAMPAIGN.totalSkus}`} variant="green" />
          <MiniStat icon="ti-skull"  label="Dead SKU"  value={String(REAL_CAMPAIGN.deadSkus)} variant="red" />
        </div>

        <div className="mt-3 text-[11px] text-[var(--text-secondary)] flex items-start gap-1.5">
          <i className="ti ti-info-circle mt-0.5 text-[var(--primary)]" />
          <span>หาก Boss SKU หยุดสแกน จะกระทบ <b className="text-[var(--dark)]">{HERO_SHARE_PCT.toFixed(0)}%</b> ของแคมเปญ — ตรวจ stock + POSM ด่วน</span>
        </div>
      </div>
    </div>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 rounded-lg p-2 backdrop-blur-sm">
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
