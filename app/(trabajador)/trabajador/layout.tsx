import { cookies } from 'next/headers'
import { WorkerShell } from '@/components/trabajador/worker-shell'

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  return (
    <WorkerShell
      userId={cookieStore.get('auth-user')?.value || ''}
      name={cookieStore.get('auth-name')?.value || 'Vendedor'}
    >
      {children}
    </WorkerShell>
  )
}
