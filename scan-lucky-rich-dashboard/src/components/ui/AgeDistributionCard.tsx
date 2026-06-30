'use client'
// 👤 Demographics — กลุ่มอายุลูกค้า (จาก dob)
// dob มีใน DB แล้ว · รอ backend เปิด endpoint /api/customers/age-distribution
// ถ้ามี API → ใช้จริง · ยังไม่มี → โชว์ "ตัวอย่าง" (ติดป้ายชัด ไม่ให้เข้าใจผิดว่าจริง)
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { useApi } from '@/lib/hooks/useApi'
import { numFmt } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface AgeBucket { label: string; count: number; pct?: number }
interface AgeDistResponse { buckets: AgeBucket[]; total?: number; medianAge?: number }

// ตัวอย่าง (placeholder) — สัดส่วนสมมุติของแคมเปญสกินแคร์ผ่านทีวี · จะถูกแทนเมื่อ API มา
const PLACEHOLDER: AgeBucket[] = [
  { label: '<18', count: 5 }, { label: '18–24', count: 18 }, { label: '25–34', count: 30 },
  { label: '35–44', count: 26 }, { label: '45–54', count: 15 }, { label: '55+', count: 6 },
]

export default function AgeDistributionCard() {
  const { data } = useApi<AgeDistResponse>('/api/customers/age-distribution')
  const isReal = !!data?.buckets?.length
  const buckets = isReal ? data!.buckets : PLACEHOLDER
  const total = buckets.reduce((s, b) => s + b.count, 0)
  const pct = (b: AgeBucket) => b.pct ?? (total > 0 ? (b.count / total) * 100 : 0)
  const top = [...buckets].sort((a, b) => pct(b) - pct(a))[0]

  return (
    <div className="card p-4 float-up">
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <i className="ti ti-user-circle text-base text-[var(--primary)]" />
        <h3 className="text-[14px] font-bold text-[var(--dark)]">👤 กลุ่มอายุลูกค้า</h3>
        {isReal
          ? <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-green-100 text-green-800">🟢 API</span>
          : <span className="ml-auto px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-amber-100 text-amber-800" title="dob มีใน DB แล้ว · รอ backend เปิด endpoint /api/customers/age-distribution">📊 ตัวอย่าง · รอ API</span>}
      </div>
      <div className="text-[10.5px] text-[var(--text-secondary)] mb-3">
        {isReal ? `คำนวณจากปีเกิด (dob) · มัธยฐาน ${data?.medianAge ?? '—'} ปี` : 'ตัวอย่างสัดส่วน — dob มีใน DB แล้ว รอ backend ส่งข้อมูลจริง'}
      </div>

      <div style={{ height: 190 }}>
        <Bar
          data={{ labels: buckets.map((b) => b.label), datasets: [{
            label: 'ลูกค้า', data: buckets.map((b) => (isReal ? b.count : pct(b))),
            backgroundColor: buckets.map((b) => (b === top ? '#1D9E75' : isReal ? '#86efac' : '#cbd5e1')),
            borderRadius: 5, barPercentage: 0.7,
          }] }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => isReal ? `${numFmt(Number(c.parsed.y))} คน (${pct(buckets[c.dataIndex]).toFixed(1)}%)` : `${Number(c.parsed.y).toFixed(0)}% (ตัวอย่าง)` } } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { callback: (v) => isReal ? numFmt(Number(v)) : `${v}%` } } },
          }}
        />
      </div>

      <div className="text-[11px] text-[var(--text-secondary)] mt-3 bg-[var(--bg-soft)] border border-[var(--border)] rounded-lg px-3 py-2">
        🎯 กลุ่มหลัก: <b>อายุ {top?.label} ปี</b> ({pct(top!).toFixed(0)}%) — กลุ่มที่ใช้ครีม/สแกนมากสุด
        {!isReal && <span className="block text-[10px] text-amber-700 mt-1">⚠️ ตัวเลขนี้เป็นตัวอย่าง · ของจริงพอ backend เปิด <code className="bg-white/70 px-1 rounded">/api/customers/age-distribution</code></span>}
      </div>

      {/* เพศ — ยังไม่มีต้นทาง */}
      <div className="text-[10.5px] text-[var(--text-muted)] mt-2 flex items-start gap-1.5">
        <span>🚻</span>
        <span><b>เพศ:</b> ยังไม่มีในระบบ (DB ไม่มี field gender) — ต้องเริ่มเก็บตอนสมัครก่อน</span>
      </div>
    </div>
  )
}
