'use client'

interface DataTableProps {
  headers: string[]
  children: React.ReactNode
}

export default function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="bg-[var(--light)] text-[var(--dark)] font-semibold text-left p-2 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
