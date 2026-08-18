"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageOff, RefreshCw, Search } from "lucide-react";
import { Modal } from "./Modal";
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

const STATUS_OPTIONS: { value: WhiskyStatus; label: string }[] = [
  { value: "UNOPENED", label: "미개봉" },
  { value: "OPENED", label: "개봉" },
  { value: "FINISHED", label: "비움" },
];

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
  const listId = useId();
  const nameWrapRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [abv, setAbv] = useState("40");
  const [status, setStatus] = useState<WhiskyStatus>("UNOPENED");
  const [openedAt, setOpenedAt] = useState("");
  const [remainingPercent, setRemainingPercent] = useState("100");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDismissed, setImageDismissed] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<
    WhiskyNameSuggestion[]
  >([]);
  const [showNameSuggest, setShowNameSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = toDateInputValue(new Date());

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
    setImageDismissed(false);
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
      setImageDismissed(false);
      return first.url;
    } catch {
      return null;
    } finally {
      setSearching(false);
    }
  }

  function pickSuggestion(item: WhiskyNameSuggestion) {
    setName(item.name);
    setShowNameSuggest(false);
    setActiveIndex(-1);
    setImageDismissed(false);
    void resolveImage(item.name, { force: true });
  }

  function handleStatusChange(next: WhiskyStatus) {
    setStatus(next);
    if (next === "UNOPENED") {
      setOpenedAt("");
      setRemainingPercent("100");
      return;
    }
    if (!openedAt) setOpenedAt(toDateInputValue(new Date()));
    if (next === "FINISHED") setRemainingPercent("0");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parsedAbv = Number(abv);
      if (!name.trim()) throw new Error("이름을 입력해 주세요.");
      if (Number.isNaN(parsedAbv) || parsedAbv <= 0 || parsedAbv > 100) {
        throw new Error("도수는 0보다 크고 100 이하로 입력해 주세요.");
      }

      const resolvedImage = imageDismissed
        ? null
        : await resolveImage(name, { preferUrl: imageUrl });

      const openedIso =
        status === "UNOPENED"
          ? null
          : openedAt
            ? new Date(`${openedAt}T12:00:00`).toISOString()
            : new Date().toISOString();

      const parsedRemaining = Number(remainingPercent);
      await onSubmit({
        name: name.trim(),
        abv: parsedAbv,
        status,
        openedAt: openedIso,
        remainingPercent:
          status === "UNOPENED"
            ? 100
            : status === "FINISHED"
              ? 0
              : Number.isNaN(parsedRemaining)
                ? 100
                : Math.round(parsedRemaining),
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
      setActiveIndex((i) => (i <= 0 ? nameSuggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickSuggestion(nameSuggestions[activeIndex]!);
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setShowNameSuggest(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          {error ? (
            <p className="mb-3 text-sm text-[#f0a99f]">{error}</p>
          ) : null}
          <button
            type="submit"
            form="whisky-form"
            disabled={saving}
            className="w-full rounded-md bg-[var(--amber)] py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)] disabled:opacity-60"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </>
      }
    >
      <form
        id="whisky-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5"
      >
        <div ref={nameWrapRef} className="relative space-y-1.5 text-sm">
          <label className="text-[var(--muted)]" htmlFor="whisky-name">
            이름
          </label>
          <input
            id="whisky-name"
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
                      onClick={() => pickSuggestion(item)}
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
                          referrerPolicy="no-referrer"
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

        <BottlePhoto
          name={name}
          imageUrl={imageDismissed ? null : imageUrl}
          searching={searching}
          onSearch={() => void resolveImage(name, { force: true })}
          onRemove={() => {
            setImageUrl(null);
            setImageDismissed(true);
          }}
        />

        <label className="block space-y-1.5 text-sm">
          <span className="text-[var(--muted)]">도수 (%)</span>
          <input
            required
            type="number"
            step="0.1"
            min="0.1"
            max="100"
            inputMode="decimal"
            value={abv}
            onChange={(e) => setAbv(e.target.value)}
            className="field w-28"
          />
        </label>

        <div className="space-y-2 text-sm">
          <span className="text-[var(--muted)]">상태</span>
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={status === option.value}
                onClick={() => handleStatusChange(option.value)}
                className={
                  status === option.value
                    ? "flex-1 rounded-md border border-[var(--amber)] bg-[var(--amber)]/15 py-2 text-sm font-medium text-[var(--gold)]"
                    : "flex-1 rounded-md border border-[var(--line)] py-2 text-sm text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--cream)]"
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {status !== "UNOPENED" ? (
          <div className="space-y-2 text-sm">
            <label className="text-[var(--muted)]" htmlFor="whisky-opened">
              개봉일
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "오늘", value: today },
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
                      ? "rounded-md bg-[var(--amber)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink)]"
                      : "rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--amber)] hover:text-[var(--cream)]"
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              id="whisky-opened"
              type="date"
              max={today}
              value={openedAt}
              onChange={(e) => setOpenedAt(e.target.value)}
              className="field"
            />
          </div>
        ) : null}

        {status === "OPENED" ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between">
              <label className="text-[var(--muted)]" htmlFor="whisky-remaining">
                남은 양
              </label>
              <span className="tabular-nums text-[var(--cream)]">
                {remainingPercent}%
              </span>
            </div>
            <input
              id="whisky-remaining"
              type="range"
              min={0}
              max={100}
              step={5}
              value={Number(remainingPercent) || 0}
              onChange={(e) => setRemainingPercent(e.target.value)}
              className="w-full accent-[var(--amber)]"
            />
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>비었음</span>
              <span>반병</span>
              <span>가득</span>
            </div>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}

function BottlePhoto({
  name,
  imageUrl,
  searching,
  onSearch,
  onRemove,
}: {
  name: string;
  imageUrl: string | null;
  searching: boolean;
  onSearch: () => void;
  onRemove: () => void;
}) {
  const canSearch = name.trim().length > 0 && !searching;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--ink)]/40 p-3">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded border border-[var(--line)] bg-[var(--ink)]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageOff aria-hidden className="h-5 w-5 text-[var(--line)]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-[var(--cream)]">
          {searching
            ? "사진 찾는 중…"
            : imageUrl
              ? "사진을 찾았습니다"
              : "사진 없음"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">
          {imageUrl
            ? "마음에 안 들면 다시 찾거나 지워도 됩니다."
            : "저장할 때 이름으로 한 번 찾아봅니다."}
        </p>
      </div>

      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={onSearch}
          disabled={!canSearch}
          className="rounded-md border border-[var(--line)] p-2 text-[var(--muted)] transition hover:border-[var(--amber)] hover:text-[var(--cream)] disabled:opacity-40"
          aria-label="사진 다시 찾기"
          title="사진 다시 찾기"
        >
          <RefreshCw className={`h-4 w-4 ${searching ? "animate-spin" : ""}`} />
        </button>
        {imageUrl ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-[var(--line)] p-2 text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
            aria-label="사진 지우기"
            title="사진 지우기"
          >
            <ImageOff className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
