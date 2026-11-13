import { desc, eq, sql, like, or } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import * as schema from '@/db/schema'

export type ProductWithDetails = {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  categoryId: string
  supplier: string
  supplierId: string
  price: number
  cost: number
  stock: number
  minStock: number
  unit: string
  tax: number
  active: number
}

// ==========================================
// 1. PRODUCTOS
// ==========================================

export async function getProducts(query = ''): Promise<ProductWithDetails[]> {
  const term = `%${query.trim()}%`

  const rows = db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      sku: schema.products.sku,
      barcode: schema.products.barcode,
      category: schema.categories.name,
      categoryId: schema.products.categoryId,
      supplier: schema.suppliers.name,
      supplierId: schema.products.supplierId,
      price: schema.products.price,
      cost: schema.products.cost,
      stock: schema.products.stock,
      minStock: schema.products.minStock,
      unit: schema.products.unit,
      tax: schema.products.taxPct,
      active: schema.products.active,
    })
    .from(schema.products)
    .innerJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
    .innerJoin(schema.suppliers, eq(schema.products.supplierId, schema.suppliers.id))
    .where(
      query.trim()
        ? or(
            like(schema.products.name, term),
            like(schema.products.sku, term),
            like(schema.products.barcode, term)
          )
        : undefined
    )
    .orderBy(schema.products.name)
    .all()

  return rows
}

export async function getProductById(id: string) {
  const row = db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .get()
  return row || null
}

export async function createProduct(input: {
  name: string
  sku: string
  barcode: string
  categoryId: string
  supplierId: string
  price: number
  cost: number
  stock: number
  minStock: number
  tax?: number
  unit?: string
  userId?: string
}) {
  const id = `P-${randomUUID().slice(0, 8).toUpperCase()}`

  return db.transaction((tx) => {
    tx.insert(schema.products)
      .values({
        id,
        name: input.name,
        sku: input.sku,
        barcode: input.barcode,
        categoryId: input.categoryId,
        supplierId: input.supplierId,
        price: Math.round(input.price),
        cost: Math.round(input.cost),
        taxPct: Math.round(input.tax || 0),
        stock: input.stock,
        minStock: input.minStock,
        unit: input.unit || 'und',
        active: 1,
      })
      .run()

    if (input.stock > 0) {
      tx.insert(schema.inventoryMovements)
        .values({
          id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
          productId: id,
          type: 'entrada',
          quantity: input.stock,
          reason: 'Registro inicial de producto',
          userId: input.userId,
        })
        .run()
    }

    return id
  })
}

export async function updateProduct(
  id: string,
  input: Partial<{
    name: string
    price: number
    cost: number
    stock: number
    minStock: number
    tax: number
    unit: string
    active: number
    userId?: string
    reason?: string
  }>
) {
  return db.transaction((tx) => {
    const current = tx.select().from(schema.products).where(eq(schema.products.id, id)).get()
    if (!current) throw new Error('Producto no encontrado')

    // If stock is changing directly via adjustment
    if (input.stock !== undefined && input.stock !== current.stock) {
      const diff = input.stock - current.stock
      tx.insert(schema.inventoryMovements).values({
        id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
        productId: id,
        type: diff > 0 ? 'ajuste' : 'merma',
        quantity: Math.abs(diff),
        reason: input.reason || 'Ajuste manual de stock',
        userId: input.userId,
      }).run()
    }

    tx.update(schema.products)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.price !== undefined ? { price: Math.round(input.price) } : {}),
        ...(input.cost !== undefined ? { cost: Math.round(input.cost) } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.minStock !== undefined ? { minStock: input.minStock } : {}),
        ...(input.tax !== undefined ? { taxPct: Math.round(input.tax) } : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(schema.products.id, id))
      .run()

    return true
  })
}

// ==========================================
// 2. VENTAS CON TRANSACCIÓN ATÓMICA
// ==========================================

export type CreateSaleInput = {
  cashierId: string
  cashierName: string
  customer?: string
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  items: {
    productId: string
    quantity: number
  }[]
}

