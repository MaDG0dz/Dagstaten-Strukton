import { useSupabaseList, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "./use-supabase-query";
import type { ActivityCategory, Activity } from "@/lib/types/database";

export const useActivityCategories = () =>
  useSupabaseList<ActivityCategory>("activity_categories", {
    orderBy: { column: "sort_order", ascending: true },
  });

export const useActivities = (categoryId?: string) =>
  useSupabaseList<Activity>("activities", {
    filters: categoryId ? { category_id: categoryId } : undefined,
    search: undefined,
    orderBy: { column: "name", ascending: true },
  });

export const useCreateActivityCategory = () => useSupabaseInsert<ActivityCategory>("activity_categories");
export const useUpdateActivityCategory = () => useSupabaseUpdate<ActivityCategory>("activity_categories");
export const useDeleteActivityCategory = () => useSupabaseDelete("activity_categories");

export const useCreateActivity = () => useSupabaseInsert<Activity>("activities");
export const useUpdateActivity = () => useSupabaseUpdate<Activity>("activities");
export const useDeleteActivity = () => useSupabaseDelete("activities");
