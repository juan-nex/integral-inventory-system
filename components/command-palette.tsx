'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ScanBarcode,
  Package,
  Boxes,
  BarChart3,
  Users,
  BellRing,
  ReceiptText,
  Settings,
  Search,
} from 'lucide-react'

const commands = [
  { label: 'Ir al Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Abrir Punto de venta', href: '/pos', icon: ScanBarcode },
  { label: 'Ver Ventas', href: '/ventas', icon: ReceiptText },
  { label: 'Gestionar Productos', href: '/productos', icon: Package },
  { label: 'Consultar Inventario', href: '/inventario', icon: Boxes },
  { label: 'Revisar Alertas de stock', href: '/alertas', icon: BellRing },
  { label: 'Generar Reportes', href: '/reportes', icon: BarChart3 },
  { label: 'Gestionar Usuarios', href: '/usuarios', icon: Users },
  { label: 'Abrir Configuración', href: '/configuracion', icon: Settings },
]

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState('')

  if (!open) return null
  const filtered = commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase()))

  const go = (href: string) => {
    router.push(href)
    setQ('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-foreground/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Escribe un comando o busca..."
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Sin resultados
            </li>
          )}
          {filtered.map((c) => {
            const Icon = c.icon
            return (
              <li key={c.href}>
                <button
                  onClick={() => go(c.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {c.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
