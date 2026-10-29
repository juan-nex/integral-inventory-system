'use client'

import { useMemo, useState } from 'react'
import { Search, Boxes, TrendingUp, AlertTriangle, PackageX } from 'lucide-react'
import { Card, Badge, PageHeader } from '@/components/kit'
import { products, categories, stockStatus, currency } from '@/lib/mock-data'

const filters = [
  { key: 'all', label: 'Todos' },
  { key: 'ok', label: 'Disponibles' },
  { key: 'low', label: 'Stock bajo' },
  { key: 'out', label: 'Agotados' },
] as const

export default function InventarioPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all')

  const stats = useMemo(() => {
    const totalValue = products.reduce((s, p) => s + p.stock * p.cost, 0)
    const low = products.filter((p) => stockStatus(p) === 'low').length
    const out = products.filter((p) => stockStatus(p) === 'out').length
    const units = products.reduce((s, p) => s + p.stock, 0)
    return { totalValue, low, out, units }
  }, [])

  const rows = useMemo(() => {
    return products.filter((p) => {
      const st = stockStatus(p)
      const matchF = filter === 'all' || st === filter
      const matchQ =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      return matchF && matchQ
    })
  }, [query, filter])

  const cards = [
    { label: 'Valor del inventario', value: currency(stats.totalValue), icon: TrendingUp, tone: 'accent' as const },
    { label: 'Unidades totales', value: stats.units.toLocaleString('es-CO'), icon: Boxes, tone: 'default' as const },
    { label: 'Productos con stock bajo', value: String(stats.low), icon: AlertTriangle, tone: 'warning' as const },
    { label: 'Productos agotados', value: String(stats.out), icon: PackageX, tone: 'danger' as const },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Inventario"
        subtitle="Consulta en tiempo real la disponibilidad física de tus productos · RQF004"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          const iconTone =
            c.tone === 'warning' ? 'bg-warning/12 text-warning'
            : c.tone === 'danger' ? 'bg-destructive/12 text-destructive'
            : c.tone === 'accent' ? 'bg-accent/12 text-accent'
            : 'bg-secondary text-foreground'
          return (
            <Card key={c.label} className="flex items-center gap-4 p-5">
              <span className={`flex size-11 items-center justify-center rounded-xl ${iconTone}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-xl font-semibold tabular-nums">{c.value}</p>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto o categoría..."
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 text-right font-medium">Stock actual</th>
                <th className="px-4 py-3 text-right font-medium">Mínimo</th>
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const st = stockStatus(p)
                const pct = Math.min(100, Math.round((p.stock / (p.minStock * 3 || 1)) * 100))
                const barTone = st === 'out' ? 'bg-destructive' : st === 'low' ? 'bg-warning' : 'bg-success'
                const catColor = categories.find((c) => c.name === p.category)?.color ?? '#3b82f6'
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: catColor }} />
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{p.stock}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{p.minStock}</td>
                    <td className="px-4 py-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${barTone}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={st === 'out' ? 'danger' : st === 'low' ? 'warning' : 'success'}>
                        {st === 'out' ? 'Agotado' : st === 'low' ? 'Stock bajo' : 'Disponible'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
