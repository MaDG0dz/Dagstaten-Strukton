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
  default: "bg-gray-100 text-gray-700",
  active: "bg-green-50 text-green-700",
  inactive: "bg-gray-100 text-gray-500",
  beheerder: "bg-purple-50 text-purple-700",
  sr_uitvoerder: "bg-indigo-50 text-indigo-700",
  uitvoerder: "bg-blue-50 text-blue-700",
  voorman: "bg-amber-50 text-amber-700",
  draft: "bg-blue-50 text-blue-700",
  submitted: "bg-orange-50 text-orange-700",
  approved: "bg-green-50 text-green-700",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
