"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }
      window.dispatchEvent(new Event("mh:auth"));
      router.push(data.user.role === "admin" ? "/admin" : "/perfil");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-pad max-w-md">
      <h1 className="font-display text-4xl font-semibold">Entrar</h1>
      <p className="mt-2 text-sm text-ink-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-berry hover:underline">
          Regístrate
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            type="email"
            className="field"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="field pr-11"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-ink-muted transition hover:text-ink"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-berry">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
        <Link
          href="/recuperar"
          className="block text-center text-sm text-ink-muted hover:text-ink"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </form>
      <p className="mt-8 border-t border-ink/10 pt-4 text-xs text-ink-muted">
        Demo: admin@morahueso.com / Admin123! · cliente@demo.com / Cliente123!
      </p>
    </div>
  );
}
