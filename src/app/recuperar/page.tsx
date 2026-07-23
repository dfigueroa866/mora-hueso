"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function RecoverInner() {
  const params = useSearchParams();
  const tokenFromUrl = params.get("token") || "";
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [demoToken, setDemoToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"request" | "reset">(
    tokenFromUrl ? "reset" : "request"
  );

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error");
      return;
    }
    setMessage(data.message);
    if (data.demoToken) {
      setDemoToken(data.demoToken);
      setToken(data.demoToken);
      setMode("reset");
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const res = await fetch("/api/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error");
      return;
    }
    setMessage(data.message + " Ya puedes iniciar sesión.");
  }

  return (
    <div className="section-pad max-w-md">
      <h1 className="font-display text-4xl font-semibold">
        Recuperar contraseña
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        <Link href="/login" className="text-berry hover:underline">
          Volver al login
        </Link>
      </p>

      {mode === "request" ? (
        <form onSubmit={requestReset} className="mt-8 space-y-4">
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
          <button type="submit" className="btn-primary w-full">
            Enviar enlace
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="mt-8 space-y-4">
          <div>
            <label className="label" htmlFor="token">
              Token
            </label>
            <input
              id="token"
              className="field"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              className="field"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Guardar contraseña
          </button>
        </form>
      )}

      {demoToken && (
        <p className="mt-4 break-all rounded-sm bg-sage/10 p-3 text-xs text-sage">
          Demo token: {demoToken}
        </p>
      )}
      {message && <p className="mt-4 text-sm text-sage">{message}</p>}
      {error && <p className="mt-4 text-sm text-berry">{error}</p>}
    </div>
  );
}

export default function RecoverPage() {
  return (
    <Suspense fallback={<div className="section-pad">Cargando…</div>}>
      <RecoverInner />
    </Suspense>
  );
}
