import { Leaf, Truck, ShieldCheck, MapPinned } from "lucide-react";

const STAMPS = [
  { label: "100% Natural", Icon: Leaf },
  { label: "Envíos a todo México", Icon: Truck },
  { label: "Pago seguro", Icon: ShieldCheck },
  { label: "Hecho en México", Icon: MapPinned },
] as const;

function StampRow({ duplicate }: { duplicate?: boolean }) {
  return (
    <ul
      className={`flex w-[100vw] shrink-0 items-center justify-evenly${
        duplicate ? " motion-reduce:hidden" : ""
      }`}
      aria-hidden={duplicate || undefined}
    >
      {STAMPS.map(({ label, Icon }) => (
        <li
          key={label}
          className="flex items-center gap-3 px-6 py-5 sm:px-8 sm:py-6"
        >
          <Icon
            className="h-5 w-5 shrink-0 text-berry"
            strokeWidth={1.6}
            aria-hidden
          />
          <span className="whitespace-nowrap font-display text-sm font-semibold tracking-wide text-ink sm:text-[0.95rem]">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TrustStamps() {
  return (
    <section
      aria-label="Garantías Mora & Hueso"
      className="overflow-hidden border-y border-ink/10 bg-bone-warm"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        <StampRow />
        <StampRow duplicate />
      </div>
    </section>
  );
}
