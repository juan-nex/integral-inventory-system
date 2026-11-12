import { NextRequest, NextResponse } from 'next/server'
import { createId, getDatabase } from '@/lib/database'

export const runtime = 'nodejs'

type SaleRow = {
  id: string
  sold_at: string
  cashier_id: string | null
  cashier_name: string
  customer: string
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  total: number
  status: string
}

type ItemRow = {
  product_id: string
  name: string
  qty: number
  price: number
  tax: number
}

type ProductRow = {
  id: string
  name: string
  price: number
  stock: number
  tax: number
}

export async function GET(request: NextRequest) {
  if (!request.cookies.get('auth-token')?.value) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }

  const db = getDatabase()
  const role = request.cookies.get('auth-token')?.value
  const userId = request.cookies.get('auth-user')?.value
  if (role !== 'admin' && role !== 'vendedor') {
    return NextResponse.json({ error: 'No tienes permiso para consultar ventas.' }, { status: 403 })
  }
  if (role === 'vendedor' && !userId) {
    return NextResponse.json({ error: 'Vuelve a iniciar sesión.' }, { status: 401 })
  }
  const sales = (role === 'admin'
    ? db.prepare('SELECT id, sold_at, cashier_id, cashier_name, customer, method, total, status FROM sales ORDER BY sold_at DESC').all()
    : db.prepare('SELECT id, sold_at, cashier_id, cashier_name, customer, method, total, status FROM sales WHERE cashier_id = ? ORDER BY sold_at DESC').all(userId ?? '')) as SaleRow[]
  const readItems = db.prepare(`
  SELECT product_id, product_name AS name, qty, unit_price AS price, tax_rate AS tax
    FROM sale_items
    WHERE sale_id = ?
  `)

  return NextResponse.json(sales.map((sale) => {
    const [date, time = '00:00'] = sale.sold_at.split('T')
    const items = readItems.all(sale.id) as ItemRow[]
    return {
      id: sale.id,
      userId: sale.cashier_id,
      date,
      time: time.slice(0, 5),
      cashier: sale.cashier_name,
      customer: sale.customer,
      method: sale.method,
      total: sale.total,
      status: sale.status as SaleRow['status'],
      items: items.map((item) => ({
        productId: item.product_id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        tax: item.tax,
      })),
    }
  }))
}

export async function POST(request: NextRequest) {
  if (!request.cookies.get('auth-token')?.value) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  if (!['admin', 'vendedor'].includes(request.cookies.get('auth-token')?.value || '')) {
    return NextResponse.json({ error: 'No tienes permiso para registrar ventas.' }, { status: 403 })
  }

  let input: { items?: unknown; method?: unknown; customer?: unknown }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  const methods = ['Efectivo', 'Tarjeta', 'Transferencia'] as const
  const method = methods.find((candidate) => candidate === input.method)
  if (
    !Array.isArray(input.items)
    || input.items.length === 0
    || !method
  ) {
    return NextResponse.json({ error: 'La venta requiere productos y un método de pago válido.' }, { status: 400 })
  }

  const quantities = new Map<string, number>()
  for (const item of input.items) {
    if (
      typeof item !== 'object'
      || item === null
      || !('productId' in item)
      || !('qty' in item)
      || typeof item.productId !== 'string'
      || !Number.isSafeInteger(item.qty)
      || Number(item.qty) < 1
    ) {
      return NextResponse.json({ error: 'Hay productos o cantidades inválidas.' }, { status: 400 })
    }
    const qty = (quantities.get(item.productId) || 0) + Number(item.qty)
    if (!Number.isSafeInteger(qty)) {
      return NextResponse.json({ error: 'La cantidad solicitada es demasiado grande.' }, { status: 400 })
    }
    quantities.set(item.productId, qty)
  }

  const db = getDatabase()
  const userId = request.cookies.get('auth-user')?.value
  const cashier = userId
    ? db.prepare('SELECT id, name FROM users WHERE id = ? AND active = 1').get(userId) as { id: string; name: string } | undefined
    : undefined
  if (!cashier) {
    return NextResponse.json({ error: 'Vuelve a iniciar sesión para registrar ventas.' }, { status: 401 })
  }

  const soldAt = new Date().toISOString()
  const customer = typeof input.customer === 'string' && input.customer.trim()
    ? input.customer.trim().slice(0, 150)
    : 'Cliente general'
  const saleItems: { product: ProductRow; qty: number }[] = []

  db.exec('BEGIN IMMEDIATE')
  try {
    const findProduct = db.prepare('SELECT id, name, price, stock, tax FROM products WHERE id = ?')
    for (const [productId, qty] of quantities) {
      const product = findProduct.get(productId) as ProductRow | undefined
      if (!product) {
        db.exec('ROLLBACK')
        return NextResponse.json({ error: `No existe el producto ${productId}.` }, { status: 404 })
      }
      if (qty > product.stock) {
        db.exec('ROLLBACK')
        return NextResponse.json({ error: `Stock insuficiente para ${product.name}; quedan ${product.stock}.` }, { status: 409 })
      }
      saleItems.push({ product, qty })
    }

    const saleIdRow = db.prepare(`
      SELECT COALESCE(MAX(CAST(SUBSTR(id, 3) AS INTEGER)), 20480) + 1 AS next
      FROM sales WHERE id GLOB 'V-[0-9]*'
    `).get() as { next: number }
    const saleId = `V-${saleIdRow.next}`
    const total = saleItems.reduce(
      (sum, item) => sum + item.product.price * item.qty + Math.round(item.product.price * item.qty * item.product.tax / 100),
      0,
    )
    db.prepare(`
      INSERT INTO sales (id, sold_at, cashier_id, cashier_name, customer, method, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(saleId, soldAt, cashier.id, cashier.name, customer, method, total)

    const updateStock = db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND stock >= ?
    `)
    const insertItem = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, product_name, qty, unit_price, tax_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const insertMovement = db.prepare(`
      INSERT INTO inventory_movements (id, product_id, user_id, quantity_delta, reason)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const item of saleItems) {
      const update = updateStock.run(item.qty, item.product.id, item.qty)
      if (Number(update.changes) !== 1) {
        throw new Error(`STOCK_CHANGED:${item.product.name}`)
      }
      insertItem.run(saleId, item.product.id, item.product.name, item.qty, item.product.price, item.product.tax)
      insertMovement.run(createId('MOV'), item.product.id, cashier.id, -item.qty, `Venta ${saleId}`)
    }
    db.exec('COMMIT')

    return NextResponse.json({
      id: saleId,
      date: soldAt.slice(0, 10),
      time: soldAt.slice(11, 16),
      cashier: cashier.name,
      customer,
      method,
      total,
      userId: cashier.id,
      status: 'Completada',
      items: saleItems.map(({ product, qty }) => ({
        productId: product.id,
        name: product.name,
        qty,
        price: product.price,
        tax: product.tax,
      })),
    }, { status: 201 })
  } catch (error) {
    db.exec('ROLLBACK')
    if (error instanceof Error && error.message.startsWith('STOCK_CHANGED:')) {
      return NextResponse.json({ error: 'El inventario cambió durante el cobro. Actualiza los productos e inténtalo otra vez.' }, { status: 409 })
    }
    console.error('Error registrando venta en SQLite:', error)
    return NextResponse.json({ error: 'No se pudo guardar la venta.' }, { status: 500 })
  }
}
