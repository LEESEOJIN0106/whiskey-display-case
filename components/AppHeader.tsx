"use client";

import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AppHeaderProps = {
  onAddWhisky?: () => void;
};

export function AppHeader({ onAddWhisky }: AppHeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)]/70 bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--amber)] transition-colors group-hover:text-[var(--gold)]">
            위스키 로그
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-[var(--muted)] sm:inline">
            Whisky Log
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {onAddWhisky ? (
            <button
              type="button"
              onClick={onAddWhisky}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--amber)] px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">위스키 등록</span>
            </button>
          ) : null}
          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--amber)] hover:text-[var(--cream)]"
              aria-label="로그아웃"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden max-w-[10rem] truncate sm:inline">
                {user.displayName || user.email}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
