"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import { WHISKY_FLAVOR_CATEGORIES } from "@/lib/whisky-flavors";

type NoteFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    tastedAt: string;
    rating: number;
    tags: string[];
    memo: string;
    isPublic: boolean;
  }) => Promise<void>;
};

export function NoteFormModal({ open, onClose, onSubmit }: NoteFormModalProps) {
  const titleId = useId();
  const [tastedAt, setTastedAt] = useState("");
  const [rating, setRating] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTastedAt(new Date().toISOString().slice(0, 10));
    setRating(3);
    setTags([]);
    setMemo("");
    setIsPublic(false);
    setError(null);
  }, [open]);

  if (!open) return null;

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        tastedAt: new Date(`${tastedAt}T12:00:00`).toISOString(),
        rating,
        tags,
        memo: memo.trim(),
        isPublic,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
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
            테이스팅 노트
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--cream)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5 text-sm">
              <span className="text-[var(--muted)]">시음일</span>
              <input
                required
                type="date"
                value={tastedAt}
                onChange={(e) => setTastedAt(e.target.value)}
                className="field"
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="text-[var(--muted)]">별점 ({rating}/5)</span>
              <input
                type="range"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--amber)]"
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">키워드</p>
            {WHISKY_FLAVOR_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-1.5">
                <p className="text-xs uppercase tracking-wide text-[var(--amber)]/80">
                  {category.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.tags.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={
                          active
                            ? "rounded-md bg-[var(--amber)] px-2.5 py-1 text-xs font-medium text-[var(--ink)]"
                            : "rounded-md border border-[var(--line)] px-2.5 py-1 text-xs text-[var(--muted)] hover:border-[var(--amber)]"
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="text-[var(--muted)]">시음평</span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              className="field resize-none"
              placeholder="오늘의 향과 맛을 남겨 보세요."
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="accent-[var(--amber)]"
            />
            공개 노트로 저장 (커뮤니티 확장용)
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-[var(--amber)] py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)] disabled:opacity-60"
          >
            {saving ? "저장 중…" : "노트 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
