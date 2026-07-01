'use client'
// 🏓 RankedTable — ตารางจัดอันดับสไตล์ Kalodata: sort หลายคอลัมน์ + คอลัมน์ยืดหยุ่น (num/badge/รูป/growth/sparkline)
// generic · reuse ได้ทุก entity (สินค้า/หมวดหมู่/จังหวัด/เวลา/เซกเมนต์)
import { useMemo, useState, type ReactNode } from 'react'

export interface RankColumn<T> {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  sortValue?: (row: T) => number | string   // ค่าที่ใช้ sort (ต้องมีถ้า sortable)
  render: (row: T, index: number) => ReactNode
  width?: string
}

interface Props<T> {
  columns: RankColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  initialSortKey?: string
  initialDir?: 'asc' | 'desc'
  topN?: number
}

export default function RankedTable<T>({ columns, rows, rowKey, initialSortKey, initialDir = 'desc', topN = 20 }: Props<T>) {
  const firstSortable = columns.find((c) => c.sortable)?.key ?? ''
  const [sortKey, setSortKey] = useState(initialSortKey ?? firstSortable)
  const [dir, setDir] = useState<'asc' | 'desc'>(initialDir)
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return rows
    const arr = [...rows]
    arr.sort((a, b) => {
      const va = col.sortValue!(a)
      const vb = col.sortValue!(b)
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'th')
      return dir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [rows, columns, sortKey, dir])

  const shown = showAll ? sorted : sorted.slice(0, topN)

  function toggleSort(key: string) {
    const col = columns.find((c) => c.key === key)
    if (!col?.sortable) return
    if (sortKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setDir('desc') }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11.5px] border-collapse">
        <thead>
          <tr className="text-[var(--text-muted)] text-[9.5px] uppercase tracking-wider border-b border-[var(--border)]">
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align ?? 'left' }}
                  className={`py-2 px-2 font-bold whitespace-nowrap ${c.sortable ? 'cursor-pointer select-none hover:text-[var(--brand-700)]' : ''}`}
                  onClick={() => toggleSort(c.key)}>
                <span className="inline-flex items-center gap-0.5">
                  {c.label}
                  {c.sortable && (sortKey === c.key
                    ? <i className={`ti ti-chevron-${dir === 'asc' ? 'up' : 'down'} text-[10px]`} />
                    : <i className="ti ti-selector text-[10px] opacity-30" />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((row, i) => (
            <tr key={rowKey(row)} className="border-b border-[var(--border-soft)] hover:bg-[var(--bg-soft)] transition-colors">
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align ?? 'left' }} className="py-1.5 px-2 align-middle">
                  {c.render(row, i)}
                </td>
              ))}
            </tr>
          ))}
          {shown.length === 0 && (
            <tr><td colSpan={columns.length} className="py-8 text-center text-[var(--text-muted)]">ไม่มีข้อมูล</td></tr>
          )}
        </tbody>
      </table>
      {sorted.length > topN && (
        <button onClick={() => setShowAll((v) => !v)}
                className="w-full mt-2 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-[11.5px] font-semibold hover:bg-[var(--bg-soft)]">
          {showAll ? 'ย่อรายการ' : `ดูทั้งหมด ${sorted.length} รายการ`}
        </button>
      )}
    </div>
  )
}
