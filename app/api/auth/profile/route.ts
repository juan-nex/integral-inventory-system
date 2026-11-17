import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!user) return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })

  let input: { name?: unknown }
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  const name = typeof input.name === 'string' ? input.name.trim() : ''
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'El nombre debe tener entre 2 y 100 caracteres.' }, { status: 400 })
  }

  db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id)).run()
  return NextResponse.json({ success: true, name })
}
