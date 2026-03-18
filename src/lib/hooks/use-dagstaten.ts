"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Dagstaat, DagstaatStatus } from "@/lib/types/database";

interface DagstaatFilters {
  project_id?: string;
  status?: DagstaatStatus;
  date_from?: string;
  date_to?: string;
}

export const useDagstaten = (filters?: DagstaatFilters) =>
  useQuery<Dagstaat[]>({
    queryKey: ["dagstaten", filters],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("dagstaten")
        .select("*, project:projects(code, name), creator:profiles!created_by(full_name)")
        .order("date", { ascending: false });

      if (filters?.project_id) {
        query = query.eq("project_id", filters.project_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.date_from) {
        query = query.gte("date", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("date", filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Dagstaat[];
    },
  });
