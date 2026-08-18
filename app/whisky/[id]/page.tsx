"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { AiringBadge } from "@/components/AiringBadge";
import { BottleLevel } from "@/components/BottleLevel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FlavorTimeline } from "@/components/FlavorTimeline";
import { PourActions } from "@/components/PourActions";
import { StarRating } from "@/components/StarRating";
import { airingHint, calendarDaysBetween } from "@/lib/airing";
import {
  createNote,
  deleteWhisky,
  fetchWhisky,
  recordPour,
  updateWhisky,
} from "@/lib/api";
import type { Whisky } from "@/lib/types";

const WhiskyFormModal = dynamic(
  () =>
    import("@/components/WhiskyFormModal").then((mod) => ({
      default: mod.WhiskyFormModal,
    })),
  { ssr: false }
);

const NoteFormModal = dynamic(
  () =>
    import("@/components/NoteFormModal").then((mod) => ({
      default: mod.NoteFormModal,
    })),
  { ssr: false }
);

const noteDate = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function WhiskyDetailPage() {
  return (
    <AuthGate>
      <WhiskyDetailContent />
    </AuthGate>
  );
}

function WhiskyDetailContent() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [whisky, setWhisky] = useState<Whisky | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [pouring, setPouring] = useState(false);
  const [pourPrompt, setPourPrompt] = useState(false);
  const [finishAsk, setFinishAsk] = useState<number | null>(null);
  const [deleteAsk, setDeleteAsk] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWhisky(id);
      setWhisky(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "상세 정보를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pourPrompt) return;
    const timer = window.setTimeout(() => setPourPrompt(false), 9000);
    return () => window.clearTimeout(timer);
  }, [pourPrompt]);

  const applyPour = useCallback(async (percent: number) => {
    setPouring(true);
    setError(null);
    try {
      const updated = await recordPour(id, percent);
      setWhisky((current) =>
        current ? { ...updated, notes: current.notes } : updated
      );
      setPourPrompt(updated.status === "OPENED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "한 잔 기록에 실패했습니다.");
    } finally {
      setPouring(false);
    }
  }, [id]);

  function handlePour(percent: number) {
    if (!whisky || pouring) return;
    if (whisky.remainingPercent - percent <= 0) {
      setFinishAsk(percent);
      return;
    }
    void applyPour(percent);
  }

  async function handleOpen() {
    if (!whisky) return;
    setError(null);
    try {
      await updateWhisky(whisky.id, {
        status: "OPENED",
        openedAt: new Date().toISOString(),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "개봉 처리에 실패했습니다.");
    }
  }

  async function handleDelete() {
    if (!whisky) return;
    setDeleting(true);
    try {
      await deleteWhisky(whisky.id);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setDeleteAsk(false);
      setDeleting(false);
    }
  }

  const hint =
    whisky?.airingDays !== null && whisky?.airingDays !== undefined
      ? airingHint(whisky.airingDays)
      : null;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--cream)]"
        >
          <ArrowLeft className="h-4 w-4" />
          셀러로 돌아가기
        </Link>

        {loading ? (
          <DetailSkeleton />
        ) : !whisky ? (
          <div className="rounded-xl border border-[var(--danger-dim)] bg-[#2a1614] p-5 text-[#f0c9c3]">
            <p>{error ?? "위스키를 찾을 수 없습니다."}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-md border border-[var(--danger-dim)] px-3 py-1.5 text-sm transition hover:bg-black/20"
              >
                다시 시도
              </button>
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-sm underline underline-offset-4"
              >
                셀러로
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-rise space-y-8">
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-[var(--danger-dim)] bg-[#2a1614] px-4 py-3 text-sm text-[#f0c9c3]"
              >
                {error}
              </p>
            ) : null}

            <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]/80">
              {whisky.imageUrl ? (
                <div className="relative max-h-72 overflow-hidden border-b border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={whisky.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    decoding="async"
                    className="max-h-72 w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--panel)] to-transparent" />
                </div>
              ) : null}

              <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                  <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-[var(--cream)] sm:text-4xl">
                    {whisky.name}
                  </h1>
                  <AiringBadge
                    label={whisky.label}
                    airingDays={whisky.airingDays}
                  />
                </div>

                <p className="mt-2 text-sm tabular-nums text-[var(--muted)]">
                  {whisky.abv}%
                  {whisky.airingDays !== null
                    ? ` · 개봉 ${whisky.airingDays}일 차`
                    : ""}
                </p>
                {hint ? (
                  <p className="mt-3 border-l-2 border-[var(--amber)]/40 pl-3 text-sm leading-relaxed text-[var(--muted)]">
                    {hint}
                  </p>
                ) : null}

                {whisky.status === "OPENED" || whisky.status === "FINISHED" ? (
                  <div className="mt-6 flex items-end gap-4">
                    <BottleLevel
                      percent={whisky.remainingPercent}
                      status={whisky.status}
                      airingDays={whisky.airingDays}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex justify-between text-sm text-[var(--muted)]">
                        <span>남은 양</span>
                        <span className="tabular-nums">
                          {whisky.status === "FINISHED"
                            ? "비움"
                            : `${whisky.remainingPercent}%`}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--ink)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--gold)] transition-[width] duration-500"
                          style={{
                            width: `${
                              whisky.status === "FINISHED"
                                ? 0
                                : whisky.remainingPercent
                            }%`,
                          }}
                        />
                      </div>
                      {whisky.status === "OPENED" ? (
                        <PourActions
                          remainingPercent={whisky.remainingPercent}
                          disabled={pouring}
                          onPour={handlePour}
                        />
                      ) : null}
                      {pourPrompt && whisky.status === "OPENED" ? (
                        <p className="mt-3 text-sm text-[var(--muted)]">
                          한 잔 기록했습니다.{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setPourPrompt(false);
                              setNoteOpen(true);
                            }}
                            className="text-[var(--gold)] underline underline-offset-2 hover:text-[var(--cream)]"
                          >
                            오늘 맛도 남겨 둘까요?
                          </button>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="mt-7 flex flex-wrap gap-2">
                  {whisky.status === "UNOPENED" ? (
                    <button
                      type="button"
                      onClick={() => void handleOpen()}
                      className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)]"
                    >
                      오늘 개봉
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="rounded-md border border-[var(--amber)]/50 px-4 py-2 text-sm text-[var(--gold)] transition hover:bg-[var(--amber)]/10"
                  >
                    노트 작성
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--cream)]"
                  >
                    <Pencil className="h-4 w-4" />
                    수정
                  </button>
                </div>
              </div>
            </section>

            <FlavorTimeline whisky={whisky} />

            <section>
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--cream)]">
                  테이스팅 노트
                </h2>
                {whisky.notes?.length ? (
                  <span className="text-sm tabular-nums text-[var(--muted)]">
                    {whisky.notes.length}개
                  </span>
                ) : null}
              </div>

              {!whisky.notes?.length ? (
                <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-12 text-center">
                  <p className="text-[var(--muted)]">
                    아직 남긴 기록이 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setNoteOpen(true)}
                    className="mt-3 text-sm text-[var(--gold)] underline underline-offset-4 hover:text-[var(--cream)]"
                  >
                    지금 한 잔 기록하기
                  </button>
                </div>
              ) : (
                <ol className="relative space-y-4 border-l border-[var(--line)] pl-6">
                  {whisky.notes.map((note) => {
                    const days = whisky.openedAt
                      ? Math.max(
                          0,
                          calendarDaysBetween(whisky.openedAt, note.tastedAt) ?? 0
                        )
                      : null;
                    return (
                      <li key={note.id} className="relative">
                        <span
                          aria-hidden
                          className="absolute -left-[1.71rem] top-2 h-2.5 w-2.5 rounded-full bg-[var(--amber)] ring-4 ring-[var(--bg)]"
                        />
                        <article className="rounded-lg border border-[var(--line)] bg-[var(--panel)]/60 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <time
                              dateTime={note.tastedAt}
                              className="text-sm tabular-nums text-[var(--muted)]"
                            >
                              {noteDate.format(new Date(note.tastedAt))}
                              {days !== null ? ` · D+${days}` : ""}
                            </time>
                            <StarRating value={note.rating} size="md" />
                          </div>

                          {note.tags.length ? (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {note.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded border border-[var(--line)] px-2 py-0.5 text-xs text-[var(--muted)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          {note.memo ? (
                            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[var(--cream)]">
                              {note.memo}
                            </p>
                          ) : null}

                          {note.isPublic ? (
                            <p className="mt-3 text-xs text-[var(--amber)]">
                              공개 노트
                            </p>
                          ) : null}
                        </article>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <div className="border-t border-[var(--line-soft)] pt-6">
              <button
                type="button"
                onClick={() => setDeleteAsk(true)}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--danger)]"
              >
                <Trash2 className="h-4 w-4" />
                이 병 지우기
              </button>
            </div>
          </div>
        )}
      </main>

      {whisky ? (
        <>
          <WhiskyFormModal
            open={editOpen}
            title="위스키 수정"
            initial={whisky}
            onClose={() => setEditOpen(false)}
            onSubmit={async (payload) => {
              await updateWhisky(whisky.id, payload);
              await load();
            }}
          />
          <NoteFormModal
            open={noteOpen}
            onClose={() => setNoteOpen(false)}
            onSubmit={async (payload) => {
              await createNote(whisky.id, payload);
              await load();
            }}
          />
          <ConfirmDialog
            open={finishAsk !== null}
            tone="neutral"
            title="마지막 한 잔인가요?"
            description="이 잔을 기록하면 남은 양이 0%가 되고 ‘비움’으로 넘어갑니다."
            confirmLabel="비움으로 기록"
            busy={pouring}
            onConfirm={() => {
              const percent = finishAsk;
              setFinishAsk(null);
              if (percent !== null) void applyPour(percent);
            }}
            onCancel={() => setFinishAsk(null)}
          />
          <ConfirmDialog
            open={deleteAsk}
            title="이 병을 지울까요?"
            description={
              <>
                <strong className="text-[var(--cream)]">{whisky.name}</strong>
                와(과) 여기에 남긴 노트 {whisky.notes?.length ?? 0}개가 함께
                사라집니다. 되돌릴 수 없습니다.
              </>
            }
            confirmLabel="삭제"
            busy={deleting}
            onConfirm={() => void handleDelete()}
            onCancel={() => setDeleteAsk(false)}
          />
        </>
      ) : null}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="불러오는 중">
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)]/60">
        <div className="h-56 bg-[var(--ink)]/60" />
        <div className="space-y-4 p-6">
          <div className="h-9 w-3/5 rounded bg-[var(--line)]/70" />
          <div className="h-4 w-28 rounded bg-[var(--line)]/50" />
          <div className="flex items-end gap-4 pt-2">
            <div className="h-24 w-8 rounded bg-[var(--line)]/50" />
            <div className="flex-1 space-y-3">
              <div className="h-2 rounded-full bg-[var(--line)]/50" />
              <div className="h-16 rounded-lg bg-[var(--line)]/30" />
            </div>
          </div>
        </div>
      </div>
      <div className="h-7 w-36 rounded bg-[var(--line)]/60" />
      <div className="h-28 rounded-lg bg-[var(--panel)]/60" />
    </div>
  );
}
