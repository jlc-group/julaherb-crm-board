// Tiny inline badge showing which API endpoint feeds a widget
// Toggle visibility via NEXT_PUBLIC_SHOW_API_SOURCE=1 (default: shown in dev)
export default function ApiSourceBadge({ endpoint, params }: { endpoint: string; params?: string }) {
  // ซ่อนโดย default (เป็นป้าย debug สำหรับ dev) — เปิดด้วย NEXT_PUBLIC_SHOW_API_SOURCE=1
  if (process.env.NEXT_PUBLIC_SHOW_API_SOURCE !== '1') return null
  const fullPath = params ? `${endpoint}?${params}` : endpoint
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono text-[var(--text-muted)] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 ml-1 align-middle"
      title={`API source: GET ${fullPath}\nWired through internal /api route → adapter.ts → api-source.ts/mock-source.ts`}
    >
      <span className="text-[8px]">📡</span>
      <span>{fullPath}</span>
    </span>
  )
}
