import Link from 'next/link'
import { cookies } from 'next/headers'
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
import { DashboardAdmin } from '@/components/dashboard-admin'
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

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const role = cookieStore.get('auth-token')?.value || 'admin'
  const lowStock = products.filter((p) => stockStatus(p) !== 'ok')
  const healthScore = 86

  // KPI calculations based on role
  if (role === 'vendedor') {
    const misVentasHoy = { label: 'Mis Ventas Hoy (Total)', value: currency(350000), icon: ShoppingCart }
    const misVentasCant = { label: 'Transacciones', value: '18', icon: ReceiptText }

    const quickActions = [
      { label: 'Nueva venta', href: '/pos', icon: ScanBarcode },
      { label: 'Ver alertas', href: '/alertas', icon: Bell },
    ]

    return (
      <div className="space-y-6 animate-fade-up">
        <PageHeader
          title="Hola, Vendedor"
          subtitle="Resumen de tu turno actual."
          actions={
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
            >
              <ScanBarcode className="size-4" />
              Nueva venta rápida
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <misVentasHoy.icon className="size-[18px]" />
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{misVentasHoy.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{misVentasHoy.value}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <misVentasCant.icon className="size-[18px]" />
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{misVentasCant.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{misVentasCant.value}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between p-5 pb-0">
              <h3 className="text-sm font-semibold">Acciones rápidas</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
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

          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="text-sm font-semibold">Avisos de Stock</h3>
                <p className="text-xs text-muted-foreground">Solo lectura</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 pt-0">
              {lowStock.slice(0, 4).map((p) => {
                const out = stockStatus(p) === 'out'
                return (
                  <div key={p.id} className={`rounded-xl border p-3 ${out ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}>
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone={out ? 'danger' : 'warning'}>{out ? 'Agotado' : 'Bajo'}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
        
        <Card>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold">Tus últimas ventas</h3>
          </div>
          <ul className="space-y-1 px-5 pb-5">
            {activity.filter(a => a.type === 'sale').slice(0,3).map((a) => (
              <li key={a.id} className="flex gap-3 py-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-success bg-success/12">
                  <ReceiptText className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    )
  }

  if (role === 'inventarista') {
    return (
      <div className="space-y-6 animate-fade-up">
        <PageHeader title="Panel de Inventario" subtitle="Gestión y alertas de existencias" />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h3 className="text-sm font-semibold">Alertas de Stock</h3>
                <p className="text-xs text-muted-foreground">Productos a reponer</p>
              </div>
              <Link href="/alertas" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Ver todo <ArrowUpRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5 pt-0">
              {lowStock.map((p) => {
                const out = stockStatus(p) === 'out'
                return (
                  <div key={p.id} className={`rounded-xl border p-3 ${out ? 'border-destructive/30 bg-destructive/5' : 'border-warning/30 bg-warning/5'}`}>
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {p.stock}/{p.minStock}
                      </span>
                      <Badge tone={out ? 'danger' : 'warning'}>{out ? 'Agotado' : 'Bajo'}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-accent/8 to-transparent">
            <div className="flex items-center gap-2 p-5 pb-3">
              <Sparkles className="size-4 text-accent" />
              <h3 className="text-sm font-semibold">Sugerencias (Inventario)</h3>
            </div>
            <ul className="space-y-3 px-5 pb-5 text-sm">
              <li className="flex gap-2.5">
                <Target className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>Reordena <strong>Leche Alpina 1L</strong> pronto.</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    )
  }

  // Admin Dashboard (Original)
  return <DashboardAdmin />
}
