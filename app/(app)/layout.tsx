import { AppShell } from '@/components/app-shell'
import { cookies } from 'next/headers'

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const role = cookieStore.get('auth-token')?.value || 'admin'
  const name = cookieStore.get('auth-name')?.value || 'Administrador'
  return <AppShell role={role} name={name}>{children}</AppShell>
}
