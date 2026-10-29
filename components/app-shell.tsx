'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Topbar } from '@/components/topbar'

export function AppShell({ children, role = 'admin' }: { children: React.ReactNode, role?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
