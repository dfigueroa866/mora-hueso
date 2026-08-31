"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="section-pad text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Algo salió mal
      </h1>
      <p className="mt-3 text-ink-muted">
        No se pudo cargar esta página. Intenta de nuevo.
      </p>
      <button type="button" className="btn-primary mt-6" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
