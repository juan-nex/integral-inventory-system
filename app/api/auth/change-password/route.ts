import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const user = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (!user) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 })
  }

  let body: { currentPassword?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { currentPassword, newPassword } = body
  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    newPassword.length < 8
  ) {
    return NextResponse.json({ error: 'Datos incompletos o contraseña muy corta.' }, { status: 400 })
  }

  const userRecord = db.select().from(schema.users).where(eq(schema.users.id, user.id)).get()
  if (!userRecord || userRecord.active !== 1) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, userRecord.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta.' }, { status: 401 })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  db.update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, user.id))
    .run()

  return NextResponse.json({ success: true })
}
