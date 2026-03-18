import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
      <div className="mb-3 rounded-2xl bg-slate-100 p-4">
        <Icon className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-slate-800">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
