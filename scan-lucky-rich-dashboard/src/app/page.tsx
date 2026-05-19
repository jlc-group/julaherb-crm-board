'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import OverviewTab from '@/components/tabs/OverviewTab'
import ScanBehaviorTab from '@/components/tabs/ScanBehaviorTab'
import CustomersTab from '@/components/tabs/CustomersTab'
import ProductsTab from '@/components/tabs/ProductsTab'
import ChannelsTab from '@/components/tabs/ChannelsTab'
import OperationsTab from '@/components/tabs/OperationsTab'
import RiskTab from '@/components/tabs/RiskTab'
import type { TabId } from '@/types'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 ml-[var(--sidebar-width)] p-6 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'scan-behavior' && <ScanBehaviorTab />}
        {activeTab === 'customers' && <CustomersTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'operations' && <OperationsTab />}
        {activeTab === 'risk' && <RiskTab />}
      </main>
    </div>
  )
}
