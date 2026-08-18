"use client";

import { GlassWater } from "lucide-react";

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
  return (
    <div className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--ink)]/40 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-sm text-[var(--muted)]">
        <GlassWater className="h-4 w-4 text-[var(--amber)]" />
        한 잔 기록
      </p>
      <div className="flex flex-wrap gap-2">
        {POUR_AMOUNTS.map((pour) => (
          <button
            key={pour.percent}
            type="button"
            disabled={disabled || remainingPercent <= 0}
            onClick={() => onPour(pour.percent)}
            className="rounded-md border border-[var(--amber)]/50 px-3 py-1.5 text-sm text-[var(--gold)] transition hover:bg-[var(--amber)]/10 disabled:opacity-50"
          >
            {pour.label} (−{pour.percent}%)
          </button>
        ))}
      </div>
    </div>
  );
}
