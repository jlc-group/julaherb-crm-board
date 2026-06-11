import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'สแกนลุ้นรวย สวยลุ้นล้าน — Dashboard',
  description: "Jula's Herb x ไทยรัฐ TV Campaign Dashboard",
}

// mobile-first สำหรับเปิดจาก LINE OA — viewport เต็มจอ + แถบสีเขียวแบรนด์ + รองรับจอรอยบาก (safe-area)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#15803d',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
