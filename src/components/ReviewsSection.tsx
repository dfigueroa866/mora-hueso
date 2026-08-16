"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
};

type ReviewItem = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  product: { id: string; name: string; image: string };
  user: { id: string; name: string };
  photos: { id: string; url: string }[];
};

type AuthUser = {
  id: string;
  name: string;
  role: string;
} | null;

function Stars({
  value,
  interactive = false,
  onChange,
}: {
  value: number;
  interactive?: boolean;
  onChange?: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role={interactive ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          onClick={() => onChange?.(n)}
          className={cn(
            "text-berry transition",
            interactive ? "hover:scale-110" : "cursor-default"
          )}
        >
          <Star
            className="h-5 w-5"
            fill={n <= value ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ReviewsSection({ products }: { products: ProductOption[] }) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isCustomer = user?.role === "customer";

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  async function loadReviews() {
    const res = await fetch("/api/reviews");
    const data = await res.json();
    if (res.ok) setReviews(data.reviews || []);
  }

  async function loadUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    Promise.all([loadReviews(), loadUser()]).finally(() => setLoading(false));
    const onAuth = () => {
      void loadUser();
    };
    window.addEventListener("mh:auth", onAuth);
    return () => window.removeEventListener("mh:auth", onAuth);
  }, []);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function onFilesChange(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).slice(0, 4);
    setFiles(next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("productId", productId);
      form.set("rating", String(rating));
      form.set("title", title);
      form.set("comment", comment);
      files.forEach((file) => form.append("photos", file));

      const res = await fetch("/api/reviews", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo publicar la reseña");
        return;
      }
      setReviews((prev) => [data.review, ...prev]);
      setTitle("");
      setComment("");
      setRating(5);
      setFiles([]);
      setSuccess("Gracias. Tu reseña ya es pública.");
    } catch {
      setError("Error de red");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reseñas" className="border-t border-ink/10 bg-bone">
      <div className="section-pad">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold text-ink md:text-4xl">
              Reseñas
            </h2>
            <p className="mt-2 text-ink-muted">
              Opiniones reales de clientes sobre los premios que recibieron.
            </p>
          </div>
          {!loading && reviews.length > 0 && (
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <Stars value={Math.round(average)} />
              <span>
                {average.toFixed(1)} · {reviews.length} reseña
                {reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            {loading && (
              <p className="text-sm text-ink-muted">Cargando reseñas…</p>
            )}
            {!loading && reviews.length === 0 && (
              <p className="text-sm text-ink-muted">
                Aún no hay reseñas. Sé el primero en compartir tu experiencia.
              </p>
            )}
            {reviews.map((review) => (
              <article
                key={review.id}
                className="border-b border-ink/10 pb-6 last:border-b-0"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={review.rating} />
                  <p className="font-display text-lg font-semibold text-ink">
                    {review.title || review.product.name}
                  </p>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-muted">
                  {review.user.name} · {formatReviewDate(review.createdAt)} ·{" "}
                  <Link
                    href={`/productos/${review.product.id}`}
                    className="text-berry hover:underline"
                  >
                    {review.product.name}
                  </Link>
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/85">
                  {review.comment}
                </p>
                {review.photos.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {review.photos.map((photo) => (
                      <a
                        key={photo.id}
                        href={photo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Foto de ${review.product.name}`}
                          className="h-24 w-24 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="lg:pl-4">
            <div className="border border-ink/10 bg-bone-warm/60 p-5 sm:p-6">
              <h3 className="font-display text-2xl font-semibold text-ink">
                Escribe tu reseña
              </h3>
              {!isCustomer ? (
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Solo clientes pueden publicar reseñas.{" "}
                  <Link href="/login" className="text-berry hover:underline">
                    Inicia sesión
                  </Link>{" "}
                  o{" "}
                  <Link href="/registro" className="text-berry hover:underline">
                    crea una cuenta
                  </Link>{" "}
                  para compartir tu experiencia y fotos del producto recibido.
                </p>
              ) : (
                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="label" htmlFor="review-product">
                      Producto
                    </label>
                    <select
                      id="review-product"
                      className="field"
                      required
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="label">Calificación</p>
                    <Stars value={rating} interactive onChange={setRating} />
                  </div>

                  <div>
                    <label className="label" htmlFor="review-title">
                      Título (opcional)
                    </label>
                    <input
                      id="review-title"
                      className="field"
                      maxLength={80}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. A mi perro le encantó"
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="review-comment">
                      Comentario
                    </label>
                    <textarea
                      id="review-comment"
                      className="field min-h-[110px] resize-y"
                      required
                      minLength={10}
                      maxLength={1000}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Cuéntanos cómo le fue a tu perro con el premio."
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="review-photos">
                      Fotos del producto recibido
                    </label>
                    <label
                      htmlFor="review-photos"
                      className="flex cursor-pointer items-center gap-3 border border-dashed border-ink/20 bg-white/50 px-4 py-3 text-sm text-ink-muted transition hover:border-berry/40 hover:text-ink"
                    >
                      <Camera className="h-5 w-5 shrink-0 text-berry" />
                      <span>
                        Sube hasta 4 fotos (JPG, PNG, WEBP · máx. 4 MB c/u)
                      </span>
                    </label>
                    <input
                      id="review-photos"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="sr-only"
                      onChange={(e) => onFilesChange(e.target.files)}
                    />
                    {previews.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {previews.map((src, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={src}
                            src={src}
                            alt={`Vista previa ${i + 1}`}
                            className="h-16 w-16 object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {error && <p className="text-sm text-berry">{error}</p>}
                  {success && <p className="text-sm text-sage">{success}</p>}

                  <button
                    type="submit"
                    className="btn-primary w-full sm:w-auto"
                    disabled={submitting || !productId}
                  >
                    {submitting ? "Publicando…" : "Publicar reseña"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
