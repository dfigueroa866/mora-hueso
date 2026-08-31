"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1600&q=80",
    alt: "Perro mirando a cámara",
  },
  {
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1600&q=80",
    alt: "Dos perros juntos",
  },
  {
    image:
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1600&q=80",
    alt: "Perro al aire libre",
  },
  {
    image:
      "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=1600&q=80",
    alt: "Perro golden",
  },
  {
    image:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1600&q=80",
    alt: "Perro con snack",
  },
];

const INTERVAL_MS = 5500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((i: number) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <section
      className="relative min-h-[72vh] overflow-hidden bg-ink text-bone sm:min-h-[88vh]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.image}
          className={cn(
            "absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${slide.image})` }}
          role="img"
          aria-label={slide.alt}
          aria-hidden={i !== index}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
      <div className="absolute inset-0 bg-hero-grain opacity-50 mix-blend-multiply" />

      <div className="relative mx-auto flex min-h-[72vh] max-w-6xl flex-col justify-end px-4 pb-12 pt-16 sm:min-h-[88vh] sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
        <p className="animate-fade-in text-xs uppercase tracking-[0.28em] text-bone/60">
          Premios para perros
        </p>
        <h1 className="mt-3 max-w-3xl animate-fade-up font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Mora & Hueso
        </h1>
        <p className="mt-5 max-w-md animate-fade-up text-base leading-relaxed text-bone/75 [animation-delay:120ms]">
          Snacks limpios, stock real y envíos cuidadosos. Premios que merecen un
          buen olfateo.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-up [animation-delay:220ms]">
          <a href="#catalogo" className="btn-primary">
            Ver catálogo
          </a>
          <Link href="/registro" className="btn-bone">
            Crear cuenta
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={prev}
            className="flex h-10 w-10 items-center justify-center border border-bone/25 bg-ink/40 text-bone backdrop-blur-sm transition hover:border-bone/60 hover:bg-ink/60"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="flex h-10 w-10 items-center justify-center border border-bone/25 bg-ink/40 text-bone backdrop-blur-sm transition hover:border-bone/60 hover:bg-ink/60"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="ml-1 flex items-center" role="tablist" aria-label="Diapositivas">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir a imagen ${i + 1}`}
                onClick={() => goTo(i)}
                className="relative p-3 -m-3"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-8 bg-bone"
                      : "w-1.5 bg-bone/35 hover:bg-bone/60"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
