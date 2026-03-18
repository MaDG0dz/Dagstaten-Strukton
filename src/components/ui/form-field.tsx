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
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
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
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        "disabled:bg-gray-50 disabled:text-gray-500",
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
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        "disabled:bg-gray-50 disabled:text-gray-500",
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
        "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm",
        "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary",
        "disabled:bg-gray-50 disabled:text-gray-500",
        className
      )}
      {...props}
    />
  );
}
