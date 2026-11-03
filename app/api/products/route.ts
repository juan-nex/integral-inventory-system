import { NextRequest, NextResponse } from 'next/server'
import { createId, getDatabase } from '@/lib/database'

export const runtime = 'nodejs'

type ProductRow = {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  supplier: string
  price: number
  cost: number
  stock: number
  minStock: number
  unit: string
}

function readProducts(query = '') {
  const db = getDatabase()
  const term = `%${query.trim()}%`
  return db.prepare(`
    SELECT p.id, p.name, p.sku, p.barcode, c.name AS category, s.name AS supplier,
      p.price, p.cost, p.stock, p.min_stock AS minStock, p.unit
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN suppliers s ON s.id = p.supplier_id
    WHERE ? = '' OR p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?
    ORDER BY p.name COLLATE NOCASE
  `).all(query.trim(), term, term, term) as ProductRow[]
}

function unauthorized(request: NextRequest) {
  return !request.cookies.get('auth-token')?.value
}

export async function GET(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  const query = new URL(request.url).searchParams.get('q') || ''
  return NextResponse.json(readProducts(query))
}

export async function POST(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const sku = typeof input.sku === 'string' ? input.sku.trim() : ''
  const barcode = typeof input.barcode === 'string' ? input.barcode.trim() : ''
  const category = typeof input.category === 'string' ? input.category.trim() : ''
  const supplier = typeof input.supplier === 'string' ? input.supplier.trim() : ''
  const unit = typeof input.unit === 'string' && input.unit.trim() ? input.unit.trim() : 'und'
  const price = Number(input.price)
  const cost = Number(input.cost)
  const stock = Number(input.stock)
  const minStock = Number(input.minStock)

  if (
    !name || !sku || !barcode || !category || !supplier
    || ![price, cost, stock, minStock].every(Number.isSafeInteger)
    || [price, cost, stock, minStock].some((value) => value < 0)
  ) {
    return NextResponse.json({ error: 'Revisa los campos obligatorios y los valores numéricos.' }, { status: 400 })
  }

  const db = getDatabase()
  const categoryRow = db.prepare('SELECT id FROM categories WHERE name = ?').get(category) as { id: string } | undefined
  const supplierRow = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(supplier) as { id: string } | undefined
  if (!categoryRow || !supplierRow) {
    return NextResponse.json({ error: 'La categoría o el proveedor seleccionados no existen.' }, { status: 400 })
  }

  const id = createId('P')
  db.exec('BEGIN IMMEDIATE')
  try {
    db.prepare(`
      INSERT INTO products (id, name, sku, barcode, category_id, supplier_id, price, cost, stock, min_stock, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, sku, barcode, categoryRow.id, supplierRow.id, price, cost, stock, minStock, unit)
    if (stock > 0) {
      db.prepare(`
        INSERT INTO inventory_movements (id, product_id, quantity_delta, reason)
        VALUES (?, ?, ?, ?)
      `).run(createId('MOV'), id, stock, 'Registro de producto')
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    const message = error instanceof Error ? error.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'El SKU o código de barras ya está registrado.' }, { status: 409 })
    }
    console.error('Error guardando producto en SQLite:', error)
    return NextResponse.json({ error: 'No se pudo guardar el producto.' }, { status: 500 })
  }

  const product = readProducts('').find((row) => row.id === id)
  return NextResponse.json(product, { status: 201 })
}
