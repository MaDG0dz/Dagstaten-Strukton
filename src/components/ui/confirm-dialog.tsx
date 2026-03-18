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
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuleren
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium text-white",
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
