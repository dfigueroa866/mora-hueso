# Desarrollo local

## Requisitos

- **Node.js 20** (el campo `engines` de `package.json` y `.nvmrc` lo fijan)
- **npm**
- **Docker Desktop** (Postgres 16 vía `docker-compose.yml`)
- Cuenta de Mercado Pago solo si vas a probar Checkout Pro real

Con [nvm](https://github.com/nvm-sh/nvm) o [nvm-windows](https://github.com/coreybutler/nvm-windows):

```bash
nvm use
```

## Primer arranque

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:setup
npm run dev
```

`db:setup` ejecuta `prisma db push` y el seed (`prisma/seed.ts`): productos de ejemplo, un año de pedidos de demo, documentos legales y usuarios demo.

**Cuidado:** el seed hace `deleteMany` de reseñas, pedidos, direcciones, productos, usuarios y políticas. No lo ejecutes contra Neon de producción si ya hay datos reales.

La app queda en [http://localhost:3000](http://localhost:3000).

`next.config.js` permite orígenes de túnel (`*.trycloudflare.com`, `loca.lt`) para previsualizar en móvil.

## Scripts npm

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo Next.js |
| `npm run build` | `prisma generate` + `next build` |
| `npm start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run db:push` | Aplica el schema Prisma a Postgres (sin migraciones versionadas) |
| `npm run db:seed` | Carga datos iniciales |
| `npm run db:setup` | `db:push` + `db:seed` |
| `postinstall` | Genera el cliente Prisma (también corre tras `npm install`) |

Los scripts invocan Next y Prisma con rutas explícitas bajo `node_modules` para que funcionen en entornos donde el binario global no está en el `PATH`.

## Postgres con Docker

`docker-compose.yml` levanta `postgres:16-alpine` en el puerto **5432**, base `morahueso`, usuario y contraseña `postgres`. El volumen `morahueso-pg` conserva los datos entre reinicios.

```bash
docker compose up -d      # iniciar
docker compose down       # parar (conserva el volumen)
docker compose down -v    # parar y borrar datos
```

`DATABASE_URL` en `.env.example` apunta a esa instancia.

## Autenticación

- Cookie HTTP-only `mh_session`, JWT HS256 (jose), vigencia 7 días.
- Roles: `admin` y `customer`.
- Contraseñas con bcrypt.
- Recuperación: token de un uso, 1 hora. En desarrollo la API devuelve `demoToken` / `demoResetUrl` porque no hay envío de correo.

Cambia `JWT_SECRET` antes de cualquier entorno compartido.

## Carrito y promo de primera compra

- El carrito vive en el cliente (Zustand + `persist` en `localStorage`).
- Primera compra: no hay pedidos previos en estado `paid`, `shipped` o `confirmed` con el mismo correo (facturación o invitado). Descuento del 10 % sobre el subtotal de productos; el IVA se calcula sobre el subtotal ya descontado.
- El anuncio de bienvenida se marca en `sessionStorage` (`mh_first_purchase_announcement_v2`).

## Envíos e IVA

Definidos en `src/lib/constants.ts`:

| Método | Costo (MXN) | Estimado |
|--------|-------------|----------|
| Estándar | 79 | 3–5 días hábiles |
| Exprés | 149 | 1–2 días hábiles |

IVA: `NEXT_PUBLIC_TAX_RATE` (16 % por defecto). Moneda: MXN.

## Reseñas

Solo clientes autenticados. Hasta 4 fotos (JPEG, PNG, WebP, GIF), 4 MB cada una, en `public/uploads/reviews/`. Ese directorio no se versiona (salvo `.gitkeep`). En Vercel el disco es efímero: las fotos subidas en runtime no persisten entre deploys.

## Inventario CSV

Columnas: `name`, `description`, `price`, `category`, `stock`, `sku`, `supplier`, `packageSize`, `ingredients`, `nutrition`, `image`, `lowStockAt`.

- Categorías válidas: `naturales`, `galletas`, `huesos`, `dentales`.
- `nutrition` es JSON en una celda (por ejemplo `{"protein":"14%","fat":"8%"}`).
- Acepta `,` o `;` como delimitador.
- Plantilla: `public/plantilla-productos-mora-hueso.csv` o `GET /api/admin/products/template`.
- Importar: panel admin o `POST /api/admin/products/import`.
- SKU duplicado actualiza el producto existente.

## Estructura

```
prisma/                 schema, seed
scripts/                migración SQLite → Postgres
src/app/                App Router (páginas y API)
src/components/         UI
src/lib/                db, auth, pedidos, MP, validadores
public/                 estáticos y plantilla CSV
docker-compose.yml
.next.config.js
```

Alias TypeScript: `@/*` → `src/*`, `@prisma-client` → cliente Prisma generado en `node_modules/.prisma/client-v2`.
