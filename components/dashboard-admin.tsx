'use client'

import Link from 'next/link'
import {
  Boxes,
  DollarSign,
  FileText,
  PackagePlus,
  ScanBarcode,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { AreaChart } from '@/components/charts'
import { Badge, Card, PageHeader } from '@/components/kit'
import { compactCurrency, currency } from '@/lib/mock-data'

type DashboardStats = {
  todayRevenue: number
  weekRevenue: number
  monthRevenue: number
  inventoryValue: number
  workerCount: number
  trend: { label: string; value: number }[]
  lowStock: { id: string; name: string; stock: number; minStock: number }[]
  recentSales: {
    id: string
    cashierName: string
    total: number
    createdAt: string
    status: string
  }[]
}

export function DashboardAdmin({ name, stats }: { name: string; stats: DashboardStats }) {
  const kpis = [
    { label: 'Ventas de hoy', value: currency(stats.todayRevenue), icon: ShoppingCart },
    { label: 'Ventas últimos 7 días', value: currency(stats.weekRevenue), icon: DollarSign },
    { label: 'Ingresos del mes', value: currency(stats.monthRevenue), icon: DollarSign },
    { label: 'Valor del inventario', value: currency(stats.inventoryValue), icon: Boxes },
    { label: 'Trabajadores activos', value: String(stats.workerCount), icon: Users },
  ]
  const quickActions = [
    { label: 'Nueva venta', href: '/pos', icon: ScanBarcode },
    { label: 'Registrar producto', href: '/productos', icon: PackagePlus },
    { label: 'Generar reporte', href: '/reportes', icon: FileText },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title={`Hola, ${name.split(' ')[0]}`}
        subtitle="Resumen global de ventas, inventario y equipo."
        actions={
          <Link href="/pos" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90">
            <ScanBarcode className="size-4" />
            Nueva venta
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className="p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary"><Icon className="size-[18px]" /></span>
              <p className="mt-4 text-sm text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{kpi.value}</p>
            </Card>
          )
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between p-5 pb-0">
          <div><h2 className="text-sm font-semibold">Ventas globales</h2><p className="text-xs text-muted-foreground">Últimos siete días, todos los trabajadores</p></div>
          <Badge tone="accent">Consolidado</Badge>
        </div>
        <div className="p-5"><AreaChart data={stats.trend} formatY={compactCurrency} /></div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <div><h2 className="text-sm font-semibold">Ventas recientes</h2><p className="text-xs text-muted-foreground">Actividad de todo el equipo</p></div>
            <Link href="/ventas" className="text-sm font-medium text-accent hover:underline">Ver todas</Link>
          </div>
          {stats.recentSales.length ? (
            <ul className="divide-y divide-border px-5 pb-2">
              {stats.recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{sale.id} · {sale.cashierName}</span><span className="text-xs text-muted-foreground">{sale.createdAt.replace('T', ' ')}</span></span>
                  <span className="shrink-0 text-sm font-semibold">{currency(sale.total)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="p-5 text-sm text-muted-foreground">Aún no hay ventas registradas.</p>}
        </Card>

        <Card>
          <div className="flex items-center justify-between p-5 pb-3">
            <div><h2 className="text-sm font-semibold">Alertas de inventario</h2><p className="text-xs text-muted-foreground">Productos en mínimo o agotados</p></div>
            <Link href="/alertas" className="text-sm font-medium text-accent hover:underline">Ver alertas</Link>
          </div>
          {stats.lowStock.length ? (
            <ul className="space-y-2 px-5 pb-5">
              {stats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                  <span className="truncate text-sm font-medium">{product.name}</span>
                  <Badge tone={product.stock === 0 ? 'danger' : 'warning'}>{product.stock}/{product.minStock}</Badge>
                </li>
              ))}
            </ul>
          ) : <p className="p-5 text-sm text-muted-foreground">No hay alertas de stock.</p>}
        </Card>
      </div>

      <Card>
        <div className="p-5 pb-3"><h2 className="text-sm font-semibold">Acciones rápidas</h2></div>
        <div className="grid grid-cols-2 gap-3 p-5 pt-0 sm:grid-cols-3">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} className="flex min-h-24 flex-col justify-between rounded-2xl border border-border bg-secondary/40 p-4 hover:border-accent/40 hover:shadow-md">
              <Icon className="size-5 text-accent" /><span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
