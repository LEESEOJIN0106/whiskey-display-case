"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { AiringBadge } from "./AiringBadge";
import type { Whisky } from "@/lib/types";

type WhiskyCardProps = {
  whisky: Whisky;
  onDelete: (whisky: Whisky) => void;
};

export function WhiskyCard({ whisky, onDelete }: WhiskyCardProps) {
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
              <p className="mt-1 text-sm text-[var(--muted)]">{whisky.distillery}</p>
            </div>
            <AiringBadge
              stage={whisky.stage}
              label={whisky.label}
              airingDays={whisky.airingDays}
            />
          </div>

          <div className="flex items-end justify-between text-sm text-[var(--muted)]">
            <span>{whisky.abv}% ABV</span>
            <span>
              {whisky.status === "UNOPENED"
                ? "미개봉"
                : whisky.status === "FINISHED"
                  ? "완료"
                  : `잔여 ${whisky.remainingPercent}%`}
            </span>
          </div>

          {whisky.status === "OPENED" ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--ink)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--gold)] transition-all"
                style={{ width: `${whisky.remainingPercent}%` }}
              />
            </div>
          ) : null}
        </div>
      </Link>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(whisky);
        }}
        className="absolute right-3 top-3 rounded-md border border-[var(--line)] bg-[var(--panel)]/90 p-1.5 text-[var(--muted)] opacity-100 transition hover:border-rose-400/70 hover:text-rose-300 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`${whisky.name} 삭제`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
