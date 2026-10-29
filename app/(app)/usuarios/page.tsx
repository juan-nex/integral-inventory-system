'use client'

import { useState } from 'react'
import { UserPlus, Shield, Search, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Card, Badge, PageHeader, Modal, Field, inputClass } from '@/components/kit'
import { users as seedUsers, type User } from '@/lib/mock-data'

const roleTone = {
  Administrador: 'accent' as const,
  Vendedor: 'success' as const,
  Inventarista: 'warning' as const,
}

const roles = [
  { name: 'Administrador', desc: 'Control total: usuarios, reportes, configuración e inventario.', perms: 12 },
  { name: 'Vendedor', desc: 'Registro de ventas, consulta de productos y punto de venta.', perms: 5 },
  { name: 'Inventarista', desc: 'Gestión de inventario, productos y alertas de stock.', perms: 7 },
]

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(seedUsers)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()),
  )

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nu: User = {
      id: `U-0${users.length + 1}`,
      name: String(fd.get('name') || 'Nuevo usuario'),
      email: String(fd.get('email') || 'usuario@stockly.co'),
      role: (String(fd.get('role')) as User['role']) || 'Vendedor',
      status: 'Activo',
      lastActive: 'Recién creado',
      sales: 0,
    }
    setUsers((prev) => [nu, ...prev])
    setOpen(false)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Usuarios y roles"
        subtitle="Administra el acceso al sistema · RQF002 / CU_02"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <UserPlus className="size-4" />
            Nuevo usuario
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((r) => (
          <Card key={r.name} className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary">
                <Shield className="size-[18px]" />
              </span>
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.perms} permisos</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{r.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="flex items-center gap-2 p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuario por nombre o correo..."
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuario</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Ventas</th>
                <th className="px-4 py-3 font-medium">Última actividad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                        {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge tone={roleTone[u.role]}>{u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className={`size-2 rounded-full ${u.status === 'Activo' ? 'bg-success' : 'bg-muted-foreground'}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.sales}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.lastActive}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Editar">
                        <Pencil className="size-4" />
                      </button>
                      <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Eliminar">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo usuario"
        description="Crea un usuario y asigna su rol de acceso."
        footer={
          <>
            <button onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" form="user-form" className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              Crear usuario
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleCreate} className="space-y-4">
          <Field label="Nombre completo">
            <input name="name" required className={inputClass} placeholder="Ej: Laura Gómez" />
          </Field>
          <Field label="Correo electrónico">
            <input name="email" type="email" required className={inputClass} placeholder="laura@stockly.co" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contraseña">
              <input name="password" type="password" className={inputClass} placeholder="••••••••" />
            </Field>
            <Field label="Rol">
              <select name="role" className={inputClass}>
                <option>Vendedor</option>
                <option>Inventarista</option>
                <option>Administrador</option>
              </select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  )
}
