import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-bone">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-2xl font-semibold">Mora & Hueso</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-bone/70">
            Premios limpios para perros curiosos. Ingredientes simples, stock
            real y envíos a toda la República.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-bone/50">
            Explorar
          </p>
          <ul className="mt-3 space-y-2 text-sm text-bone/80">
            <li>
              <Link href="/#catalogo" className="hover:text-bone">
                Catálogo
              </Link>
            </li>
            <li>
              <Link href="/envio" className="hover:text-bone">
                Envíos
              </Link>
            </li>
            <li>
              <Link href="/registro" className="hover:text-bone">
                Crear cuenta
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-bone/50">
            Contacto
          </p>
          <p className="mt-3 text-sm text-bone/80">hola@morahueso.com</p>
          <p className="text-sm text-bone/80">CDMX · México</p>
        </div>
      </div>
      <div className="border-t border-bone/10 py-4 text-center text-xs text-bone/40">
        © {new Date().getFullYear()} Mora & Hueso
      </div>
    </footer>
  );
}
