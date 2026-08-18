import { Star } from "lucide-react";
import { airingColor } from "@/lib/airing";
import { getFlavorChange } from "@/lib/flavor-change";
import type { Whisky } from "@/lib/types";

type FlavorTimelineProps = {
  whisky: Whisky;
};

export function FlavorTimeline({ whisky }: FlavorTimelineProps) {
  const change = getFlavorChange(whisky);
  if (change.points.length === 0) return null;

  const maxRating = 5;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)]/60 p-5">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]">
        맛의 변화
      </h2>
      {change.summary ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{change.summary}</p>
      ) : null}

      <ol className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {change.points.map((point, index) => (
          <li
            key={point.noteId}
            className="min-w-[7.5rem] flex-1 rounded-lg border border-[var(--line)] bg-[var(--ink)]/60 px-3 py-3"
          >
            <p
              className="text-xs font-medium"
              style={{
                color:
                  point.airingDays !== null
                    ? airingColor(point.airingDays)
                    : "var(--gold)",
              }}
            >
              {point.airingDays !== null ? `D+${point.airingDays}` : `시음 ${index + 1}`}
            </p>
            <div
              className="mt-3 flex h-16 items-end gap-0.5"
              aria-label={`별점 ${point.rating}점`}
            >
              {Array.from({ length: maxRating }, (_, bar) => (
                <span
                  key={bar}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${((bar + 1) / maxRating) * 100}%`,
                    background:
                      bar < point.rating ? "var(--amber)" : "var(--line)",
                  }}
                />
              ))}
            </div>
            <p className="mt-2 inline-flex items-center gap-1 text-sm text-[var(--gold)]">
              <Star className="h-3.5 w-3.5 fill-current" />
              {point.rating}/5
            </p>
            {point.tags.length ? (
              <p className="mt-1 truncate text-xs text-[var(--muted)]">
                {point.tags.slice(0, 3).join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      {change.appearedTags.length || change.fadedTags.length ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {change.appearedTags.map((tag) => (
            <span
              key={`in-${tag}`}
              className="rounded-full border border-emerald-800/60 bg-emerald-950/40 px-2 py-0.5 text-emerald-200"
            >
              + {tag}
            </span>
          ))}
          {change.fadedTags.map((tag) => (
            <span
              key={`out-${tag}`}
              className="rounded-full border border-rose-900/60 bg-rose-950/30 px-2 py-0.5 text-rose-200"
            >
              − {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
