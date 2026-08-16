import { cn } from "@/lib/utils";
import type { AiringStage } from "@/lib/types";
import { AIRING_STAGE_COPY } from "@/lib/airing";

const stageStyles: Record<AiringStage, string> = {
  Fresh: "bg-emerald-900/40 text-emerald-200 border-emerald-700/50",
  "Initial Airing": "bg-sky-900/40 text-sky-200 border-sky-700/50",
  "Peak Flavor": "bg-amber-900/50 text-amber-100 border-amber-600/50",
  "Fully Aired": "bg-rose-950/50 text-rose-200 border-rose-700/50",
};

type AiringBadgeProps = {
  stage: AiringStage | null;
  label: string | null;
  airingDays: number | null;
  className?: string;
};

export function AiringBadge({
  stage,
  label,
  airingDays,
  className,
}: AiringBadgeProps) {
  if (!stage) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]",
          className
        )}
      >
        {label ?? "미개봉"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-col gap-0.5 rounded border px-2 py-1 text-xs",
        stageStyles[stage],
        className
      )}
      title={AIRING_STAGE_COPY[stage]}
    >
      <span className="font-medium">{stage}</span>
      {airingDays !== null ? (
        <span className="opacity-80">D+{airingDays}</span>
      ) : null}
    </span>
  );
}
