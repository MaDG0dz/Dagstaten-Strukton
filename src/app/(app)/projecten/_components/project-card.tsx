"use client";

import { MapPin, Building2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/types/database";

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project) => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const startFormatted = formatDate(project.start_date);
  const endFormatted = formatDate(project.end_date);
  const dateRange =
    startFormatted || endFormatted
      ? `${startFormatted ?? "..."} - ${endFormatted ?? "..."}`
      : null;

  return (
    <button
      onClick={() => onClick(project)}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{project.code}</p>
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {project.name}
          </h3>
        </div>
        <Badge variant={project.is_active ? "active" : "inactive"}>
          {project.is_active ? "Actief" : "Inactief"}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {project.client && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.client}</span>
          </div>
        )}
        {project.location && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}
        {dateRange && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{dateRange}</span>
          </div>
        )}
      </div>
    </button>
  );
}
