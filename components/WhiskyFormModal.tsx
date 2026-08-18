"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchWhiskyImages, suggestWhiskyNames } from "@/lib/api";
import type {
  Whisky,
  WhiskyNameSuggestion,
  WhiskyStatus,
} from "@/lib/types";

type WhiskyFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    abv: number;
    status: WhiskyStatus;
    openedAt: string | null;
    remainingPercent: number;
    imageUrl: string | null;
  }) => Promise<void>;
  initial?: Whisky | null;
  title?: string;
};

function toDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function WhiskyFormModal({
  open,
  onClose,
  onSubmit,
  initial,
  title = "위스키 등록",
}: WhiskyFormModalProps) {
  const titleId = useId();
  const listId = useId();
  const nameWrapRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [abv, setAbv] = useState("40");
  const [status, setStatus] = useState<WhiskyStatus>("UNOPENED");
  const [openedAt, setOpenedAt] = useState("");
  const [remainingPercent, setRemainingPercent] = useState("100");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<
    WhiskyNameSuggestion[]
  >([]);
  const [showNameSuggest, setShowNameSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, i) => now - i);
  }, []);

  const [year, month, day] = openedAt
    ? openedAt.split("-").map((v) => Number(v))
    : [0, 0, 0];

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setAbv(String(initial?.abv ?? 40));
    setStatus(initial?.status ?? "UNOPENED");
    setOpenedAt(
      initial?.openedAt
        ? toDateInputValue(new Date(initial.openedAt))
        : initial?.status && initial.status !== "UNOPENED"
          ? toDateInputValue(new Date())
          : ""
    );
    setRemainingPercent(String(initial?.remainingPercent ?? 100));
    setImageUrl(initial?.imageUrl ?? null);
    setNameSuggestions([]);
    setShowNameSuggest(false);
    setActiveIndex(-1);
    setError(null);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    const query = name.trim();
    if (query.length < 1) {
      setNameSuggestions([]);
      setShowNameSuggest(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { results } = await suggestWhiskyNames(query);
          setNameSuggestions(results);
          setShowNameSuggest(results.length > 0);
          setActiveIndex(-1);
        } catch {
          setNameSuggestions([]);
          setShowNameSuggest(false);
        }
      })();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [name, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!nameWrapRef.current?.contains(event.target as Node)) {
        setShowNameSuggest(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  if (!open) return null;

  function setOpenedParts(nextYear: number, nextMonth: number, nextDay: number) {
    if (!nextYear || !nextMonth || !nextDay) {
      setOpenedAt("");
      return;
    }
    const safeDay = Math.min(
      nextDay,
      new Date(nextYear, nextMonth, 0).getDate()
    );
    setOpenedAt(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`
    );
  }

  async function resolveImage(
    nextName = name,
    options?: { preferUrl?: string | null; force?: boolean }
  ) {
    if (!options?.force && options?.preferUrl) return options.preferUrl;
    if (!options?.force && imageUrl) return imageUrl;

    const query = nextName.trim();
    if (!query) return null;

    setSearching(true);
    try {
      const { results } = await searchWhiskyImages(query);
      const first = results[0];
      if (!first) return null;
      setImageUrl(first.url);
      return first.url;
    } catch {
      return null;
    } finally {
      setSearching(false);
    }
  }

  async function pickSuggestion(item: WhiskyNameSuggestion) {
    setName(item.name);
    setShowNameSuggest(false);
    setActiveIndex(-1);

    void resolveImage(item.name, { force: true });
  }

  function handleStatusChange(next: WhiskyStatus) {
    setStatus(next);
    if (next === "UNOPENED") {
      setOpenedAt("");
      return;
    }
    if (!openedAt) {
      setOpenedAt(toDateInputValue(new Date()));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsedAbv = Number(abv);
      const parsedRemaining = Number(remainingPercent);
      if (!name.trim() || Number.isNaN(parsedAbv)) {
        throw new Error("이름과 도수를 확인해 주세요.");
      }

      const resolvedImage = await resolveImage(name, {
        preferUrl: imageUrl,
      });

      const openedIso =
        status === "UNOPENED"
          ? null
          : openedAt
            ? new Date(`${openedAt}T12:00:00`).toISOString()
            : new Date().toISOString();

      await onSubmit({
        name: name.trim(),
        abv: parsedAbv,
        status,
        openedAt: openedIso,
        remainingPercent: Number.isNaN(parsedRemaining) ? 100 : parsedRemaining,
        imageUrl: resolvedImage,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function onNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showNameSuggest || nameSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % nameSuggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        i <= 0 ? nameSuggestions.length - 1 : i - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      void pickSuggestion(nameSuggestions[activeIndex]!);
    } else if (e.key === "Escape") {
      setShowNameSuggest(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--cream)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div ref={nameWrapRef} className="relative space-y-1.5 text-sm">
            <span className="text-[var(--muted)]">이름</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => {
                if (nameSuggestions.length > 0) setShowNameSuggest(true);
              }}
              onKeyDown={onNameKeyDown}
              className="field"
              placeholder="카발란, Lagavulin…"
              role="combobox"
              aria-expanded={showNameSuggest}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
            />
            {showNameSuggest && nameSuggestions.length > 0 ? (
              <ul
                id={listId}
                role="listbox"
                className="absolute left-0 right-0 z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[var(--line)] bg-[#1f1710] py-1 shadow-xl"
              >
                {nameSuggestions.map((item, index) => {
                  const active = index === activeIndex;
                  const isEntity = item.kind === "entity";
                  return (
                    <li
                      key={`${item.kind ?? "query"}-${item.label}-${index}`}
                      role="option"
                      aria-selected={active}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => void pickSuggestion(item)}
                        className={
                          active
                            ? "flex w-full items-center gap-3 bg-[var(--panel)] px-3 py-2.5 text-left"
                            : "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--panel)]"
                        }
                      >
                        {isEntity && item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-[var(--cream)]">
                            {item.label}
                          </span>
                          {item.subtitle ? (
                          <span className="block truncate text-xs text-[var(--muted)]">
                            {item.subtitle}
                          </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="ABV (%)">
              <input
                required
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={abv}
                onChange={(e) => setAbv(e.target.value)}
                className="field"
              />
            </Field>
            <Field label="상태">
              <select
                value={status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as WhiskyStatus)
                }
                className="field"
              >
                <option value="UNOPENED">미개봉</option>
                <option value="OPENED">개봉</option>
                <option value="FINISHED">완료</option>
              </select>
            </Field>
          </div>

          {status !== "UNOPENED" ? (
            <div className="space-y-2">
              <span className="text-sm text-[var(--muted)]">개봉일</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "오늘", value: toDateInputValue(new Date()) },
                  { label: "1주 전", value: shiftDays(-7) },
                  { label: "1달 전", value: shiftDays(-30) },
                  { label: "1년 전", value: shiftDays(-365) },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setOpenedAt(preset.value)}
                    className={
                      openedAt === preset.value
                        ? "rounded-md bg-[var(--amber)] px-2.5 py-1 text-xs font-medium text-[var(--ink)]"
                        : "rounded-md border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--amber)]"
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="field"
                  value={year || ""}
                  onChange={(e) =>
                    setOpenedParts(
                      Number(e.target.value),
                      month || 1,
                      day || 1
                    )
                  }
                >
                  <option value="">년</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={month || ""}
                  onChange={(e) =>
                    setOpenedParts(year || new Date().getFullYear(), Number(e.target.value), day || 1)
                  }
                >
                  <option value="">월</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
                <select
                  className="field"
                  value={day || ""}
                  onChange={(e) =>
                    setOpenedParts(
                      year || new Date().getFullYear(),
                      month || 1,
                      Number(e.target.value)
                    )
                  }
                >
                  <option value="">일</option>
                  {Array.from(
                    {
                      length: new Date(year || 2026, month || 1, 0).getDate(),
                    },
                    (_, i) => i + 1
                  ).map((d) => (
                    <option key={d} value={d}>
                      {d}일
                    </option>
                  ))}
                </select>
              </div>
              <Field label="잔여량 (%)">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={remainingPercent}
                  onChange={(e) => setRemainingPercent(e.target.value)}
                  className="field"
                />
              </Field>
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={saving || searching}
            className="w-full rounded-md bg-[var(--amber)] py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)] disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}
