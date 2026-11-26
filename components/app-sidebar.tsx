'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Boxes,
  Package,
  ScanBarcode,
  ReceiptText,
  BellRing,
  BarChart3,
  Users,
  Truck,
  Settings,
  Sparkles,
  X,
  LogOut,
  Inbox,
  House,
  UserRound,
  ClipboardList,
  CircleHelp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNav = [
  { section: 'General', items: [{ href: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Operación',
    items: [
      { href: '/pos', label: 'Punto de venta', icon: ScanBarcode },
      { href: '/ventas', label: 'Ventas', icon: ReceiptText },
      { href: '/productos', label: 'Productos', icon: Package },
      { href: '/inventario', label: 'Inventario', icon: Boxes },
      { href: '/alertas', label: 'Alertas', icon: BellRing, badge: 3 },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { href: '/reportes', label: 'Reportes', icon: BarChart3 },
      { href: '/proveedores', label: 'Proveedores', icon: Truck },
      { href: '/usuarios', label: 'Usuarios', icon: Users },
      { href: '/configuracion', label: 'Configuración', icon: Settings },
      { href: '/solicitudes', label: 'Solicitudes', icon: Inbox },
    ],
  },
]

const workerNav = [
  {
    section: 'Mi espacio',
    items: [
      { href: '/', label: 'Inicio', icon: House },
      { href: '/pos', label: 'Vender', icon: ScanBarcode },
      { href: '/inventario', label: 'Inventario', icon: Boxes },
      { href: '/ventas', label: 'Mis ventas', icon: ClipboardList },
      { href: '/solicitudes', label: 'Solicitudes y soporte', icon: CircleHelp },
      { href: '/configuracion', label: 'Mi perfil', icon: UserRound },
    ],
  },
]

export function AppSidebar({
  open,
  onClose,
  role = 'admin',
}: {
  open?: boolean
  onClose?: () => void
  role: 'admin' | 'trabajador'
}) {
  const pathname = usePathname()
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.replace('/login')
  }

  const filteredNav = role === 'trabajador' ? workerNav : adminNav

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-72 shrink-0 flex-col overflow-y-auto scrollbar-thin border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">SIDT</p>
              <p className="text-xs text-muted-foreground">Rol: {role === 'admin' ? 'Administrador' : 'Trabajador'}</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
          {filteredNav.map((group) => (
            <div key={group.section}>
              <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.section}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                  const Icon = item.icon
                  const badge = 'badge' in item && typeof item.badge === 'number' ? item.badge : 0
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        )}
                      >
                        <Icon className="size-[18px]" />
                        <span className="flex-1">{item.label}</span>
                        {badge ? (
                          <span
                            className={cn(
                              'flex size-5 items-center justify-center rounded-full text-[11px] font-semibold',
                              active
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-destructive/12 text-destructive',
                            )}
                          >
                            {badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="m-3">
          <button
            onClick={logout}
            className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <LogOut className="size-[18px]" />
            <span className="flex-1 text-left">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