export async function createSale(input: CreateSaleInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error('La venta debe incluir al menos un producto.')
  }

  return db.transaction((tx) => {
    // 1. Verificar stock y obtener precios inmutables del momento
    const verifiedItems: {
      product: typeof schema.products.$inferSelect
      quantity: number
      itemSubtotal: number
      itemTax: number
    }[] = []

    for (const item of input.items) {
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        throw new Error(`Cantidad inválida para el producto ${item.productId}`)
      }

      const product = tx
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, item.productId))
        .get()

      if (!product) {
        throw new Error(`El producto con ID ${item.productId} no existe.`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}, Solicitado: ${item.quantity}.`)
      }

      const itemSubtotal = product.price * item.quantity
      const itemTax = Math.round(itemSubtotal * ((product.taxPct || 0) / 100))

      verifiedItems.push({
        product,
        quantity: item.quantity,
        itemSubtotal,
        itemTax,
      })
    }

    // 2. Generar folio consecutivo seguro
    const maxFolioRow = tx
      .select({
        maxId: sql<string>`MAX(CAST(SUBSTR(${schema.sales.id}, 3) AS INTEGER))`,
      })
      .from(schema.sales)
      .where(sql`${schema.sales.id} GLOB 'V-[0-9]*'`)
      .get()

    const nextNumber = (Number(maxFolioRow?.maxId) || 20480) + 1
    const saleId = `V-${nextNumber}`
    const folio = saleId

    const totalSubtotal = verifiedItems.reduce((acc, curr) => acc + curr.itemSubtotal, 0)
    const totalTax = verifiedItems.reduce((acc, curr) => acc + curr.itemTax, 0)
    const grandTotal = totalSubtotal + totalTax
    const soldAt = new Date().toISOString()

    // 3. Insertar venta
    tx.insert(schema.sales)
      .values({
        id: saleId,
        folio,
        userId: input.cashierId,
        cashierName: input.cashierName,
        customer: input.customer?.trim() || 'Cliente general',
        paymentMethod: input.paymentMethod,
        status: 'Completada',
        subtotal: totalSubtotal,
        tax: totalTax,
        total: grandTotal,
        createdAt: soldAt,
      })
      .run()

    // 4. Insertar sale_items (copia inmutable) + descontar stock + registrar inventory_movements (Kardex)
    for (const item of verifiedItems) {
      tx.insert(schema.saleItems)
        .values({
          saleId,
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.price,
          taxPct: item.product.taxPct,
        })
        .run()

      // Descontar stock atómicamente
      tx.update(schema.products)
        .set({
          stock: sql`${schema.products.stock} - ${item.quantity}`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(schema.products.id, item.product.id))
        .run()

      // Kardex: salida
      tx.insert(schema.inventoryMovements)
        .values({
          id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
          productId: item.product.id,
          type: 'salida',
          quantity: item.quantity,
          reason: `Venta folio ${folio}`,
          userId: input.cashierId,
          createdAt: soldAt,
        })
        .run()
    }

    return {
      id: saleId,
      folio,
      total: grandTotal,
      subtotal: totalSubtotal,
      tax: totalTax,
      cashier: input.cashierName,
      customer: input.customer || 'Cliente general',
      method: input.paymentMethod,
      date: soldAt.slice(0, 10),
      time: soldAt.slice(11, 16),
      status: 'Completada',
      items: verifiedItems.map((vi) => ({
        productId: vi.product.id,
        name: vi.product.name,
        qty: vi.quantity,
        price: vi.product.price,
        tax: vi.product.taxPct,
      })),
    }
  })
}

export async function getSales(filter?: { cashierId?: string }) {
  const salesQuery = db
    .select()
    .from(schema.sales)
    .where(filter?.cashierId ? eq(schema.sales.userId, filter.cashierId) : undefined)
    .orderBy(desc(schema.sales.createdAt))
    .all()

  const allItems = db.select().from(schema.saleItems).all()

  return salesQuery.map((s) => {
    const [date, time = '00:00'] = s.createdAt.split('T')
    const items = allItems
      .filter((it) => it.saleId === s.id)
      .map((it) => ({
        productId: it.productId,
        name: it.productName,
        qty: it.quantity,
        price: it.unitPrice,
        tax: it.taxPct,
      }))

    return {
      id: s.id,
      folio: s.folio,
      userId: s.userId,
      date,
      time: time.slice(0, 5),
      cashier: s.cashierName,
      customer: s.customer,
      method: s.paymentMethod,
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
      status: s.status,
      items,
    }
  })
}

// ==========================================
// 3. CATEGORÍAS Y PROVEEDORES
// ==========================================

export async function getCategories() {
  return db.select().from(schema.categories).all()
}

export async function getSuppliers() {
  return db.select().from(schema.suppliers).all()
}

// ==========================================
// 4. AUTENTICACIÓN Y USUARIOS
// ==========================================

export async function verifyUserCredentials(email: string, passwordPlain: string) {
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.trim().toLowerCase()))
    .get()

  if (!user || user.active !== 1) return null

  // Supports bcrypt
  const valid = await bcrypt.compare(passwordPlain, user.passwordHash)
  if (!valid) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}

export async function getUsers() {
  const userList = db.select().from(schema.users).all()
  const salesCountByCashier = db
    .select({
      userId: schema.sales.userId,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.sales)
    .groupBy(schema.sales.userId)
    .all()

  const salesMap = new Map(salesCountByCashier.map((s) => [s.userId, s.count]))

  return userList.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === 'admin' ? 'Administrador' : u.role === 'vendedor' ? 'Vendedor' : 'Inventarista',
    status: u.active === 1 ? 'Activo' : 'Inactivo',
    lastActive: 'Hoy',
    sales: salesMap.get(u.id) || 0,
  }))
}

// ==========================================
// 5. MOVIMIENTOS DE INVENTARIO (KARDEX)
// ==========================================

export async function getInventoryMovements(productId?: string) {
  return db
    .select({
      id: schema.inventoryMovements.id,
      productId: schema.inventoryMovements.productId,
      productName: schema.products.name,
      type: schema.inventoryMovements.type,
      quantity: schema.inventoryMovements.quantity,
      reason: schema.inventoryMovements.reason,
      userId: schema.inventoryMovements.userId,
      userName: schema.users.name,
      createdAt: schema.inventoryMovements.createdAt,
    })
    .from(schema.inventoryMovements)
    .innerJoin(schema.products, eq(schema.inventoryMovements.productId, schema.products.id))
    .leftJoin(schema.users, eq(schema.inventoryMovements.userId, schema.users.id))
    .where(productId ? eq(schema.inventoryMovements.productId, productId) : undefined)
    .orderBy(desc(schema.inventoryMovements.createdAt))
    .all()
}

// ==========================================
// 6. TICKETS Y NOTICES (PANEL TRABAJADOR)
// ==========================================

export async function getWorkerTickets(userId?: string) {
  return db
    .select()
    .from(schema.tickets)
    .where(userId ? eq(schema.tickets.userId, userId) : undefined)
    .orderBy(desc(schema.tickets.createdAt))
    .all()
}

export async function getNotices() {
  return db.select().from(schema.notices).orderBy(desc(schema.notices.createdAt)).all()
}

export async function getSaleVoidRequests(userId?: string) {
  return db
    .select({
      id: schema.saleVoidRequests.id,
      saleId: schema.saleVoidRequests.saleId,
      userId: schema.saleVoidRequests.userId,
      userName: schema.saleVoidRequests.userName,
      reason: schema.saleVoidRequests.reason,
      status: schema.saleVoidRequests.status,
      date: schema.saleVoidRequests.createdAt,
      total: schema.sales.total,
    })
    .from(schema.saleVoidRequests)
    .innerJoin(schema.sales, eq(schema.saleVoidRequests.saleId, schema.sales.id))
    .where(userId ? eq(schema.saleVoidRequests.userId, userId) : undefined)
    .orderBy(desc(schema.saleVoidRequests.createdAt))
    .all()
}

