'use client'

import { useState } from 'react'
import { Store, Palette, Bell, ShieldCheck, Sun, Moon } from 'lucide-react'
import { Card, PageHeader, Field, inputClass } from '@/components/kit'
import { useTheme } from '@/components/theme-provider'

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-muted'}`}
      role="switch"
      aria-checked={on}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme()
  const [notif, setNotif] = useState({ lowStock: true, dailyReport: true, newSale: false })

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="Configuración" subtitle="Personaliza tu plataforma y preferencias del negocio" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Store className="size-5 text-accent" />
            <h3 className="font-semibold">Información del negocio</h3>
          </div>
          <div className="space-y-4">
            <Field label="Nombre del negocio">
              <input className={inputClass} defaultValue="Minimercado La Esquina" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="NIT / Documento">
                <input className={inputClass} defaultValue="900.123.456-7" />
              </Field>
              <Field label="Teléfono">
                <input className={inputClass} defaultValue="310 555 0100" />
              </Field>
            </div>
            <Field label="Dirección">
              <input className={inputClass} defaultValue="Calle 45 # 12-30, Bogotá" />
            </Field>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              Guardar cambios
            </button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="size-5 text-accent" />
              <h3 className="font-semibold">Apariencia</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${theme === 'light' ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-muted'}`}
              >
                <Sun className="size-4" /> Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${theme === 'dark' ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-muted'}`}
              >
                <Moon className="size-4" /> Oscuro
              </button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="size-5 text-accent" />
              <h3 className="font-semibold">Notificaciones</h3>
            </div>
            <ul className="space-y-4">
              {[
                { key: 'lowStock' as const, label: 'Alertas de stock bajo', desc: 'Recibe avisos cuando un producto llegue al mínimo.' },
                { key: 'dailyReport' as const, label: 'Reporte diario', desc: 'Resumen de ventas al cierre del día.' },
                { key: 'newSale' as const, label: 'Nueva venta', desc: 'Notificación por cada venta registrada.' },
              ].map((n) => (
                <li key={n.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground">{n.desc}</p>
                  </div>
                  <Toggle on={notif[n.key]} onToggle={() => setNotif((s) => ({ ...s, [n.key]: !s[n.key] }))} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck className="size-5 text-accent" />
              <h3 className="font-semibold">Seguridad</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              La confiabilidad de los datos está garantizada (RQNF003). Autenticación por roles activa.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
