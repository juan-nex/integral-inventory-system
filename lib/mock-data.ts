export type StockStatus = 'ok' | 'low' | 'out'

export type Product = {
  id: string
  name: string
  sku: string
  barcode: string
  category: string
  supplier: string
  price: number
  cost: number
  stock: number
  minStock: number
  unit: string
}

export type SaleItem = {
  productId: string
  name: string
  qty: number
  price: number
}

export type Sale = {
  id: string
  date: string
  time: string
  cashier: string
  customer: string
  items: SaleItem[]
  total: number
  method: 'Efectivo' | 'Tarjeta' | 'Transferencia'
}

export type User = {
  id: string
  name: string
  email: string
  role: 'Administrador' | 'Vendedor' | 'Inventarista'
  status: 'Activo' | 'Inactivo'
  lastActive: string
  sales: number
}

export const categories = [
  { name: 'Bebidas', color: '#3b82f6', count: 42 },
  { name: 'Snacks', color: '#10b981', count: 38 },
  { name: 'Lácteos', color: '#f59e0b', count: 27 },
  { name: 'Aseo', color: '#6366f1', count: 31 },
  { name: 'Panadería', color: '#ef4444', count: 19 },
  { name: 'Granos', color: '#14b8a6', count: 24 },
]

export const suppliers = [
  { id: 'SUP-01', name: 'Distribuidora El Progreso', contact: 'Carlos Méndez', phone: '310 555 0142', products: 48 },
  { id: 'SUP-02', name: 'Alimentos La Cosecha', contact: 'Marta Ríos', phone: '311 555 0198', products: 33 },
  { id: 'SUP-03', name: 'Bebidas Andinas S.A.', contact: 'Julián Torres', phone: '312 555 0110', products: 27 },
  { id: 'SUP-04', name: 'Aseo Total Ltda.', contact: 'Diana Peña', phone: '313 555 0176', products: 21 },
]

export const products: Product[] = [
  { id: 'P-1001', name: 'Coca-Cola 400ml', sku: 'BEB-COC-400', barcode: '7702004003457', category: 'Bebidas', supplier: 'Bebidas Andinas S.A.', price: 2500, cost: 1700, stock: 128, minStock: 40, unit: 'und' },
  { id: 'P-1002', name: 'Agua Cristal 600ml', sku: 'BEB-AGU-600', barcode: '7702535000123', category: 'Bebidas', supplier: 'Bebidas Andinas S.A.', price: 1800, cost: 1100, stock: 18, minStock: 30, unit: 'und' },
  { id: 'P-1003', name: 'Papas Margarita Pollo', sku: 'SNK-MAR-POL', barcode: '7702025101234', category: 'Snacks', supplier: 'Distribuidora El Progreso', price: 2200, cost: 1500, stock: 64, minStock: 25, unit: 'und' },
  { id: 'P-1004', name: 'Leche Alpina 1L', sku: 'LAC-ALP-1L', barcode: '7702001042198', category: 'Lácteos', supplier: 'Alimentos La Cosecha', price: 4200, cost: 3200, stock: 6, minStock: 20, unit: 'und' },
  { id: 'P-1005', name: 'Yogurt Alpina Fresa', sku: 'LAC-YOG-FRE', barcode: '7702001098765', category: 'Lácteos', supplier: 'Alimentos La Cosecha', price: 3500, cost: 2500, stock: 42, minStock: 15, unit: 'und' },
  { id: 'P-1006', name: 'Jabón Rey 300g', sku: 'ASE-REY-300', barcode: '7702011223344', category: 'Aseo', supplier: 'Aseo Total Ltda.', price: 3200, cost: 2100, stock: 0, minStock: 12, unit: 'und' },
  { id: 'P-1007', name: 'Pan Tajado Bimbo', sku: 'PAN-BIM-TAJ', barcode: '7702099001122', category: 'Panadería', supplier: 'Distribuidora El Progreso', price: 5800, cost: 4200, stock: 22, minStock: 10, unit: 'und' },
  { id: 'P-1008', name: 'Arroz Diana 500g', sku: 'GRA-DIA-500', barcode: '7702123400998', category: 'Granos', supplier: 'Alimentos La Cosecha', price: 2900, cost: 2000, stock: 88, minStock: 30, unit: 'und' },
  { id: 'P-1009', name: 'Detergente Fab 1kg', sku: 'ASE-FAB-1K', barcode: '7702011990011', category: 'Aseo', supplier: 'Aseo Total Ltda.', price: 9800, cost: 7100, stock: 14, minStock: 15, unit: 'und' },
  { id: 'P-1010', name: 'Gaseosa Postobón 1.5L', sku: 'BEB-POS-15', barcode: '7702004556677', category: 'Bebidas', supplier: 'Bebidas Andinas S.A.', price: 4500, cost: 3100, stock: 56, minStock: 20, unit: 'und' },
  { id: 'P-1011', name: 'Galletas Festival', sku: 'SNK-FES-CHO', barcode: '7702025667788', category: 'Snacks', supplier: 'Distribuidora El Progreso', price: 1500, cost: 950, stock: 9, minStock: 20, unit: 'und' },
  { id: 'P-1012', name: 'Café Sello Rojo 250g', sku: 'GRA-SEL-250', barcode: '7702123998877', category: 'Granos', supplier: 'Alimentos La Cosecha', price: 7200, cost: 5400, stock: 33, minStock: 15, unit: 'und' },
]

