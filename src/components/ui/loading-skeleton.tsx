import { cn } from "@/lib/utils/cn";

function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-gray-200", className)}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Pulse className="h-8 w-48" />
        <Pulse className="h-4 w-32" />
      </div>
      <Pulse className="h-10 w-full max-w-sm" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Pulse key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Pulse className="h-10 flex-1" />
          <Pulse className="h-10 w-24 hidden sm:block" />
          <Pulse className="h-10 w-20 hidden md:block" />
          <Pulse className="h-10 w-16" />
        </div>
      ))}
    </div>
  );
}
