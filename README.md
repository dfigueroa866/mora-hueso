# Mora & Hueso — Tienda de premios para perros

Stack: Next.js 14 · React · Tailwind CSS · Prisma · SQLite · Zustand · Zod · Jose

## Arranque

```bash
npm install
npm run db:setup
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Credenciales demo

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@morahueso.com | Admin123! |
| Cliente | cliente@demo.com | Cliente123! |

## Funcionalidades

- Catálogo con filtros (categoría, tamaño de perro, precio, ingredientes)
- Detalle de producto con stock en tiempo real
- Panel admin: CRUD, stock bajo, historial de ventas
- Carga masiva de inventario por CSV (plantilla descargable en Admin)
- Registro, login, recuperación de contraseña, perfil
- Carrito, checkout con impuestos, envío y confirmación
