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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
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
  role?: string
}) {
  const pathname = usePathname()

  // Filtramos la navegación por rol
  const filteredNav = nav.map((group) => {
    let items = group.items
    if (role === 'vendedor') {
      // Vendedor: POS, Ventas (solo suyas, en UI), Inventario, Alertas, Productos
      const allowed = ['/', '/pos', '/ventas', '/inventario', '/alertas', '/productos']
      items = items.filter(item => allowed.includes(item.href))
    } else if (role === 'inventarista') {
      // Inventarista: Inventario, Alertas, Productos, Proveedores, Dashboard
      const allowed = ['/', '/inventario', '/alertas', '/productos', '/proveedores']
      items = items.filter(item => allowed.includes(item.href))
    }
    return { ...group, items }
  }).filter(group => group.items.length > 0)

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
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0',
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
              <p className="text-xs text-muted-foreground capitalize">Rol: {role}</p>
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

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
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
                        {'badge' in item && item.badge ? (
                          <span
                            className={cn(
                              'flex size-5 items-center justify-center rounded-full text-[11px] font-semibold',
                              active
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-destructive/12 text-destructive',
                            )}
                          >
                            {item.badge}
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

        <div className="m-3 space-y-3">
          <div className="rounded-2xl border border-sidebar-border bg-gradient-to-br from-accent/10 to-transparent p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-accent" />
              Asistente IA
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sugerencias de reorden y análisis inteligente de tu inventario.
            </p>
          </div>
          <button
            onClick={() => {
              document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
              window.location.href = '/login'
            }}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-[18px]" />
            <span className="flex-1 text-left">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}
