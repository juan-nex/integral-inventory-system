import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { userId?: unknown; currentPassword?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { userId, currentPassword, newPassword } = body
  if (
    typeof userId !== 'string' ||
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    newPassword.length < 6
  ) {
    return NextResponse.json({ error: 'Datos incompletos o contraseña muy corta.' }, { status: 400 })
  }

  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()
  if (!user || user.active !== 1) {
    return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 })
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Contraseña actual incorrecta.' }, { status: 401 })
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  db.update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, userId))
    .run()

  return NextResponse.json({ success: true })
}
