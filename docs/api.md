# API

Rutas en `src/app/api`. JSON salvo import/export CSV y el `multipart` de reseñas e importación.

La sesión va en la cookie `mh_session`. Las rutas de admin comprueban `role === "admin"`.

## Auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Alta de cliente |
| `POST` | `/api/auth/login` | No | Inicia sesión |
| `POST` | `/api/auth/logout` | Cookie | Cierra sesión |
| `GET` | `/api/auth/me` | Cookie | Usuario actual |
| `POST` | `/api/auth/recover` | No | Pide reset; con `{ token, password }` aplica la nueva clave. En demo incluye `demoToken`. |

Contraseña: mínimo 8 caracteres, una mayúscula y un número.

## Perfil

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/profile` | Usuario | Perfil, direcciones y últimos pedidos |
| `PUT` | `/api/profile` | Usuario | Actualiza nombre/teléfono, o `action: "address"` para crear/editar dirección |

## Productos (tienda)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/products` | No | Catálogo activo. Query: `category`, `ingredient`, `minPrice`, `maxPrice`, `q`. `admin=1` incluye inactivos. |
| `POST` | `/api/products` | Admin | Crea producto |
| `GET` | `/api/products/[id]` | No | Ficha (solo `active`) |
| `PUT` | `/api/products/[id]` | Admin | Actualiza (campos parciales) |
| `DELETE` | `/api/products/[id]` | Admin | Baja lógica (`active: false`) |

## Pedidos y pagos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/orders` | Opcional | Checkout: reserva stock, crea pedido `pending_payment`, devuelve `checkoutUrl` (MP o demo) |
| `GET` | `/api/orders/mine` | Usuario | Pedidos del usuario |
| `GET` | `/api/orders/tracking/[tracking]` | No | Pedido por número `MH-######` |
| `GET` | `/api/orders/first-purchase?email=` | No | Si el correo aplica al 10 % de bienvenida |
| `POST` | `/api/mercadopago/sync` | No | Sincroniza tras volver de MP o de `/pago/demo` (`trackingNumber`, `paymentId` o `demoStatus`) |
| `POST` / `GET` | `/api/mercadopago/webhook` | No | Notificaciones MP (payment / IPN). Responde `{ ok: true }` siempre para evitar reintentos en bucle. |

Cuerpo típico de checkout: ítems (`productId`, `quantity`), datos de envío y facturación, `shippingMethod` (`standard` \| `express`). Validación en `src/lib/validators.ts`.

## Reseñas

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/reviews` | No | Lista paginada (`page`, 5 por página), promedio |
| `POST` | `/api/reviews` | Cliente | `multipart/form-data`: rating, título, comentario, `productId`, fotos |

## Legal

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/legal` | Admin | Lista de documentos |
| `GET` | `/api/legal/[slug]` | No | Documento público |
| `PUT` | `/api/legal/[slug]` | Admin | Actualiza título y Markdown |

Slugs: `privacidad`, `terminos`, `envios`, `devoluciones`.

## Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/dashboard` | Productos, últimos pedidos, alertas de stock, KPIs |
| `GET` | `/api/admin/sales` | Reporte. Query: `from`, `to` (`YYYY-MM-DD`, zona México), `productId` |
| `GET` | `/api/admin/sales/export` | CSV. `kind=detail` o `kind=summary` + mismos filtros |
| `GET` | `/api/admin/products/template` | CSV de plantilla |
| `POST` | `/api/admin/products/import` | CSV (`multipart` campo `file` o cuerpo texto) |
| `POST` | `/api/admin/products/bulk-delete` | `{ ids: string[] }` — baja lógica |

Todas requieren admin. El reporte de ventas solo cuenta pedidos `paid`, `shipped` y `confirmed`.
