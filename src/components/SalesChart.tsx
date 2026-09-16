"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/constants";

export type SalesChartPoint = {
  key: string;
  label: string;
  revenue: number;
  units: number;
  orderCount: number;
};

const W = 800;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 36, left: 56 };

function compactMxn(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)} mil`;
  return formatPrice(n);
}

function yTicks(max: number): number[] {
  if (max <= 0) return [0];
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const nice = Math.ceil(raw / pow) * pow;
  return [0, nice, nice * 2, nice * 3, nice * 4];
}

export function SalesChart({
  points,
  grain,
}: {
  points: SalesChartPoint[];
  grain: "day" | "week" | "month";
}) {
  const [hover, setHover] = useState<number | null>(null);

  const { maxY, ticks, coords, area, line } = useMemo(() => {
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(0, ...points.map((p) => p.revenue));
    const ticks = yTicks(maxVal);
    const maxY = ticks[ticks.length - 1] || 1;
    const n = Math.max(points.length, 1);
    const coords = points.map((p, i) => {
      const x =
        PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = PAD.top + innerH - (p.revenue / maxY) * innerH;
      return { x, y, ...p };
    });
    const area =
      coords.length === 0
        ? ""
        : `M ${coords[0].x} ${PAD.top + innerH} ` +
          coords.map((c) => `L ${c.x} ${c.y}`).join(" ") +
          ` L ${coords[coords.length - 1].x} ${PAD.top + innerH} Z`;
    const line =
      coords.length === 0
        ? ""
        : coords
            .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
            .join(" ");
    return { maxY, ticks, coords, area, line };
  }, [points]);

  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const grainLabel =
    grain === "month" ? "por mes" : grain === "week" ? "por semana" : "por día";
  const active = hover != null ? coords[hover] : null;

  if (points.length === 0) return null;

  return (
    <div className="relative">
      <p className="mb-3 text-xs uppercase tracking-[0.14em] text-ink-muted">
        Ingresos de producto {grainLabel}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[220px] w-full sm:h-[280px]"
        role="img"
        aria-label={`Ingresos ${grainLabel}`}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const innerH = H - PAD.top - PAD.bottom;
          const y = PAD.top + innerH - (t / maxY) * innerH;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-ink/10"
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-ink-muted text-[10px]"
              >
                {compactMxn(t)}
              </text>
            </g>
          );
        })}
        <path d={area} fill="#8B3A4A" fillOpacity="0.16" />
        <path
          d={line}
          fill="none"
          stroke="#8B3A4A"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <rect
            key={c.key}
            x={
              i === 0
                ? PAD.left
                : (coords[i - 1].x + c.x) / 2
            }
            y={PAD.top}
            width={
              i === 0
                ? Math.max(8, (coords[1]?.x ?? c.x + 16) - c.x)
                : i === coords.length - 1
                  ? W - PAD.right - (coords[i - 1].x + c.x) / 2
                  : (coords[i + 1].x - coords[i - 1].x) / 2
            }
            height={H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        {active && (
          <>
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="#8B3A4A"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />
            <circle cx={active.x} cy={active.y} r="4.5" fill="#8B3A4A" />
            <circle cx={active.x} cy={active.y} r="8" fill="#8B3A4A" fillOpacity="0.2" />
          </>
        )}
        {coords.map((c, i) =>
          i % labelEvery === 0 || i === coords.length - 1 ? (
            <text
              key={`l-${c.key}`}
              x={c.x}
              y={H - 10}
              textAnchor="middle"
              className="fill-ink-muted text-[10px]"
            >
              {c.label}
            </text>
          ) : null
        )}
      </svg>
      {active && (
        <div className="pointer-events-none mt-1 rounded-sm border border-ink/10 bg-white px-3 py-2 text-sm shadow-sm">
          <p className="font-medium text-ink">{active.label}</p>
          <p className="text-berry">{formatPrice(active.revenue)}</p>
          <p className="text-xs text-ink-muted">
            {active.units} uds · {active.orderCount} pedido
            {active.orderCount === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
