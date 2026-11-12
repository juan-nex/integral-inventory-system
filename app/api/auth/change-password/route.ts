import { NextRequest, NextResponse } from 'next/server'
import { changeUserPassword } from '@/lib/database'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('auth-user')?.value
  if (!userId || request.cookies.get('auth-token')?.value !== 'vendedor') {
    return NextResponse.json({ error: 'Debes iniciar sesión como vendedor.' }, { status: 401 })
  }
  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'El cuerpo de la solicitud no es JSON válido.' }, { status: 400 })
  }
  const currentPassword = typeof input.currentPassword === 'string' ? input.currentPassword : ''
  const newPassword = typeof input.newPassword === 'string' ? input.newPassword : ''
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
  }
  if (!changeUserPassword(userId, currentPassword, newPassword)) {
    return NextResponse.json({ error: 'La contraseña actual no es correcta.' }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
