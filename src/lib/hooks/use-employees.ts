import { useSupabaseList, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "./use-supabase-query";
import type { Employee } from "@/lib/types/database";

export const useEmployees = (search?: string) =>
  useSupabaseList<Employee>("employees", {
    search: search ? { column: "name", term: search } : undefined,
    orderBy: { column: "name", ascending: true },
  });

export const useCreateEmployee = () => useSupabaseInsert<Employee>("employees");
export const useUpdateEmployee = () => useSupabaseUpdate<Employee>("employees");
export const useDeleteEmployee = () => useSupabaseDelete("employees");
