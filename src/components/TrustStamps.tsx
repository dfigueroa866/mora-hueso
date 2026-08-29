import { Leaf, Truck, ShieldCheck, MapPinned } from "lucide-react";

const STAMPS = [
  { label: "100% Natural", Icon: Leaf },
  { label: "Envíos a todo México", Icon: Truck },
  { label: "Pago seguro", Icon: ShieldCheck },
  { label: "Hecho en México", Icon: MapPinned },
] as const;

export function TrustStamps() {
  const loop = [...STAMPS, ...STAMPS];

  return (
    <section
      aria-label="Garantías Mora & Hueso"
      className="overflow-hidden border-y border-ink/10 bg-bone-warm"
    >
      <ul className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        {loop.map(({ label, Icon }, index) => {
          const duplicate = index >= STAMPS.length;
          return (
            <li
              key={`${label}-${index}`}
              className="flex items-center gap-3 px-6 py-5 sm:px-8 sm:py-6"
              aria-hidden={duplicate || undefined}
            >
              <Icon
                className="h-5 w-5 shrink-0 text-berry"
                strokeWidth={1.6}
                aria-hidden
              />
              <span className="whitespace-nowrap font-display text-sm font-semibold tracking-wide text-ink sm:text-[0.95rem]">
                {label}
              </span>
              <span
                className="ml-6 h-1 w-1 shrink-0 rounded-full bg-ink/25 sm:ml-8"
                aria-hidden
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
