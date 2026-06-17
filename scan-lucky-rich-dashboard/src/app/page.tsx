'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import OverviewTab from '@/components/tabs/OverviewTab'
import ScanBehaviorTab from '@/components/tabs/ScanBehaviorTab'
import CustomersTab from '@/components/tabs/CustomersTab'
import ProductsTab from '@/components/tabs/ProductsTab'
import ChannelsTab from '@/components/tabs/ChannelsTab'
import OperationsTab from '@/components/tabs/OperationsTab'
import ClaimsTab from '@/components/tabs/ClaimsTab'
import RiskTab from '@/components/tabs/RiskTab'
import PrintListTab from '@/components/tabs/PrintListTab'
import ReportTab from '@/components/tabs/ReportTab'
import CrmCenterTab from '@/components/tabs/CrmCenterTab'
import FloatingExportButton from '@/components/ui/FloatingExportButton'
import type { TabId } from '@/types'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [claimFocus, setClaimFocus] = useState<string | null>(null) // เบอร์ 9 หลักท้าย ที่ส่งมาจาก Operations เพื่อโฟกัสในหน้ารับรางวัล

  // เปลี่ยนแท็บปกติ (sidebar) → ล้างโฟกัสที่ค้างไว้
  const handleTab = (tab: TabId) => {
    setClaimFocus(null)
    setActiveTab(tab)
  }
  // จาก Operations: กดผู้ได้รางวัล → ไปหน้ารับรางวัล + โฟกัสคนนั้น
  const goToClaim = (phoneLast9: string) => {
    setClaimFocus(phoneLast9)
    setActiveTab('claims')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={handleTab} />
      <main className="flex-1 ml-[var(--sidebar-width)] px-6 pb-6 overflow-y-auto h-screen">
        {activeTab === 'crm-center' && <CrmCenterTab />}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'scan-behavior' && <ScanBehaviorTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'operations' && <OperationsTab onOpenClaim={goToClaim} />}
        {activeTab === 'claims' && <ClaimsTab focusPhone={claimFocus} />}
        {activeTab === 'risk' && <RiskTab />}
        {activeTab === 'print-list' && <PrintListTab />}
        {activeTab === 'report' && <ReportTab />}
      </main>
      <FloatingExportButton />
    </div>
  )
}
