"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

interface ListOptions {
  queryKey?: string[];
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: { column: string; ascending?: boolean };
  search?: { column: string; term: string };
  enabled?: boolean;
}

export function useSupabaseList<T>(table: string, options?: ListOptions) {
  const key = options?.queryKey ?? [table];

  return useQuery<T[]>({
    queryKey: [...key, options?.filters, options?.search?.term],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase.from(table).select(options?.select ?? "*");

      if (options?.filters) {
        for (const [col, val] of Object.entries(options.filters)) {
          if (val !== undefined && val !== null && val !== "") {
            query = query.eq(col, val);
          }
        }
      }

      if (options?.search?.term) {
        query = query.ilike(options.search.column, `%${options.search.term}%`);
      }

      const order = options?.orderBy ?? { column: "created_at", ascending: false };
      query = query.order(order.column, { ascending: order.ascending ?? false });

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useSupabaseItem<T>(table: string, id: string | undefined) {
  return useQuery<T | null>({
    queryKey: [table, id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as T;
    },
    enabled: !!id,
  });
}

interface MutationOptions {
  invalidateKeys?: string[][];
}

export function useSupabaseInsert<T>(table: string, options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: Partial<T>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .insert(values as Record<string, unknown>)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
    },
  });
}

export function useSupabaseUpdate<T>(table: string, options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string } & Partial<T>) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .update(values as Record<string, unknown>)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
    },
  });
}

export function useSupabaseDelete(table: string, options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] });
      options?.invalidateKeys?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );
    },
  });
}
