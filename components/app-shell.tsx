'use client'

import { createContext, useContext, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { Topbar } from '@/components/topbar'

const AppSessionContext = createContext({ userId: '', name: 'Trabajador', role: 'trabajador' as 'admin' | 'trabajador' })

export function useAppSession() {
  return useContext(AppSessionContext)
}

export function useWorkerSession() {
  const { userId, name } = useAppSession()
  return { userId, name }
}

export function AppShell({
  children,
  role,
  name,
  userId,
}: {
  children: React.ReactNode
  role: 'admin' | 'trabajador'
  name: string
  userId: string
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const adminOnly = ['/usuarios', '/reportes', '/proveedores', '/productos', '/alertas']
  const restricted = role === 'trabajador' && adminOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  const redirectPath = pathname === '/productos' || pathname.startsWith('/productos/') ||
    pathname === '/alertas' || pathname.startsWith('/alertas/')
    ? '/inventario'
    : '/'

  useEffect(() => {
    if (restricted) router.replace(redirectPath)
  }, [restricted, redirectPath, router])

  return (
    <AppSessionContext.Provider value={{ userId, name, role }}>
      <div className="flex h-screen h-[100dvh] overflow-hidden bg-background">
        <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenu={() => setSidebarOpen(true)} name={name} role={role} />
          <main className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
              {restricted ? null : children}
            </div>
          </main>
        </div>
      </div>
    </AppSessionContext.Provider>
  )
}
