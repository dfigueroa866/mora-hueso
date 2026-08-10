import { Leaf, Truck, ShieldCheck, MapPinned } from "lucide-react";

const STAMPS = [
  { label: "100% Natural", Icon: Leaf },
  { label: "Envíos a todo México", Icon: Truck },
  { label: "Pago seguro", Icon: ShieldCheck },
  { label: "Hecho en México", Icon: MapPinned },
] as const;

export function TrustStamps() {
  return (
    <section
      aria-label="Garantías Mora & Hueso"
      className="border-y border-ink/10 bg-bone-warm"
    >
      <ul className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-ink/10 sm:grid-cols-4 sm:divide-y-0">
        {STAMPS.map(({ label, Icon }) => (
          <li
            key={label}
            className="flex items-center gap-3 px-4 py-5 sm:justify-center sm:px-6 sm:py-6"
          >
            <Icon
              className="h-5 w-5 shrink-0 text-berry"
              strokeWidth={1.6}
              aria-hidden
            />
            <span className="font-display text-sm font-semibold tracking-wide text-ink sm:text-[0.95rem]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
