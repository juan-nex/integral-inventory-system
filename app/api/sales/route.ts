import { NextRequest, NextResponse } from 'next/server'
import { getSales, createSale } from '@/lib/data'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const role = request.cookies.get('auth-token')?.value
  const userId = request.cookies.get('auth-user')?.value
  if (!role) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  if (role !== 'admin' && role !== 'vendedor') {
    return NextResponse.json({ error: 'No tienes permiso para consultar ventas.' }, { status: 403 })
  }
  if (role === 'vendedor' && !userId) {
    return NextResponse.json({ error: 'Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const sales = await getSales(role === 'vendedor' ? { cashierId: userId } : undefined)
  return NextResponse.json(sales)
}

export async function POST(request: NextRequest) {
  const role = request.cookies.get('auth-token')?.value
  const userId = request.cookies.get('auth-user')?.value
  if (!role || !userId) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  if (!['admin', 'vendedor'].includes(role)) {
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
  if (!Array.isArray(input.items) || input.items.length === 0 || !method) {
    return NextResponse.json({ error: 'La venta requiere productos y un método de pago válido.' }, { status: 400 })
  }

  const cashier = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()
  if (!cashier || cashier.active !== 1) {
    return NextResponse.json({ error: 'Usuario no autorizado.' }, { status: 401 })
  }

  try {
    const saleResult = await createSale({
      cashierId: cashier.id,
      cashierName: cashier.name,
      customer: typeof input.customer === 'string' ? input.customer : undefined,
      paymentMethod: method,
      items: input.items.map((it: { productId: string; qty: number }) => ({
        productId: it.productId,
        quantity: it.qty,
      })),
    })

    return NextResponse.json(saleResult, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al registrar la venta.'
    if (message.includes('Stock insuficiente')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    console.error('Error registrando venta con Drizzle:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
