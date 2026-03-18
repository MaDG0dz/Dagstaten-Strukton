import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export function FormInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900",
        "transition-shadow duration-150",
        "focus:border-[#e43122] focus:outline-none focus:ring-4 focus:ring-[#e43122]/20",
        "disabled:bg-slate-50 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}

export function FormSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-900",
        "transition-shadow duration-150",
        "focus:border-[#e43122] focus:outline-none focus:ring-4 focus:ring-[#e43122]/20",
        "disabled:bg-slate-50 disabled:text-slate-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-900",
        "transition-shadow duration-150",
        "focus:border-[#e43122] focus:outline-none focus:ring-4 focus:ring-[#e43122]/20",
        "disabled:bg-slate-50 disabled:text-slate-500",
        className
      )}
      {...props}
    />
  );
}
