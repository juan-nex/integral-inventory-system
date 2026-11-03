import { NextResponse } from 'next/server'
import { verifyUser } from '@/lib/database'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let credentials: { email?: unknown; password?: unknown }
  try {
    credentials = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  if (
    typeof credentials.email !== 'string'
    || typeof credentials.password !== 'string'
    || !credentials.email.trim()
    || !credentials.password
  ) {
    return NextResponse.json({ error: 'Ingresa correo y contraseña.' }, { status: 400 })
  }

  const user = verifyUser(credentials.email.trim(), credentials.password)
  if (!user) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('auth-token', user.role, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  response.cookies.set('auth-user', user.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
