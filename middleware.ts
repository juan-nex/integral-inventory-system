import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const role = request.cookies.get('auth-token')?.value
  const path = request.nextUrl.pathname

  if (!role) {
    if (path === '/login') return NextResponse.next()
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (role !== 'admin' && role !== 'vendedor') {
    const response = NextResponse.redirect(new URL('/login', request.url))
    for (const cookie of ['auth-token', 'auth-user', 'auth-name']) {
      response.cookies.delete(cookie)
    }
    return response
  }

  if (path === '/login') return NextResponse.next()

  const workerRoute = path === '/trabajador' || path.startsWith('/trabajador/')
  if (workerRoute && role !== 'vendedor') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  if (!workerRoute && role !== 'admin') {
    return NextResponse.redirect(new URL('/trabajador', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
