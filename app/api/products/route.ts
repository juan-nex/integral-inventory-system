import { NextRequest, NextResponse } from 'next/server'
import { getProducts, createProduct } from '@/lib/data'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

function unauthorized(request: NextRequest) {
  return !request.cookies.get('auth-token')?.value
}

export async function GET(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  const role = request.cookies.get('auth-token')?.value
  if (role !== 'admin' && role !== 'vendedor') {
    return NextResponse.json({ error: 'No tienes permiso para consultar productos.' }, { status: 403 })
  }

  const query = new URL(request.url).searchParams.get('q') || ''
  const rows = await getProducts(query)

  if (role === 'vendedor') {
    return NextResponse.json(
      rows.map(({ id, name, sku, barcode, category, price, stock, minStock, unit, tax }) => ({
        id,
        name,
        sku,
        barcode,
        category,
        price,
        stock,
        minStock,
        unit,
        tax,
      }))
    )
  }

  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  if (unauthorized(request)) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  if (request.cookies.get('auth-token')?.value !== 'admin') {
    return NextResponse.json({ error: 'Solo administración puede modificar productos.' }, { status: 403 })
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
  const categoryName = typeof input.category === 'string' ? input.category.trim() : ''
  const supplierName = typeof input.supplier === 'string' ? input.supplier.trim() : ''
  const unit = typeof input.unit === 'string' && input.unit.trim() ? input.unit.trim() : 'und'
  const price = Number(input.price)
  const cost = Number(input.cost)
  const stock = Number(input.stock)
  const minStock = Number(input.minStock)
  const tax = input.tax === undefined ? 0 : Number(input.tax)

  if (
    !name ||
    !sku ||
    !barcode ||
    !categoryName ||
    !supplierName ||
    ![price, cost, stock, minStock, tax].every(Number.isSafeInteger) ||
    [price, cost, stock, minStock, tax].some((value) => value < 0) ||
    tax > 100
  ) {
    return NextResponse.json({ error: 'Revisa los campos obligatorios y los valores numéricos.' }, { status: 400 })
  }

  const category = db.select().from(schema.categories).where(eq(schema.categories.name, categoryName)).get()
  const supplier = db.select().from(schema.suppliers).where(eq(schema.suppliers.name, supplierName)).get()

  if (!category || !supplier) {
    return NextResponse.json({ error: 'La categoría o el proveedor seleccionados no existen.' }, { status: 400 })
  }

  try {
    const id = await createProduct({
      name,
      sku,
      barcode,
      categoryId: category.id,
      supplierId: supplier.id,
      price,
      cost,
      stock,
      minStock,
      tax,
      unit,
      userId: request.cookies.get('auth-user')?.value,
    })

    const all = await getProducts('')
    const created = all.find((p) => p.id === id)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'El SKU o código de barras ya está registrado.' }, { status: 409 })
    }
    console.error('Error guardando producto:', error)
    return NextResponse.json({ error: 'No se pudo guardar el producto.' }, { status: 500 })
  }
}
