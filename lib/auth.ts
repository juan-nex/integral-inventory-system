import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const SESSION_COOKIE = 'auth-session'
export const SESSION_MAX_AGE = 60 * 60 * 8

export type UserRole = 'admin' | 'trabajador'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

type SessionPayload = {
  sub: string
  exp: number
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32 || secret === 'senasoft-stockly-secret-key-32chars-min!!') {
    throw new Error('SESSION_SECRET debe tener al menos 32 caracteres.')
  }
  return secret
}

function normalizeRole(role: string): UserRole | null {
  if (role === 'admin') return 'admin'
  if (role === 'trabajador' || role === 'vendedor' || role === 'inventarista') return 'trabajador'
  return null
}

export function createSessionToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  })).toString('base64url')
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifySessionToken(token?: string): AuthUser | null {
  if (!token) return null
  const [payloadPart, signaturePart, extraPart] = token.split('.')
  if (!payloadPart || !signaturePart || extraPart !== undefined) return null

  const expected = createHmac('sha256', sessionSecret()).update(payloadPart).digest()
  const supplied = Buffer.from(signaturePart, 'base64url')
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as SessionPayload
  } catch {
    return null
  }
  if (typeof payload.sub !== 'string' || !payload.sub || !Number.isInteger(payload.exp) || payload.exp <= Date.now() / 1000) {
    return null
  }

  const user = db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      active: schema.users.active,
    })
    .from(schema.users)
    .where(eq(schema.users.id, payload.sub))
    .get()
  const role = user && normalizeRole(user.role)
  if (!user || user.active !== 1 || !role) return null

  return { id: user.id, name: user.name, email: user.email, role }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value)
}
