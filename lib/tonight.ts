import type { Whisky } from "./types";

export type TonightUrgency = "finish" | "peak" | "open" | "sip";

export type TonightPick = {
  whisky: Whisky;
  score: number;
  reason: string;
  urgency: TonightUrgency;
};

function remainingBonus(percent: number): number {
  if (percent <= 15) return 30;
  if (percent <= 30) return 18;
  if (percent <= 50) return 8;
  return 0;
}

function scoreOpened(whisky: Whisky): TonightPick | null {
  if (whisky.airingDays === null) return null;

  const days = whisky.airingDays;
  const score =
    Math.min(50, days * 0.25) + remainingBonus(whisky.remainingPercent);

  const urgency: TonightUrgency =
    whisky.remainingPercent <= 20 || days >= 180
      ? "finish"
      : days >= 60
        ? "peak"
        : "sip";

  return { whisky, score, reason: pickReason(whisky, urgency), urgency };
}

function pickReason(whisky: Whisky, urgency: TonightUrgency): string {
  const days = whisky.airingDays ?? 0;
  if (urgency === "finish" && whisky.remainingPercent <= 20) {
    return `잔여 ${whisky.remainingPercent}% · 바닥이 보이니 오늘 비우는 편이 좋습니다.`;
  }
  if (days >= 180) {
    return `개봉 ${days}일 차입니다. 이번 주 안에 마시는 편이 좋아요.`;
  }
  if (days >= 60) {
    return `개봉 ${days}일 차입니다. 오늘 잔에 담기 좋아요.`;
  }
  return `개봉 ${days}일 차입니다. 변화를 남겨 두기 좋은 때입니다.`;
}

export function pickTonight(whiskies: Whisky[], limit = 3): TonightPick[] {
  const opened = whiskies
    .filter((item) => item.status === "OPENED")
    .map(scoreOpened)
    .filter((item): item is TonightPick => item !== null)
    .sort((a, b) => b.score - a.score || a.whisky.name.localeCompare(b.whisky.name));

  if (opened.length > 0) return opened.slice(0, limit);

  const unopened = whiskies.find((item) => item.status === "UNOPENED");
  if (!unopened) return [];

  return [
    {
      whisky: unopened,
      score: 5,
      reason: "아직 열린 병이 없습니다. 오늘 첫 병을 열어 볼까요?",
      urgency: "open",
    },
  ];
}
