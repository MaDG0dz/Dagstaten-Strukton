import { cn } from "@/lib/utils/cn";

type BadgeVariant =
  | "default"
  | "active"
  | "inactive"
  | "beheerder"
  | "sr_uitvoerder"
  | "uitvoerder"
  | "voorman"
  | "draft"
  | "submitted"
  | "approved";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  beheerder: "bg-violet-50 text-violet-700",
  sr_uitvoerder: "bg-indigo-50 text-indigo-700",
  uitvoerder: "bg-blue-50 text-blue-700",
  voorman: "bg-amber-50 text-amber-700",
  draft: "bg-sky-50 text-sky-700",
  submitted: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
