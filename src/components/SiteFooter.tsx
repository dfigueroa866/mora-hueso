import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function SocialIcon({
  name,
  className,
}: {
  name: (typeof SOCIAL_LINKS)[number]["name"];
  className?: string;
}) {
  if (name === "Facebook") {
    return <Facebook className={className} strokeWidth={1.8} fill="currentColor" />;
  }
  if (name === "Instagram") {
    return <Instagram className={className} strokeWidth={1.8} />;
  }
  return <WhatsAppIcon className={className} />;
}

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
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                title={social.name}
                className="flex h-10 w-10 items-center justify-center text-white transition hover:opacity-90 hover:brightness-110"
                style={
                  social.name === "Instagram"
                    ? {
                        backgroundImage:
                          "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                      }
                    : { backgroundColor: social.color }
                }
              >
                <SocialIcon name={social.name} className="h-4 w-4" />
              </a>
            ))}
          </div>
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
          <a
            href="https://wa.me/524493916199"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-[#25D366] hover:underline"
          >
            WhatsApp: 449 391 6199
          </a>
        </div>
      </div>
      <div className="border-t border-bone/10 py-4 text-center text-xs text-bone/40">
        © {new Date().getFullYear()} Mora & Hueso
      </div>
    </footer>
  );
}
