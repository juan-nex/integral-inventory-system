import { NextRequest, NextResponse } from 'next/server'
import { createId, getDatabase } from '@/lib/database'

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
  const db = getDatabase()
  const tickets = role === 'admin'
    ? db.prepare('SELECT id, user_id AS userId, user_name AS userName, subject, type, description, priority, status, response, created_at AS date FROM support_tickets ORDER BY created_at DESC').all()
    : db.prepare('SELECT id, user_id AS userId, user_name AS userName, subject, type, description, priority, status, response, created_at AS date FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC').all(userId ?? '')
  const cancellations = role === 'admin'
    ? db.prepare(`
      SELECT r.id, r.sale_id AS saleId, r.user_id AS userId, r.user_name AS userName,
        r.reason, r.status, r.created_at AS date, s.total
      FROM sale_void_requests r JOIN sales s ON s.id = r.sale_id ORDER BY r.created_at DESC
    `).all()
    : db.prepare(`
      SELECT r.id, r.sale_id AS saleId, r.user_id AS userId, r.user_name AS userName,
        r.reason, r.status, r.created_at AS date, s.total
      FROM sale_void_requests r JOIN sales s ON s.id = r.sale_id
      WHERE r.user_id = ? ORDER BY r.created_at DESC
    `).all(userId ?? '')
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
  if (!userId || !userName) return NextResponse.json({ error: 'Vuelve a iniciar sesión.' }, { status: 401 })
  const db = getDatabase()

  if (input.kind === 'ticket') {
    const types = ['Error de stock', 'Precio incorrecto', 'Falla del sistema', 'Otro']
    const priorities = ['Baja', 'Media', 'Alta']
    const type = typeof input.type === 'string' ? input.type : ''
    const priority = typeof input.priority === 'string' ? input.priority : ''
    const subject = typeof input.subject === 'string' ? input.subject.trim() : ''
    const description = typeof input.description === 'string' ? input.description.trim() : ''
    if (!subject || !description || !types.includes(type) || !priorities.includes(priority)) {
      return NextResponse.json({ error: 'Completa asunto, tipo, descripción y prioridad.' }, { status: 400 })
    }
    const id = createId('TKT')
    db.prepare(`
      INSERT INTO support_tickets (id, user_id, user_name, subject, type, description, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userName, subject.slice(0, 120), type, description.slice(0, 2000), priority)
    return NextResponse.json({ id }, { status: 201 })
  }

  if (input.kind === 'cancellation') {
    const saleId = typeof input.saleId === 'string' ? input.saleId : ''
    const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
    if (!saleId || !reason) return NextResponse.json({ error: 'El motivo de anulación es obligatorio.' }, { status: 400 })
    const sale = db.prepare('SELECT id, status FROM sales WHERE id = ? AND cashier_id = ?').get(saleId, userId) as { id: string; status: string } | undefined
    if (!sale || sale.status !== 'Completada') {
      return NextResponse.json({ error: 'La venta no existe o ya tiene una solicitud de anulación.' }, { status: 409 })
    }
    const pending = db.prepare("SELECT 1 FROM sale_void_requests WHERE sale_id = ? AND status = 'Pendiente'").get(saleId)
    if (pending) return NextResponse.json({ error: 'Esta venta ya tiene una solicitud pendiente.' }, { status: 409 })
    const id = createId('ANU')
    db.prepare(`
      INSERT INTO sale_void_requests (id, sale_id, user_id, user_name, reason)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, saleId, userId, userName, reason.slice(0, 1000))
    db.prepare("UPDATE sales SET status = 'Anulación solicitada' WHERE id = ?").run(saleId)
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
  const db = getDatabase()
  if (input.kind === 'ticket') {
    const id = typeof input.id === 'string' ? input.id : ''
    const status = typeof input.status === 'string' ? input.status : ''
    const responseText = typeof input.response === 'string' ? input.response.trim() : ''
    if (!id || !['En proceso', 'Resuelto'].includes(status)) {
      return NextResponse.json({ error: 'Estado de ticket no válido.' }, { status: 400 })
    }
    const result = db.prepare('UPDATE support_tickets SET status = ?, response = ? WHERE id = ?')
      .run(status, responseText || null, id)
    if (Number(result.changes) !== 1) return NextResponse.json({ error: 'No se encontró el ticket.' }, { status: 404 })
    return NextResponse.json({ success: true })
  }

  if (input.kind === 'cancellation') {
    const id = typeof input.id === 'string' ? input.id : ''
    const decision = typeof input.decision === 'string' ? input.decision : ''
    if (!id || !['Aprobada', 'Rechazada'].includes(decision)) {
      return NextResponse.json({ error: 'Decisión no válida.' }, { status: 400 })
    }
    db.exec('BEGIN IMMEDIATE')
    try {
      const requestRow = db.prepare("SELECT id, sale_id AS saleId, status FROM sale_void_requests WHERE id = ?").get(id) as { id: string; saleId: string; status: string } | undefined
      if (!requestRow || requestRow.status !== 'Pendiente') {
        db.exec('ROLLBACK')
        return NextResponse.json({ error: 'La solicitud ya fue atendida o no existe.' }, { status: 409 })
      }
      db.prepare('UPDATE sale_void_requests SET status = ? WHERE id = ?').run(decision, id)
      if (decision === 'Aprobada') {
        const items = db.prepare('SELECT product_id AS productId, qty FROM sale_items WHERE sale_id = ?').all(requestRow.saleId) as { productId: string; qty: number }[]
        for (const item of items) {
          db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(item.qty, item.productId)
          db.prepare(`
            INSERT INTO inventory_movements (id, product_id, user_id, quantity_delta, reason)
            VALUES (?, ?, ?, ?, ?)
          `).run(createId('MOV'), item.productId, request.cookies.get('auth-user')?.value ?? null, item.qty, `Anulación ${requestRow.saleId}`)
        }
        db.prepare("UPDATE sales SET status = 'Anulada' WHERE id = ?").run(requestRow.saleId)
      } else {
        db.prepare("UPDATE sales SET status = 'Completada' WHERE id = ?").run(requestRow.saleId)
      }
      db.exec('COMMIT')
    } catch (error) {
      db.exec('ROLLBACK')
      console.error('Error resolviendo solicitud de anulación:', error)
      return NextResponse.json({ error: 'No se pudo resolver la solicitud.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Tipo de solicitud no válido.' }, { status: 400 })
}
