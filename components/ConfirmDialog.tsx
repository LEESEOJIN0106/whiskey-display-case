"use client";

import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "neutral";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        {description}
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-[var(--line)] py-2.5 text-sm text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--cream)]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={
            tone === "danger"
              ? "flex-1 rounded-md bg-[var(--danger)] py-2.5 text-sm font-medium text-[#1b0f0d] transition hover:brightness-110 disabled:opacity-60"
              : "flex-1 rounded-md bg-[var(--amber)] py-2.5 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--gold)] disabled:opacity-60"
          }
        >
          {busy ? "처리 중…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
