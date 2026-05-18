'use client'
import { numFmt } from '@/lib/utils'

interface TopProduct {
  name: string
  sku: string
  scans: number
  rights: number
}

interface Props {
  /** Display date label e.g. "18 พ.ค. 2569" */
  dateLabel: string
  scansToday: number
  scansYesterday: number
  rightsToday: number
  uniqueUsers: number
  newUsers: number
  topProducts: TopProduct[] // top 3
  totalSku: number
}

export default function DailyBrief({
  dateLabel,
  scansToday,
  scansYesterday,
  rightsToday,
  uniqueUsers,
  newUsers,
  topProducts,
  totalSku,
}: Props) {
  const delta = scansYesterday > 0 ? ((scansToday - scansYesterday) / scansYesterday) * 100 : 0
  const deltaPos = delta >= 0
  const avgRights = uniqueUsers > 0 ? (rightsToday / uniqueUsers).toFixed(1) : '0'
  const newRatio = uniqueUsers > 0 ? Math.round((newUsers / uniqueUsers) * 100) : 0
  const skusWithScans = topProducts.length

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-[var(--light)]"
         style={{ background: 'linear-gradient(135deg, #085041 0%, #0F6E56 60%, #1D9E75 100%)' }}>
      <div className="px-5 py-4 text-white">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ti ti-sparkles text-[var(--gold)] text-xl" />
            <h2 className="text-[15px] font-bold">บรีฟวันนี้</h2>
            <span className="text-[11px] opacity-70">— {dateLabel}</span>
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            deltaPos ? 'bg-[var(--gold)] text-[var(--dark)]' : 'bg-red-100 text-red-700'
          }`}>
            {deltaPos ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs เมื่อวาน
          </span>
        </div>

        {/* Big numbers row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div>
            <div className="text-[10px] opacity-70 uppercase tracking-wide">สแกนวันนี้</div>
            <div className="text-2xl font-bold leading-tight">{numFmt(scansToday)}</div>
            <div className="text-[10px] opacity-70">ครั้ง</div>
          </div>
          <div>
            <div className="text-[10px] opacity-70 uppercase tracking-wide">สิทธิ์ที่แจกแล้ว</div>
            <div className="text-2xl font-bold leading-tight text-[var(--gold)]">{numFmt(rightsToday)}</div>
            <div className="text-[10px] opacity-70">สิทธิ์ • เฉลี่ย {avgRights}/คน</div>
          </div>
          <div>
            <div className="text-[10px] opacity-70 uppercase tracking-wide">ผู้สแกน</div>
            <div className="text-2xl font-bold leading-tight">{numFmt(uniqueUsers)}</div>
            <div className="text-[10px] opacity-70">คน • ใหม่ {newRatio}%</div>
          </div>
          <div>
            <div className="text-[10px] opacity-70 uppercase tracking-wide">SKU มียอด</div>
            <div className="text-2xl font-bold leading-tight">{skusWithScans}<span className="text-sm opacity-70"> / {totalSku}</span></div>
            <div className="text-[10px] opacity-70">รายการ</div>
          </div>
        </div>

        {/* Narrative summary */}
        <div className="text-[12px] leading-relaxed bg-black/15 rounded-lg px-3 py-2 mb-3">
          วันนี้มีการสแกนทั้งหมด <b className="text-[var(--gold)]">{numFmt(scansToday)} ครั้ง</b>
          {' '}จาก <b>{numFmt(uniqueUsers)} คน</b> — แจกสิทธิ์ลุ้นรางวัลไปแล้ว{' '}
          <b className="text-[var(--gold)]">{numFmt(rightsToday)} สิทธิ์</b> (เฉลี่ย {avgRights} สิทธิ์/คน){' '}
          {deltaPos
            ? <>โมเมนตัมดี <b>+{delta.toFixed(1)}%</b> เทียบเมื่อวาน 🚀</>
            : <>ชะลอตัว <b>{delta.toFixed(1)}%</b> เทียบเมื่อวาน — ควรเร่ง content/ads</>
          }
        </div>

        {/* Top 3 Products */}
        {topProducts.length > 0 && (
          <div>
            <div className="text-[10px] opacity-70 uppercase tracking-wide mb-1.5">
              <i className="ti ti-trophy text-[var(--gold)]" /> สินค้าได้สิทธิ์สูงสุดวันนี้
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {topProducts.slice(0, 3).map((p, i) => (
                <div key={p.sku} className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className={`text-lg font-bold w-6 text-center ${
                    i === 0 ? 'text-[var(--gold)]' : i === 1 ? 'text-gray-200' : 'text-amber-300'
                  }`}>#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] opacity-70 flex justify-between">
                      <span>{numFmt(p.scans)} สแกน</span>
                      <span className="text-[var(--gold)] font-semibold">{numFmt(p.rights)} สิทธิ์</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
