"use client";

import { memo } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AiringBadge } from "./AiringBadge";
import { BottleLevel } from "./BottleLevel";
import { StarRating } from "./StarRating";
import type { Whisky } from "@/lib/types";

type WhiskyCardProps = {
  whisky: Whisky;
  onDelete: (whisky: Whisky) => void;
  priority?: boolean;
};

const shortDate = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
});

function statusLine(whisky: Whisky) {
  if (whisky.status === "UNOPENED") return "미개봉";
  if (whisky.status === "FINISHED") return "비움";
  return `잔여 ${whisky.remainingPercent}%`;
}

export const WhiskyCard = memo(function WhiskyCard({
  whisky,
  onDelete,
  priority = false,
}: WhiskyCardProps) {
  const notes = whisky.notes ?? [];
  const lastNote = notes.length
    ? notes.reduce((latest, note) =>
        note.tastedAt > latest.tastedAt ? note : latest
      )
    : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]/80 shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition duration-300 focus-within:border-[var(--amber)]/60 hover:-translate-y-0.5 hover:border-[var(--amber)]/60 hover:bg-[var(--panel)]">
      <Link
        href={`/whisky/${whisky.id}`}
        className="flex flex-1 flex-col rounded-lg outline-none"
      >
        {whisky.imageUrl ? (
          <div className="relative h-40 overflow-hidden bg-[var(--ink)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={whisky.imageUrl}
              alt=""
              referrerPolicy="no-referrer"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "low"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--panel)] via-[var(--panel)]/10 to-transparent" />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-5">
          <h2
            className={`font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--cream)] transition-colors group-hover:text-[var(--gold)] ${
              whisky.imageUrl ? "" : "pr-9"
            }`}
          >
            {whisky.name}
          </h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {whisky.abv}% · {statusLine(whisky)}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <AiringBadge
              label={whisky.label}
              airingDays={whisky.airingDays}
            />
            <BottleLevel
              percent={whisky.remainingPercent}
              status={whisky.status}
              airingDays={whisky.airingDays}
              size="sm"
            />
          </div>

          {lastNote ? (
            <div className="mt-4 flex items-center gap-2 border-t border-[var(--line-soft)] pt-3 text-xs text-[var(--muted)]">
              <StarRating value={lastNote.rating} />
              <span>
                노트 {notes.length}개 · {shortDate.format(new Date(lastNote.tastedAt))}
              </span>
            </div>
          ) : null}
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
        className="absolute right-3 top-3 z-20 rounded-md border border-[var(--line)] bg-[var(--panel)]/90 p-1.5 text-[var(--muted)] shadow-sm backdrop-blur-sm transition hover:border-[var(--danger)] hover:text-[var(--danger)] sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 sm:focus-visible:opacity-100"
        aria-label={`${whisky.name} 삭제`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
});