export function stockStatus(p: Product): StockStatus {
  if (p.stock <= 0) return 'out'
  if (p.stock <= p.minStock) return 'low'
  return 'ok'
}

export const sales: Sale[] = [
  { id: 'V-20481', date: '2026-07-09', time: '09:14', cashier: 'Laura Gómez', customer: 'Cliente general', method: 'Efectivo', total: 12800, items: [{ productId: 'P-1001', name: 'Coca-Cola 400ml', qty: 2, price: 2500 }, { productId: 'P-1007', name: 'Pan Tajado Bimbo', qty: 1, price: 5800 }, { productId: 'P-1002', name: 'Agua Cristal 600ml', qty: 1, price: 1800 }] },
  { id: 'V-20480', date: '2026-07-09', time: '08:52', cashier: 'Andrés Ruiz', customer: 'María Fernanda', method: 'Tarjeta', total: 21500, items: [{ productId: 'P-1004', name: 'Leche Alpina 1L', qty: 3, price: 4200 }, { productId: 'P-1012', name: 'Café Sello Rojo 250g', qty: 1, price: 7200 }] },
  { id: 'V-20479', date: '2026-07-09', time: '08:31', cashier: 'Laura Gómez', customer: 'Cliente general', method: 'Efectivo', total: 6900, items: [{ productId: 'P-1003', name: 'Papas Margarita Pollo', qty: 2, price: 2200 }, { productId: 'P-1011', name: 'Galletas Festival', qty: 1, price: 1500 }, { productId: 'P-1002', name: 'Agua Cristal 600ml', qty: 1, price: 1000 }] },
  { id: 'V-20478', date: '2026-07-08', time: '19:05', cashier: 'Andrés Ruiz', customer: 'José Palacio', method: 'Transferencia', total: 18400, items: [{ productId: 'P-1010', name: 'Gaseosa Postobón 1.5L', qty: 2, price: 4500 }, { productId: 'P-1009', name: 'Detergente Fab 1kg', qty: 1, price: 9800 }] },
  { id: 'V-20477', date: '2026-07-08', time: '18:22', cashier: 'Laura Gómez', customer: 'Cliente general', method: 'Efectivo', total: 8700, items: [{ productId: 'P-1008', name: 'Arroz Diana 500g', qty: 3, price: 2900 }] },
  { id: 'V-20476', date: '2026-07-08', time: '16:40', cashier: 'Camila Vega', customer: 'Cliente general', method: 'Tarjeta', total: 15300, items: [{ productId: 'P-1005', name: 'Yogurt Alpina Fresa', qty: 3, price: 3500 }, { productId: 'P-1001', name: 'Coca-Cola 400ml', qty: 2, price: 2400 }] },
]

