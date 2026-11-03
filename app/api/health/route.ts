import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export const runtime = 'nodejs'

export async function GET() {
  const db = getDatabase()
  const products = db.prepare('SELECT COUNT(*) AS count FROM products').get() as { count: number }
  const sales = db.prepare('SELECT COUNT(*) AS count FROM sales').get() as { count: number }
  return NextResponse.json({
    status: 'ok',
    database: 'SQLite',
    products: products.count,
    sales: sales.count,
  })
}
