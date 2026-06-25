import { redirect } from 'next/navigation'

// root = ฝั่งลูกค้า — เด้งไปหน้าประกาศผล (แอดมินย้ายไป /jlc-console)
// ตัด URL เหลือ "/" จะเจอหน้าลูกค้า ไม่ใช่หน้าแอดมินอีกต่อไป
export default function Home() {
  redirect('/winners')
}
