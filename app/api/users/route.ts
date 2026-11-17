import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

function requireAdmin(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!user) return { response: NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 }) }
  if (user.role !== 'admin') {
    return { response: NextResponse.json({ error: 'Solo administración puede gestionar usuarios.' }, { status: 403 }) }
  }
  return { user }
}

export async function GET(request: NextRequest) {
  const access = requireAdmin(request)
  if (access.response) return access.response

  const users = db.select({
    id: schema.users.id,
    name: schema.users.name,
    email: schema.users.email,
    role: schema.users.role,
    active: schema.users.active,
  }).from(schema.users).all()
  const sales = db.select({
    userId: schema.sales.userId,
    count: sql<number>`COUNT(*)`,
  }).from(schema.sales).groupBy(schema.sales.userId).all()
  const salesByUser = new Map(sales.map((sale) => [sale.userId, sale.count]))

  return NextResponse.json(users.map((user) => ({
    ...user,
    role: user.role === 'admin' ? 'admin' : 'trabajador',
    sales: salesByUser.get(user.id) || 0,
  })))
}

export async function POST(request: NextRequest) {
  const access = requireAdmin(request)
  if (access.response) return access.response

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
  const password = typeof input.password === 'string' ? input.password : ''
  const role = input.role === 'admin' || input.role === 'trabajador' ? input.role : null
  if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || !role) {
    return NextResponse.json({ error: 'Revisa nombre, correo, rol y contraseña (mínimo 8 caracteres).' }, { status: 400 })
  }

  try {
    const id = `U-${randomUUID()}`
    db.insert(schema.users).values({
      id,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      active: 1,
    }).run()
    return NextResponse.json({ id, name, email, role, active: 1, sales: 0 }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo.' }, { status: 409 })
    }
    console.error('Error creando usuario:', error)
    return NextResponse.json({ error: 'No se pudo crear el usuario.' }, { status: 500 })
  }
}

