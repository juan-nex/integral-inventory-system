import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'
import { isLastActiveAdmin } from '@/lib/user-admin'

export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

function adminResponse(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administración puede gestionar usuarios.' }, { status: 403 })
  }
  return null
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const denied = adminResponse(request)
  if (denied) return denied
  const { id } = await params
  const current = db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!current) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  const name = input.name === undefined ? undefined : typeof input.name === 'string' ? input.name.trim() : null
  const email = input.email === undefined ? undefined : typeof input.email === 'string' ? input.email.trim().toLowerCase() : null
  const role = input.role === undefined ? undefined : input.role === 'admin' || input.role === 'trabajador' ? input.role : null
  const active = input.active === undefined ? undefined : input.active === true ? 1 : input.active === false ? 0 : null
  const password = input.password === undefined ? undefined : typeof input.password === 'string' ? input.password : null
  if (
    (name !== undefined && (name === null || name.length < 2 || name.length > 100)) ||
    (email !== undefined && (email === null || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
    (role !== undefined && role === null) ||
    (active !== undefined && active === null) ||
    (password !== undefined && (password === null || password.length < 8))
  ) {
    return NextResponse.json({ error: 'Hay campos inválidos. La contraseña debe tener mínimo 8 caracteres.' }, { status: 400 })
  }

  if (name === undefined && email === undefined && role === undefined && active === undefined && password === undefined) {
    return NextResponse.json({ error: 'No se enviaron cambios.' }, { status: 400 })
  }

  const nextRole = role ?? (current.role === 'admin' ? 'admin' : 'trabajador')
  const nextActive = active ?? current.active
  if (isLastActiveAdmin(id, nextRole, nextActive)) {
    return NextResponse.json({ error: 'No se puede desactivar o cambiar el rol del último administrador activo.' }, { status: 409 })
  }

  const updates: {
    name?: string
    email?: string
    role?: 'admin' | 'trabajador'
    active?: number
    passwordHash?: string
  } = {}
  if (name !== undefined) updates.name = name
  if (email !== undefined) updates.email = email
  if (role !== undefined) updates.role = role
  if (active !== undefined) updates.active = active
  if (password !== undefined) updates.passwordHash = await bcrypt.hash(password, 10)

  try {
    db.update(schema.users).set(updates).where(eq(schema.users.id, id)).run()
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese correo.' }, { status: 409 })
    }
    console.error('Error actualizando usuario:', error)
    return NextResponse.json({ error: 'No se pudo actualizar el usuario.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const denied = adminResponse(request)
  if (denied) return denied
  const { id } = await params
  const current = db.select().from(schema.users).where(eq(schema.users.id, id)).get()
  if (!current) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  if (isLastActiveAdmin(id, current.role === 'admin' ? 'admin' : 'trabajador', 0)) {
    return NextResponse.json({ error: 'No se puede eliminar el último administrador activo.' }, { status: 409 })
  }
  db.update(schema.users).set({ active: 0 }).where(eq(schema.users.id, id)).run()
  return NextResponse.json({ success: true })
}
