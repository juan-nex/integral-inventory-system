'use client'

import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Boxes,
  Wallet,
  ArrowUpRight,
  Sparkles,
  ScanBarcode,
  PackagePlus,
  FileText,
  AlertTriangle,
  ReceiptText,
  Bell,
  Trophy,
  Target,
} from 'lucide-react'
import { Card, Badge, PageHeader } from '@/components/kit'
import { AreaChart, DonutChart, BarChart, Sparkline } from '@/components/charts'
import {
  salesTrend,
  hourlyToday,
  categoryPerformance,
  topProducts,
  activity,
  products,
  stockStatus,
  currency,
  compactCurrency,
} from '@/lib/mock-data'

export function DashboardAdmin() {
  const lowStock = products.filter((p) => stockStatus(p) !== 'ok')
  const healthScore = 86

  const kpis = [
    { label: 'Ventas de hoy', value: currency(1420000), delta: 12.4, up: true, icon: ShoppingCart, spark: [8, 12, 9, 14, 11, 18, 16, 21] },
    { label: 'Ventas de la semana', value: currency(6375000), delta: 8.1, up: true, icon: DollarSign, spark: [30, 42, 38, 55, 60, 71, 64] },
    { label: 'Ingresos del mes', value: currency(24900000), delta: 5.5, up: true, icon: Wallet, spark: [18, 17, 20, 21, 20, 24, 25] },
    { label: 'Valor del inventario', value: currency(41850000), delta: 2.3, up: false, icon: Boxes, spark: [42, 41, 43, 42, 41, 42, 42] },
  ]
  const quickActions = [
    { label: 'Nueva venta', href: '/pos', icon: ScanBarcode },
    { label: 'Registrar producto', href: '/productos', icon: PackagePlus },
    { label: 'Generar reporte', href: '/reportes', icon: FileText },
    { label: 'Ver alertas', href: '/alertas', icon: Bell },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Buenos días, Administrador"
        subtitle="Aquí está el resumen inteligente del negocio."
        actions={
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
          >
            <ScanBarcode className="size-4" />
            Nueva venta
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="relative overflow-hidden bg-primary text-primary-foreground lg:col-span-1">
          <div className="p-6">
            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Sparkles className="size-4" />
              Business Health Score
            </div>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold tabular-nums">{healthScore}</span>
              <span className="mb-1 text-primary-foreground/60">/100</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-primary-foreground/15">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-primary-foreground/70">
              Tu negocio está saludable. Rotación de inventario y margen por encima del promedio.
            </p>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-0">
            <h3 className="text-sm font-semibold">Acciones rápidas</h3>
            <Badge tone="accent">Atajos</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {quickActions.map((a) => {
              const Icon = a.icon
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-card text-accent shadow-sm">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium">{a.label}</span>
                </Link>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="size-[18px]" />
                </span>
                <Badge tone={k.up ? 'success' : 'danger'}>
                  {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {k.delta}%
                </Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{k.value}</p>
              <div className="mt-2">
                <Sparkline data={k.spark} color={k.up ? 'var(--success)' : 'var(--destructive)'} />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0">
            <div>
              <h3 className="text-sm font-semibold">Tendencia de ventas</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 días vs. meta diaria</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-accent" /> Ventas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-border" /> Meta
              </span>
            </div>
          </div>
          <div className="p-5">
            <AreaChart
              data={salesTrend.map((d) => ({ label: d.day, value: d.ventas }))}
              formatY={compactCurrency}
            />
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold">Desempeño por categoría</h3>
            <p className="text-xs text-muted-foreground">Unidades vendidas este mes</p>
          </div>
          <div className="p-5">
            <DonutChart data={categoryPerformance} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-semibold">Productos más vendidos</h3>
            <Trophy className="size-4 text-warning" />
          </div>
          <ul className="divide-y divide-border">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.units} unidades</p>
                </div>
                <span className="text-sm font-medium tabular-nums">{compactCurrency(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-1">
          <div className="p-5 pb-2">
            <h3 className="text-sm font-semibold">Ventas por hora (hoy)</h3>
            <p className="text-xs text-muted-foreground">Flujo de caja en tiempo real</p>
          </div>
          <div className="p-5 pt-2">
            <BarChart
              data={hourlyToday.map((h) => ({ label: h.h, value: h.v }))}
              formatY={compactCurrency}
              height={190}
            />
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold">Actividad reciente</h3>
          </div>
          <ul className="space-y-1 px-5 pb-5">
            {activity.map((a) => {
              const tone =
                a.type === 'alert' ? 'text-destructive bg-destructive/12'
                : a.type === 'sale' ? 'text-success bg-success/12'
                : a.type === 'report' ? 'text-accent bg-accent/12'
                : 'text-warning bg-warning/12'
              const Icon =
                a.type === 'alert' ? AlertTriangle
                : a.type === 'sale' ? ReceiptText
                : a.type === 'report' ? FileText
                : Boxes
              return (
                <li key={a.id} className="flex gap-3 py-2">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <div>
              <h3 className="text-sm font-semibold">Mapa de stock bajo</h3>
              <p className="text-xs text-muted-foreground">Productos que requieren reabastecimiento</p>
            </div>
            <Link href="/alertas" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Ver alertas <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 pt-0 sm:grid-cols-3">
            {lowStock.map((p) => {
              const out = stockStatus(p) === 'out'
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-3 ${out ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}
                >
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {p.stock}/{p.minStock} mín.
                    </span>
                    <Badge tone={out ? 'danger' : 'warning'}>{out ? 'Agotado' : 'Bajo'}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="lg:col-span-1 bg-gradient-to-br from-accent/8 to-transparent">
          <div className="flex items-center gap-2 p-5 pb-3">
            <Sparkles className="size-4 text-accent" />
            <h3 className="text-sm font-semibold">Recomendaciones IA</h3>
          </div>
          <ul className="space-y-3 px-5 pb-5 text-sm">
            <li className="flex gap-2.5">
              <Target className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Reordena <strong>Leche Alpina 1L</strong>: se agotará en ~2 días al ritmo actual.</span>
            </li>
            <li className="flex gap-2.5">
              <TrendingUp className="mt-0.5 size-4 shrink-0 text-success" />
              <span>Las <strong>Bebidas</strong> crecen 18% los fines de semana. Aumenta el stock.</span>
            </li>
            <li className="flex gap-2.5">
              <Wallet className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>Margen bajo en <strong>Detergente Fab</strong>. Revisa el precio de venta.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
