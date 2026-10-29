import { AppShell } from '@/components/app-shell'
import { cookies } from 'next/headers'

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const role = cookieStore.get('auth-token')?.value || 'admin'
  return <AppShell role={role}>{children}</AppShell>
}
