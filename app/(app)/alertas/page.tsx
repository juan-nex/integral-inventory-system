'use client'

import { useState } from 'react'
import { AlertTriangle, PackageX, Bell, RefreshCw, Check } from 'lucide-react'
import { Card, Badge, PageHeader } from '@/components/kit'
import { products, stockStatus, currency } from '@/lib/mock-data'

export default function AlertasPage() {
  const [resolved, setResolved] = useState<string[]>([])

  const alerts = products
    .filter((p) => stockStatus(p) !== 'ok')
    .sort((a, b) => a.stock - b.stock)

  const out = alerts.filter((p) => stockStatus(p) === 'out')
  const low = alerts.filter((p) => stockStatus(p) === 'low')

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Alertas de stock"
        subtitle="Notificaciones automáticas de productos por agotarse"
        actions={
          <button className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">
            <RefreshCw className="size-4" />
            Actualizar
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
            <PackageX className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Agotados</p>
            <p className="text-xl font-semibold">{out.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Stock bajo</p>
            <p className="text-xl font-semibold">{low.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
            <Bell className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Total de alertas</p>
            <p className="text-xl font-semibold">{alerts.length}</p>
          </div>
        </Card>
      </div>

      <Card className="divide-y divide-border overflow-hidden">
        {alerts.map((p) => {
          const st = stockStatus(p)
          const isOut = st === 'out'
          const isResolved = resolved.includes(p.id)
          const suggested = Math.max(p.minStock * 2 - p.stock, p.minStock)
          return (
            <div
              key={p.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${isResolved ? 'opacity-50' : ''}`}
            >
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                  isOut ? 'bg-destructive/12 text-destructive' : 'bg-warning/15 text-warning'
                }`}
              >
                {isOut ? <PackageX className="size-5" /> : <AlertTriangle className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{p.name}</p>
                  <Badge tone={isOut ? 'danger' : 'warning'}>{isOut ? 'Agotado' : 'Stock bajo'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quedan <strong>{p.stock}</strong> de un mínimo de {p.minStock} · {p.supplier}
                </p>
              </div>
              <div className="text-sm text-muted-foreground sm:text-right">
                <p className="text-xs">Reorden sugerido</p>
                <p className="font-medium text-foreground">
                  {suggested} und · {currency(suggested * p.cost)}
                </p>
              </div>
              <button
                onClick={() =>
                  setResolved((r) => (r.includes(p.id) ? r.filter((x) => x !== p.id) : [...r, p.id]))
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isResolved
                    ? 'border border-border text-muted-foreground hover:bg-muted'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90'
                }`}
              >
                <Check className="size-4" />
                {isResolved ? 'Reabierta' : 'Marcar reabastecido'}
              </button>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
