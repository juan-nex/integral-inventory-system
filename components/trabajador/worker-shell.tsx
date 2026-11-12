'use client'

import { createContext, useContext } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Boxes, CircleHelp, ClipboardList, House, LogOut, Moon, PackageSearch, Sun, UserRound, ScanBarcode } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

const links = [
  { href: '/trabajador', label: 'Inicio', icon: House },
  { href: '/trabajador/vender', label: 'Vender', icon: ScanBarcode },
  { href: '/trabajador/productos', label: 'Productos', icon: PackageSearch },
  { href: '/trabajador/mis-ventas', label: 'Mis ventas', icon: ClipboardList },
  { href: '/trabajador/perfil', label: 'Perfil', icon: UserRound },
  { href: '/trabajador/soporte', label: 'Soporte', icon: CircleHelp },
]

const SessionContext = createContext({ userId: '', name: 'Vendedor' })

export function useWorkerSession() {
  return useContext(SessionContext)
}

export function WorkerShell({
  userId,
  name,
  children,
}: {
  userId: string
  name: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.replace('/login')
  }

  return (
    <SessionContext.Provider value={{ userId, name }}>
      <div className="min-h-screen bg-background lg:flex">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
          <Link href="/trabajador" className="flex h-16 items-center gap-3 border-b border-border px-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Boxes className="size-5" /></span>
            <span><span className="block font-semibold">SDIT</span><span className="text-xs text-muted-foreground">Panel de vendedor</span></span>
          </Link>
          <nav aria-label="Menú del vendedor" className="flex-1 space-y-1 p-3 pt-5">
            {links.map(({ href, label, icon: Icon }) => {
              const active = href === '/trabajador' ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-[18px]" />{label}
                </Link>
              )
            })}
          </nav>
          <button onClick={logout} className="m-3 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-accent">
            <LogOut className="size-[18px]" />Cerrar sesión
          </button>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">SDIT <span className="font-normal text-muted-foreground">/ Vendedor</span></p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={toggleTheme} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent" aria-label="Cambiar tema">
                {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </button>
              <div className="flex items-center gap-2 rounded-xl px-2 py-1">
                <span className="flex size-9 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">{initials}</span>
                <span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-sm font-medium">{name}</span><span className="block text-xs text-muted-foreground">Vendedor</span></span>
              </div>
              <button onClick={logout} className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent lg:hidden" aria-label="Cerrar sesión"><LogOut className="size-5" /></button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>

        <nav aria-label="Navegación inferior" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === '/trabajador' ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} className={cn('flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-accent', active ? 'text-accent' : 'text-muted-foreground')}>
                <Icon className="size-5" /><span className="truncate">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </SessionContext.Provider>
  )
}
