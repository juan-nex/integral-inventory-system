'use client'

import { useMemo, useState } from 'react'
import { Search, ReceiptText, ChevronDown, CreditCard, Banknote, ArrowRightLeft } from 'lucide-react'
import { Card, Badge, PageHeader } from '@/components/kit'
import { sales, currency } from '@/lib/mock-data'

const methodIcon = {
  Efectivo: Banknote,
  Tarjeta: CreditCard,
  Transferencia: ArrowRightLeft,
}

export default function VentasPage() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(sales[0]?.id ?? null)

  const filtered = useMemo(
    () =>
      sales.filter(
        (s) =>
          s.id.toLowerCase().includes(query.toLowerCase()) ||
          s.cashier.toLowerCase().includes(query.toLowerCase()) ||
          s.customer.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  const totalDay = sales.filter((s) => s.date === '2026-07-09').reduce((a, s) => a + s.total, 0)
  const count = sales.length

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Ventas"
        subtitle="Historial de transacciones registradas"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Ventas de hoy</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{currency(totalDay)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Transacciones</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Ticket promedio</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {currency(Math.round(sales.reduce((a, s) => a + s.total, 0) / count))}
          </p>
        </Card>
      </div>

      <Card className="flex items-center gap-2 p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por folio, cajero o cliente..."
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </Card>

      <Card className="divide-y divide-border overflow-hidden">
        {filtered.map((s) => {
          const open = expanded === s.id
          const Icon = methodIcon[s.method]
          return (
            <div key={s.id}>
              <button
                onClick={() => setExpanded(open ? null : s.id)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left hover:bg-muted/50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <ReceiptText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{s.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.date} · {s.time} · {s.cashier}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <Badge tone="muted">
                    <Icon className="size-3" />
                    {s.method}
                  </Badge>
                </div>
                <span className="text-right font-semibold tabular-nums">{currency(s.total)}</span>
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="bg-muted/30 px-4 pb-4">
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Detalle · Cliente: {s.customer}
                    </p>
                    <ul className="divide-y divide-border">
                      {s.items.map((it) => (
                        <li key={it.productId} className="flex items-center justify-between py-2 text-sm">
                          <span>{it.qty}× {it.name}</span>
                          <span className="tabular-nums">{currency(it.price * it.qty)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </Card>
    </div>
  )
}
