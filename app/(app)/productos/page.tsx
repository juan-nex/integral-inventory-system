'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Package, Barcode, Truck, LayoutGrid, List } from 'lucide-react'
import { Card, Badge, PageHeader, Modal, Field, inputClass } from '@/components/kit'
import {
  products as seedProducts,
  categories,
  suppliers,
  stockStatus,
  currency,
  type Product,
} from '@/lib/mock-data'

const statusMeta = {
  ok: { tone: 'success' as const, label: 'Disponible' },
  low: { tone: 'warning' as const, label: 'Stock bajo' },
  out: { tone: 'danger' as const, label: 'Agotado' },
}

export default function ProductosPage() {
  const [items, setItems] = useState<Product[]>(seedProducts)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('Todas')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return items.filter((p) => {
      const matchQ =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase()) ||
        p.barcode.includes(query)
      const matchC = cat === 'Todas' || p.category === cat
      return matchQ && matchC
    })
  }, [items, query, cat])

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newProduct: Product = {
      id: `P-${1000 + items.length + 1}`,
      name: String(fd.get('name') || 'Nuevo producto'),
      sku: String(fd.get('sku') || 'SKU-NUEVO'),
      barcode: String(fd.get('barcode') || '0000000000000'),
      category: String(fd.get('category') || categories[0].name),
      supplier: String(fd.get('supplier') || suppliers[0].name),
      price: Number(fd.get('price') || 0),
      cost: Number(fd.get('cost') || 0),
      stock: Number(fd.get('stock') || 0),
      minStock: Number(fd.get('minStock') || 0),
      unit: 'und',
    }
    setItems((prev) => [newProduct, ...prev])
    setOpen(false)
    setToast(`Producto "${newProduct.name}" registrado correctamente`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Productos"
        subtitle={`${items.length} productos en el catálogo · RQF001 Registro de productos`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
          >
            <Plus className="size-4" />
            Registrar producto
          </button>
        }
      />

      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o código de barras..."
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {['Todas', ...categories.map((c) => c.name)].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                cat === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            onClick={() => setView('grid')}
            className={`rounded-md p-1.5 ${view === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
            aria-label="Vista de cuadrícula"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`rounded-md p-1.5 ${view === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
            aria-label="Vista de tabla"
          >
            <List className="size-4" />
          </button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="font-medium">No se encontraron productos</p>
          <p className="text-sm text-muted-foreground">Ajusta la búsqueda o los filtros aplicados.</p>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const st = statusMeta[stockStatus(p)]
            const catColor = categories.find((c) => c.name === p.category)?.color ?? '#3b82f6'
            return (
              <Card key={p.id} className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
                <div
                  className="flex h-28 items-center justify-center"
                  style={{ background: `${catColor}14` }}
                >
                  <Package className="size-10" style={{ color: catColor }} />
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Barcode className="size-3.5" />{p.category}
                    </span>
                  </div>
                  <div className="flex items-end justify-between border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="text-base font-semibold">{currency(p.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="text-base font-semibold tabular-nums">{p.stock}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const st = statusMeta[stockStatus(p)]
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.supplier}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">{currency(p.price)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                      <td className="px-4 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrar producto"
        description="Ingresa la información básica del producto ."
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="product-form"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
            >
              Guardar producto
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleCreate} className="space-y-4">
          <Field label="Nombre del producto">
            <input name="name" required className={inputClass} placeholder="Ej: Coca-Cola 400ml" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <input name="sku" className={inputClass} placeholder="BEB-COC-400" />
            </Field>
            <Field label="Código de barras">
              <input name="barcode" className={inputClass} placeholder="7702004003457" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <select name="category" className={inputClass}>
                {categories.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Proveedor">
              <select name="supplier" className={inputClass}>
                {suppliers.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio de venta (COP)">
              <input name="price" type="number" min="0" className={inputClass} placeholder="2500" />
            </Field>
            <Field label="Costo (COP)">
              <input name="cost" type="number" min="0" className={inputClass} placeholder="1700" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad inicial">
              <input name="stock" type="number" min="0" className={inputClass} placeholder="100" />
            </Field>
            <Field label="Stock mínimo">
              <input name="minStock" type="number" min="0" className={inputClass} placeholder="20" />
            </Field>
          </div>
        </form>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2-translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  )
}
