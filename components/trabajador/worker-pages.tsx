'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Check, ChevronDown, CircleHelp, FileText, Minus, Package, Plus, Printer, ReceiptText,
  Search, ShieldCheck, ShoppingBag, Ticket, TrendingUp, UserRound,
} from 'lucide-react'
import { Badge, Card, Field, inputClass, PageHeader } from '@/components/kit'
import { categories, currency, notices, stockStatus, type Sale, type Ticket as SupportTicket } from '@/lib/mock-data'
import {
  createSale, createTicket, defaultWorkerProfile, getProducts, getSalesByUser, getWorkerProfile,
  getWorkerRequests, requestSaleCancellation, saveWorkerProfile, subscribeWorkerProfile,
  type PaymentMethod, type WorkerProduct, type WorkerProfile, type WorkerRequests,
} from '@/lib/worker-data'
import { useWorkerSession } from './worker-shell'

type WorkerPage = 'home' | 'sell' | 'products' | 'sales' | 'profile' | 'support'

const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton = `${buttonClass} bg-accent text-accent-foreground hover:bg-accent/90`
const outlineButton = `${buttonClass} border border-border bg-card hover:bg-muted`
const statusInfo = {
  ok: { tone: 'success' as const, label: 'Disponible' },
  low: { tone: 'warning' as const, label: 'Stock bajo' },
  out: { tone: 'danger' as const, label: 'Agotado' },
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{children}</p>
}

