# Despliegue

La tienda está pensada para **Vercel** (Next.js) y **Neon** (PostgreSQL). SQLite no es viable en el filesystem de Vercel.

## Checklist

1. Repositorio en Git conectado a Vercel.
2. Proyecto Neon con base creada.
3. Variables de entorno en Vercel (Production y Preview si aplica).
4. `prisma db push` contra Neon (URL directa) para crear tablas.
5. Datos: seed de demo **o** migración SQLite **o** carga CSV / panel admin.
6. Dominio y `NEXT_PUBLIC_APP_URL` en HTTPS.
7. Access Token de Mercado Pago de **producción** cuando dejes de usar sandbox.
8. Webhook de MP apuntando a `https://TU-DOMINIO/api/mercadopago/webhook`.

## Variables en Vercel

| Variable | Notas |
|----------|--------|
| `DATABASE_URL` | URL Neon **con pooler** (`-pooler` en el host). `sslmode=require`. |
| `JWT_SECRET` | Valor largo y aleatorio, distinto del de desarrollo. |
| `NEXT_PUBLIC_TAX_RATE` | `0.16` salvo otro IVA. |
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.com` sin barra final. |
| `MERCADOPAGO_ACCESS_TOKEN` | Token PROD (o TEST en un preview). |
| `ALLOW_DEMO_PAYMENTS` | `false` en producción real. |

`NEXT_PUBLIC_*` se incrustan en el cliente: un cambio exige **redeploy**.

## Build

`npm run build` ya ejecuta `prisma generate` antes de `next build`. El `postinstall` también genera el cliente.

El cliente se genera en `node_modules/.prisma/client-v2` con binario `rhel-openssl-3.0.x` para las funciones serverless de Vercel. No hace falta un `vercel.json` extra para Prisma si ese output y el tracing de Next están como en `next.config.js`.

Framework: Next.js. Node: **20.x**.

## Schema en Neon

Desde tu máquina, con la URL **directa** (sin pooler):

```bash
# temporal: URL directa en el entorno
npx prisma db push
```

O usa el SQL editor de Neon. No subas la URL al repo.

## Mercado Pago en producción

- `NEXT_PUBLIC_APP_URL` debe ser el dominio público HTTPS.
- En entornos no locales, la preferencia incluye `auto_return` y `notification_url` hacia `/api/mercadopago/webhook`.
- Configura la misma URL en el panel de Mercado Pago (notificaciones / IPN).
- Prueba un pago real pequeño o el flujo de TEST antes de abrir la tienda.

## Limitaciones en Vercel

- **Fotos de reseñas:** se guardan en `public/uploads/reviews/`. El disco del serverless no persiste; en producción conviene un storage (S3, Blob, etc.) si las reseñas con imagen son importantes.
- **Seed:** borra todas las tablas de la app. Nunca lo ejecutes contra producción con datos reales.
- **Preview deployments:** cada URL de preview necesita `NEXT_PUBLIC_APP_URL` coherente o los `back_urls` de MP apuntarán al dominio de Production.

## Docker solo para Postgres local

`docker-compose.yml` no despliega la app. En producción no hace falta Postgres en Docker si usas Neon.
