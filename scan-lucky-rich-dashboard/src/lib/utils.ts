export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return 'xxx-xxx-xxxx'
  return 'xxx-xxx-' + phone.slice(-4)
}

export function numFmt(n: number): string {
  return n.toLocaleString('th-TH')
}

export function statusColor(s: string): string {
  return s === 'confirmed' ? '#1D9E75' : s === 'pending' ? '#EF9F27' : s === 'forfeited' ? '#e74c3c' : '#888'
}

export function statusLabel(s: string): string {
  return s === 'confirmed' ? 'ยืนยันแล้ว' : s === 'pending' ? 'รอยืนยัน' : s === 'forfeited' ? 'สละสิทธิ์' : 'ยังไม่ประกาศ'
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
