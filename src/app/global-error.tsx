"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f6f1e8] px-4 py-16 text-[#1a1614]">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8b3a4a]">
            Error
          </p>
          <h1 className="mt-3 font-serif text-4xl">Algo salió mal</h1>
          <p className="mt-3 text-sm text-[#1a1614]/99">
            {error.message || "Ocurrió un error inesperado."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 inline-flex bg-[#8b3a4a] px-5 py-2.5 text-sm text-[#f6f1e8]"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
