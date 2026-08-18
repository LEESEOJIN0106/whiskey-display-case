"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { WhiskyCard } from "@/components/WhiskyCard";
import { TonightPicks } from "@/components/TonightPicks";
import { createWhisky, deleteWhisky, fetchWhiskies } from "@/lib/api";
import {
  CELLAR_FILTERS,
  CELLAR_SORTS,
  applyCellarView,
  countByStatus,
  type CellarFilter,
  type CellarSort,
} from "@/lib/cellar";
import { pickTonight } from "@/lib/tonight";
import type { Whisky } from "@/lib/types";

const WhiskyFormModal = dynamic(
  () =>
    import("@/components/WhiskyFormModal").then((mod) => ({
      default: mod.WhiskyFormModal,
    })),
  { ssr: false }
);

export function Dashboard() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const [whiskies, setWhiskies] = useState<Whisky[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<CellarFilter>("ALL");
  const [sort, setSort] = useState<CellarSort>("recent");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Whisky | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWhiskies();
      setWhiskies(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => countByStatus(whiskies), [whiskies]);
  const visible = useMemo(
    () => applyCellarView(whiskies, { filter, sort, search }),
    [whiskies, filter, sort, search]
  );

  const filtering = filter !== "ALL" || search.trim().length > 0;
  const showControls = !loading && !error && whiskies.length > 0;
  const showSearch = whiskies.length >= 6;

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteWhisky(pendingDelete.id);
      setWhiskies((current) =>
        current.filter((item) => item.id !== pendingDelete.id)
      );
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AppHeader onAddWhisky={() => setModalOpen(true)} />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="animate-rise mb-7">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--cream)] sm:text-4xl">
            나의 셀러
          </h1>
          {showControls ? (
            <p className="mt-2 text-sm tabular-nums text-[var(--muted)]">
              {summary(counts)}
            </p>
          ) : null}
        </div>

        {showControls ? (
          <div className="animate-rise mb-6 flex flex-wrap items-center gap-x-2 gap-y-3">
            <div className="flex flex-wrap gap-1.5">
              {CELLAR_FILTERS.filter(
                (item) => item.key === "ALL" || counts[item.key] > 0
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                  className={
                    filter === item.key
                      ? "rounded-md border border-[var(--amber)] bg-[var(--amber)]/15 px-3 py-1.5 text-sm font-medium text-[var(--gold)]"
                      : "rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--cream)]"
                  }
                >
                  {item.label}
                  <span className="ml-1.5 text-xs tabular-nums opacity-60">
                    {counts[item.key]}
                  </span>
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {showSearch ? (
                <div className="relative">
                  <Search
                    aria-hidden
                    className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="이름으로 찾기"
                    aria-label="위스키 이름으로 찾기"
                    className="field min-h-0 w-40 py-1.5 pl-8 pr-2 text-sm sm:w-48"
                  />
                </div>
              ) : null}
              <label className="sr-only" htmlFor="cellar-sort">
                정렬 기준
              </label>
              <select
                id="cellar-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as CellarSort)}
                className="field min-h-0 w-auto py-1.5 text-sm"
              >
                {CELLAR_SORTS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {showControls && !filtering ? (
          <TonightPicks picks={pickTonight(whiskies)} />
        ) : null}

        {loading ? (
          <CellarSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-[var(--danger-dim)] bg-[#2a1614] p-4 text-[#f0c9c3]">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded-md border border-[var(--danger-dim)] px-3 py-1.5 text-sm transition hover:bg-black/20"
            >
              다시 시도
            </button>
          </div>
        ) : whiskies.length === 0 ? (
          <div className="animate-rise-delay rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)]/40 px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--cream)]">
              셀러가 비어 있습니다
            </p>
            <p className="mx-auto mt-2 max-w-xs text-[var(--muted)]">
              지금 갖고 있는 병 하나만 올려 두면, 개봉일부터 며칠이 지났는지
              알아서 세어 둡니다.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)]"
            >
              첫 병 등록
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] px-6 py-14 text-center">
            <p className="text-[var(--muted)]">
              {search.trim()
                ? `‘${search.trim()}’과 맞는 병이 없습니다.`
                : "이 조건에 맞는 병이 없습니다."}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("ALL");
                setSearch("");
              }}
              className="mt-4 text-sm text-[var(--gold)] underline underline-offset-4 hover:text-[var(--cream)]"
            >
              조건 지우기
            </button>
          </div>
        ) : (
          <div className="animate-rise-delay grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((whisky, index) => (
              <WhiskyCard
                key={whisky.id}
                whisky={whisky}
                priority={index < 3}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        )}
      </main>

      <WhiskyFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={async (payload) => {
          await createWhisky(payload);
          await load();
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="이 병을 지울까요?"
        description={
          <>
            <strong className="text-[var(--cream)]">
              {pendingDelete?.name}
            </strong>
            와(과) 여기에 남긴 테이스팅 노트가 함께 사라집니다. 되돌릴 수
            없습니다.
          </>
        }
        confirmLabel="삭제"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

function summary(counts: Record<CellarFilter, number>) {
  const parts = [`${counts.ALL}병`];
  if (counts.OPENED) parts.push(`개봉 ${counts.OPENED}`);
  if (counts.UNOPENED) parts.push(`미개봉 ${counts.UNOPENED}`);
  if (counts.FINISHED) parts.push(`비움 ${counts.FINISHED}`);
  return parts.join(" · ");
}

function CellarSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="셀러 불러오는 중"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)]/50"
        >
          <div className="h-40 bg-[var(--ink)]/60" />
          <div className="space-y-3 p-5">
            <div
              className="h-5 rounded bg-[var(--line)]/70"
              style={{ width: `${70 - index * 8}%` }}
            />
            <div className="h-3.5 w-1/3 rounded bg-[var(--line)]/50" />
            <div className="flex items-end justify-between pt-3">
              <div className="h-6 w-14 rounded bg-[var(--line)]/50" />
              <div className="h-12 w-5 rounded bg-[var(--line)]/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
