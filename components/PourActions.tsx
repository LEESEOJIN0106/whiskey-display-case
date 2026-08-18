"use client";

export const POUR_AMOUNTS = [
  { label: "한 잔", percent: 3 },
  { label: "넉넉히", percent: 5 },
] as const;

type PourActionsProps = {
  remainingPercent: number;
  disabled?: boolean;
  onPour: (percent: number) => void;
};

export function PourActions({
  remainingPercent,
  disabled = false,
  onPour,
}: PourActionsProps) {
  const empty = remainingPercent <= 0;

  return (
    <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--ink)]/40 p-3">
      <p className="mb-2.5 text-sm text-[var(--muted)]">
        {empty ? "남은 양이 없습니다" : "오늘 마신 만큼 덜어 두기"}
      </p>
      <div className="flex flex-wrap gap-2">
        {POUR_AMOUNTS.map((pour) => (
          <button
            key={pour.percent}
            type="button"
            disabled={disabled || empty}
            onClick={() => onPour(pour.percent)}
            className="rounded-md border border-[var(--amber)]/50 px-3 py-1.5 text-sm tabular-nums text-[var(--gold)] transition hover:bg-[var(--amber)]/10 disabled:opacity-40"
          >
            {pour.label} −{pour.percent}%
          </button>
        ))}
      </div>
    </div>
  );
}