function Receipt({ sale, onNewSale }: { sale: Sale; onNewSale: () => void }) {
  return (
    <Card className="mx-auto max-w-xl p-5 sm:p-8">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/12 text-success"><Check className="size-7" /></span>
        <h2 className="mt-4 text-xl font-semibold">Venta completada</h2>
        <p className="mt-1 text-sm text-muted-foreground">Comprobante {sale.id}</p>
      </div>
      <div className="my-5 border-y border-dashed border-border py-4">
        {sale.items.map((item) => (
          <div key={item.productId} className="flex justify-between gap-3 py-1.5 text-sm">
            <span>{item.qty} × {item.name}</span><span className="tabular-nums">{currency(item.price * item.qty + Math.round(item.price * item.qty * (item.tax || 0) / 100))}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span>{currency(sale.total)}</span></div>
        <p className="mt-2 text-xs text-muted-foreground">{sale.date} · {sale.time} · {sale.method}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={() => window.print()} className={`${outlineButton} flex-1`}><Printer className="size-4" />Imprimir / Descargar PDF</button>
        <button onClick={onNewSale} className={`${primaryButton} flex-1`}><Plus className="size-4" />Nueva venta</button>
      </div>
    </Card>
  )
}

export function WorkerPageScreen({ page }: { page: WorkerPage }) {
  const { userId, name } = useWorkerSession()
  const [products, setProducts] = useState<WorkerProduct[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [requests, setRequests] = useState<WorkerRequests>({ tickets: [], cancellations: [] })
  const [loading, setLoading] = useState(page !== 'profile')
  const [error, setError] = useState('')

  async function refreshProducts() {
    setProducts(await getProducts())
  }
  async function refreshSales() {
    setSales(await getSalesByUser(userId))
  }
  async function refreshRequests() {
    setRequests(await getWorkerRequests())
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        if (page === 'home' || page === 'sell' || page === 'products') {
          const result = await getProducts()
          if (active) setProducts(result)
        }
        if (page === 'home' || page === 'sales') {
          const result = await getSalesByUser(userId)
          if (active) setSales(result)
        }
        if (page === 'sales' || page === 'support') {
          const result = await getWorkerRequests()
          if (active) setRequests(result)
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los datos.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [page, userId])

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Cargando información…</div>

  if (page === 'home') {
    const today = new Date().toISOString().slice(0, 10)
    const todaySales = sales.filter((sale) => sale.date === today && sale.status !== 'Anulada')
    const total = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    const target = 500000
    const lowProducts = products.filter((product) => stockStatus(product) !== 'ok')
    const actions = [
      { href: '/trabajador/vender', label: 'Nueva venta', icon: ShoppingBag },
      { href: '/trabajador/productos', label: 'Consultar producto', icon: Search },
      { href: '/trabajador/mis-ventas', label: 'Mis ventas', icon: ReceiptText },
      { href: '/trabajador/soporte', label: 'Reportar problema', icon: CircleHelp },
    ]
    return (
      <div className="space-y-5">
        <PageHeader title={`Hola, ${name.split(' ')[0]}`} subtitle="Tu turno, tus ventas y lo que necesitas para atender." />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4 sm:p-5"><p className="text-sm text-muted-foreground">Mis ventas de hoy</p><p className="mt-2 text-2xl font-semibold">{currency(total)}</p><p className="mt-1 text-xs text-muted-foreground">{todaySales.length} transacciones</p></Card>
          <Card className="p-4 sm:p-5"><p className="text-sm text-muted-foreground">Ticket promedio</p><p className="mt-2 text-2xl font-semibold">{currency(todaySales.length ? Math.round(total / todaySales.length) : 0)}</p><p className="mt-1 text-xs text-muted-foreground">Ventas completadas de hoy</p></Card>
          <Card className="p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Meta diaria</p><TrendingUp className="size-4 text-accent" /></div><p className="mt-2 text-2xl font-semibold">{Math.min(100, Math.round(total / target * 100))}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, total / target * 100)}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{currency(total)} de {currency(target)}</p></Card>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold">Accesos rápidos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {actions.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-24 flex-col items-start justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-accent/50 hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent"><Icon className="size-5 text-accent" /><span className="text-sm font-semibold">{label}</span></Link>)}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between p-4 pb-2"><h2 className="font-semibold">Últimas ventas</h2><Link href="/trabajador/mis-ventas" className="text-sm font-medium text-accent hover:underline">Ver todas</Link></div>
            {sales.length ? <ul className="divide-y divide-border px-4 pb-2">{sales.slice(0, 5).map((sale) => <li key={sale.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0"><span className="block text-sm font-medium">{sale.id}</span><span className="text-xs text-muted-foreground">{sale.date} · {sale.time}</span></span><span className="text-sm font-semibold">{currency(sale.total)}</span></li>)}</ul> : <p className="p-4 text-sm text-muted-foreground">Todavía no tienes ventas registradas.</p>}
          </Card>
          <Card>
            <div className="p-4 pb-2"><h2 className="font-semibold">Avisos de inventario</h2><p className="text-xs text-muted-foreground">Consulta de solo lectura</p></div>
            {lowProducts.length ? <ul className="space-y-2 px-4 pb-4">{lowProducts.slice(0, 5).map((product) => <li key={product.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 p-3"><span className="truncate text-sm font-medium">{product.name} · {product.stock} disp.</span><Badge tone={stockStatus(product) === 'out' ? 'danger' : 'warning'}>{stockStatus(product) === 'out' ? 'Agotado' : 'Stock bajo'}</Badge></li>)}</ul> : <p className="p-4 text-sm text-muted-foreground">No hay alertas de stock.</p>}
          </Card>
        </div>
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">Comunicados del administrador</h2>
          <div className="grid gap-3 sm:grid-cols-2">{notices.map((notice) => <article key={notice.id} className="rounded-xl bg-muted/50 p-3"><h3 className="text-sm font-semibold">{notice.title}</h3><p className="mt-1 text-sm text-muted-foreground">{notice.body}</p><time className="mt-2 block text-xs text-muted-foreground">{notice.date}</time></article>)}</div>
        </Card>
      </div>
    )
  }

  if (page === 'sell') {
    return <SellPage products={products} onProductsChange={refreshProducts} error={error} setError={setError} />
  }

  if (page === 'products') {
    return <ProductLookup products={products} error={error} />
  }

  if (page === 'sales') {
    return <SalesPage sales={sales} requests={requests} userId={userId} onRefresh={async () => { await Promise.all([refreshSales(), refreshRequests()]) }} error={error} setError={setError} />
  }

  if (page === 'profile') return <ProfilePage name={name} />
  return <SupportPage requests={requests} onRefresh={refreshRequests} error={error} setError={setError} />
}

function ProductLookup({ products, error }: { products: WorkerProduct[]; error: string }) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => products.filter((p) => `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(query.toLowerCase())), [products, query])
  return (
    <div className="space-y-4">
      <PageHeader title="Consultar productos" subtitle="Precios y existencias actualizados. Solo lectura." />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-accent/30"><Search className="size-4 text-muted-foreground" /><span className="sr-only">Buscar por nombre, SKU o código de barras</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, SKU o código de barras…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      {filtered.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product) => {
        const status = statusInfo[stockStatus(product)]
        return <Card key={product.id} className="p-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Package className="size-5 text-accent" /></span><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{product.name}</h2><p className="text-xs text-muted-foreground">{product.category} · {product.sku}</p></div><Badge tone={status.tone}>{status.label}</Badge></div><div className="mt-4 flex items-end justify-between border-t border-border pt-3"><span><span className="block text-xs text-muted-foreground">Precio</span><span className="font-semibold">{currency(product.price)}</span></span><span className="text-right"><span className="block text-xs text-muted-foreground">Stock</span><span className="font-semibold tabular-nums">{product.stock}</span></span></div></Card>
      })}</div> : <Card className="p-8 text-center text-sm text-muted-foreground">No hay productos que coincidan.</Card>}
    </div>
  )
}

function SellPage({ products, onProductsChange, error, setError }: { products: WorkerProduct[]; onProductsChange: () => Promise<void>; error: string; setError: (message: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [method, setMethod] = useState<PaymentMethod>('Efectivo')
  const [received, setReceived] = useState('')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const [stockWarning, setStockWarning] = useState('')
  const filtered = products.filter((p) => `${p.name} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()) && (category === 'Todas' || p.category === category) && p.stock > 0)
  const cartItems = products.filter((p) => cart[p.id])
  const total = cartItems.reduce((sum, p) => sum + p.price * cart[p.id] + Math.round(p.price * cart[p.id] * p.tax / 100), 0)
  const change = Math.max(0, (Number(received) || 0) - total)

  function changeQty(product: WorkerProduct, delta: number) {
    setCart((current) => {
      const next = (current[product.id] || 0) + delta
      if (next > product.stock) {
        setStockWarning(`No puedes agregar más de ${product.stock} unidades de ${product.name}.`)
        return current
      }
      setStockWarning('')
      if (next <= 0) {
        const { [product.id]: removed, ...rest } = current
        void removed
        return rest
      }
      return { ...current, [product.id]: next }
    })
  }

  async function charge() {
    setError('')
    if (!cartItems.length) return setError('Agrega al menos un producto al carrito.')
    if (method === 'Efectivo' && (Number(received) || 0) < total) return setError('El valor recibido no alcanza para cubrir el total.')
    setBusy(true)
    try {
      const sale = await createSale({ method, items: cartItems.map((product) => ({ productId: product.id, qty: cart[product.id] })) })
      setReceipt(sale)
      setCart({})
      setReceived('')
      await onProductsChange()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la venta.')
      await onProductsChange().catch((refreshError: unknown) => setError(refreshError instanceof Error ? refreshError.message : 'No se pudo actualizar el inventario.'))
    } finally {
      setBusy(false)
    }
  }

  if (receipt) return <Receipt sale={receipt} onNewSale={() => { setReceipt(null); setError('') }} />
  return (
    <div className="space-y-4">
      <PageHeader title="Punto de venta" subtitle="Busca, agrega productos y cobra en pocos pasos." />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {stockWarning && <p role="status" className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{stockWarning}</p>}
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-accent/30"><Search className="size-4 text-muted-foreground" /><span className="sr-only">Buscar producto o código de barras</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o código de barras…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
          <div className="flex gap-2 overflow-x-auto pb-1">{['Todas', ...categories.map((item) => item.name)].map((item) => <button key={item} onClick={() => setCategory(item)} className={`${buttonClass} shrink-0 border ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'}`}>{item}</button>)}</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{filtered.map((product) => <button key={product.id} onClick={() => changeQty(product, 1)} className="flex min-h-36 flex-col items-start justify-between rounded-2xl border border-border bg-card p-3 text-left shadow-sm hover:border-accent/60 hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent sm:p-4"><span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Package className="size-5" /></span><span className="mt-3 line-clamp-2 text-sm font-semibold">{product.name}</span><span className="mt-1 flex w-full items-center justify-between gap-1"><span className="text-sm font-semibold">{currency(product.price)}</span><span className="text-xs text-muted-foreground">{product.stock} disp.</span></span></button>)}</div>
          {!filtered.length && <Card className="p-8 text-center text-sm text-muted-foreground">No hay productos disponibles con ese filtro.</Card>}
        </section>

        <Card className="lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-border p-4"><div><h2 className="font-semibold">Carrito</h2><p className="text-xs text-muted-foreground">{cartItems.reduce((sum, p) => sum + cart[p.id], 0)} artículos</p></div><ShoppingBag className="size-5 text-accent" /></div>
          {cartItems.length ? <ul className="max-h-64 divide-y divide-border overflow-y-auto px-4">{cartItems.map((product) => <li key={product.id} className="flex items-center gap-2 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{currency(product.price)} c/u</p></div><button onClick={() => changeQty(product, -1)} className="flex size-11 items-center justify-center rounded-lg border border-border" aria-label={`Quitar una unidad de ${product.name}`}><Minus className="size-4" /></button><span className="w-6 text-center font-semibold tabular-nums">{cart[product.id]}</span><button onClick={() => changeQty(product, 1)} className="flex size-11 items-center justify-center rounded-lg border border-border" aria-label={`Agregar una unidad de ${product.name}`}><Plus className="size-4" /></button></li>)}</ul> : <p className="p-5 text-center text-sm text-muted-foreground">Selecciona productos para comenzar.</p>}
          <div className="space-y-3 border-t border-border p-4">
            <Field label="Método de pago"><select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)} className={inputClass}><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></Field>
            {method === 'Efectivo' && <><Field label="Recibido"><input type="number" min={total} value={received} onChange={(event) => setReceived(event.target.value)} className={inputClass} placeholder="Valor recibido" /></Field><p className="flex justify-between text-sm"><span className="text-muted-foreground">Cambio</span><span className="font-semibold">{currency(change)}</span></p></>}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>{currency(total)}</span></div>
            <button onClick={() => void charge()} disabled={busy || !cartItems.length} className={`${primaryButton} w-full`}>{busy ? 'Procesando…' : 'Cobrar'}</button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function SalesPage({ sales, requests, userId, onRefresh, error, setError }: { sales: Sale[]; requests: WorkerRequests; userId: string; onRefresh: () => Promise<void>; error: string; setError: (message: string) => void }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [method, setMethod] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const requested = new Set(requests.cancellations.filter((request) => request.userId === userId && request.status === 'Pendiente').map((request) => request.saleId))
  const filtered = sales.filter((sale) => {
    const saleStatus = requested.has(sale.id) ? 'Anulación solicitada' : sale.status || 'Completada'
    return (!from || sale.date >= from) && (!to || sale.date <= to) && (method === 'Todas' || sale.method === method) && (status === 'Todos' || saleStatus === status)
  })
  async function submitCancellation(event: React.FormEvent) {
    event.preventDefault()
    if (!cancelId || !reason.trim()) return setError('Escribe el motivo obligatorio de la solicitud.')
    setBusy(true)
    try {
      await requestSaleCancellation(cancelId, reason)
      setCancelId(null)
      setReason('')
      setError('')
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo enviar la solicitud.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Mis ventas" subtitle="Solo ves las transacciones asociadas a tu usuario." />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Card className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Desde"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} /></Field>
        <Field label="Hasta"><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} /></Field>
        <Field label="Método de pago"><select value={method} onChange={(event) => setMethod(event.target.value)} className={inputClass}><option>Todas</option><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></Field>
        <Field label="Estado"><select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option>Todos</option><option>Completada</option><option>Anulación solicitada</option><option>Anulada</option></select></Field>
      </Card>
      <Card className="divide-y divide-border overflow-hidden">
        {!filtered.length && <p className="p-8 text-center text-sm text-muted-foreground">No hay ventas en este período.</p>}
        {filtered.map((sale) => {
          const pending = requested.has(sale.id)
          const saleStatus = pending ? 'Anulación solicitada' : sale.status || 'Completada'
          const open = expanded === sale.id
          return <div key={sale.id}>
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => setExpanded(open ? null : sale.id)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-accent"><ReceiptText className="size-5 shrink-0 text-accent" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{sale.id} · {currency(sale.total)}</span><span className="text-xs text-muted-foreground">{sale.date} · {sale.time} · {sale.method}</span></span><Badge tone={saleStatus === 'Completada' ? 'success' : saleStatus === 'Anulada' ? 'muted' : 'warning'}>{saleStatus}</Badge><ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
            </div>
            {open && <div className="space-y-3 bg-muted/30 px-4 pb-4"><ul className="divide-y divide-border rounded-xl border border-border bg-card px-3">{sale.items.map((item) => <li key={item.productId} className="flex justify-between gap-2 py-2 text-sm"><span>{item.qty} × {item.name}</span><span>{currency(item.price * item.qty)}</span></li>)}</ul><div className="flex flex-wrap gap-2"><button onClick={() => window.print()} className={outlineButton}><FileText className="size-4" />Descargar comprobante</button>{saleStatus === 'Completada' && <button onClick={() => { setCancelId(sale.id); setError('') }} className={outlineButton}>Solicitar anulación</button>}</div>{cancelId === sale.id && <form onSubmit={submitCancellation} className="space-y-3 rounded-xl border border-border bg-card p-3"><Field label="Motivo de anulación"><textarea required minLength={5} value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} min-h-20`} /></Field><div className="flex gap-2"><button disabled={busy} className={primaryButton}>{busy ? 'Enviando…' : 'Enviar solicitud'}</button><button type="button" onClick={() => { setCancelId(null); setReason('') }} className={outlineButton}>Cancelar</button></div><p className="text-xs text-muted-foreground">La solicitud será revisada por administración. No se anula la venta automáticamente.</p></form>}</div>}
          </div>
        })}
      </Card>
    </div>
  )
}

function ProfilePage({ name }: { name: string }) {
  const getSnapshot = useCallback(() => getWorkerProfile(name), [name])
  const getServerSnapshot = useCallback(() => defaultWorkerProfile(name), [name])
  const savedProfile = useSyncExternalStore(subscribeWorkerProfile, getSnapshot, getServerSnapshot)
  const [draft, setDraft] = useState<WorkerProfile | null>(null)
  const profile = draft ?? savedProfile
  const [saved, setSaved] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const strength = [newPassword.length >= 8, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /\d/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)].filter(Boolean).length
  function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    saveWorkerProfile(profile)
    setDraft(null)
    setSaved('Perfil guardado en este dispositivo.')
  }
  async function changePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword.length < 8) return setPasswordError('La contraseña debe tener mínimo 8 caracteres.')
    if (newPassword !== confirmPassword) return setPasswordError('La confirmación no coincide.')
    try {
      const response = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'No se pudo cambiar la contraseña.')
      setPasswordMessage('Contraseña actualizada.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : 'No se pudo cambiar la contraseña.')
    }
  }
  function update<K extends keyof WorkerProfile>(key: K, value: WorkerProfile[K]) {
    setDraft((current) => ({ ...(current ?? profile), [key]: value }))
    setSaved('')
  }
  function readPhoto(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('photo', String(reader.result || ''))
    reader.onerror = () => setSaved('No se pudo cargar la imagen.')
    reader.readAsDataURL(file)
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Perfil y seguridad" subtitle="Administra tus datos personales y el acceso a tu cuenta." />
      <Card className="p-4 sm:p-6">
        <form onSubmit={saveProfile} className="space-y-4">
          <h2 className="font-semibold">Datos personales</h2>
          <div className="flex items-center gap-4">
            {profile.photo ? <Image src={profile.photo} alt="Vista previa del perfil" width={64} height={64} unoptimized className="size-16 rounded-full object-cover" /> : <span className="flex size-16 items-center justify-center rounded-full bg-secondary"><UserRound className="size-7 text-muted-foreground" /></span>}
            <Field label="Foto de perfil"><input type="file" accept="image/*" onChange={(event) => readPhoto(event.target.files?.[0])} className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-secondary file:px-3" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre"><input required value={profile.name} onChange={(event) => update('name', event.target.value)} className={inputClass} /></Field><Field label="Teléfono"><input type="tel" value={profile.phone} onChange={(event) => update('phone', event.target.value)} className={inputClass} /></Field></div>
          <div className="flex items-center gap-3"><button className={primaryButton}>Guardar perfil</button>{saved && <span role="status" className="text-sm text-muted-foreground">{saved}</span>}</div>
        </form>
      </Card>
      <Card className="p-4 sm:p-6">
        <form onSubmit={changePassword} className="space-y-4">
          <div className="flex items-center gap-2"><ShieldCheck className="size-5 text-accent" /><h2 className="font-semibold">Cambiar contraseña</h2></div>
          <Field label="Contraseña actual"><input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} /></Field>
          <Field label="Nueva contraseña"><input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} /></Field>
          <div><div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Fortaleza</span><span>{newPassword.length < 8 ? 'Mínimo 8 caracteres' : strength < 3 ? 'Débil' : strength < 5 ? 'Media' : 'Fuerte'}</span></div><div className="grid grid-cols-5 gap-1">{[1, 2, 3, 4, 5].map((step) => <span key={step} className={`h-1.5 rounded ${step <= strength ? strength >= 4 ? 'bg-success' : 'bg-warning' : 'bg-muted'}`} />)}</div></div>
          <Field label="Confirmar nueva contraseña"><input type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} /></Field>
          {passwordError && <ErrorMessage>{passwordError}</ErrorMessage>}{passwordMessage && <p role="status" className="text-sm text-success">{passwordMessage}</p>}
          <button className={primaryButton}>Actualizar contraseña</button>
        </form>
      </Card>
      <Card className="space-y-3 p-4 sm:p-6">
        <h2 className="font-semibold">Preferencias de notificación</h2>
        {([['lowStockAlerts', 'Alertas de stock bajo'], ['adminNotices', 'Avisos del administrador'], ['ticketReplies', 'Respuestas a mis tickets']] as const).map(([key, label]) => <label key={key} className="flex min-h-11 items-center justify-between gap-4"><span className="text-sm">{label}</span><input type="checkbox" checked={profile[key]} onChange={(event) => update(key, event.target.checked)} className="size-5 accent-accent" /></label>)}
        <button onClick={() => { saveWorkerProfile(profile); setSaved('Preferencias guardadas en este dispositivo.') }} className={outlineButton}>Guardar preferencias</button>
      </Card>
    </div>
  )
}

const faq = [
  ['¿Qué hago si el precio en la caja no coincide con la etiqueta?', 'No completes el cobro con un precio distinto. Reporta “Precio incorrecto” en Soporte y consulta al administrador.'],
  ['¿Qué hago si el stock físico no coincide con el sistema?', 'Cuenta nuevamente las unidades y crea un ticket “Error de stock” con el producto y la cantidad observada. No ajustes el inventario desde tu cuenta.'],
  ['¿Cómo cobro con tarjeta?', 'Agrega los productos, elige “Tarjeta” y confirma el cobro en el datáfono. La venta queda registrada cuando confirmas “Cobrar”.'],
  ['¿Cómo registro una transferencia?', 'Elige “Transferencia”, verifica el comprobante con el procedimiento del negocio y después confirma la venta.'],
  ['¿Cómo reporto una falla del sistema?', 'Abre un ticket de tipo “Falla del sistema”, describe qué estabas haciendo e incluye el mensaje de error si aparece.'],
  ['¿Puedo anular una venta cobrada?', 'Solicita la anulación desde el detalle de la venta e indica el motivo. El administrador debe aprobarla; no se anula de inmediato.'],
  ['¿Qué significa “Stock bajo” o “Agotado”?', '“Stock bajo” indica que quedan unidades al nivel mínimo configurado. “Agotado” significa que el sistema no tiene unidades disponibles para vender.'],
]

function SupportPage({ requests, onRefresh, error, setError }: { requests: WorkerRequests; onRefresh: () => Promise<void>; error: string; setError: (message: string) => void }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setBusy(true)
    setError('')
    setSuccess('')
    const data = new FormData(event.currentTarget)
    try {
      await createTicket({
        subject: String(data.get('subject') || ''),
        type: String(data.get('type') || 'Otro') as SupportTicket['type'],
        description: String(data.get('description') || ''),
        priority: String(data.get('priority') || 'Media') as SupportTicket['priority'],
      })
      form.reset()
      setSuccess('Ticket enviado. Puedes consultar aquí el estado y la respuesta.')
      await onRefresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el ticket.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader title="Soporte" subtitle="Resuelve dudas o solicita ayuda al administrador." />
      {error && <ErrorMessage>{error}</ErrorMessage>}{success && <p role="status" className="rounded-xl bg-success/10 p-3 text-sm text-success">{success}</p>}
      <Card className="p-4 sm:p-5"><h2 className="mb-3 flex items-center gap-2 font-semibold"><CircleHelp className="size-5 text-accent" />Preguntas frecuentes</h2><div className="divide-y divide-border">{faq.map(([question, answer], index) => <div key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} className="flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent">{question}<ChevronDown className={`size-4 shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} /></button>{openFaq === index && <p className="pb-3 pr-7 text-sm leading-relaxed text-muted-foreground">{answer}</p>}</div>)}</div></Card>
      <Card className="p-4 sm:p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><Ticket className="size-5 text-accent" />Crear ticket</h2><form onSubmit={submit} className="space-y-3">
        <Field label="Asunto"><input name="subject" required maxLength={120} className={inputClass} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Tipo"><select name="type" className={inputClass}><option>Error de stock</option><option>Precio incorrecto</option><option>Falla del sistema</option><option>Otro</option></select></Field><Field label="Prioridad"><select name="priority" defaultValue="Media" className={inputClass}><option>Baja</option><option>Media</option><option>Alta</option></select></Field></div>
        <Field label="Descripción"><textarea name="description" required minLength={10} maxLength={2000} className={`${inputClass} min-h-28`} /></Field>
        <button disabled={busy} className={primaryButton}>{busy ? 'Enviando…' : 'Enviar ticket'}</button>
      </form></Card>
      <Card className="p-4 sm:p-5"><h2 className="mb-3 font-semibold">Mis tickets</h2>{requests.tickets.length ? <ul className="space-y-3">{requests.tickets.map((ticket) => <li key={ticket.id} className="rounded-xl border border-border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">{ticket.subject}</h3><Badge tone={ticket.status === 'Resuelto' ? 'success' : ticket.status === 'En proceso' ? 'accent' : 'warning'}>{ticket.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{ticket.type} · Prioridad {ticket.priority} · {ticket.date.slice(0, 10)}</p><p className="mt-2 text-sm">{ticket.description}</p>{ticket.response && <p className="mt-3 rounded-lg bg-muted p-3 text-sm"><strong>Respuesta del administrador:</strong> {ticket.response}</p>}</li>)}</ul> : <p className="text-sm text-muted-foreground">Aún no tienes tickets.</p>}</Card>
    </div>
  )
}
