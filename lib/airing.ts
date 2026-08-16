import type { AiringStage } from "./types";

export type AiringInfo = {
  airingDays: number | null;
  stage: AiringStage | null;
  label: string | null;
};

export function getAiringInfo(
  openedAt: string | Date | null | undefined,
  status: string
): AiringInfo {
  if (status === "UNOPENED" || !openedAt) {
    return { airingDays: null, stage: null, label: "미개봉" };
  }

  if (status === "FINISHED") {
    return { airingDays: null, stage: null, label: "완료" };
  }

  const opened = typeof openedAt === "string" ? new Date(openedAt) : openedAt;
  if (Number.isNaN(opened.getTime())) {
    return { airingDays: null, stage: null, label: "개봉일 미상" };
  }

  const today = new Date();
  const start = Date.UTC(
    opened.getFullYear(),
    opened.getMonth(),
    opened.getDate()
  );
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const airingDays = Math.max(0, Math.floor((end - start) / 86_400_000));

  if (airingDays > 365 * 50) {
    return { airingDays: null, stage: null, label: "개봉일 확인 필요" };
  }

  let stage: AiringStage;
  if (airingDays <= 14) stage = "Fresh";
  else if (airingDays <= 60) stage = "Initial Airing";
  else if (airingDays <= 180) stage = "Peak Flavor";
  else stage = "Fully Aired";

  return { airingDays, stage, label: stage };
}

export const AIRING_STAGE_COPY: Record<AiringStage, string> = {
  Fresh: "Newly Opened",
  "Initial Airing": "알코올감이 가라앉는 시기",
  "Peak Flavor": "풍미가 가장 안정된 시기",
  "Fully Aired": "산화 진행 주의",
};
