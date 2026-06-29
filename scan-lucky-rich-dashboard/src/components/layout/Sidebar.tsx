'use client'

import type { TabId } from '@/types'
import { CAMPAIGN } from '@/config/campaign'

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const NAV_GROUPS: { label: string; items: { id: TabId; label: string; icon: string }[] }[] = [
  {
    label: 'Overview',
    items: [
      { id: 'crm-center', label: 'CRM Center',    icon: 'ti-heart-handshake' },
      { id: 'overview',   label: 'Scan Overview', icon: 'ti-chart-pie' },
      { id: 'scan-behavior', label: 'Scan Behavior', icon: 'ti-chart-histogram' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'customers',  label: 'Customers', icon: 'ti-users' },
      { id: 'products',   label: 'Products',  icon: 'ti-package' },
    ],
  },
  {
    label: 'Rewards',
    items: [
      { id: 'operations', label: 'Operations', icon: 'ti-trophy' },
      { id: 'claims',     label: 'Claim',      icon: 'ti-medal' },
      { id: 'print-list', label: 'Print List', icon: 'ti-printer' },
    ],
  },
  {
    label: 'System & Reports',
    items: [
      { id: 'risk',   label: 'Risk Watch', icon: 'ti-shield-check' },
      { id: 'report', label: 'Report',     icon: 'ti-file-text' },
    ],
  },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen overflow-y-auto flex flex-col text-white"
      style={{
        width: 'var(--sidebar-width)',
        background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
        boxShadow: '4px 0 16px rgba(20, 83, 45, 0.08)',
      }}
    >
      {/* Logo / Campaign banner */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <i className="ti ti-leaf text-[var(--accent)] text-lg" />
          <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Campaign</span>
        </div>
        <div className="text-[16px] font-extrabold leading-tight">
          สแกนลุ้นรวย<br/>สวยลุ้นล้าน
        </div>
        <div className="text-[11px] mt-1 text-white/60">{CAMPAIGN.partner}</div>
      </div>

      {/* Prize Pool snapshot */}
      <div className="mx-3 mt-3 rounded-xl px-3 py-2.5"
           style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] uppercase tracking-wider text-white/70 font-bold flex items-center gap-1">
            <i className="ti ti-coin" /> Prize Pool
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/15">198 รางวัล</span>
        </div>
        <div className="text-[18px] font-extrabold num">5.67M <span className="text-[12px] font-normal opacity-70">฿</span></div>
        <div className="progress mt-2" style={{ background: 'rgba(255,255,255,0.10)', border: 'none', height: 6 }}>
          <div className="progress-fill" style={{ width: '12%' }} />
        </div>
        <div className="flex justify-between text-[9.5px] mt-1 text-white/60">
          <span>Claimed 12%</span>
          <span>เหลือ 174</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
            {/* Group label */}
            <div className="px-4 pt-3 pb-1">
              <span className="text-[9.5px] uppercase tracking-widest font-bold text-white/35">
                {group.label}
              </span>
            </div>
            {/* Items */}
            {group.items.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`nav-tab w-full text-left ${active ? 'nav-tab-active' : ''}`}
                >
                  <i className={`ti ${tab.icon} text-base ${active ? 'text-[var(--accent)]' : ''}`} />
                  <span className="flex-1">{tab.label}</span>
                  {active && <i className="ti ti-chevron-right text-xs opacity-70" />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Live footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-[11px] mb-1">
          <span className="live-dot" />
          <span className="font-semibold">LIVE</span>
          <span className="text-white/50">• ประกาศ {CAMPAIGN.announceTime}</span>
        </div>
        <div className="text-[10px] text-white/40">
          16 พ.ค. → 16 ธ.ค. 2569
        </div>
      </div>
    </aside>
  )
}
