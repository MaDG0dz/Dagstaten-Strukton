import { useSupabaseList, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "./use-supabase-query";
import type { Equipment } from "@/lib/types/database";

export const useEquipment = (search?: string) =>
  useSupabaseList<Equipment>("equipment", {
    search: search ? { column: "name", term: search } : undefined,
    orderBy: { column: "name", ascending: true },
  });

export const useCreateEquipment = () => useSupabaseInsert<Equipment>("equipment");
export const useUpdateEquipment = () => useSupabaseUpdate<Equipment>("equipment");
export const useDeleteEquipment = () => useSupabaseDelete("equipment");
