import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  for (const name of ['auth-token', 'auth-user', 'auth-name']) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
  return response
}
