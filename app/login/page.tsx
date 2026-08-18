"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/components/GoogleAnalytics";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      trackEvent("login", { method: "Google" });
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "구글 로그인에 실패했습니다."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-dvh flex-1 flex-col">
      <Image
        src="/login-cellar.jpg"
        alt=""
        fill
        preload
        quality={70}
        sizes="100vw"
        className="object-cover object-[center_68%]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#140e09]/35 to-black/70" />

      <section className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="animate-rise mb-10 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-5xl tracking-[0.06em] text-[var(--cream)] drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)] sm:text-6xl">
            whiskeylog
          </h1>
          <p className="mt-4 text-[#e8dcc8] drop-shadow-[0_1px_12px_rgba(0,0,0,0.8)]">
            위로그로 에어링을 추적하고, 시음의 순간을 남기세요.
          </p>
        </div>

        <div className="animate-rise-delay space-y-4 rounded-xl border border-white/15 bg-[#1a120c]/55 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
          {error ? (
            <p role="alert" className="text-sm text-[#f0a99f]">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleGoogle()}
            className="w-full rounded-md bg-[var(--amber)] py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)] disabled:opacity-60"
          >
            {busy ? "로그인 중…" : "Google로 계속하기"}
          </button>
        </div>
      </section>
    </main>
  );
}
