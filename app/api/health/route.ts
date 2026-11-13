import { NextResponse } from 'next/server'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const productsCount = db.select({ count: sql<number>`count(*)` }).from(schema.products).get()?.count || 0
    const salesCount = db.select({ count: sql<number>`count(*)` }).from(schema.sales).get()?.count || 0

    return NextResponse.json({
      status: 'ok',
      database: 'SQLite (Drizzle ORM)',
      counts: {
        products: productsCount,
        sales: salesCount,
      },
    })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 })
  }
}
