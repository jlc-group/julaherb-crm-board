// ════════════════════════════════════════════════════════════════
// 📅 Period grouping — รวมข้อมูลรายวัน → รายเดือน (logic กลาง ใช้ได้ทุกหน้า)
// 'day'   = ใช้ rows เดิม (รายวัน)
// 'month' = รวมเป็นผลรวมต่อเดือน (พ.ค. = 1 แท่ง = ผลรวมทุกวันของ พ.ค.)
// ════════════════════════════════════════════════════════════════

export type Period = 'day' | 'month'

const TH_MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** label เดือนไทย เช่น "พ.ค. 69" จากวันที่ YYYY-MM-DD */
export function monthLabel(date: string): string {
  const m = parseInt(date.slice(5, 7), 10)
  const yy = (parseInt(date.slice(0, 4), 10) + 543) % 100
  return `${TH_MO[m - 1]} ${yy}`
}

/**
 * รวม rows ตามช่วงเวลา
 * - period='day'   → คืน rows เดิม
 * - period='month' → รวม sumKeys ของทุกวันในเดือนเดียวกัน, date = วันแรกของเดือน (YYYY-MM-01)
 *
 * generic — ใช้กับ shape ไหนก็ได้ที่มี `date: string` + บอกว่า field ไหนเอามาบวก
 */
export function groupByPeriod<T extends { date: string }>(rows: T[], period: Period, sumKeys: (keyof T)[]): T[] {
  if (period === 'day' || rows.length === 0) return rows
  const map = new Map<string, T>()
  const order: string[] = []
  for (const r of rows) {
    const ym = r.date.slice(0, 7) // YYYY-MM
    const acc = map.get(ym)
    if (!acc) {
      // ก๊อปแถวแรกของเดือน (sumKeys มีค่าเริ่มจากแถวนี้แล้ว) + ตั้ง date = วันแรกของเดือน
      map.set(ym, { ...r, date: `${ym}-01` })
      order.push(ym)
    } else {
      for (const k of sumKeys) {
        ;(acc as Record<string, unknown>)[k as string] =
          (Number((acc as Record<string, unknown>)[k as string]) || 0) +
          (Number((r as Record<string, unknown>)[k as string]) || 0)
      }
    }
  }
  return order.map((ym) => map.get(ym)!).sort((a, b) => a.date.localeCompare(b.date))
}
