import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categoryLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { stock: "asc" },
  });
  const alerts = products.filter((p) => p.stock <= p.lowStockAt);
  const outOfStock = alerts.filter((p) => p.stock <= 0).length;

  return (
    <div className="section-pad space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm text-ink-muted transition hover:text-ink"
        >
          ← Administración
        </Link>
        <h1 className="mt-3 font-display text-4xl font-semibold">
          Alertas de stock
        </h1>
        <p className="mt-2 text-ink-muted">
          Productos activos en o por debajo de su umbral de alerta.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-ink/10 bg-white/60 px-4 py-5">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
            Alertas
          </p>
          <p className="mt-2 font-display text-3xl">{alerts.length}</p>
        </div>
        <div className="border border-ink/10 bg-white/60 px-4 py-5">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
            Agotados
          </p>
          <p className="mt-2 font-display text-3xl">{outOfStock}</p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <p className="text-ink-muted">No hay productos con stock bajo.</p>
      ) : (
        <div className="overflow-hidden rounded-sm border border-ink/10 bg-white/70">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink-muted">
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Categoría</th>
                <th className="px-3 py-2 font-medium text-right">Stock</th>
                <th className="px-3 py-2 font-medium text-right">Alerta en</th>
                <th className="px-3 py-2 font-medium text-right">Estado</th>
                <th className="px-3 py-2 font-medium text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((p) => (
                <tr key={p.id} className="border-b border-ink/5">
                  <td className="px-3 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3 font-mono text-xs text-ink-muted">
                    {p.sku}
                  </td>
                  <td className="px-3 py-3 text-ink-muted">
                    {categoryLabel(p.category)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {p.stock}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-ink-muted">
                    {p.lowStockAt}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-berry">
                    {p.stock <= 0 ? "Agotado" : `${p.stock} uds`}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      href={`/admin?editar=${p.id}`}
                      className="text-xs font-medium text-berry hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
