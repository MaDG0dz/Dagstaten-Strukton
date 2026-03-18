import { useSupabaseList, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "./use-supabase-query";
import type { Project, Subproject, ProjectMember } from "@/lib/types/database";

export const useProjects = (search?: string) =>
  useSupabaseList<Project>("projects", {
    search: search ? { column: "name", term: search } : undefined,
    orderBy: { column: "name", ascending: true },
  });

export const useCreateProject = () => useSupabaseInsert<Project>("projects");
export const useUpdateProject = () => useSupabaseUpdate<Project>("projects");
export const useDeleteProject = () => useSupabaseDelete("projects");

export const useSubprojects = (projectId: string) =>
  useSupabaseList<Subproject>("subprojects", {
    filters: { project_id: projectId },
    orderBy: { column: "code", ascending: true },
  });

export const useCreateSubproject = () => useSupabaseInsert<Subproject>("subprojects");
export const useUpdateSubproject = () => useSupabaseUpdate<Subproject>("subprojects");
export const useDeleteSubproject = () => useSupabaseDelete("subprojects");

export const useProjectMembers = (projectId: string) =>
  useSupabaseList<ProjectMember>("project_members", {
    select: "*, profile:profiles(*)",
    filters: { project_id: projectId },
    orderBy: { column: "created_at", ascending: true },
  });

export const useAddProjectMember = () => useSupabaseInsert<ProjectMember>("project_members");
export const useRemoveProjectMember = () => useSupabaseDelete("project_members");
