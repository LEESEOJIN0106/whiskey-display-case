"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AuthGate } from "@/components/AuthGate";
import { AppHeader } from "@/components/AppHeader";
import { WhiskyCard } from "@/components/WhiskyCard";
import { TonightPicks } from "@/components/TonightPicks";
import { createWhisky, deleteWhisky, fetchWhiskies } from "@/lib/api";
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

  const handleDelete = useCallback(async (whisky: Whisky) => {
    if (!window.confirm(`‘${whisky.name}’을(를) 삭제할까요?`)) return;
    try {
      await deleteWhisky(whisky.id);
      setWhiskies((current) => current.filter((item) => item.id !== whisky.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }, []);

  return (
    <>
      <AppHeader onAddWhisky={() => setModalOpen(true)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="animate-rise mb-8">
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--cream)] sm:text-4xl">
            나의 셀러
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            개봉 후 에어링 상태와 잔여량을 한눈에 확인하세요.
          </p>
        </div>

        {!loading && !error && whiskies.length > 0 ? (
          <TonightPicks picks={pickTonight(whiskies)} />
        ) : null}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-lg border border-[var(--line)] bg-[var(--panel)]/50"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-800/50 bg-rose-950/30 p-4 text-rose-200">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 text-sm underline"
            >
              다시 시도
            </button>
          </div>
        ) : whiskies.length === 0 ? (
          <div className="animate-rise-delay rounded-xl border border-dashed border-[var(--line)] bg-[var(--panel)]/40 px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--cream)]">
              아직 등록된 위스키가 없습니다
            </p>
            <p className="mt-2 text-[var(--muted)]">
              첫 병을 등록하고 에어링을 시작해 보세요.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 rounded-md bg-[var(--amber)] px-4 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--gold)]"
            >
              위스키 등록
            </button>
          </div>
        ) : (
          <div className="animate-rise-delay grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whiskies.map((whisky, index) => (
              <WhiskyCard
                key={whisky.id}
                whisky={whisky}
                priority={index < 3}
                onDelete={handleDelete}
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
    </>
  );
}
