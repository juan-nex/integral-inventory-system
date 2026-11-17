import { AppShell } from '@/components/app-shell'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return <AppShell role={user.role} name={user.name} userId={user.id}>{children}</AppShell>
}
