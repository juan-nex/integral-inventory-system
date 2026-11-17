import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  for (const name of [SESSION_COOKIE, 'auth-token', 'auth-user', 'auth-name']) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  return response
}
