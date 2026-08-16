"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LEGAL_META, LEGAL_SLUGS, type LegalSlug } from "@/lib/legal";

type LegalDoc = {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
  href: string;
};

export function AdminPolicies() {
  const [docs, setDocs] = useState<LegalDoc[]>([]);
  const [slug, setSlug] = useState<LegalSlug>("privacidad");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/legal");
      if (res.status === 401) {
        setError("No autorizado");
        return;
      }
      const data = await res.json();
      const list = (data.documents || []) as LegalDoc[];
      setDocs(list);
      const current =
        list.find((d) => d.slug === slug) ||
        list.find((d) => d.slug === "privacidad") ||
        list[0];
      if (current) {
        setSlug(current.slug as LegalSlug);
        setTitle(current.title);
        setContent(current.content);
      }
    } catch {
      setError("No se pudieron cargar las políticas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectDoc(next: LegalSlug) {
    const doc = docs.find((d) => d.slug === next);
    setSlug(next);
    setError("");
    setMsg("");
    if (doc) {
      setTitle(doc.title);
      setContent(doc.content);
    } else {
      setTitle(LEGAL_META[next].title);
      setContent("");
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch(`/api/legal/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo guardar");
        return;
      }
      setMsg(`“${data.document.title}” actualizada`);
      setDocs((prev) =>
        prev.map((d) =>
          d.slug === slug
            ? {
                ...d,
                title: data.document.title,
                content: data.document.content,
                updatedAt: data.document.updatedAt,
              }
            : d
        )
      );
    } catch {
      setError("Error de red al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Cargando políticas…</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="space-y-2">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
          Documentos
        </p>
        {LEGAL_SLUGS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => selectDoc(s)}
            className={`block w-full border px-3 py-2 text-left text-sm transition ${
              slug === s
                ? "border-berry/40 bg-berry/5 text-ink"
                : "border-ink/10 bg-white/50 text-ink-muted hover:border-ink/25 hover:text-ink"
            }`}
          >
            {LEGAL_META[s].navLabel}
          </button>
        ))}
      </aside>

      <form onSubmit={onSave} className="space-y-4 border border-ink/10 bg-white/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Editar política</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Solo administradores pueden modificar estos textos. Usa Markdown
              simple: <code className="text-xs">## Título</code> y{" "}
              <code className="text-xs">- lista</code>.
            </p>
          </div>
          <Link
            href={LEGAL_META[slug].href}
            target="_blank"
            className="btn-ghost text-sm"
          >
            Ver pública
          </Link>
        </div>

        <div>
          <label className="label" htmlFor="legal-title">
            Título
          </label>
          <input
            id="legal-title"
            className="field"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="legal-content">
            Contenido
          </label>
          <textarea
            id="legal-content"
            className="field min-h-[420px] font-mono text-xs leading-relaxed"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-berry">{error}</p>}
        {msg && <p className="text-sm text-sage">{msg}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
