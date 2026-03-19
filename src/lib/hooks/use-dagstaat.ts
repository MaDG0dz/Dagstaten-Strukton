"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  useSupabaseList,
  useSupabaseInsert,
  useSupabaseUpdate,
  useSupabaseDelete,
} from "./use-supabase-query";
import type { Dagstaat } from "@/lib/types/database";

// ── Dagstaat (fetch-or-create) ──────────────────────────────────────
export function useDagstaat(projectId: string, date: string, userId?: string) {
  const queryClient = useQueryClient();

  return useQuery<Dagstaat | null>({
    queryKey: ["dagstaten", projectId, date],
    queryFn: async () => {
      const supabase = createClient();

      // Try to fetch existing dagstaat
      const { data: existing, error: fetchError } = await supabase
        .from("dagstaten")
        .select("*")
        .eq("project_id", projectId)
        .eq("date", date)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) return existing as Dagstaat;

      // Auto-create if not found
      if (!userId) return null;

      const { data: created, error: createError } = await supabase
        .from("dagstaten")
        .insert({
          project_id: projectId,
          date,
          status: "draft",
          created_by: userId,
        })
        .select()
        .single();

      if (createError) throw createError;
      return created as Dagstaat;
    },
    enabled: !!projectId && !!date,
  });
}

export function useUpdateDagstaat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...values
    }: { id: string } & Partial<Dagstaat>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dagstaten")
        .update(values as Record<string, unknown>)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Dagstaat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dagstaten"] });
    },
  });
}

// ── Dagstaat Personeel ──────────────────────────────────────────────
export interface DagstaatPersoneel {
  id: string;
  dagstaat_id: string;
  employee_id: string;
  unit: string;
  quantity: number;
  start_time: string | null;
  end_time: string | null;
  remarks: string | null;
  sort_order: number;
  employee?: { id: string; name: string; is_subcontractor: boolean; function: string | null };
}

export const useDagstaatPersoneel = (dagstaatId: string) =>
  useSupabaseList<DagstaatPersoneel>("dagstaat_personeel", {
    queryKey: ["dagstaat_personeel", dagstaatId],
    select: "*, employee:employees(id, name, is_subcontractor, function)",
    filters: { dagstaat_id: dagstaatId },
    orderBy: { column: "sort_order", ascending: true },
    enabled: !!dagstaatId,
  });

export const useInsertPersoneel = () =>
  useSupabaseInsert<DagstaatPersoneel>("dagstaat_personeel", {
    invalidateKeys: [["dagstaat_personeel"]],
  });

export const useUpdatePersoneel = () =>
  useSupabaseUpdate<DagstaatPersoneel>("dagstaat_personeel", {
    invalidateKeys: [["dagstaat_personeel"]],
  });

export const useDeletePersoneel = () =>
  useSupabaseDelete("dagstaat_personeel", {
    invalidateKeys: [["dagstaat_personeel"]],
  });

// ── Dagstaat Materieel ──────────────────────────────────────────────
export interface DagstaatMaterieel {
  id: string;
  dagstaat_id: string;
  equipment_id: string;
  unit: string;
  quantity: number;
  remarks: string | null;
  sort_order: number;
  equipment?: { id: string; name: string; code: string | null };
}

export const useDagstaatMaterieel = (dagstaatId: string) =>
  useSupabaseList<DagstaatMaterieel>("dagstaat_materieel", {
    queryKey: ["dagstaat_materieel", dagstaatId],
    select: "*, equipment:equipment(id, name, code)",
    filters: { dagstaat_id: dagstaatId },
    orderBy: { column: "sort_order", ascending: true },
    enabled: !!dagstaatId,
  });

export const useInsertMaterieel = () =>
  useSupabaseInsert<DagstaatMaterieel>("dagstaat_materieel", {
    invalidateKeys: [["dagstaat_materieel"]],
  });

export const useUpdateMaterieel = () =>
  useSupabaseUpdate<DagstaatMaterieel>("dagstaat_materieel", {
    invalidateKeys: [["dagstaat_materieel"]],
  });

export const useDeleteMaterieel = () =>
  useSupabaseDelete("dagstaat_materieel", {
    invalidateKeys: [["dagstaat_materieel"]],
  });

// ── Dagstaat Werk ───────────────────────────────────────────────────
export interface DagstaatWerk {
  id: string;
  dagstaat_id: string;
  activity_id: string;
  subproject_id: string | null;
  unit: string;
  quantity: number;
  description: string | null;
  sort_order: number;
  activity?: { id: string; name: string; code: string | null };
  subproject?: { id: string; name: string; code: string } | null;
}

