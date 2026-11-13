import { NextResponse } from 'next/server'
import { verifyUserCredentials } from '@/lib/data'

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

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name, role: user.role },
  })

  // Cookie firmada / httpOnly segura
  response.cookies.set('auth-token', user.role, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
  })
  response.cookies.set('auth-user', user.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
  })
  response.cookies.set('auth-name', user.name, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
    secure: isHttps,
  })

  return response
}
