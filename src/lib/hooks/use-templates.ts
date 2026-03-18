import { useSupabaseList, useSupabaseInsert, useSupabaseDelete } from "./use-supabase-query";
import type { ProjectTemplate, Activity } from "@/lib/types/database";

// ── Project Templates ──────────────────────────────────────────────

export interface TemplatePersoneel {
  id: string;
  template_id: string;
  employee_id: string;
  unit: string;
  default_qty: number;
  sort_order: number;
  employee?: { id: string; name: string; is_subcontractor: boolean; function: string | null };
}

export interface TemplateMaterieel {
  id: string;
  template_id: string;
  equipment_id: string;
  unit: string;
  default_qty: number;
  sort_order: number;
  equipment?: { id: string; name: string; code: string | null };
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  activity_id: string;
  created_at: string;
  activity?: Activity;
}

export const useProjectTemplates = (projectId: string) =>
  useSupabaseList<ProjectTemplate>("project_templates", {
    queryKey: ["project_templates", projectId],
    filters: { project_id: projectId },
    orderBy: { column: "created_at", ascending: true },
    enabled: !!projectId,
  });

export const useTemplatePersoneel = (templateId: string) =>
  useSupabaseList<TemplatePersoneel>("template_personeel", {
    queryKey: ["template_personeel", templateId],
    select: "*, employee:employees(id, name, is_subcontractor, function)",
    filters: { template_id: templateId },
    orderBy: { column: "sort_order", ascending: true },
    enabled: !!templateId,
  });

export const useTemplateMaterieel = (templateId: string) =>
  useSupabaseList<TemplateMaterieel>("template_materieel", {
    queryKey: ["template_materieel", templateId],
    select: "*, equipment:equipment(id, name, code)",
    filters: { template_id: templateId },
    orderBy: { column: "sort_order", ascending: true },
    enabled: !!templateId,
  });

export const useCreateTemplate = () =>
  useSupabaseInsert<ProjectTemplate>("project_templates", {
    invalidateKeys: [["project_templates"]],
  });

export const useDeleteTemplate = () =>
  useSupabaseDelete("project_templates", {
    invalidateKeys: [["project_templates"]],
  });

export const useCreateTemplatePersoneel = () =>
  useSupabaseInsert<TemplatePersoneel>("template_personeel", {
    invalidateKeys: [["template_personeel"]],
  });

export const useDeleteTemplatePersoneel = () =>
  useSupabaseDelete("template_personeel", {
    invalidateKeys: [["template_personeel"]],
  });

export const useCreateTemplateMaterieel = () =>
  useSupabaseInsert<TemplateMaterieel>("template_materieel", {
    invalidateKeys: [["template_materieel"]],
  });

export const useDeleteTemplateMaterieel = () =>
  useSupabaseDelete("template_materieel", {
    invalidateKeys: [["template_materieel"]],
  });

// ── Project Activities ─────────────────────────────────────────────

export const useProjectActivities = (projectId: string) =>
  useSupabaseList<ProjectActivity>("project_activities", {
    queryKey: ["project_activities", projectId],
    select: "*, activity:activities(*)",
    filters: { project_id: projectId },
    orderBy: { column: "created_at", ascending: true },
    enabled: !!projectId,
  });

export const useAddProjectActivity = () =>
  useSupabaseInsert<ProjectActivity>("project_activities", {
    invalidateKeys: [["project_activities"]],
  });

export const useRemoveProjectActivity = () =>
  useSupabaseDelete("project_activities", {
    invalidateKeys: [["project_activities"]],
  });
