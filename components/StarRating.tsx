"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX = 5;

export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const box = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`별점 ${value}점 / ${MAX}점`}
    >
      {Array.from({ length: MAX }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn(
            box,
            index < value
              ? "fill-[var(--gold)] text-[var(--gold)]"
              : "fill-transparent text-[var(--line)]"
          )}
        />
      ))}
    </span>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="별점"
      className="flex items-center gap-1"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          onChange(Math.max(1, value - 1));
        } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          onChange(Math.min(MAX, value + 1));
        }
      }}
    >
      {Array.from({ length: MAX }, (_, index) => {
        const score = index + 1;
        const filled = score <= value;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={score === value}
            aria-label={`${score}점`}
            tabIndex={score === value ? 0 : -1}
            onClick={() => onChange(score)}
            className="rounded p-0.5 transition hover:scale-110"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                filled
                  ? "fill-[var(--gold)] text-[var(--gold)]"
                  : "fill-transparent text-[var(--line)]"
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-sm tabular-nums text-[var(--muted)]">
        {value}/{MAX}
      </span>
    </div>
  );
}
