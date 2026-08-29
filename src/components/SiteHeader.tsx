"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
} | null;

const links = [
  { href: "/#catalogo", label: "Catálogo" },
  { href: "/carrito", label: "Carrito" },
  { href: "/perfil", label: "Mi cuenta" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const [user, setUser] = useState<User>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const refreshUser = useCallback(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setMounted(true);
    refreshUser();
  }, [pathname, refreshUser]);

  useEffect(() => {
    function onAuthChange() {
      refreshUser();
    }
    function onVisible() {
      if (document.visibilityState === "visible") refreshUser();
    }
    window.addEventListener("mh:auth", onAuthChange);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onAuthChange);
    return () => {
      window.removeEventListener("mh:auth", onAuthChange);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onAuthChange);
    };
  }, [refreshUser]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.dispatchEvent(new Event("mh:auth"));
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-bone/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
        <Link href="/" className="group min-w-0">
          <span className="block truncate font-display text-xl font-semibold tracking-tight text-ink transition group-hover:text-berry sm:text-2xl">
            Mora & Hueso
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-ink-muted transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-berry transition hover:text-berry-deep"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <button onClick={logout} className="btn-ghost hidden sm:inline-flex">
              Salir
            </button>
          ) : (
            <Link href="/login" className="btn-ghost hidden sm:inline-flex">
              Entrar
            </Link>
          )}
          <Link href="/carrito" className="relative btn-ink px-3">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {mounted && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[10px] font-semibold text-bone">
                {count}
              </span>
            )}
          </Link>
          <button
            className="btn-ghost px-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "border-t border-ink/10 bg-bone md:hidden",
          open ? "block animate-fade-in" : "hidden"
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-sm px-3 py-2 text-sm hover:bg-ink/5"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-sm px-3 py-2 text-sm text-berry"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          )}
          {user ? (
            <button
              onClick={logout}
              className="rounded-sm px-3 py-2 text-left text-sm hover:bg-ink/5"
            >
              Salir
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-sm px-3 py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
