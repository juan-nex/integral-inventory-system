import { NextRequest, NextResponse } from 'next/server'
import { getSales, createSale } from '@/lib/data'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }

  const sales = await getSales(user.role === 'trabajador' ? { cashierId: user.id } : undefined)
  return NextResponse.json(sales)
}

export async function POST(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
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

  const cashier = db.select().from(schema.users).where(eq(schema.users.id, user.id)).get()
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
