import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section-pad text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-sage">404</p>
      <h1 className="mt-3 font-display text-4xl">Página no encontrada</h1>
      <p className="mt-3 text-ink-muted">
        El enlace no existe o el producto ya no está disponible.
      </p>
      <Link href="/" className="btn-primary mt-8 inline-flex">
        Volver al inicio
      </Link>
    </div>
  );
}
