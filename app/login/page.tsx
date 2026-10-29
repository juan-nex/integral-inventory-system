'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Boxes, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Field, inputClass } from '@/components/kit'

export default function LoginPage() {
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('admin@sena.edu.co')
  const [password, setPassword] = useState('senasoft')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    let role = 'admin'
    if (email.includes('vendedor') || email.includes('trabajador')) role = 'vendedor'
    if (email.includes('inventarista')) role = 'inventarista'

    setTimeout(() => {
      document.cookie = `auth-token=${role}; path=/; max-age=86400` // 1 day
      router.push('/')
      router.refresh()
    }, 900)
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Boxes className="size-6" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">SENA Inventario</p>
              <p className="text-xs text-primary-foreground/70">Gestión de stock y ventas</p>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-balance text-3xl font-semibold leading-tight">
              Controla tu inventario en tiempo real
            </h1>
            <p className="text-pretty text-sm text-primary-foreground/80">
              Registra productos, gestiona ventas y recibe alertas automáticas de stock bajo
              desde un solo lugar.
            </p>
          </div>
          <p className="text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} Servicio Nacional de Aprendizaje
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </div>
            <p className="font-semibold">SENA Inventario</p>
          </div>

          <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder al panel.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Correo electrónico">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="tucorreo@sena.edu.co"
              />
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" defaultChecked className="size-4 rounded border-border accent-primary" />
                Recordarme
              </label>
              <button type="button" className="font-medium text-accent hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              {loading ? 'Ingresando…' : 'Ingresar al panel'}
            </button>

            <div className="mt-4 flex flex-col gap-2 text-center text-xs text-muted-foreground">
              <p>Demo: usa las credenciales precargadas o selecciona un rol:</p>
              <div className="flex justify-center gap-2">
                <button type="button" onClick={() => setEmail('admin@sena.edu.co')} className="rounded border px-2 py-1 hover:bg-muted">Admin</button>
                <button type="button" onClick={() => setEmail('vendedor@sena.edu.co')} className="rounded border px-2 py-1 hover:bg-muted">Vendedor</button>
                <button type="button" onClick={() => setEmail('inventarista@sena.edu.co')} className="rounded border px-2 py-1 hover:bg-muted">Inventarista</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
