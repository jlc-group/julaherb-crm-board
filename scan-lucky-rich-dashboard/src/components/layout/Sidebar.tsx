'use client'

import type { TabId } from '@/types'
import { CAMPAIGN } from '@/config/campaign'

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Scan Overview', icon: 'ti-chart-pie' },
  { id: 'customers', label: 'Customers', icon: 'ti-users' },
  { id: 'products', label: 'Products', icon: 'ti-package' },
  { id: 'channels', label: 'Channel & Attribution', icon: 'ti-building-store' },
  { id: 'operations', label: 'Operations', icon: 'ti-trophy' },
  { id: 'risk', label: 'Risk Watch', icon: 'ti-shield-check' },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 h-screen overflow-y-auto flex flex-col"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--dark)',
        color: '#fff',
      }}
    >
      {/* Logo / Campaign Name */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="text-base font-bold leading-tight">
          {CAMPAIGN.name}
        </div>
        <div className="text-xs mt-1 opacity-60">{CAMPAIGN.partner}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors ${
              activeTab === tab.id
                ? 'bg-white/15 font-semibold'
                : 'hover:bg-white/8 opacity-80 hover:opacity-100'
            }`}
          >
            <i className={`ti ${tab.icon} text-lg`} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 text-xs opacity-40 border-t border-white/10">
        <div>สถานะ: {CAMPAIGN.status === 'active' ? 'กำลังดำเนิน' : 'จบแล้ว'}</div>
        <div>ประกาศ {CAMPAIGN.announceTime} น. ทุกวัน</div>
      </div>
    </aside>
  )
}
