"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { SlideOver } from "@/components/ui/slide-over";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
} from "@/lib/hooks/use-projects";
import type { Project } from "@/lib/types/database";
import { isAdmin } from "@/lib/constants/roles";
import { ProjectForm } from "./_components/project-form";
import { ProjectCard } from "./_components/project-card";
import type { ProjectFormValues } from "@/lib/validations/project";

export default function ProjectenPage() {
  const router = useRouter();
  const { effectiveRole } = useAuth();
  const canManage = isAdmin(effectiveRole);

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: projects = [], isLoading } = useProjects(search);
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    if (editingItem) {
      await updateProject.mutateAsync({ id: editingItem.id, ...values });
    } else {
      await createProject.mutateAsync(values);
    }
    handleClose();
  };

  const handleNavigate = (project: Project) => {
    router.push(`/projecten/${project.id}`);
  };

  const columns: Column<Project>[] = [
    {
      key: "code",
      header: "Code",
      render: (p) => <span className="font-medium">{p.code}</span>,
    },
    {
      key: "name",
      header: "Naam",
      render: (p) => p.name,
    },
    {
      key: "client",
      header: "Opdrachtgever",
      hideOnMobile: true,
      render: (p) => p.client || "\u2014",
    },
    {
      key: "location",
      header: "Locatie",
      hideOnMobile: true,
      render: (p) => p.location || "\u2014",
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <Badge variant={p.is_active ? "active" : "inactive"}>
          {p.is_active ? "Actief" : "Inactief"}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Projecten"
        actions={
          canManage ? (
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nieuw project
            </button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Zoek project..."
        />
      </div>

      {/* Mobile: card grid */}
      <div className="block md:hidden">
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Geen projecten"
            description="Voeg een project toe om te beginnen"
          />
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: data table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={projects}
          isLoading={isLoading}
          rowKey={(p) => p.id}
          onRowClick={handleNavigate}
          emptyState={
            <EmptyState
              icon={FolderKanban}
              title="Geen projecten"
              description="Voeg een project toe om te beginnen"
            />
          }
        />
      </div>

      <SlideOver
        open={isFormOpen}
        onClose={handleClose}
        title={editingItem ? "Project bewerken" : "Nieuw project"}
      >
        <ProjectForm
          key={editingItem?.id ?? "new"}
          defaultValues={
            editingItem
              ? {
                  code: editingItem.code,
                  name: editingItem.name,
                  description: editingItem.description,
                  client: editingItem.client,
                  location: editingItem.location,
                  start_date: editingItem.start_date,
                  end_date: editingItem.end_date,
                  is_active: editingItem.is_active,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={createProject.isPending || updateProject.isPending}
        />
      </SlideOver>
    </div>
  );
}
