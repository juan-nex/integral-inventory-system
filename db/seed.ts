import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { db } from './index'
import * as schema from './schema'
import {
  categories as mockCategories,
  suppliers as mockSuppliers,
  products as mockProducts,
  sales as mockSales,
  users as mockUsers,
  notices as mockNotices,
} from '../lib/mock-data'

export async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Check if data already exists to prevent duplicate runs
  const existingUsers = db.select().from(schema.users).all()
  if (existingUsers.length > 0) {
    console.log('ℹ️ La base de datos ya contiene datos. Omitiendo seed.')
    return
  }

  const demoHash = await bcrypt.hash('senasoft', 10)

  // 1. Seed Categories
  console.log('➡️ Insertando categorías...')
  const categoryMap = new Map<string, string>()
  mockCategories.forEach((cat, index) => {
    const id = `CAT-${index + 1}`
    categoryMap.set(cat.name, id)
    db.insert(schema.categories).values({
      id,
      name: cat.name,
      color: cat.color,
    }).run()
  })

  // 2. Seed Suppliers
  console.log('➡️ Insertando proveedores...')
  const supplierMap = new Map<string, string>()
  mockSuppliers.forEach((sup) => {
    supplierMap.set(sup.name, sup.id)
    db.insert(schema.suppliers).values({
      id: sup.id,
      name: sup.name,
      contact: sup.contact,
      phone: sup.phone,
    }).run()
  })

  // 3. Seed Users (Admin demo + Vendedor demo + Mock users)
  console.log('➡️ Insertando usuarios...')
  const defaultAdmin = {
    id: 'U-ADMIN-DEMO',
    name: 'Administrador SENA',
    email: 'admin@sena.edu.co',
    passwordHash: demoHash,
    role: 'admin' as const,
    active: 1,
  }
  db.insert(schema.users).values(defaultAdmin).run()

  for (const u of mockUsers) {
    const role: 'admin' | 'vendedor' | 'inventarista' =
      u.role === 'Administrador' ? 'admin' : u.role === 'Vendedor' ? 'vendedor' : 'inventarista'

    db.insert(schema.users).values({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: demoHash,
      role,
      active: u.status === 'Activo' ? 1 : 0,
    }).run()
  }

  // 4. Seed Products + Initial Inventory Movements
  console.log('➡️ Insertando productos y movimientos iniciales...')
  for (const prod of mockProducts) {
    const categoryId = categoryMap.get(prod.category) || 'CAT-1'
    const supplierId = supplierMap.get(prod.supplier) || 'SUP-01'

    db.insert(schema.products).values({
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      categoryId,
      supplierId,
      price: Math.round(prod.price),
      cost: Math.round(prod.cost),
      taxPct: Math.round(prod.tax || 0),
      stock: prod.stock,
      minStock: prod.minStock,
      unit: prod.unit || 'und',
      active: 1,
    }).run()

    if (prod.stock > 0) {
      db.insert(schema.inventoryMovements).values({
        id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
        productId: prod.id,
        type: 'entrada',
        quantity: prod.stock,
        reason: 'Inventario inicial del sistema',
        userId: 'U-ADMIN-DEMO',
      }).run()
    }
  }

  // 5. Seed Sales & Sale Items
  console.log('➡️ Insertando historial de ventas...')
  const allUsers = db.select().from(schema.users).all()
  for (const s of mockSales) {
    const matchedUser = allUsers.find((u) => u.name === s.cashier) || allUsers[0]
    const subtotal = s.items.reduce((acc, item) => acc + item.price * item.qty, 0)
    const tax = s.items.reduce((acc, item) => acc + Math.round(item.price * item.qty * ((item.tax || 0) / 100)), 0)
    const total = s.total || (subtotal + tax)

    db.insert(schema.sales).values({
      id: s.id,
      folio: s.id, // e.g., "V-20481"
      userId: matchedUser?.id,
      cashierName: s.cashier,
      customer: s.customer || 'Cliente general',
      paymentMethod: s.method,
      status: (s.status as 'Completada' | 'Anulación solicitada' | 'Anulada') || 'Completada',
      subtotal,
      tax,
      total,
      createdAt: `${s.date}T${s.time || '10:00'}:00`,
    }).run()

    for (const item of s.items) {
      db.insert(schema.saleItems).values({
        saleId: s.id,
        productId: item.productId,
        productName: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        taxPct: item.tax || 0,
      }).run()

      db.insert(schema.inventoryMovements).values({
        id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
        productId: item.productId,
        type: 'salida',
        quantity: item.qty,
        reason: `Venta folio ${s.id}`,
        userId: matchedUser?.id,
        createdAt: `${s.date}T${s.time || '10:00'}:00`,
      }).run()
    }
  }

  // 6. Seed Notices
  console.log('➡️ Insertando avisos...')
  for (const n of mockNotices) {
    db.insert(schema.notices).values({
      id: n.id,
      title: n.title,
      body: n.body,
      createdAt: `${n.date}T08:00:00`,
    }).run()
  }

  console.log('✅ Seed completado con éxito.')
}

// Run directly if invoked from command line
if (require.main === module || process.argv[1]?.includes('seed')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error ejecutando seed:', err)
      process.exit(1)
    })
}

