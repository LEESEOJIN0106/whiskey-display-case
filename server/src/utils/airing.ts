export type AiringInfo = {
  airingDays: number | null;
  label: string | null;
};

function empty(label: string): AiringInfo {
  return { airingDays: null, label };
}

export function getAiringInfo(
  openedAt: Date | string | null | undefined,
  status: string
): AiringInfo {
  if (status === "UNOPENED" || !openedAt) return empty("미개봉");
  if (status === "FINISHED") return empty("완료");

  const opened = typeof openedAt === "string" ? new Date(openedAt) : openedAt;
  if (Number.isNaN(opened.getTime())) return empty("개봉일 미상");

  const today = new Date();
  const start = Date.UTC(opened.getFullYear(), opened.getMonth(), opened.getDate());
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const airingDays = Math.max(0, Math.floor((end - start) / 86_400_000));

  if (airingDays > 365 * 50) return empty("개봉일 확인 필요");

  return { airingDays, label: null };
}
