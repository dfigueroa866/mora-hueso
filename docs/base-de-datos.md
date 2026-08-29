# Base de datos

El datasource de Prisma es **PostgreSQL**. SQLite (`file:`) está rechazado en runtime: `src/lib/db.ts` lanza error si `DATABASE_URL` empieza por `file:`.

## Cliente Prisma

El generador escribe en `node_modules/.prisma/client-v2` (no en el cliente por defecto). Así el bundle de Vercel incluye los binarios correctos.

- `binaryTargets`: `native` (desarrollo) y `rhel-openssl-3.0.x` (Vercel).
- Webpack y `tsconfig` resuelven `@prisma-client` a esa carpeta.
- `outputFileTracingIncludes` en `next.config.js` empaqueta esos archivos en el deploy.

Tras clonar o cambiar el schema:

```bash
npm install          # postinstall → prisma generate
npm run db:push      # sincroniza tablas
```

No hay carpeta `prisma/migrations`. El esquema se aplica con `db push`. Si más adelante versionas migraciones, usa `prisma migrate`.

## Modelos

| Modelo | Rol |
|--------|-----|
| `User` | Cuenta (`customer` / `admin`), token de reset |
| `Address` | Direcciones de envío del usuario |
| `Product` | Catálogo; `active` es la baja lógica |
| `Order` | Pedido, importes, envío, ids de Mercado Pago |
| `OrderItem` | Línea; conserva nombre/SKU si se borra el producto |
| `Review` / `ReviewPhoto` | Reseñas y fotos |
| `LegalDocument` | Políticas editables (`privacidad`, `terminos`, `envios`, `devoluciones`) |

Estados de pedido: `pending_payment`, `paid`, `cancelled`, `shipped`, `confirmed`.

Al crear el pedido se descuenta stock. Si pasa a `cancelled` desde `pending_payment`, el stock se restaura. Un pedido ya `paid` o `shipped` no se cancela por el webhook.

## Postgres local (Docker)

```bash
docker compose up -d
```

URL típica:

```
postgresql://postgres:postgres@localhost:5432/morahueso?schema=public
```

Datos persistentes en el volumen Docker `morahueso-pg`.

## Neon (producción / Vercel)

1. Crea un proyecto en [Neon](https://neon.tech) (región cercana a los usuarios, p. ej. un centro de EE. UU. o LatAm).
2. Copia la connection string.
3. En Vercel y en Prisma **runtime** usa la URL del **pooler** (host con `-pooler.`).
4. Para `prisma db push`, scripts o la migración Python, usa la URL **directa** (sin `-pooler`) si el pooler da problemas de prepared statements o `channel_binding`.

Ejemplo de forma (no es un secreto real):

```
# Runtime (Vercel)
DATABASE_URL="postgresql://USER:PASS@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Push / migración (directa)
DATABASE_URL="postgresql://USER:PASS@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"
```

## Migración desde SQLite

Si aún tienes `prisma/dev.db` de una versión anterior:

1. Apunta `DATABASE_URL` a Postgres (Neon o Docker).
2. Aplica el schema: `npm run db:push`.
3. Instala `psycopg2` (o `psycopg2-binary`) en Python 3.
4. Ejecuta:

```bash
python scripts/migrate-sqlite-to-neon.py
```

El script:

- Lee `.env` si las variables no están ya en el entorno.
- Convierte la URL con `-pooler` a host directo y quita `channel_binding=require`.
- Hace `TRUNCATE … CASCADE` de las tablas de la app y copia: `User`, `Product`, `LegalDocument`, `Address`, `Order`, `OrderItem`, `Review`, `ReviewPhoto`.
- Convierte booleanos y fechas de SQLite a tipos Postgres.

**Esto borra el contenido actual de esas tablas en Postgres.** Úsalo una vez, con copia de seguridad si Neon ya tiene datos.

## Seed

`prisma/seed.ts` **vacía** reseñas, pedidos, direcciones, productos, usuarios y documentos legales, y luego inserta el catálogo de ejemplo, usuarios demo, políticas y un histórico de ventas para el panel admin.

Úsalo solo en local o en un Neon de pruebas. En producción aplica el schema con `db:push` y carga el catálogo desde el admin o el CSV.
