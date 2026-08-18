import type { AiringInfo } from "./types";

type RGB = [number, number, number];

const COLOR_STOPS: { days: number; color: RGB }[] = [
  { days: 0, color: [224, 177, 90] },
  { days: 45, color: [201, 137, 58] },
  { days: 120, color: [196, 106, 58] },
  { days: 240, color: [180, 84, 62] },
  { days: 400, color: [156, 72, 72] },
];

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function airingRgb(days: number): RGB {
  const value = Math.max(0, days);
  const first = COLOR_STOPS[0];
  const last = COLOR_STOPS[COLOR_STOPS.length - 1];
  if (value <= first.days) return first.color;
  if (value >= last.days) return last.color;

  for (let i = 1; i < COLOR_STOPS.length; i++) {
    const prev = COLOR_STOPS[i - 1];
    const next = COLOR_STOPS[i];
    if (value > next.days) continue;
    const t = (value - prev.days) / (next.days - prev.days);
    return [
      Math.round(lerp(prev.color[0], next.color[0], t)),
      Math.round(lerp(prev.color[1], next.color[1], t)),
      Math.round(lerp(prev.color[2], next.color[2], t)),
    ];
  }

  return last.color;
}

export function airingColor(days: number): string {
  const [r, g, b] = airingRgb(days);
  return `rgb(${r} ${g} ${b})`;
}

export function airingTint(days: number, alpha: number): string {
  const [r, g, b] = airingRgb(days);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Guidance sentence for how long a bottle has been open. Deliberately a full
 * sentence rather than a stage name — a "Peak" label compresses away the reason.
 */
const HINTS: { until: number; hint: string }[] = [
  { until: 13, hint: "아직 알코올이 앞섭니다. 며칠 두면 향이 풀립니다." },
  {
    until: 59,
    hint: "향이 갈라지기 시작하는 구간입니다. 지금 노트를 남겨 두면 나중에 비교하기 좋습니다.",
  },
  { until: 179, hint: "향이 가장 둥글게 느껴질 무렵입니다." },
  {
    until: 364,
    hint: "향이 조금씩 옅어집니다. 남은 양을 어떻게 비울지 정해 두면 좋습니다.",
  },
];

const LONG_OPEN_HINT =
  "1년을 넘겼습니다. 아까워도 이번 달 안에 비우는 편이 낫습니다.";

export function airingHint(days: number): string {
  const value = Math.max(0, days);
  for (const entry of HINTS) {
    if (value <= entry.until) return entry.hint;
  }
  return LONG_OPEN_HINT;
}

export function calendarDaysBetween(
  from: string | Date,
  to: string | Date = new Date()
): number | null {
  const startDate = toDate(from);
  const endDate = toDate(to);
  if (!startDate || !endDate) return null;

  const start = Date.UTC(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const end = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  return Math.floor((end - start) / 86_400_000);
}

export function getAiringInfo(
  openedAt: string | Date | null | undefined,
  status: string
): AiringInfo {
  if (status === "UNOPENED" || !openedAt) {
    return { airingDays: null, label: "미개봉" };
  }

  if (status === "FINISHED") {
    return { airingDays: null, label: "완료" };
  }

  const airingDays = calendarDaysBetween(openedAt);
  if (airingDays === null) {
    return { airingDays: null, label: "개봉일 미상" };
  }

  if (airingDays > 365 * 50) {
    return { airingDays: null, label: "개봉일 확인 필요" };
  }

  return { airingDays: Math.max(0, airingDays), label: null };
}
