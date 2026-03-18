import { useSupabaseList, useSupabaseUpdate } from "./use-supabase-query";
import type { Profile } from "@/lib/types/database";

export const useProfiles = (search?: string) =>
  useSupabaseList<Profile>("profiles", {
    search: search ? { column: "full_name", term: search } : undefined,
    orderBy: { column: "full_name", ascending: true },
  });

export const useUpdateProfile = () => useSupabaseUpdate<Profile>("profiles");
