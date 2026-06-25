'use client'

/**
 * MobileShell — โครงหน้า public (claim / winners) แบบ mobile-native
 * - คอลัมน์กว้างเท่าจอมือถือ (≤480px) จัดกลาง → บน desktop ก็เป็นคอลัมน์มือถือสวยๆ
 * - sticky app bar สีเขียวแบรนด์ด้านบน (เหมือน nav bar ของแอป) แทนโลโก้ก้อนใหญ่กลางจอ
 * - รองรับ safe-area (จอรอยบาก) ทั้งบน-ล่าง
 */
export default function MobileShell({
  icon,
  backHref,
  badge,
  children,
}: {
  icon: string
  backHref?: string
  badge?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen flex justify-center"
      style={{ background: 'linear-gradient(180deg,#f0fdf4 0%,#ffffff 42%,#f7fee7 100%)' }}
    >
      <div className="w-full max-w-[480px] min-h-screen flex flex-col bg-white/0 shadow-[0_0_40px_rgba(15,23,42,0.04)]">
        {/* ── App bar (sticky) ── */}
        <header
          className="sticky top-0 z-30 flex items-center gap-2.5 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
          style={{
            background: 'var(--brand-grad)',
            boxShadow: '0 2px 12px rgba(21,128,61,0.22)',
          }}
        >
          {backHref && (
            <a
              href={backHref}
              aria-label="ย้อนกลับ"
              className="inline-flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-white text-[22px] leading-none hover:bg-white/15 transition"
            >
              ‹
            </a>
          )}
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-[19px] bg-white/15">
            {icon}
          </span>
          <div className="leading-tight">
            <div className="text-[10px] font-medium text-white/85">จุฬาเฮิร์บ สานฝันคนไทย</div>
            <div className="text-[14px] font-extrabold text-white tracking-tight">สแกนลุ้นรวย สวยลุ้นล้าน</div>
          </div>
          {badge && <div className="ml-auto">{badge}</div>}
        </header>

        {/* ── Body ── */}
        <main className="flex-1 px-4 pt-5 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  )
}
