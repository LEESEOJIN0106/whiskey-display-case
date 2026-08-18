import { airingColor } from "@/lib/airing";
import { getFlavorChange } from "@/lib/flavor-change";
import { StarRating } from "./StarRating";
import type { Whisky } from "@/lib/types";

type FlavorTimelineProps = {
  whisky: Whisky;
};

const MAX_RATING = 5;

export function FlavorTimeline({ whisky }: FlavorTimelineProps) {
  const change = getFlavorChange(whisky);
  if (change.points.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)]/60 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--cream)]">
        맛의 변화
      </h2>
      {change.summary ? (
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          {change.summary}
        </p>
      ) : null}

      <ol className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {change.points.map((point, index) => {
          const tone =
            point.airingDays !== null
              ? airingColor(point.airingDays)
              : "var(--gold)";
          return (
            <li
              key={point.noteId}
              className="min-w-[7.5rem] flex-1 rounded-lg border border-[var(--line)] bg-[var(--ink)]/60 px-3 py-3"
            >
              <p className="text-xs font-medium tabular-nums" style={{ color: tone }}>
                {point.airingDays !== null
                  ? `D+${point.airingDays}`
                  : `시음 ${index + 1}`}
              </p>

              <div className="mt-3 flex h-16 items-end rounded-sm bg-[var(--line)]/35">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: `${(point.rating / MAX_RATING) * 100}%`,
                    background: tone,
                  }}
                />
              </div>

              <StarRating value={point.rating} className="mt-2.5" />

              {point.tags.length ? (
                <p className="mt-1.5 truncate text-xs text-[var(--muted)]">
                  {point.tags.slice(0, 3).join(" · ")}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {change.appearedTags.length || change.fadedTags.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
          {change.appearedTags.map((tag) => (
            <span
              key={`in-${tag}`}
              className="rounded-full border border-[var(--amber)]/50 bg-[var(--amber)]/12 px-2.5 py-0.5 text-[var(--gold)]"
              title="처음 시음에는 없었는데 최근에 잡힌 향"
            >
              새로 올라옴 · {tag}
            </span>
          ))}
          {change.fadedTags.map((tag) => (
            <span
              key={`out-${tag}`}
              className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-[var(--muted)]"
              title="처음에는 잡혔는데 최근에는 사라진 향"
            >
              옅어짐 · {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
