"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="section-pad text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-berry">Error</p>
      <h1 className="mt-3 font-display text-4xl">No se pudo cargar esta página</h1>
      <p className="mt-3 text-ink-muted">
        {error.message || "Intenta de nuevo en un momento."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={reset}>
          Reintentar
        </button>
        <Link href="/" className="btn-ghost">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
