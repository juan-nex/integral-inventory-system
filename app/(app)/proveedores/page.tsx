'use client'

import { Truck, Phone, User, Package, Plus } from 'lucide-react'
import { Card, Badge, PageHeader } from '@/components/kit'
import { suppliers } from '@/lib/mock-data'

export default function ProveedoresPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Proveedores"
        subtitle="Gestiona los aliados que abastecen tu inventario"
        actions={
          <button className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90">
            <Plus className="size-4" />
            Nuevo proveedor
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <Card key={s.id} className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <Truck className="size-5" />
              </span>
              <Badge tone="muted">{s.id}</Badge>
            </div>
            <p className="mt-4 font-semibold">{s.name}</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><User className="size-4" />{s.contact}</p>
              <p className="flex items-center gap-2"><Phone className="size-4" />{s.phone}</p>
              <p className="flex items-center gap-2"><Package className="size-4" />{s.products} productos suministrados</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
