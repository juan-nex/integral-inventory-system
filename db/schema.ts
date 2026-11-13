import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 1. users: id, nombre, email único, password_hash, rol, activo, created_at
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'vendedor', 'inventarista'] }).notNull().default('vendedor'),
  active: integer('active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 2. categories: id, nombre, color
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#3b82f6'),
})

// 3. suppliers: id, nombre, contacto, teléfono
export const suppliers = sqliteTable('suppliers', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  contact: text('contact').notNull(),
  phone: text('phone').notNull(),
})

// 4. products: id, sku único, barcode único, nombre, category_id, supplier_id, costo, precio, impuesto_pct, stock, stock_minimo, unit, activo, created_at, updated_at
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  barcode: text('barcode').notNull().unique(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id),
  price: integer('price').notNull().default(0), // Entero en pesos COP
  cost: integer('cost').notNull().default(0),   // Entero en pesos COP
  taxPct: integer('tax_pct').notNull().default(0), // Impuesto porcentaje (ej. 19 para 19%)
  stock: integer('stock').notNull().default(0),
  minStock: integer('min_stock').notNull().default(0),
  unit: text('unit').notNull().default('und'),
  active: integer('active').notNull().default(1),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 5. sales: id, folio único, user_id, método_pago, estado, customer, subtotal, impuesto, total, created_at
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey(), // Ej: "V-20481"
  folio: text('folio').notNull().unique(), // Folio único consecutivo
  userId: text('user_id').references(() => users.id),
  cashierName: text('cashier_name').notNull(),
  customer: text('customer').notNull().default('Cliente general'),
  paymentMethod: text('payment_method', { enum: ['Efectivo', 'Tarjeta', 'Transferencia'] }).notNull(),
  status: text('status', { enum: ['Completada', 'Anulación solicitada', 'Anulada'] }).notNull().default('Completada'),
  subtotal: integer('subtotal').notNull().default(0),
  tax: integer('tax').notNull().default(0),
  total: integer('total').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 6. sale_items: sale_id, product_id, product_name, cantidad, precio_unitario, impuesto_pct (copia inmutable del momento)
export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: text('sale_id').notNull().references(() => sales.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  taxPct: integer('tax_pct').notNull().default(0),
})

// 7. inventory_movements: product_id, tipo (entrada, salida, ajuste, merma), cantidad, motivo, user_id, created_at
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id),
  type: text('type', { enum: ['entrada', 'salida', 'ajuste', 'merma'] }).notNull(),
  quantity: integer('quantity').notNull(), // Cantidad positiva movida o delta absoluto
  reason: text('reason').notNull(),
  userId: text('user_id').references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 8. tickets para panel de trabajador y soporte
export const tickets = sqliteTable('tickets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  userName: text('user_name').notNull(),
  subject: text('subject').notNull(),
  type: text('type', { enum: ['Error de stock', 'Precio incorrecto', 'Falla del sistema', 'Otro'] }).notNull(),
  description: text('description').notNull(),
  priority: text('priority', { enum: ['Baja', 'Media', 'Alta'] }).notNull().default('Media'),
  status: text('status', { enum: ['Abierto', 'En proceso', 'Resuelto'] }).notNull().default('Abierto'),
  response: text('response'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 9. notices: avisos generales para el panel
export const notices = sqliteTable('notices', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

// 10. sale_void_requests: solicitudes de anulación de venta del vendedor
export const saleVoidRequests = sqliteTable('sale_void_requests', {
  id: text('id').primaryKey(),
  saleId: text('sale_id').notNull().references(() => sales.id),
  userId: text('user_id').notNull().references(() => users.id),
  userName: text('user_name').notNull(),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['Pendiente', 'Aprobada', 'Rechazada'] }).notNull().default('Pendiente'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

