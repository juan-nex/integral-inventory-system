import { DashboardAdmin } from '@/components/dashboard-admin'
import { WorkerPageScreen } from '@/components/trabajador/worker-pages'
import { getCurrentUser } from '@/lib/auth'
import { db, schema } from '@/db'

function sumSales(rows: typeof schema.sales.$inferSelect[]) {
  return rows.filter((sale) => sale.status !== 'Anulada').reduce((total, sale) => total + sale.total, 0)
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role === 'trabajador') return <WorkerPageScreen page="home" />

  const sales = db.select().from(schema.sales).all()
  const products = db.select().from(schema.products).all()
  const users = db.select().from(schema.users).all()
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const weekStartDate = new Date(now)
  weekStartDate.setUTCDate(weekStartDate.getUTCDate() - 6)
  const weekStart = weekStartDate.toISOString().slice(0, 10)
  const month = today.slice(0, 7)
  const salesToday = sales.filter((sale) => sale.createdAt.slice(0, 10) === today)
  const salesThisWeek = sales.filter((sale) => sale.createdAt.slice(0, 10) >= weekStart && sale.createdAt.slice(0, 10) <= today)
  const salesThisMonth = sales.filter((sale) => sale.createdAt.startsWith(month))
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStartDate)
    date.setUTCDate(date.getUTCDate() + index)
    const key = date.toISOString().slice(0, 10)
    return {
      label: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(date),
      value: sumSales(sales.filter((sale) => sale.createdAt.slice(0, 10) === key)),
    }
  })
  const lowStock = products
    .filter((product) => product.active === 1 && product.stock <= product.minStock)
    .map(({ id, name, stock, minStock }) => ({ id, name, stock, minStock }))
    .slice(0, 8)
  const recentSales = sales
    .slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 5)
    .map(({ id, cashierName, total, createdAt, status }) => ({ id, cashierName, total, createdAt, status }))

  return (
    <DashboardAdmin
      name={user.name}
      stats={{
        todayRevenue: sumSales(salesToday),
        weekRevenue: sumSales(salesThisWeek),
        monthRevenue: sumSales(salesThisMonth),
        inventoryValue: products.reduce((sum, product) => sum + product.cost * product.stock, 0),
        workerCount: users.filter((entry) => entry.active === 1 && entry.role !== 'admin').length,
        trend,
        lowStock,
        recentSales,
      }}
    />
  )
}
