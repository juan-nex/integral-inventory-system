'use client'

import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  ShoppingCart,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  CheckCircle2,
  ScanBarcode,
} from 'lucide-react'
import { Card, Badge, Modal } from '@/components/kit'
import { products, categories, stockStatus, currency, type Product } from '@/lib/mock-data'

type CartLine = { product: Product; qty: number }

const methods = [
  { key: 'Efectivo', icon: Banknote },
  { key: 'Tarjeta', icon: CreditCard },
  { key: 'Transferencia', icon: ArrowRightLeft },
] as const

export default function PosPage() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Todas')
  const [cart, setCart] = useState<CartLine[]>([])
  const [method, setMethod] = useState<(typeof methods)[number]['key']>('Efectivo')
  const [done, setDone] = useState(false)

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const mq =
          p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query)
        const mc = cat === 'Todas' || p.category === cat
        return mq && mc && stockStatus(p) !== 'out'
      }),
    [query, cat],
  )

  const add = (p: Product) =>
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === p.id)
      if (found) return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { product: p, qty: 1 }]
    })

  const setQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    )

  const remove = (id: string) => setCart((prev) => prev.filter((l) => l.product.id !== id))

  const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0)
  const tax = Math.round(subtotal * 0.08)
  const total = subtotal + tax

  const checkout = () => {
    setDone(true)
  }

  const reset = () => {
    setDone(false)
    setCart([])
    setMethod('Efectivo')
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-6 lg:grid-cols-[1fr_380px] animate-fade-up">
      {/* Products */}
      <div className="flex min-h-0 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
              <ScanBarcode className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escanea el código de barras o busca un producto..."
                className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Search className="size-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['Todas', ...categories.map((c) => c.name)].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  cat === c ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const st = stockStatus(p)
              const catColor = categories.find((c) => c.name === p.category)?.color ?? '#3b82f6'
              return (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                >
                  <div className="flex h-20 items-center justify-center" style={{ background: `${catColor}14` }}>
                    <Package className="size-8" style={{ color: catColor }} />
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{currency(p.price)}</span>
                      {st === 'low' && <Badge tone="warning">{p.stock}</Badge>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Cart */}
      <Card className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-accent" />
            <h2 className="font-semibold">Carrito</h2>
            <Badge tone="muted">{cart.reduce((s, l) => s + l.qty, 0)}</Badge>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-muted-foreground hover:text-destructive">
              Vaciar
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <ShoppingCart className="size-10" />
              <p className="text-sm">Agrega productos para iniciar la venta</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.product.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.product.name}</p>
                    <p className="text-xs text-muted-foreground">{currency(l.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setQty(l.product.id, -1)} className="rounded-md border border-border p-1 hover:bg-muted">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">{l.qty}</span>
                    <button onClick={() => setQty(l.product.id, 1)} className="rounded-md border border-border p-1 hover:bg-muted">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button onClick={() => remove(l.product.id)} className="rounded-md p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-border p-4">
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => {
              const Icon = m.icon
              return (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-medium transition-colors ${
                    method === m.key ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="size-4" />
                  {m.key}
                </button>
              )
            })}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{currency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Impuesto (8%)</span>
              <span className="tabular-nums">{currency(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{currency(total)}</span>
            </div>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={checkout}
            className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cobrar {currency(total)}
          </button>
        </div>
      </Card>

      <Modal open={done} onClose={reset} title="Venta registrada" description="El inventario se actualizó automáticamente (RQF003).">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-9" />
          </span>
          <p className="text-2xl font-semibold tabular-nums">{currency(total)}</p>
          <p className="text-sm text-muted-foreground">
            {cart.reduce((s, l) => s + l.qty, 0)} artículos · Pago con {method}
          </p>
          <div className="mt-2 w-full rounded-xl border border-dashed border-border p-4 text-left text-sm">
            {cart.map((l) => (
              <div key={l.product.id} className="flex justify-between py-0.5">
                <span className="text-muted-foreground">{l.qty}× {l.product.name}</span>
                <span className="tabular-nums">{currency(l.product.price * l.qty)}</span>
              </div>
            ))}
          </div>
          <button
            onClick={reset}
            className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Nueva venta
          </button>
        </div>
      </Modal>
    </div>
  )
}
