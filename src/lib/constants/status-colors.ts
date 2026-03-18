export type DagstaatStatus = "empty" | "draft" | "submitted" | "approved";

export const STATUS_CONFIG: Record<
  DagstaatStatus,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  empty: {
    label: "Leeg",
    color: "bg-slate-300",
    bgColor: "bg-slate-100",
    textColor: "text-slate-500",
  },
  draft: {
    label: "Concept",
    color: "bg-sky-500",
    bgColor: "bg-sky-50",
    textColor: "text-sky-700",
  },
  submitted: {
    label: "Ingediend",
    color: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  approved: {
    label: "Goedgekeurd",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
};
