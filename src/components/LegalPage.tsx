import Link from "next/link";
import type { ReactNode } from "react";
import { LEGAL_META, LEGAL_SLUGS } from "@/lib/legal";

const LEGAL_LINKS = LEGAL_SLUGS.map((slug) => ({
  href: LEGAL_META[slug].href,
  label: LEGAL_META[slug].navLabel,
}));

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="section-pad">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:pt-2">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">
            Avisos legales
          </p>
          <nav className="mt-4 space-y-2" aria-label="Documentos legales">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm text-ink/75 transition hover:text-berry"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">
            Mora & Hueso
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Última actualización: {updated}
          </p>
          <div className="legal-prose mt-10 space-y-6 text-sm leading-relaxed text-ink/85">
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}
