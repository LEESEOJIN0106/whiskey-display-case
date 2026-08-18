import Link from "next/link";
import { BottleLevel } from "./BottleLevel";
import type { TonightPick } from "@/lib/tonight";

const urgencyLabel: Record<TonightPick["urgency"], string> = {
  finish: "이번 주 안에",
  peak: "지금이 피크",
  open: "오늘 개봉",
  sip: "가볍게 한 잔",
};

type TonightPicksProps = {
  picks: TonightPick[];
};

export function TonightPicks({ picks }: TonightPicksProps) {
  if (picks.length === 0) return null;

  return (
    <section className="mb-8 rounded-xl border border-[var(--amber)]/35 bg-[var(--panel)]/70 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--cream)]">
        오늘 마실 병
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        개봉일과 남은 양만 보고 골랐습니다.
      </p>

      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {picks.map((pick) => (
          <li key={pick.whisky.id}>
            <Link
              href={`/whisky/${pick.whisky.id}`}
              className="flex h-full gap-3 rounded-lg border border-[var(--line)] bg-[var(--ink)]/50 p-3 transition hover:border-[var(--amber)]/70 hover:bg-[var(--ink)]/80"
            >
              <BottleLevel
                percent={pick.whisky.remainingPercent}
                status={pick.whisky.status}
                airingDays={pick.whisky.airingDays}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-[family-name:var(--font-display)] text-lg text-[var(--cream)]">
                  {pick.whisky.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--gold)]">
                  {urgencyLabel[pick.urgency]}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
                  {pick.reason}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
