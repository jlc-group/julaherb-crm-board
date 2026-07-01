'use client'
// 🗺️ Explorer entity: จังหวัด — ตารางจัดอันดับ sort ได้ + ดัชนีกระจุกตัวเชิงพื้นที่
// /api/customers/provinces (snapshot รายวัน) · ไม่มี sparkline (snapshot วันเดียว)
import { useMemo } from 'react'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'
import RankedTable, { type RankColumn } from '@/components/ui/RankedTable'
import ConcentrationStrip from '@/components/ui/ConcentrationStrip'
import type { ProvincesResponse, ProvinceRow } from '@/lib/api/types'

const FLAG: Record<string, { label: string; color: string }> = {
  fraud: { label: 'ผิดปกติ', color: '#dc2626' },
  watch: { label: 'จับตา', color: '#d97706' },
  normal: { label: '', color: '' },
}
const UNKNOWN = 'ไม่ระบุ'

export default function ProvinceRankTable({ date }: { date: string }) {
  const { data, loading } = useApi<ProvincesResponse>(`/api/customers/provinces?date=${date}&limit=50`)
  const rows = data?.provinces ?? []

  // ดัชนีกระจุกตัว — ตัด "ไม่ระบุ" ออก (ไม่ใช่พื้นที่จริง) + สัดส่วน "ไม่ระบุ"
  const { concValues, unknownPct } = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.scans, 0) || 1
    const unknown = rows.find((r) => r.name === UNKNOWN)?.scans ?? 0
    return { concValues: rows.filter((r) => r.name !== UNKNOWN).map((r) => r.scans), unknownPct: (unknown / total) * 100 }
  }, [rows])

  const columns: RankColumn<ProvinceRow>[] = [
    { key: 'rank', label: '#', width: '30px', align: 'center', render: (_r, i) => <span className="text-[10px] font-bold text-[var(--text-muted)]">{i + 1}</span> },
    { key: 'name', label: 'จังหวัด', sortable: true, sortValue: (r) => r.name, render: (r) => <span className={`font-semibold ${r.name === UNKNOWN ? 'text-[var(--text-muted)] italic' : 'text-[var(--dark)]'}`}>{r.name}</span> },
    { key: 'scans', label: 'สแกน', align: 'right', sortable: true, sortValue: (r) => r.scans, render: (r) => <span className="num font-bold text-[var(--dark)]">{numFmt(r.scans)}</span> },
    { key: 'users', label: 'ผู้ใช้', align: 'right', sortable: true, sortValue: (r) => r.users, render: (r) => <span className="num text-[var(--text-secondary)]">{numFmt(r.users)}</span> },
    { key: 'avg', label: 'เฉลี่ย/คน', align: 'right', sortable: true, sortValue: (r) => r.avgPerUser, render: (r) => <span className="num" style={{ color: r.avgPerUser > 5 ? '#d97706' : 'var(--text-secondary)' }}>{r.avgPerUser.toFixed(1)}</span> },
    { key: 'flag', label: '', width: '64px', align: 'center', render: (r) => {
        const f = r.flag && FLAG[r.flag]; if (!f || !f.label) return null
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: f.color + '18', color: f.color }}>{f.label}</span>
      } },
  ]

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-map-pin text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">🗺️ ตารางจัดอันดับจังหวัด</h3>
        <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">
        คลิกหัวคอลัมน์เพื่อ sort · snapshot {date}
        {unknownPct > 0 && <> · <span className="text-[#d97706] font-semibold">⚠️ ไม่ระบุจังหวัด {unknownPct.toFixed(0)}%</span> (ควรเก็บ profile เพิ่ม)</>}
      </div>

      {rows.length > 0 && <ConcentrationStrip values={concValues} />}
      {loading && !rows.length
        ? <div className="text-[12px] text-[var(--text-muted)] py-8 text-center">กำลังโหลด…</div>
        : <RankedTable columns={columns} rows={rows} rowKey={(r) => r.name} initialSortKey="scans" topN={15} />}
    </div>
  )
}
