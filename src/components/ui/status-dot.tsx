import { cn } from "@/lib/utils/cn";
import { STATUS_CONFIG, type DagstaatStatus } from "@/lib/constants/status-colors";

interface StatusDotProps {
  status: DagstaatStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

export function StatusDot({ status, size = "md", showLabel = false }: StatusDotProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("rounded-full", config.color, sizeClasses[size])}
        aria-label={config.label}
      />
      {showLabel && (
        <span className={cn("text-xs font-medium", config.textColor)}>
          {config.label}
        </span>
      )}
    </span>
  );
}
