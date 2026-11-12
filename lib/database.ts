import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { categories, products, sales, suppliers, users } from './mock-data.ts'

let connection: DatabaseSync | undefined

const demoPassword = 'senasoft'

function createSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      contact TEXT NOT NULL,
      phone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'vendedor', 'inventarista')),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      barcode TEXT NOT NULL UNIQUE,
      category_id TEXT NOT NULL REFERENCES categories(id),
      supplier_id TEXT NOT NULL REFERENCES suppliers(id),
      price INTEGER NOT NULL CHECK (price >= 0),
      cost INTEGER NOT NULL CHECK (cost >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
      tax INTEGER NOT NULL DEFAULT 0 CHECK (tax >= 0),
      unit TEXT NOT NULL DEFAULT 'und',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      sold_at TEXT NOT NULL,
      cashier_id TEXT REFERENCES users(id),
      cashier_name TEXT NOT NULL,
      customer TEXT NOT NULL,
      method TEXT NOT NULL CHECK (method IN ('Efectivo', 'Tarjeta', 'Transferencia')),
      total INTEGER NOT NULL CHECK (total >= 0),
      status TEXT NOT NULL DEFAULT 'Completada'
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL CHECK (qty > 0),
      unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
      tax_rate INTEGER NOT NULL DEFAULT 0 CHECK (tax_rate >= 0)
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      user_id TEXT REFERENCES users(id),
      quantity_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      user_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Abierto',
      response TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_void_requests (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL REFERENCES sales(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      user_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pendiente',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
    CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at);
    CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
  `)
  const productColumns = db.prepare('PRAGMA table_info(products)').all() as { name: string }[]
  if (!productColumns.some((column) => column.name === 'tax')) {
    db.exec('ALTER TABLE products ADD COLUMN tax INTEGER NOT NULL DEFAULT 0')
  }
  const saleColumns = db.prepare('PRAGMA table_info(sales)').all() as { name: string }[]
  if (!saleColumns.some((column) => column.name === 'status')) {
    db.exec("ALTER TABLE sales ADD COLUMN status TEXT NOT NULL DEFAULT 'Completada'")
  }
  const saleItemColumns = db.prepare('PRAGMA table_info(sale_items)').all() as { name: string }[]
  if (!saleItemColumns.some((column) => column.name === 'tax_rate')) {
    db.exec('ALTER TABLE sale_items ADD COLUMN tax_rate INTEGER NOT NULL DEFAULT 0')
  }
  db.exec(`
    UPDATE sales
    SET total = (
      SELECT COALESCE(SUM(qty * unit_price + ROUND(qty * unit_price * tax_rate / 100.0)), 0)
      FROM sale_items
      WHERE sale_items.sale_id = sales.id
    )
    WHERE EXISTS (SELECT 1 FROM sale_items WHERE sale_items.sale_id = sales.id)
  `)
}

function seedDemoData(db: DatabaseSync) {
  const hasProducts = db.prepare('SELECT 1 FROM products LIMIT 1').get()
  if (hasProducts) return

  db.exec('BEGIN IMMEDIATE')
  try {
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)')
    categories.forEach((category, index) => {
      insertCategory.run(`CAT-${index + 1}`, category.name, category.color)
    })

    const insertSupplier = db.prepare(
      'INSERT OR IGNORE INTO suppliers (id, name, contact, phone) VALUES (?, ?, ?, ?)',
    )
    suppliers.forEach((supplier) => {
      insertSupplier.run(supplier.id, supplier.name, supplier.contact, supplier.phone)
    })

    const insertUser = db.prepare(
      'INSERT OR IGNORE INTO users (id, name, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?, ?)',
    )
    users.forEach((user) => {
      const salt = randomBytes(16).toString('hex')
      const passwordHash = `${salt}:${scryptSync(demoPassword, salt, 64).toString('hex')}`
      const role = user.role === 'Administrador'
        ? 'admin'
        : user.role === 'Vendedor'
          ? 'vendedor'
          : 'inventarista'
      insertUser.run(user.id, user.name, user.email, passwordHash, role, user.status === 'Activo' ? 1 : 0)
    })
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (
        id, name, sku, barcode, category_id, supplier_id, price, cost, stock, min_stock, unit, tax
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const categoryIds = new Map(categories.map((category, index) => [category.name, `CAT-${index + 1}`]))
    const supplierIds = new Map(suppliers.map((supplier) => [supplier.name, supplier.id]))
    products.forEach((product) => {
      const categoryId = categoryIds.get(product.category)
      const supplierId = supplierIds.get(product.supplier)
      if (!categoryId || !supplierId) {
        throw new Error(`Falta categoría o proveedor para el producto ${product.id}`)
      }
      insertProduct.run(
        product.id,
        product.name,
        product.sku,
        product.barcode,
        categoryId,
        supplierId,
        product.price,
        product.cost,
        product.stock,
        product.minStock,
        product.unit,
        product.tax,
      )
    })

    const insertSale = db.prepare(`
      INSERT OR IGNORE INTO sales (id, sold_at, cashier_id, cashier_name, customer, method, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertSaleItem = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, product_name, qty, unit_price, tax_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    sales.forEach((sale) => {
      const cashierId = users.find((user) => user.name === sale.cashier)?.id ?? null
      insertSale.run(
        sale.id,
        `${sale.date}T${sale.time}:00`,
        cashierId,
        sale.cashier,
        sale.customer,
        sale.method,
        sale.total,
      )
      sale.items.forEach((item) => {
        const product = products.find((candidate) => candidate.id === item.productId)
        insertSaleItem.run(sale.id, item.productId, item.name, item.qty, item.price, product?.tax ?? 0)
      })
    })

    const insertMovement = db.prepare(`
      INSERT INTO inventory_movements (id, product_id, quantity_delta, reason)
      VALUES (?, ?, ?, ?)
    `)
    products.forEach((product) => {
      if (product.stock > 0) {
        insertMovement.run(randomUUID(), product.id, product.stock, 'Inventario inicial')
      }
    })

    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function seedDemoAdmin(db: DatabaseSync) {
  const salt = randomBytes(16).toString('hex')
  const passwordHash = `${salt}:${scryptSync(demoPassword, salt, 64).toString('hex')}`
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('U-ADMIN-DEMO', 'Administrador SENA', 'admin@sena.edu.co', passwordHash, 'admin', 1)
}

function seedDemoSeller(db: DatabaseSync) {
  const salt = randomBytes(16).toString('hex')
  const passwordHash = `${salt}:${scryptSync(demoPassword, salt, 64).toString('hex')}`
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('U-SELLER-DEMO', 'Vendedor Demo', 'vendedor@sena.edu.co', passwordHash, 'vendedor', 1)
}

export function getDatabase() {
  if (connection) return connection

  const databasePath = resolve(
    process.env.STOCKLY_DB_PATH || join(process.cwd(), 'data', 'stockly.sqlite'),
  )
  mkdirSync(dirname(databasePath), { recursive: true })
  const db = new DatabaseSync(databasePath)

  try {
    createSchema(db)
    seedDemoData(db)
    seedDemoAdmin(db)
    seedDemoSeller(db)
  } catch (error) {
    db.close()
    throw error
  }

  connection = db
  return db
}

export function verifyUser(email: string, password: string) {
  const row = getDatabase()
    .prepare('SELECT id, name, role, password_hash FROM users WHERE email = ? AND active = 1')
    .get(email) as { id: string; name: string; role: string; password_hash: string } | undefined

  if (!row) return null
  const [salt, storedHash] = row.password_hash.split(':')
  if (!salt || !storedHash) return null

  const actualHash = scryptSync(password, salt, 64)
  const expectedHash = Buffer.from(storedHash, 'hex')
  if (actualHash.length !== expectedHash.length || !timingSafeEqual(actualHash, expectedHash)) {
    return null
  }

  return { id: row.id, name: row.name, role: row.role }
}

export function changeUserPassword(userId: string, currentPassword: string, newPassword: string) {
  const db = getDatabase()
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ? AND active = 1')
    .get(userId) as { password_hash: string } | undefined
  if (!row) return false
  const [salt, storedHash] = row.password_hash.split(':')
  if (!salt || !storedHash) return false
  const currentHash = scryptSync(currentPassword, salt, 64)
  const expectedHash = Buffer.from(storedHash, 'hex')
  if (currentHash.length !== expectedHash.length || !timingSafeEqual(currentHash, expectedHash)) return false
  const nextSalt = randomBytes(16).toString('hex')
  const nextHash = scryptSync(newPassword, nextSalt, 64).toString('hex')
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(`${nextSalt}:${nextHash}`, userId)
  return true
}

export function createId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}
