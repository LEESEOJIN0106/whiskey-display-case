"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "lg";
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "lg",
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const { body } = document;
    const scrollbarWidth = window.innerWidth - body.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    const panel = panelRef.current;
    const firstField = panel?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),select:not([disabled])'
    );
    (firstField ?? panel)?.focus({ preventScroll: true });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((item) => item.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="animate-fade absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onMouseDown={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "animate-sheet relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_-8px_50px_rgba(0,0,0,0.5)] outline-none sm:rounded-xl sm:shadow-[0_24px_70px_rgba(0,0,0,0.55)]",
          size === "sm" ? "sm:max-w-sm" : "sm:max-w-lg"
        )}
      >
        <div className="shrink-0 px-6 pb-4 pt-3 sm:pt-5">
          <div
            aria-hidden
            className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line)] sm:hidden"
          />
          <div className="flex items-start justify-between gap-4">
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--cream)]"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="-mr-1.5 -mt-0.5 rounded-md p-1.5 text-[var(--muted)] transition hover:bg-[var(--ink)] hover:text-[var(--cream)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-2">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-[var(--line-soft)] bg-[var(--panel)] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:rounded-b-xl">
            {footer}
          </div>
        ) : (
          <div className="h-4 shrink-0 pb-[env(safe-area-inset-bottom)]" />
        )}
      </div>
    </div>
  );
}
