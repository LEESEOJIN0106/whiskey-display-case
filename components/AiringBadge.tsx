import { cn } from "@/lib/utils";
import { airingColor, airingHint, airingTint } from "@/lib/airing";

type AiringBadgeProps = {
  label: string | null;
  airingDays: number | null;
  className?: string;
};

export function AiringBadge({
  label,
  airingDays,
  className,
}: AiringBadgeProps) {
  if (airingDays === null) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded border border-[var(--line)] px-2 py-1 text-xs text-[var(--muted)]",
          className
        )}
      >
        {label ?? "미개봉"}
      </span>
    );
  }

  const color = airingColor(airingDays);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium tabular-nums",
        className
      )}
      style={{
        color,
        borderColor: airingTint(airingDays, 0.55),
        backgroundColor: airingTint(airingDays, 0.16),
      }}
      title={airingHint(airingDays)}
    >
      D+{airingDays}
    </span>
  );
}