export const useDagstaatWerk = (dagstaatId: string) =>
  useSupabaseList<DagstaatWerk>("dagstaat_werk", {
    queryKey: ["dagstaat_werk", dagstaatId],
    select: "*, activity:activities(id, name, code), subproject:subprojects(id, name, code)",
    filters: { dagstaat_id: dagstaatId },
    orderBy: { column: "sort_order", ascending: true },
    enabled: !!dagstaatId,
  });

export const useInsertWerk = () =>
  useSupabaseInsert<DagstaatWerk>("dagstaat_werk", {
    invalidateKeys: [["dagstaat_werk"]],
  });

export const useUpdateWerk = () =>
  useSupabaseUpdate<DagstaatWerk>("dagstaat_werk", {
    invalidateKeys: [["dagstaat_werk"]],
  });

export const useDeleteWerk = () =>
  useSupabaseDelete("dagstaat_werk", {
    invalidateKeys: [["dagstaat_werk"]],
  });

// ── Dagstaat Materiaal ──────────────────────────────────────────────
export interface DagstaatMateriaal {
  id: string;
  dagstaat_id: string;
  material_id: string | null;
  subproject_id: string | null;
  name_override: string | null;
  unit: string;
  quantity: number;
  remarks: string | null;
  sort_order: number;
  material?: { id: string; name: string; code: string | null } | null;
  subproject?: { id: string; name: string; code: string } | null;
}

export const useDagstaatMateriaal = (dagstaatId: string) =>
  useSupabaseList<DagstaatMateriaal>("dagstaat_materiaal", {
    queryKey: ["dagstaat_materiaal", dagstaatId],
    select:
      "*, material:materials(id, name, code), subproject:subprojects(id, name, code)",
    filters: { dagstaat_id: dagstaatId },
    orderBy: { column: "sort_order", ascending: true },
    enabled: !!dagstaatId,
  });

export const useInsertMateriaal = () =>
  useSupabaseInsert<DagstaatMateriaal>("dagstaat_materiaal", {
    invalidateKeys: [["dagstaat_materiaal"]],
  });

export const useUpdateMateriaal = () =>
  useSupabaseUpdate<DagstaatMateriaal>("dagstaat_materiaal", {
    invalidateKeys: [["dagstaat_materiaal"]],
  });

export const useDeleteMateriaal = () =>
  useSupabaseDelete("dagstaat_materiaal", {
    invalidateKeys: [["dagstaat_materiaal"]],
  });

// ── Dagstaat Notes ──────────────────────────────────────────────────
export interface DagstaatNote {
  id: string;
  dagstaat_id: string;
  content: string;
  is_private: boolean;
  created_by: string;
}

export const useDagstaatNotes = (dagstaatId: string) =>
  useSupabaseList<DagstaatNote>("dagstaat_notes", {
    queryKey: ["dagstaat_notes", dagstaatId],
    filters: { dagstaat_id: dagstaatId },
    orderBy: { column: "created_at", ascending: true },
    enabled: !!dagstaatId,
  });

export const useInsertNote = () =>
  useSupabaseInsert<DagstaatNote>("dagstaat_notes", {
    invalidateKeys: [["dagstaat_notes"]],
  });

export const useUpdateNote = () =>
  useSupabaseUpdate<DagstaatNote>("dagstaat_notes", {
    invalidateKeys: [["dagstaat_notes"]],
  });

export const useDeleteNote = () =>
  useSupabaseDelete("dagstaat_notes", {
    invalidateKeys: [["dagstaat_notes"]],
  });

// ── Dagstaat Photos ──────────────────────────────────────────────
export interface DagstaatPhoto {
  id: string;
  dagstaat_id: string;
  subproject_id: string | null;
  storage_path: string;
  file_name: string;
  file_size: number;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

export const useDagstaatPhotos = (dagstaatId: string) =>
  useSupabaseList<DagstaatPhoto>("dagstaat_photos", {
    queryKey: ["dagstaat_photos", dagstaatId],
    filters: { dagstaat_id: dagstaatId },
    orderBy: { column: "created_at", ascending: true },
    enabled: !!dagstaatId,
  });

export const useInsertPhoto = () =>
  useSupabaseInsert<DagstaatPhoto>("dagstaat_photos", {
    invalidateKeys: [["dagstaat_photos"]],
  });

export const useUpdatePhoto = () =>
  useSupabaseUpdate<DagstaatPhoto>("dagstaat_photos", {
    invalidateKeys: [["dagstaat_photos"]],
  });

export const useDeletePhoto = () =>
  useSupabaseDelete("dagstaat_photos", {
    invalidateKeys: [["dagstaat_photos"]],
  });
