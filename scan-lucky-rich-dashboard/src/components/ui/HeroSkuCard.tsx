'use client'
import { numFmt } from '@/lib/utils'
import { HERO_SKU, HERO_SHARE_PCT, REAL_CAMPAIGN, TOP3_SHARE, TOP10_SHARE } from '@/lib/real-data'

export default function HeroSkuCard() {
  const dailyVelocity = Math.round(HERO_SKU.rights / 2) // 2 วันแรก
  const concentrationRisk = HERO_SHARE_PCT > 30 ? 'HIGH' : HERO_SHARE_PCT > 20 ? 'MEDIUM' : 'LOW'
  const riskColor = concentrationRisk === 'HIGH' ? '#e74c3c' : concentrationRisk === 'MEDIUM' ? '#EF9F27' : '#1D9E75'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Hero SKU spotlight */}
      <div className="rounded-xl overflow-hidden shadow-sm border border-[var(--light)]"
           style={{ background: 'linear-gradient(135deg, #085041 0%, #1D9E75 100%)' }}>
        <div className="px-5 py-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <i className="ti ti-flame text-[var(--gold)] text-lg" />
            <h3 className="text-[12px] font-bold uppercase tracking-wider opacity-90">Hero SKU</h3>
            <span className="text-[10px] bg-[var(--gold)] text-[var(--dark)] px-2 py-0.5 rounded-full font-bold">#1</span>
          </div>
          <div className="text-[14px] font-semibold leading-tight">{HERO_SKU.name} <span className="opacity-70 text-[11px]">({HERO_SKU.sku})</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] opacity-70">สิทธิ์</div>
              <div className="text-xl font-bold text-[var(--gold)]">{numFmt(HERO_SKU.rights)}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Users</div>
              <div className="text-xl font-bold">{numFmt(HERO_SKU.users)}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">สิทธิ์/คน</div>
              <div className="text-xl font-bold">{HERO_SKU.rightsPerUser.toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-3 bg-black/20 rounded-lg px-3 py-2 text-[11px]">
            <div className="flex justify-between mb-1">
              <span>ส่วนแบ่ง:</span>
              <span className="font-bold text-[var(--gold)]">{HERO_SHARE_PCT.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded overflow-hidden">
              <div className="h-full bg-[var(--gold)]" style={{ width: `${HERO_SHARE_PCT}%` }} />
            </div>
            <div className="mt-2 flex justify-between opacity-80">
              <span>Velocity: <b>{numFmt(dailyVelocity)} สิทธิ์/วัน</b></span>
              <span>ซอง 8G</span>
            </div>
          </div>
        </div>
      </div>

      {/* Concentration Risk */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="ti ti-alert-triangle text-lg" style={{ color: riskColor }} />
          <h3 className="text-[13px] font-bold text-[var(--dark)]">SKU Concentration Risk</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                style={{ background: riskColor }}>
            {concentrationRisk}
          </span>
        </div>

        <div className="space-y-2.5">
          <RiskRow label="Top 1 SKU"   pct={HERO_SHARE_PCT} threshold={30} />
          <RiskRow label="Top 3 SKUs"  pct={TOP3_SHARE}      threshold={50} />
          <RiskRow label="Top 10 SKUs" pct={TOP10_SHARE}     threshold={70} />
          <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-amber-50 rounded p-2">
              <div className="text-gray-500">SKU มียอด</div>
              <div className="text-base font-bold text-[var(--dark)]">{REAL_CAMPAIGN.activeSkus} <span className="text-[10px] text-gray-400">/ {REAL_CAMPAIGN.totalSkus}</span></div>
            </div>
            <div className="bg-red-50 rounded p-2">
              <div className="text-gray-500">SKU ยังไม่ถูกสแกน</div>
              <div className="text-base font-bold text-[var(--danger)]">{REAL_CAMPAIGN.deadSkus}</div>
            </div>
          </div>
        </div>

        <div className="mt-3 text-[10.5px] text-gray-500 italic border-l-2 border-[var(--gold)] pl-2">
          ⚠️ หาก Hero SKU หยุดสแกน จะกระทบ {HERO_SHARE_PCT.toFixed(0)}% ของแคมเปญทันที — แนะนำตรวจ stock + POSM
        </div>
      </div>
    </div>
  )
}

function RiskRow({ label, pct, threshold }: { label: string; pct: number; threshold: number }) {
  const over = pct > threshold
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-600">{label}</span>
        <span className={`font-bold ${over ? 'text-[var(--danger)]' : 'text-[var(--dark)]'}`}>
          {pct.toFixed(1)}% <span className="text-gray-400 text-[10px] font-normal">/ {threshold}%</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded overflow-hidden relative">
        <div className={`h-full ${over ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-gray-400" style={{ left: `${threshold}%` }} />
      </div>
    </div>
  )
}
