import { calendarDaysBetween } from "./airing";
import type { TastingNote, Whisky } from "./types";

export type FlavorChangePoint = {
  noteId: string;
  tastedAt: string;
  airingDays: number | null;
  rating: number;
  tags: string[];
};

export type FlavorChange = {
  points: FlavorChangePoint[];
  ratingDelta: number | null;
  appearedTags: string[];
  fadedTags: string[];
  summary: string | null;
};

function pointFromNote(
  note: TastingNote,
  openedAt: string | null
): FlavorChangePoint {
  const airingDays = openedAt
    ? calendarDaysBetween(openedAt, note.tastedAt)
    : null;
  return {
    noteId: note.id,
    tastedAt: note.tastedAt,
    airingDays: airingDays === null ? null : Math.max(0, airingDays),
    rating: note.rating,
    tags: note.tags,
  };
}

function summarize(change: Omit<FlavorChange, "summary">): string | null {
  const { points, ratingDelta, appearedTags, fadedTags } = change;
  if (points.length === 0) return null;

  if (points.length === 1) {
    const [first] = points;
    const dayLabel =
      first.airingDays !== null ? `개봉 ${first.airingDays}일 차` : "첫 시음";
    return `${dayLabel} 기록입니다. 시간이 지나면 향이 어떻게 바뀌는지 비교할 수 있어요.`;
  }

  const parts: string[] = [];
  if (ratingDelta !== null && ratingDelta > 0) {
    parts.push("개봉 직후보다 별점이 올랐습니다");
  } else if (ratingDelta !== null && ratingDelta < 0) {
    parts.push("처음보다 별점이 조금 내려갔습니다");
  }

  if (appearedTags.length) {
    parts.push(`${appearedTags.slice(0, 3).join(", ")}가 새로 드러났습니다`);
  }
  if (fadedTags.length) {
    parts.push(`${fadedTags.slice(0, 3).join(", ")}가 한결 잦아들었습니다`);
  }

  if (parts.length === 0) {
    return "시간이 지나도 향의 결은 비슷하게 유지되고 있습니다.";
  }

  return `${parts.join(". ")}.`;
}

export function getFlavorChange(whisky: Whisky): FlavorChange {
  const notes = [...(whisky.notes ?? [])].sort((a, b) =>
    a.tastedAt.localeCompare(b.tastedAt)
  );
  const points = notes.map((note) => pointFromNote(note, whisky.openedAt));

  if (points.length === 0) {
    return {
      points,
      ratingDelta: null,
      appearedTags: [],
      fadedTags: [],
      summary: null,
    };
  }

  const first = points[0];
  const last = points[points.length - 1];
  const firstTags = new Set(first.tags);
  const lastTags = new Set(last.tags);
  const appearedTags = last.tags.filter((tag) => !firstTags.has(tag));
  const fadedTags = first.tags.filter((tag) => !lastTags.has(tag));
  const ratingDelta = points.length > 1 ? last.rating - first.rating : null;

  const change = { points, ratingDelta, appearedTags, fadedTags };
  return { ...change, summary: summarize(change) };
}
