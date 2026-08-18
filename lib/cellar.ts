import type { Whisky, WhiskyStatus } from "./types";

export type CellarFilter = "ALL" | WhiskyStatus;
export type CellarSort = "recent" | "airing" | "remaining" | "name";

export const CELLAR_FILTERS: { key: CellarFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "OPENED", label: "개봉" },
  { key: "UNOPENED", label: "미개봉" },
  { key: "FINISHED", label: "비움" },
];

export const CELLAR_SORTS: { key: CellarSort; label: string }[] = [
  { key: "recent", label: "최근 등록순" },
  { key: "airing", label: "오래 열린 순" },
  { key: "remaining", label: "남은 양 적은 순" },
  { key: "name", label: "이름순" },
];

export function countByStatus(whiskies: Whisky[]): Record<CellarFilter, number> {
  const counts: Record<CellarFilter, number> = {
    ALL: whiskies.length,
    OPENED: 0,
    UNOPENED: 0,
    FINISHED: 0,
  };
  for (const whisky of whiskies) counts[whisky.status] += 1;
  return counts;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

const collator = new Intl.Collator("ko");

const comparators: Record<CellarSort, (a: Whisky, b: Whisky) => number> = {
  recent: (a, b) => collator.compare(b.createdAt, a.createdAt),
  airing: (a, b) => (b.airingDays ?? -1) - (a.airingDays ?? -1),
  remaining: (a, b) => {
    const rank = (whisky: Whisky) =>
      whisky.status === "OPENED" ? 0 : whisky.status === "UNOPENED" ? 1 : 2;
    return (
      rank(a) - rank(b) || a.remainingPercent - b.remainingPercent
    );
  },
  name: (a, b) => collator.compare(a.name, b.name),
};

export function applyCellarView(
  whiskies: Whisky[],
  options: { filter: CellarFilter; sort: CellarSort; search: string }
): Whisky[] {
  const term = normalize(options.search.trim());

  return whiskies
    .filter((whisky) => {
      if (options.filter !== "ALL" && whisky.status !== options.filter) {
        return false;
      }
      if (!term) return true;
      return (
        normalize(whisky.name).includes(term) ||
        normalize(whisky.distillery).includes(term)
      );
    })
    .sort((a, b) => comparators[options.sort](a, b) || collator.compare(a.name, b.name));
}
