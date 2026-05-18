import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'สแกนลุ้นรวย สวยลุ้นล้าน — Dashboard',
  description: "Jula's Herb x ไทยรัฐ TV Campaign Dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
