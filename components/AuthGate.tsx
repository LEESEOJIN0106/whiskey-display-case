"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div
        className="flex flex-1 flex-col"
        aria-busy="true"
        aria-label="불러오는 중"
      >
        <div className="h-16 border-b border-[var(--line)]/70" />
        <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6">
          <div className="h-9 w-40 rounded bg-[var(--line)]/60" />
          <div className="mt-3 h-4 w-56 rounded bg-[var(--line)]/40" />
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
