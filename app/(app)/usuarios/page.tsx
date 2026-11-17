'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Shield, Search, Pencil, Trash2, Check } from 'lucide-react'
import { Card, Badge, PageHeader, Modal, Field, inputClass } from '@/components/kit'

type UserRole = 'admin' | 'trabajador'
type UserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  active: number
  sales: number
}

async function loadUsers() {
  const response = await fetch('/api/users')
  const result = await response.json() as UserRow[] | { error?: string }
  if (!response.ok || !Array.isArray(result)) {
    throw new Error(!Array.isArray(result) ? result.error || 'No se pudieron cargar los usuarios.' : 'No se pudieron cargar los usuarios.')
  }
  return result
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setUsers(await loadUsers())
  }

  useEffect(() => {
    let active = true
    void loadUsers().then((rows) => {
      if (active) setUsers(rows)
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los usuarios.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const filtered = users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase()),
  )

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const body: Record<string, string> = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      role: String(form.get('role') || 'trabajador'),
    }
    const password = String(form.get('password') || '')
    if (password) body.password = password

    try {
      const response = await fetch(editing ? `/api/users/${editing.id}` : '/api/users', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el usuario.')
      await refresh()
      setOpen(false)
      setEditing(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar el usuario.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(user: UserRow) {
    setError('')
    const deleting = user.active === 1
    if (deleting && !window.confirm(`¿Suspender la cuenta de ${user.name}?`)) return
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: deleting ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        ...(deleting ? {} : { body: JSON.stringify({ active: true }) }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error || 'No se pudo actualizar el usuario.')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el usuario.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="Usuarios y roles"
        subtitle="Administra las cuentas y los permisos del sistema."
        actions={
          <button
            onClick={() => { setEditing(null); setError(''); setOpen(true) }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <UserPlus className="size-4" />
            Nuevo usuario
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { role: 'Administrador', description: 'Acceso total a inventario, ventas, usuarios y configuración.', tone: 'accent' as const },
          { role: 'Trabajador', description: 'Opera ventas e inventario compartido; solo consulta y modifica sus propios registros.', tone: 'success' as const },
        ].map((item) => (
          <Card key={item.role} className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-secondary"><Shield className="size-[18px]" /></span>
              <div><p className="font-medium">{item.role}</p><Badge tone={item.tone}>Rol del sistema</Badge></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
          </Card>
        ))}
      </div>

      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      <Card className="flex items-center gap-2 p-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Search className="size-4 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario por nombre o correo..." className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
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
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Cargando usuarios…</td></tr>
                : filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
                        <div><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={user.role === 'admin' ? 'accent' : 'success'}>{user.role === 'admin' ? 'Administrador' : 'Trabajador'}</Badge></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><span className={`size-2 rounded-full ${user.active ? 'bg-success' : 'bg-muted-foreground'}`} />{user.active ? 'Activo' : 'Suspendido'}</span></td>
                    <td className="px-4 py-3 text-right tabular-nums">{user.sales}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditing(user); setError(''); setOpen(true) }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={`Editar ${user.name}`}><Pencil className="size-4" /></button>
                        <button onClick={() => void toggleActive(user)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={user.active ? `Suspender ${user.name}` : `Reactivar ${user.name}`}>
                          {user.active ? <Trash2 className="size-4" /> : <Check className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay usuarios que coincidan.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null) }}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        description="Gestiona los datos y el rol de acceso."
        footer={
          <>
            <button onClick={() => { setOpen(false); setEditing(null) }} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Cancelar</button>
            <button type="submit" form="user-form" disabled={busy} className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-60">{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario'}</button>
          </>
        }
      >
        <form id="user-form" onSubmit={saveUser} className="space-y-4">
          <Field label="Nombre completo"><input name="name" required minLength={2} maxLength={100} defaultValue={editing?.name} className={inputClass} /></Field>
          <Field label="Correo electrónico"><input name="email" type="email" required defaultValue={editing?.email} className={inputClass} /></Field>
          <Field label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
            <input name="password" type="password" minLength={8} required={!editing} autoComplete="new-password" className={inputClass} placeholder={editing ? 'Dejar en blanco para conservarla' : 'Mínimo 8 caracteres'} />
          </Field>
          <Field label="Rol">
            <select name="role" defaultValue={editing?.role || 'trabajador'} className={inputClass}>
              <option value="trabajador">Trabajador</option>
              <option value="admin">Administrador</option>
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  )
}
