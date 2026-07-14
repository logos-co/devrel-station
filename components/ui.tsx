import type { MilestoneStatus, OverallStatus } from "@/lib/types";
import { MILESTONE_STATUS_META, OVERALL_STATUS_META } from "@/lib/status";

export function Badge({
  label,
  className,
  title,
}: {
  label: string;
  className: string;
  title?: string;
}) {
  return (
    <span className={`badge ${className}`} title={title}>
      {label}
    </span>
  );
}

export function MilestoneBadge({ status }: { status: MilestoneStatus }) {
  const meta = MILESTONE_STATUS_META[status];
  return <Badge label={meta.label} className={meta.className} title={meta.description} />;
}

export function OverallBadge({ status }: { status: OverallStatus }) {
  const meta = OVERALL_STATUS_META[status];
  return <Badge label={meta.label} className={meta.className} />;
}

export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="meter"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

const TILE_VARIANTS = {
  blue: "card-blue",
  tan: "card-tan",
  grey: "card-grey",
  dark: "card-dark",
} as const;

export function StatTile({
  label,
  value,
  detail,
  meter,
  variant,
}: {
  label: string;
  value: string;
  detail?: string;
  meter?: { value: number; max: number };
  variant?: keyof typeof TILE_VARIANTS;
}) {
  return (
    <div
      className={`card ${variant ? TILE_VARIANTS[variant] : ""} flex min-h-40 flex-col justify-between px-5 py-4`}
    >
      <div className="text-[11px] uppercase tracking-widest opacity-60">
        {label}
      </div>
      <div>
        <div className="font-display text-5xl leading-none">{value}</div>
        {detail && <div className="mt-2 text-xs opacity-60">{detail}</div>}
        {meter && (
          <div className="mt-3">
            <Meter value={meter.value} max={meter.max} />
          </div>
        )}
      </div>
    </div>
  );
}
