# Stockly

## Desarrollo local

Requiere Node.js 22.13 o superior.

```bash
npm install
npm run db:init
npm run dev
```

Abre `http://localhost:3000/login`. La ruta de inicio de sesión forma parte de
`app/login/page.tsx`; si ves un 404 después de actualizar el proyecto, detén el
servidor de desarrollo y vuelve a iniciarlo desde esta carpeta con `npm run dev`.

La base SQLite se guarda en `data/stockly.sqlite`. Se crea y se llena con los
datos de demostración si aún no existe. Ejecutar `npm run db:init` otra vez no
borra los productos ni las ventas guardadas. Para elegir otra ubicación, define
la variable `STOCKLY_DB_PATH`.

## Acceso de demostración

- Administrador: `admin@sena.edu.co`
- Contraseña: `senasoft`

Las cuentas de demostración de vendedor e inventarista también usan la
contraseña `senasoft`. Las contraseñas se guardan en SQLite como hashes.

La base contiene las tablas `categories`, `suppliers`, `users`, `products`,
`sales`, `sale_items` e `inventory_movements`. El catálogo y el historial de
ventas se consultan desde SQLite; los productos nuevos también se guardan allí.
El POS registra la venta y descuenta existencias dentro de una transacción para
evitar stock negativo.
