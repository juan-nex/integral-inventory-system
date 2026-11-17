import { NextResponse } from 'next/server'
import { verifyUserCredentials } from '@/lib/data'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let credentials: { email?: unknown; password?: unknown }
  try {
    credentials = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }

  if (
    typeof credentials.email !== 'string' ||
    typeof credentials.password !== 'string' ||
    !credentials.email.trim() ||
    !credentials.password
  ) {
    return NextResponse.json({ error: 'Ingresa correo y contraseña.' }, { status: 400 })
  }

  const user = await verifyUserCredentials(credentials.email.trim(), credentials.password)
  if (!user) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 })
  }

  const isHttps =
    request.headers.get('x-forwarded-proto')?.split(',')[0].trim() === 'https' ||
    new URL(request.url).protocol === 'https:'

  const role = user.role === 'admin' ? 'admin' : 'trabajador'
  const response = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, role },
  })

  response.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: '/',
    sameSite: 'strict',
    secure: isHttps,
  })

  return response
}
