import { NextRequest, NextResponse } from 'next/server'
import { getWorkerTickets, getSaleVoidRequests } from '@/lib/data'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const role = request.cookies.get('auth-token')?.value
  const userId = request.cookies.get('auth-user')?.value
  if (role !== 'admin' && role !== 'vendedor') {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }
  if (role === 'vendedor' && !userId) {
    return NextResponse.json({ error: 'Vuelve a iniciar sesión.' }, { status: 401 })
  }

  const rawTickets = await getWorkerTickets(role === 'vendedor' ? userId : undefined)
  const tickets = rawTickets.map((t) => ({
    id: t.id,
    userId: t.userId,
    userName: t.userName,
    subject: t.subject,
    type: t.type,
    description: t.description,
    priority: t.priority,
    status: t.status,
    response: t.response,
    date: t.createdAt,
  }))

  const cancellations = await getSaleVoidRequests(role === 'vendedor' ? userId : undefined)

  return NextResponse.json({ tickets, cancellations })
}

export async function POST(request: NextRequest) {
  if (request.cookies.get('auth-token')?.value !== 'vendedor') {
    return NextResponse.json({ error: 'Solo vendedores pueden crear solicitudes.' }, { status: 403 })
  }

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  const userId = request.cookies.get('auth-user')?.value
  const userName = request.cookies.get('auth-name')?.value
  if (!userId || !userName) {
    return NextResponse.json({ error: 'Vuelve a iniciar sesión.' }, { status: 401 })
  }

  if (input.kind === 'ticket') {
    const types = ['Error de stock', 'Precio incorrecto', 'Falla del sistema', 'Otro'] as const
    const priorities = ['Baja', 'Media', 'Alta'] as const
    const type = types.find((t) => t === input.type)
    const priority = priorities.find((p) => p === input.priority) || 'Media'
    const subject = typeof input.subject === 'string' ? input.subject.trim() : ''
    const description = typeof input.description === 'string' ? input.description.trim() : ''

    if (!subject || !description || !type) {
      return NextResponse.json({ error: 'Completa asunto, tipo, descripción y prioridad.' }, { status: 400 })
    }

    const id = `TKT-${randomUUID().slice(0, 8).toUpperCase()}`
    db.insert(schema.tickets)
      .values({
        id,
        userId,
        userName,
        subject: subject.slice(0, 120),
        type,
        description: description.slice(0, 2000),
        priority,
        status: 'Abierto',
      })
      .run()

    return NextResponse.json({ id }, { status: 201 })
  }

  if (input.kind === 'cancellation') {
    const saleId = typeof input.saleId === 'string' ? input.saleId : ''
    const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
    if (!saleId || !reason) {
      return NextResponse.json({ error: 'El motivo de anulación es obligatorio.' }, { status: 400 })
    }

    const sale = db.select().from(schema.sales).where(and(eq(schema.sales.id, saleId), eq(schema.sales.userId, userId))).get()
    if (!sale || sale.status !== 'Completada') {
      return NextResponse.json({ error: 'La venta no existe o ya tiene una solicitud de anulación.' }, { status: 409 })
    }

    const pending = db.select().from(schema.saleVoidRequests).where(and(eq(schema.saleVoidRequests.saleId, saleId), eq(schema.saleVoidRequests.status, 'Pendiente'))).get()
    if (pending) {
      return NextResponse.json({ error: 'Esta venta ya tiene una solicitud pendiente.' }, { status: 409 })
    }

    const id = `ANU-${randomUUID().slice(0, 8).toUpperCase()}`
    db.transaction((tx) => {
      tx.insert(schema.saleVoidRequests).values({
        id,
        saleId,
        userId,
        userName,
        reason: reason.slice(0, 1000),
        status: 'Pendiente',
      }).run()

      tx.update(schema.sales).set({ status: 'Anulación solicitada' }).where(eq(schema.sales.id, saleId)).run()
    })

    return NextResponse.json({ id }, { status: 201 })
  }

  return NextResponse.json({ error: 'Tipo de solicitud no válido.' }, { status: 400 })
}

export async function PATCH(request: NextRequest) {
  if (request.cookies.get('auth-token')?.value !== 'admin') {
    return NextResponse.json({ error: 'Solo administración puede resolver solicitudes.' }, { status: 403 })
  }

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  if (input.kind === 'ticket') {
    const id = typeof input.id === 'string' ? input.id : ''
    const status = input.status === 'En proceso' || input.status === 'Resuelto' ? input.status : null
    const responseText = typeof input.response === 'string' ? input.response.trim() : ''
    if (!id || !status) {
      return NextResponse.json({ error: 'Estado de ticket no válido.' }, { status: 400 })
    }

    db.update(schema.tickets)
      .set({ status, response: responseText || null })
      .where(eq(schema.tickets.id, id))
      .run()

    return NextResponse.json({ success: true })
  }

  if (input.kind === 'cancellation') {
    const id = typeof input.id === 'string' ? input.id : ''
    const decision = input.decision === 'Aprobada' || input.decision === 'Rechazada' ? input.decision : null
    if (!id || !decision) {
      return NextResponse.json({ error: 'Decisión no válida.' }, { status: 400 })
    }

    return db.transaction((tx) => {
      const requestRow = tx.select().from(schema.saleVoidRequests).where(eq(schema.saleVoidRequests.id, id)).get()
      if (!requestRow || requestRow.status !== 'Pendiente') {
        return NextResponse.json({ error: 'La solicitud ya fue atendida o no existe.' }, { status: 409 })
      }

      tx.update(schema.saleVoidRequests).set({ status: decision }).where(eq(schema.saleVoidRequests.id, id)).run()

      if (decision === 'Aprobada') {
        const items = tx.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, requestRow.saleId)).all()
        for (const it of items) {
          tx.update(schema.products)
            .set({
              stock: sql`${schema.products.stock} + ${it.quantity}`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(schema.products.id, it.productId))
            .run()

          tx.insert(schema.inventoryMovements)
            .values({
              id: `MOV-${randomUUID().slice(0, 8).toUpperCase()}`,
              productId: it.productId,
              type: 'ajuste',
              quantity: it.quantity,
              reason: `Anulación de venta ${requestRow.saleId}`,
              userId: request.cookies.get('auth-user')?.value || null,
            })
            .run()
        }
        tx.update(schema.sales).set({ status: 'Anulada' }).where(eq(schema.sales.id, requestRow.saleId)).run()
      } else {
        tx.update(schema.sales).set({ status: 'Completada' }).where(eq(schema.sales.id, requestRow.saleId)).run()
      }

      return NextResponse.json({ success: true })
    })
  }

  return NextResponse.json({ error: 'Tipo de solicitud no válido.' }, { status: 400 })
}
