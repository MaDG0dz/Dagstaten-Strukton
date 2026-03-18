"use client";

import { Modal } from "./modal";
import { cn } from "@/lib/utils/cn";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Bevestigen",
  variant = "danger",
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
        >
          Annuleren
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "h-10 rounded-xl px-4 text-sm font-medium text-white transition-colors duration-150",
            variant === "danger"
              ? "bg-red-600 hover:bg-red-700"
              : "bg-amber-600 hover:bg-amber-700",
            loading && "opacity-50"
          )}
        >
          {loading ? "Bezig..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
