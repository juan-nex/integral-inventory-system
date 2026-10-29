import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware para proteger las rutas de la aplicación
export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value
  const isLoginPage = request.nextUrl.pathname === '/login'

  // Si no está autenticado y no está en la página de login, redirigir al login
  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si ya está autenticado y trata de entrar al login, redirigir al dashboard
  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (authToken && !isLoginPage) {
    const role = authToken
    const path = request.nextUrl.pathname

    if (role === 'vendedor') {
      const allowed = ['/', '/pos', '/ventas', '/inventario', '/alertas', '/productos']
      if (!allowed.includes(path) && path !== '/') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } else if (role === 'inventarista') {
      const allowed = ['/', '/inventario', '/alertas', '/productos', '/proveedores']
      if (!allowed.includes(path) && path !== '/') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return NextResponse.next()
}

// Configurar en qué rutas se debe ejecutar el middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