export const users: User[] = [
  { id: 'U-01', name: 'Laura Gómez', email: 'laura.gomez@stockly.co', role: 'Vendedor', status: 'Activo', lastActive: 'Hace 2 min', sales: 184 },
  { id: 'U-02', name: 'Andrés Ruiz', email: 'andres.ruiz@stockly.co', role: 'Vendedor', status: 'Activo', lastActive: 'Hace 15 min', sales: 152 },
  { id: 'U-03', name: 'Camila Vega', email: 'camila.vega@stockly.co', role: 'Inventarista', status: 'Activo', lastActive: 'Hace 1 h', sales: 41 },
  { id: 'U-04', name: 'Diego Martínez', email: 'diego.martinez@stockly.co', role: 'Administrador', status: 'Activo', lastActive: 'Hace 5 h', sales: 96 },
  { id: 'U-05', name: 'Paula Ortiz', email: 'paula.ortiz@stockly.co', role: 'Vendedor', status: 'Inactivo', lastActive: 'Hace 8 días', sales: 63 },
]

export const salesTrend = [
  { day: 'Lun', ventas: 620000, meta: 700000 },
  { day: 'Mar', ventas: 815000, meta: 700000 },
  { day: 'Mié', ventas: 740000, meta: 700000 },
  { day: 'Jue', ventas: 910000, meta: 700000 },
  { day: 'Vie', ventas: 1180000, meta: 700000 },
  { day: 'Sáb', ventas: 1420000, meta: 700000 },
  { day: 'Dom', ventas: 690000, meta: 700000 },
]

export const hourlyToday = [
  { h: '8a', v: 120000 },
  { h: '9a', v: 210000 },
  { h: '10a', v: 180000 },
  { h: '11a', v: 260000 },
  { h: '12p', v: 340000 },
  { h: '1p', v: 290000 },
  { h: '2p', v: 220000 },
  { h: '3p', v: 310000 },
]

export const categoryPerformance = categories.map((c, i) => ({
  name: c.name,
  color: c.color,
  value: [820, 610, 430, 380, 240, 300][i],
}))

export const topProducts = [
  { name: 'Coca-Cola 400ml', units: 342, revenue: 855000 },
  { name: 'Pan Tajado Bimbo', units: 210, revenue: 1218000 },
  { name: 'Leche Alpina 1L', units: 198, revenue: 831600 },
  { name: 'Gaseosa Postobón 1.5L', units: 176, revenue: 792000 },
  { name: 'Arroz Diana 500g', units: 154, revenue: 446600 },
]

export const monthlyRevenue = [
  { m: 'Ene', v: 18200000 },
  { m: 'Feb', v: 17100000 },
  { m: 'Mar', v: 19800000 },
  { m: 'Abr', v: 21200000 },
  { m: 'May', v: 20400000 },
  { m: 'Jun', v: 23600000 },
  { m: 'Jul', v: 24900000 },
]

export const activity = [
  { id: 1, text: 'Laura Gómez registró la venta V-20481', time: 'Hace 2 min', type: 'sale' as const },
  { id: 2, text: 'Stock bajo detectado en Leche Alpina 1L', time: 'Hace 12 min', type: 'alert' as const },
  { id: 3, text: 'Camila Vega actualizó el inventario de Arroz Diana', time: 'Hace 34 min', type: 'inventory' as const },
  { id: 4, text: 'Jabón Rey 300g se agotó', time: 'Hace 1 h', type: 'alert' as const },
  { id: 5, text: 'Diego Martínez generó el reporte mensual', time: 'Hace 3 h', type: 'report' as const },
]

export const currency = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

export const compactCurrency = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}
