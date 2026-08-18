"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Star, Trash2 } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { AiringBadge } from "@/components/AiringBadge";
import { BottleLevel } from "@/components/BottleLevel";
import { FlavorTimeline } from "@/components/FlavorTimeline";
import { PourActions } from "@/components/PourActions";
import { calendarDaysBetween } from "@/lib/airing";
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

  async function handlePour(percent: number) {
    if (!whisky || pouring) return;
    const next = Math.max(0, whisky.remainingPercent - percent);
    if (next === 0) {
      if (!window.confirm("잔여량이 0이 됩니다. 시음 완료로 표시할까요?")) return;
    }
    setPouring(true);
    setError(null);
    try {
      const updated = await recordPour(whisky.id, percent);
      setWhisky((current) =>
        current ? { ...updated, notes: current.notes } : updated
      );
      setPourPrompt(updated.status === "OPENED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "한 잔 기록에 실패했습니다.");
    } finally {
      setPouring(false);
    }
  }

  async function handleOpen() {
    if (!whisky) return;
    const updated = await updateWhisky(whisky.id, {
      status: "OPENED",
      openedAt: new Date().toISOString(),
    });
    setWhisky({ ...updated, notes: whisky.notes });
    await load();
  }

  async function handleDelete() {
    if (!whisky) return;
    if (!window.confirm(`‘${whisky.name}’을(를) 삭제할까요?`)) return;
    try {
      await deleteWhisky(whisky.id);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--cream)]"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Link>

        {loading ? (
          <p className="text-[var(--muted)]">불러오는 중…</p>
        ) : error || !whisky ? (
          <p className="text-rose-300">{error ?? "위스키를 찾을 수 없습니다."}</p>
        ) : (
          <div className="animate-rise space-y-8">
            <section className="rounded-xl border border-[var(--line)] bg-[var(--panel)]/80 p-6">
              {whisky.imageUrl ? (
                <div className="mb-5 overflow-hidden rounded-lg border border-[var(--line)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={whisky.imageUrl}
                    alt={whisky.name}
                    referrerPolicy="no-referrer"
                    fetchPriority="high"
                    decoding="async"
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--cream)]">
                    {whisky.name}
                  </h1>
                  <p className="mt-2 text-[var(--muted)]">{whisky.abv}% ABV</p>
                </div>
                <AiringBadge
                  label={whisky.label}
                  airingDays={whisky.airingDays}
                />
              </div>

              {whisky.airingDays !== null ? (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  개봉 {whisky.airingDays}일 차
                </p>
              ) : null}

              {whisky.status === "OPENED" || whisky.status === "FINISHED" ? (
                <div className="mt-5 flex items-end gap-4">
                  <BottleLevel
                    percent={whisky.remainingPercent}
                    status={whisky.status}
                    airingDays={whisky.airingDays}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-sm text-[var(--muted)]">
                      <span>잔여량</span>
                      <span>
                        {whisky.status === "FINISHED"
                          ? "완료"
                          : `${whisky.remainingPercent}%`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--ink)]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--amber)] to-[var(--gold)]"
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
                        onPour={(percent) => void handlePour(percent)}
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

              <div className="mt-6 flex flex-wrap gap-2">
                {whisky.status === "UNOPENED" ? (
                  <button
                    type="button"
                    onClick={() => void handleOpen()}
                    className="rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--gold)]"
                  >
                    개봉하기
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--amber)] hover:text-[var(--cream)]"
                >
                  <Pencil className="h-4 w-4" />
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setNoteOpen(true)}
                  className="rounded-md border border-[var(--amber)]/50 px-4 py-2 text-sm text-[var(--gold)] hover:bg-[var(--amber)]/10"
                >
                  노트 작성
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-900/60 px-4 py-2 text-sm text-rose-300 hover:border-rose-400/70 hover:bg-rose-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              </div>
            </section>

            <FlavorTimeline whisky={whisky} />

            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]">
                테이스팅 노트
              </h2>
              {!whisky.notes?.length ? (
                <p className="rounded-lg border border-dashed border-[var(--line)] px-4 py-10 text-center text-[var(--muted)]">
                  아직 노트가 없습니다. 첫 시음을 기록해 보세요.
                </p>
              ) : (
                <ol className="relative space-y-4 border-l border-[var(--line)] pl-6">
                  {whisky.notes.map((note) => (
                    <li key={note.id} className="relative">
                      <span className="absolute -left-[1.7rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--amber)]" />
                      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)]/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <time className="text-sm text-[var(--muted)]">
                            {new Date(note.tastedAt).toLocaleDateString("ko-KR")}
                            {whisky.openedAt
                              ? ` · D+${Math.max(0, calendarDaysBetween(whisky.openedAt, note.tastedAt) ?? 0)}`
                              : ""}
                          </time>
                          <span className="inline-flex items-center gap-1 text-[var(--gold)]">
                            <Star className="h-4 w-4 fill-current" />
                            {note.rating}/5
                          </span>
                        </div>
                        {note.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
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
                          <p className="mt-3 whitespace-pre-wrap text-[var(--cream)]">
                            {note.memo}
                          </p>
                        ) : null}
                        {note.isPublic ? (
                          <p className="mt-2 text-xs text-[var(--amber)]">공개</p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
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
        </>
      ) : null}
    </>
  );
}
