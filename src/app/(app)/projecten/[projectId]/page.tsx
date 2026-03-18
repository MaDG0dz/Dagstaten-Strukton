"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, ClipboardList, Building2, MapPin, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { SlideOver } from "@/components/ui/slide-over";
import { useAuth } from "@/components/providers/auth-provider";
import { useSupabaseItem } from "@/lib/hooks/use-supabase-query";
import { useUpdateProject } from "@/lib/hooks/use-projects";
import type { Project } from "@/lib/types/database";
import { isAdmin } from "@/lib/constants/roles";
import { ProjectForm } from "../_components/project-form";
import { MembersSection } from "./_components/members-section";
import { SubprojectsSection } from "./_components/subprojects-section";
import type { ProjectFormValues } from "@/lib/validations/project";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { effectiveRole } = useAuth();
  const canManage = isAdmin(effectiveRole);

  const { data: project, isLoading } = useSupabaseItem<Project>("projects", projectId);
  const updateProject = useUpdateProject();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleEditSubmit = async (values: ProjectFormValues) => {
    await updateProject.mutateAsync({ id: projectId, ...values });
    setIsEditOpen(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-50" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Project niet gevonden.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        backHref="/projecten"
        actions={
          canManage ? (
            <button
              onClick={() => setIsEditOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Bewerken
            </button>
          ) : undefined
        }
      />

      {/* Project info */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500">
            {project.code}
          </span>
          <Badge variant={project.is_active ? "active" : "inactive"}>
            {project.is_active ? "Actief" : "Inactief"}
          </Badge>
        </div>

        {project.description && (
          <p className="mb-4 text-sm text-slate-600">{project.description}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {project.client && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Opdrachtgever</p>
                <p>{project.client}</p>
              </div>
            </div>
          )}
          {project.location && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Locatie</p>
                <p>{project.location}</p>
              </div>
            </div>
          )}
          {(project.start_date || project.end_date) && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-400">Periode</p>
                <p>
                  {formatDate(project.start_date) ?? "..."} -{" "}
                  {formatDate(project.end_date) ?? "..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dagstaten link */}
      <div className="mb-8">
        <Link
          href={`/projecten/${projectId}/dagstaat`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
        >
          <ClipboardList className="h-4 w-4" />
          Dagstaten bekijken
        </Link>
      </div>

      {/* Members */}
      <div className="mb-8">
        <MembersSection projectId={projectId} />
      </div>

      {/* Subprojects */}
      <div className="mb-8">
        <SubprojectsSection projectId={projectId} />
      </div>

      {/* Edit SlideOver */}
      <SlideOver
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Project bewerken"
      >
        <ProjectForm
          key={project.id}
          defaultValues={{
            code: project.code,
            name: project.name,
            description: project.description,
            client: project.client,
            location: project.location,
            start_date: project.start_date,
            end_date: project.end_date,
            is_active: project.is_active,
          }}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditOpen(false)}
          isLoading={updateProject.isPending}
        />
      </SlideOver>
    </div>
  );
}
