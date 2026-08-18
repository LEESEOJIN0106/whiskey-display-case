"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { StarRatingInput } from "./StarRating";
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
    <Modal
      open={open}
      onClose={onClose}
      title="테이스팅 노트"
      footer={
        <>
          {error ? (
            <p className="mb-3 text-sm text-[#f0a99f]">{error}</p>
          ) : null}
          <button
            type="submit"
            form="note-form"
            disabled={saving}
            className="w-full rounded-md bg-[var(--amber)] py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)] disabled:opacity-60"
          >
            {saving ? "저장 중…" : "노트 저장"}
          </button>
        </>
      }
    >
      <form id="note-form" onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-1.5 text-sm">
          <span className="text-[var(--muted)]">시음일</span>
          <input
            required
            type="date"
            value={tastedAt}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setTastedAt(e.target.value)}
            className="field"
          />
        </label>

        <div className="space-y-2 text-sm">
          <span className="text-[var(--muted)]">별점</span>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[var(--muted)]">키워드</span>
            {tags.length ? (
              <button
                type="button"
                onClick={() => setTags([])}
                className="text-xs text-[var(--muted)] underline underline-offset-2 hover:text-[var(--cream)]"
              >
                {tags.length}개 선택 · 지우기
              </button>
            ) : null}
          </div>
          {WHISKY_FLAVOR_CATEGORIES.map((category) => (
            <div key={category.id} className="space-y-1.5">
              <p className="text-xs text-[var(--amber)]/80">{category.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {category.tags.map((tag) => {
                  const active = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleTag(tag)}
                      className={
                        active
                          ? "rounded-md bg-[var(--amber)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink)]"
                          : "rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--amber)] hover:text-[var(--cream)]"
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
            className="field resize-y"
            placeholder="첫 잔은 알코올이 세게 왔는데, 물 한 방울 떨어뜨리니 꿀 향이 올라왔다."
          />
        </label>

        <label className="flex items-start gap-2.5 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--amber)]"
          />
          <span>공개 노트로 남기기</span>
        </label>
      </form>
    </Modal>
  );
}
