"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { airingColor } from "@/lib/airing";
import type { WhiskyStatus } from "@/lib/types";

type BottleLevelProps = {
  percent: number;
  status: WhiskyStatus;
  airingDays?: number | null;
  size?: "sm" | "md";
  className?: string;
};

export function BottleLevel({
  percent,
  status,
  airingDays = null,
  size = "md",
  className,
}: BottleLevelProps) {
  const uid = useId().replace(/:/g, "");
  const fill =
    status === "UNOPENED"
      ? 100
      : status === "FINISHED"
        ? 0
        : Math.max(0, Math.min(100, percent));
  const liquid =
    airingDays === null ? "#c9893a" : airingColor(airingDays);
  const height = size === "sm" ? 52 : 88;
  const clipId = `bottle-fill-${uid}`;

  return (
    <svg
      viewBox="0 0 40 110"
      width={Math.round(height * 0.36)}
      height={height}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={
        status === "UNOPENED"
          ? "미개봉"
          : status === "FINISHED"
            ? "시음 완료"
            : `잔여 ${Math.round(fill)}%`
      }
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="8" y={28 + (70 * (100 - fill)) / 100} width="24" height={(70 * fill) / 100} />
        </clipPath>
        <linearGradient id={`${clipId}-shine`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d="M15 8h10v6c0 2-1 4-2 6v8c4 3 7 8 7 16v48c0 8-5 12-10 12s-10-4-10-12V44c0-8 3-13 7-16v-8c-1-2-2-4-2-6V8z"
        fill="#1a120c"
        stroke="#c9893a"
        strokeWidth="1.4"
      />
      <path
        d="M15 8h10v6c0 2-1 4-2 6v8c4 3 7 8 7 16v48c0 8-5 12-10 12s-10-4-10-12V44c0-8 3-13 7-16v-8c-1-2-2-4-2-6V8z"
        fill={liquid}
        fillOpacity={fill === 0 ? 0.08 : 0.92}
        clipPath={`url(#${clipId})`}
      />
      <path
        d="M15 8h10v6c0 2-1 4-2 6v8c4 3 7 8 7 16v48c0 8-5 12-10 12s-10-4-10-12V44c0-8 3-13 7-16v-8c-1-2-2-4-2-6V8z"
        fill={`url(#${clipId}-shine)`}
      />
      <rect x="14" y="4" width="12" height="6" rx="1.2" fill="#e0b15a" />
    </svg>
  );
}
