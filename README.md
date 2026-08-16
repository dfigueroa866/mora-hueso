# Mora & Hueso — Tienda de premios para perros

Stack: Next.js 14 · React · Tailwind CSS · Prisma · SQLite · Zustand · Zod · Jose · Mercado Pago

## Arranque

```bash
npm install
cp .env.example .env
# Completa MERCADOPAGO_ACCESS_TOKEN con tu Access Token de prueba
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
- Pago con Mercado Pago (Checkout Pro) + webhook de confirmación

## Mercado Pago

1. Crea una aplicación en [Mercado Pago Developers](https://www.mercadopago.com.mx/developers).
2. Copia el **Access Token** de prueba a `MERCADOPAGO_ACCESS_TOKEN`.
3. Define `NEXT_PUBLIC_APP_URL` con la URL pública (en local, usa un túnel si quieres probar el webhook).
4. Endpoints:
   - `POST /api/mercadopago/preference` — crea pedido pendiente + preferencia y devuelve `initPoint`
   - `POST /api/mercadopago/webhook` — recibe notificaciones y actualiza el estado del pedido
