"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo registrar");
        if (data.details) setFieldErrors(data.details);
        return;
      }
      window.dispatchEvent(new Event("mh:auth"));
      router.push("/perfil");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section-pad max-w-md">
      <h1 className="font-display text-4xl font-semibold">Crear cuenta</h1>
      <p className="mt-2 text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-berry hover:underline">
          Entrar
        </Link>
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {(
          [
            ["name", "Nombre", "text"],
            ["email", "Correo", "email"],
            ["phone", "Teléfono", "tel"],
            ["password", "Contraseña", "password"],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key}>
            <label className="label" htmlFor={key}>
              {label}
            </label>
            <input
              id={key}
              type={type}
              className="field"
              required
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
            {fieldErrors[key]?.[0] && (
              <p className="mt-1 text-xs text-berry">{fieldErrors[key][0]}</p>
            )}
          </div>
        ))}
        {error && <p className="text-sm text-berry">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando…" : "Registrarme"}
        </button>
      </form>
    </div>
  );
}
