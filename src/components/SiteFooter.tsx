import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-bone">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
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
              <Link href="/#reseñas" className="hover:text-bone">
                Reseñas
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
            Legal
          </p>
          <ul className="mt-3 space-y-2 text-sm text-bone/80">
            <li>
              <Link href="/legal/privacidad" className="hover:text-bone">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/legal/terminos" className="hover:text-bone">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/legal/envios" className="hover:text-bone">
                Política de envíos
              </Link>
            </li>
            <li>
              <Link href="/legal/devoluciones" className="hover:text-bone">
                Cambios y devoluciones
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
