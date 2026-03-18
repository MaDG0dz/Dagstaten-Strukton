import { useSupabaseList, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "./use-supabase-query";
import type { MaterialCategory, Material } from "@/lib/types/database";

export const useMaterialCategories = () =>
  useSupabaseList<MaterialCategory>("material_categories", {
    orderBy: { column: "sort_order", ascending: true },
  });

export const useMaterials = (categoryId?: string) =>
  useSupabaseList<Material>("materials", {
    filters: categoryId ? { category_id: categoryId } : undefined,
    search: undefined,
    orderBy: { column: "name", ascending: true },
  });

export const useCreateMaterialCategory = () => useSupabaseInsert<MaterialCategory>("material_categories");
export const useUpdateMaterialCategory = () => useSupabaseUpdate<MaterialCategory>("material_categories");
export const useDeleteMaterialCategory = () => useSupabaseDelete("material_categories");

export const useCreateMaterial = () => useSupabaseInsert<Material>("materials");
export const useUpdateMaterial = () => useSupabaseUpdate<Material>("materials");
export const useDeleteMaterial = () => useSupabaseDelete("materials");
