// Tiny inline badge showing which API endpoint feeds a widget
// Toggle visibility via NEXT_PUBLIC_SHOW_API_SOURCE=1 (default: shown in dev)
export default function ApiSourceBadge({ endpoint, params }: { endpoint: string; params?: string }) {
  const fullPath = params ? `${endpoint}?${params}` : endpoint
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-mono text-[var(--text-muted)] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 ml-1 align-middle"
      title={`API source: GET ${fullPath}\nWired in src/lib/api/db-source.ts`}
    >
      <span className="text-[8px]">📡</span>
      <span>{fullPath}</span>
    </span>
  )
}
