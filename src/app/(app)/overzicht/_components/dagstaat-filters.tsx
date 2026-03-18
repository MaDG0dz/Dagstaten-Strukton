"use client";

import type { DagstaatStatus } from "@/lib/types/database";
import { useProjects } from "@/lib/hooks/use-projects";
import { STATUS_CONFIG } from "@/lib/constants/status-colors";

interface DagstaatFiltersProps {
  projectId: string;
  onProjectChange: (id: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
}

export function DagstaatFilters({
  projectId,
  onProjectChange,
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: DagstaatFiltersProps) {
  const { data: projects } = useProjects();

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={projectId}
        onChange={(e) => onProjectChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Alle projecten</option>
        {projects?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.name}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Alle statussen</option>
        {(["draft", "submitted", "approved"] as DagstaatStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Vanaf"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Tot"
      />
    </div>
  );
}
