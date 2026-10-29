'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet, TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react'
import { Card, Badge, PageHeader } from '@/components/kit'
import { AreaChart, BarChart, DonutChart } from '@/components/charts'
import {
  monthlyRevenue,
  categoryPerformance,
  topProducts,
  salesTrend,
  currency,
  compactCurrency,
} from '@/lib/mock-data'

const ranges = ['Hoy', 'Semana', 'Mes', 'Trimestre', 'Año']

export default function ReportesPage() {
  const [range, setRange] = useState('Mes')

  const kpis = [
    { label: 'Ingresos totales', value: currency(24900000), delta: '+5.5%', icon: DollarSign },
    { label: 'Ventas realizadas', value: '1.284', delta: '+8.1%', icon: ShoppingCart },
    { label: 'Ganancia estimada', value: currency(7420000), delta: '+6.2%', icon: TrendingUp },
    { label: 'Margen promedio', value: '29.8%', delta: '+1.4%', icon: Percent },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Reportes de ventas"
        subtitle="Analiza el comportamiento comercial y económico · RQF006"
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted">
              <FileSpreadsheet className="size-4" />
              Excel
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              <FileDown className="size-4" />
              Exportar PDF
            </button>
          </div>
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-2">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              range === r ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto px-2 text-sm text-muted-foreground">
          Periodo: 1 — 31 de julio de 2026
        </span>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Card key={k.label} className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="size-[18px]" />
                </span>
                <Badge tone="success">{k.delta}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{k.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold">Ingresos mensuales</h3>
            <p className="text-xs text-muted-foreground">Evolución de los últimos 7 meses</p>
          </div>
          <div className="p-5">
            <AreaChart
              data={monthlyRevenue.map((d) => ({ label: d.m, value: d.v }))}
              formatY={compactCurrency}
              color="var(--chart-2)"
            />
          </div>
        </Card>
        <Card>
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold">Ventas por categoría</h3>
            <p className="text-xs text-muted-foreground">Participación del periodo</p>
          </div>
          <div className="p-5">
            <DonutChart data={categoryPerformance} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="p-5 pb-2">
            <h3 className="text-sm font-semibold">Comparativo semanal</h3>
            <p className="text-xs text-muted-foreground">Ventas diarias frente a la meta</p>
          </div>
          <div className="p-5 pt-2">
            <BarChart
              data={salesTrend.map((d) => ({ label: d.day, value: d.ventas, target: d.meta }))}
              formatY={compactCurrency}
            />
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold">Productos más vendidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Producto</th>
                  <th className="px-5 py-2 text-right font-medium">Unidades</th>
                  <th className="px-5 py-2 text-right font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0">
                    <td className="px-5 py-2.5 font-medium">{p.name}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums">{p.units}</td>
                    <td className="px-5 py-2.5 text-right font-medium tabular-nums">{currency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
