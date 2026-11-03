const { getDatabase } = require('../lib/database.ts')

const db = getDatabase()
const products = db.prepare('SELECT COUNT(*) AS count FROM products').get().count
const sales = db.prepare('SELECT COUNT(*) AS count FROM sales').get().count
const users = db.prepare('SELECT COUNT(*) AS count FROM users').get().count

console.log(`SQLite lista en data/stockly.sqlite`)
console.log(`Productos: ${products} | Ventas: ${sales} | Usuarios: ${users}`)
