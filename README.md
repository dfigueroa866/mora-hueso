# Mora & Hueso — Tienda de premios para perros

Tienda en línea de premios naturales, galletas, huesos y snacks dentales. Incluye catálogo, carrito, checkout con Mercado Pago, cuentas de cliente y un panel de administración.

**Stack:** Next.js 14 · React 18 · Tailwind CSS · Prisma 5 · PostgreSQL · Zustand · Zod · Jose · Mercado Pago

> SQLite ya no se usa. En local corre PostgreSQL con Docker; en producción, Neon (u otro Postgres compatible). SQLite no funciona en Vercel.

## Documentación

| Guía | Contenido |
|------|-----------|
| [Desarrollo](docs/desarrollo.md) | Arranque local, scripts, estructura del proyecto |
| [Base de datos](docs/base-de-datos.md) | Prisma, Docker, Neon, migración desde SQLite |
| [Despliegue](docs/despliegue.md) | Vercel, variables de entorno, URL con pooler |
| [API](docs/api.md) | Rutas HTTP, autenticación y roles |

## Arranque rápido

Requiere **Node.js 20** (ver `.nvmrc`) y **Docker** para Postgres local.

```bash
nvm use          # o instala Node 20
cp .env.example .env
docker compose up -d
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

Cámbialas en producción. `npm run db:seed` **borra todos los datos** de la app y vuelve a cargar el catálogo, usuarios y pedidos de demo.

## Variables de entorno

Copia `.env.example` a `.env`. Nunca subas `.env` al repositorio.

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres. Local: `postgresql://postgres:postgres@localhost:5432/morahueso?schema=public`. En Neon/Vercel usa la URL **con `-pooler`** para el runtime. |
| `JWT_SECRET` | Secreto para firmar la cookie de sesión (`mh_session`). Cámbialo en producción. |
| `NEXT_PUBLIC_TAX_RATE` | IVA (por defecto `0.16`). |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (HTTPS en producción). Se usa en `back_urls` y el webhook de Mercado Pago. |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de prueba o producción (panel de desarrolladores MP México). |
| `ALLOW_DEMO_PAYMENTS` | `true` por defecto. Si no hay token, el checkout usa `/pago/demo`. |

## Mercado Pago

El checkout usa **Checkout Pro**:

1. Se crea el pedido en `pending_payment` y se reserva stock.
2. Se genera una preferencia de Mercado Pago y el cliente es redirigido a pagar.
3. Al volver, `/confirmacion` sincroniza el estado. El webhook `POST/GET /api/mercadopago/webhook` también actualiza el pedido.
4. Si el pago se rechaza o cancela, se libera el stock.

Sin `MERCADOPAGO_ACCESS_TOKEN`, el flujo abre `/pago/demo` para aprobar o rechazar el cobro en local (requiere `ALLOW_DEMO_PAYMENTS` distinto de `false`).

El descuento de primera compra se prorratea en las líneas de producto de la preferencia: Mercado Pago no acepta `unit_price` negativo.

## Funcionalidades

- Catálogo con filtros (categoría, precio, ingredientes)
- Detalle de producto con stock
- Panel admin: CRUD de productos, stock bajo, historial de ventas, políticas legales
- Carga masiva de inventario por CSV y baja lógica en lote
- Registro, login, recuperación de contraseña, perfil y direcciones
- Carrito (Zustand + persistencia local), envío y checkout
- Promo de bienvenida: 10 % sobre el subtotal en la primera compra (por correo, pedidos `paid` / `shipped` / `confirmed`)
- Reseñas con fotos (clientes autenticados) y paginación
- Sellos de confianza en la portada (100 % natural, envíos a México, pago seguro, hecho en México)

## Rutas de la tienda

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio y catálogo |
| `/productos/[id]` | Ficha de producto |
| `/carrito` | Carrito |
| `/envio` | Dirección y método de envío |
| `/checkout` | Datos de facturación y pago |
| `/pago/demo` | Cobro simulado (solo sin token MP) |
| `/confirmacion` | Resultado del pago |
| `/login` `/registro` `/recuperar` | Autenticación |
| `/perfil` | Cuenta, direcciones y pedidos |
| `/legal/[slug]` | Privacidad, términos, envíos, devoluciones |
| `/admin` | Panel de administración |
| `/admin/alertas` | Productos con stock bajo |

## Licencia

Uso privado del proyecto Mora & Hueso.
