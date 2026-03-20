"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Pencil,
  Building2,
  MapPin,
  Calendar,
  LayoutDashboard,
  Settings,
  Package,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { SlideOver } from "@/components/ui/slide-over";
import { useAuth } from "@/components/providers/auth-provider";
import { useSupabaseItem } from "@/lib/hooks/use-supabase-query";
import { useUpdateProject } from "@/lib/hooks/use-projects";
import { useDagstaten } from "@/lib/hooks/use-dagstaten";
import type { Project } from "@/lib/types/database";
import { isAdmin } from "@/lib/constants/roles";
import { ProjectForm } from "../_components/project-form";
import { MembersSection } from "./_components/members-section";
import { SubprojectsSection } from "./_components/subprojects-section";
import { ProjectDagstatenTab } from "./_components/project-dagstaten-tab";
import { ProjectInstellingenTab } from "./_components/project-instellingen-tab";
import { ProjectMateriaalTab } from "./_components/project-materiaal-tab";
import { ProjectUrenTab } from "./_components/project-uren-tab";
import type { ProjectFormValues } from "@/lib/validations/project";

type TabKey = "overzicht" | "dagstaten" | "materiaalgebruik" | "urenoverzicht" | "instellingen";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overzicht", label: "Overzicht", icon: LayoutDashboard },
  { key: "dagstaten", label: "Dagstaten", icon: Calendar },
  { key: "materiaalgebruik", label: "Materiaalgebruik", icon: Package },
  { key: "urenoverzicht", label: "Urenoverzicht", icon: Clock },
  { key: "instellingen", label: "Instellingen", icon: Settings },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { effectiveRole } = useAuth();
  const canManage = isAdmin(effectiveRole);

  const { data: project, isLoading } = useSupabaseItem<Project>("projects", projectId);
  const updateProject = useUpdateProject();

  const [activeTab, setActiveTab] = useState<TabKey>("overzicht");
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Quick stats: dagstaten this month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const nextMonth = now.getMonth() === 11
    ? `${now.getFullYear() + 1}-01-01`
    : `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, "0")}-01`;

  const { data: monthDagstaten = [] } = useDagstaten({
    project_id: projectId,
    date_from: monthStart,
    date_to: nextMonth,
  });

  const stats = useMemo(() => {
    const draft = monthDagstaten.filter((d) => d.status === "draft").length;
    const submitted = monthDagstaten.filter((d) => d.status === "submitted").length;
    const approved = monthDagstaten.filter((d) => d.status === "approved").length;
    return { draft, submitted, approved, total: draft + submitted + approved };
  }, [monthDagstaten]);

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
        breadcrumbs={[
          { label: "Projecten", href: "/projecten" },
          { label: project.name },
        ]}
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

      {/* Tab Bar */}
      <div className="flex border-b border-slate-200 mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 cursor-pointer transition-colors ${
                isActive
                  ? "border-b-2 border-[#e43122] text-[#e43122] -mb-px font-semibold"
                  : "text-slate-500 hover:text-slate-700 hover:border-b-2 hover:border-slate-300 -mb-px"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overzicht" && (
          <div className="space-y-8">
            {/* Project Info Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500">
                  {project.code}
                </span>
                <Badge variant={project.is_active ? "active" : "inactive"}>
                  {project.is_active ? "Actief" : "Inactief"}
                </Badge>
              </div>

              {project.description && (
                <p className="mb-4 text-sm text-slate-600">
                  {project.description}
                </p>
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

            {/* Quick Stats */}
            <div>
              <h3 className="mb-3 font-[family-name:var(--font-heading)] text-base font-semibold text-slate-900">
                Dagstaten deze maand
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <span className="text-2xl font-bold text-slate-900">
                    {stats.total}
                  </span>
                  <p className="mt-1 text-xs text-slate-500">Totaal</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.draft}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Concept</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.submitted}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Ingediend</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-2xl font-bold text-slate-900">
                      {stats.approved}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Goedgekeurd</p>
                </div>
              </div>
            </div>

            {/* Members */}
            <MembersSection projectId={projectId} />

            {/* Subprojects */}
            <SubprojectsSection projectId={projectId} />
          </div>
        )}

        {activeTab === "dagstaten" && (
          <ProjectDagstatenTab projectId={projectId} />
        )}

        {activeTab === "materiaalgebruik" && (
          <ProjectMateriaalTab projectId={projectId} />
        )}

        {activeTab === "urenoverzicht" && (
          <ProjectUrenTab projectId={projectId} />
        )}

        {activeTab === "instellingen" && (
          <ProjectInstellingenTab projectId={projectId} />
        )}
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
