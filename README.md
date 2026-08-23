# Mora & Hueso — Tienda de premios para perros

Stack: Next.js 14 · React · Tailwind CSS · Prisma · SQLite · Zustand · Zod · Jose · Mercado Pago

## Arranque

```bash
npm install
cp .env.example .env   # si aún no tienes .env
npm run db:setup
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### Credenciales demo

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@morahueso.com | Admin123! |
| Cliente | cliente@demo.com | Cliente123! |

## Mercado Pago

El checkout usa **Checkout Pro**:

1. Se crea el pedido en estado `pending_payment` (stock reservado).
2. Se genera una preferencia de Mercado Pago y el cliente es redirigido a pagar.
3. Al volver, `/confirmacion` sincroniza el estado. El webhook `/api/mercadopago/webhook` también actualiza el pedido.
4. Si el pago se rechaza/cancela, se libera el stock.

### Variables

| Variable | Descripción |
|----------|-------------|
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de prueba o producción (panel de desarrolladores MP México) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (HTTPS en producción; usada en `back_urls` y webhook) |
| `ALLOW_DEMO_PAYMENTS` | `true` por defecto. Si no hay token, usa `/pago/demo` para simular cobro local |

Sin token, el flujo abre la página demo para aprobar/rechazar el pago.

## Funcionalidades

- Catálogo con filtros (categoría, tamaño de perro, precio, ingredientes)
- Detalle de producto con stock en tiempo real
- Panel admin: CRUD, stock bajo, historial de ventas, políticas legales
- Carga masiva de inventario por CSV
- Registro, login, recuperación de contraseña, perfil
- Carrito, envío, checkout con Mercado Pago
- Promo de bienvenida: 10% en la primera compra (por correo)
- Reseñas con fotos (clientes) y paginación
