import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import * as schema from '@/db/schema'

export function isLastActiveAdmin(
  userId: string,
  nextRole: 'admin' | 'trabajador',
  nextActive: number,
) {
  const current = db.select().from(schema.users).where(eq(schema.users.id, userId)).get()
  if (!current || current.role !== 'admin' || current.active !== 1) return false
  if (nextRole === 'admin' && nextActive === 1) return false
  const admins = db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.users)
    .where(sql`${schema.users.role} = 'admin' AND ${schema.users.active} = 1`)
    .get()
  return (admins?.count || 0) <= 1
}
