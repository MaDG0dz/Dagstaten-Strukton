export type DagstaatStatus = "empty" | "draft" | "submitted" | "approved";

export const STATUS_CONFIG: Record<
  DagstaatStatus,
  { label: string; color: string; bgColor: string; textColor: string }
> = {
  empty: {
    label: "Leeg",
    color: "bg-gray-400",
    bgColor: "bg-gray-100",
    textColor: "text-gray-600",
  },
  draft: {
    label: "Concept",
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  submitted: {
    label: "Ingediend",
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
  },
  approved: {
    label: "Goedgekeurd",
    color: "bg-green-500",
    bgColor: "bg-green-50",
    textColor: "text-green-700",
  },
};
