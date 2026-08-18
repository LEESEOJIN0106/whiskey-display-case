"use client";

import { memo } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AiringBadge } from "./AiringBadge";
import { BottleLevel } from "./BottleLevel";
import type { Whisky } from "@/lib/types";

type WhiskyCardProps = {
  whisky: Whisky;
  onDelete: (whisky: Whisky) => void;
  priority?: boolean;
};

export const WhiskyCard = memo(function WhiskyCard({
  whisky,
  onDelete,
  priority = false,
}: WhiskyCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]/80 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--amber)]/60 hover:bg-[var(--panel)]">
      <Link href={`/whisky/${whisky.id}`} className="block">
        {whisky.imageUrl ? (
          <div className="relative h-44 overflow-hidden bg-[var(--ink)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={whisky.imageUrl}
              alt={whisky.name}
              referrerPolicy="no-referrer"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--panel)] via-transparent to-transparent" />
          </div>
        ) : null}

        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--cream)] transition-colors group-hover:text-[var(--gold)]">
                {whisky.name}
              </h2>
            </div>
            <AiringBadge
              label={whisky.label}
              airingDays={whisky.airingDays}
            />
          </div>

          <div className="flex items-end justify-between gap-3 text-sm text-[var(--muted)]">
            <div className="space-y-1">
              <p>{whisky.abv}% ABV</p>
              <p>
                {whisky.status === "UNOPENED"
                  ? "미개봉"
                  : whisky.status === "FINISHED"
                    ? "완료"
                    : `잔여 ${whisky.remainingPercent}%`}
              </p>
            </div>
            <BottleLevel
              percent={whisky.remainingPercent}
              status={whisky.status}
              airingDays={whisky.airingDays}
              size="sm"
            />
          </div>
        </div>
      </Link>

      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(whisky);
        }}
        className="absolute right-3 top-3 z-20 rounded-md border border-[var(--line)] bg-[var(--panel)] p-1.5 text-[var(--muted)] shadow-sm transition hover:border-rose-400/70 hover:text-rose-300"
        aria-label={`${whisky.name} 삭제`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});
