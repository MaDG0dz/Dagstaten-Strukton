"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { useDagstaten } from "@/lib/hooks/use-dagstaten";
import type { DagstaatMateriaal } from "@/lib/hooks/use-dagstaat";

interface Props {
  projectId: string;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1); // Monday
  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 6); // Sunday
  return { start, end };
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export function ProjectMateriaalTab({ projectId }: Props) {
  const [search, setSearch] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);

  const currentWeek = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + weekOffset * 7);
    return getWeekRange(now);
  }, [weekOffset]);

  const weekNumber = getWeekNumber(currentWeek.start);
  const dateFrom = formatDate(currentWeek.start);
  const dateTo = formatDate(currentWeek.end);

  // Fetch dagstaten for this project in the date range
  const { data: dagstaten = [] } = useDagstaten({
    project_id: projectId,
    date_from: dateFrom,
    date_to: dateTo,
  });

  const dagstaatIds = useMemo(
    () => dagstaten.map((d) => d.id),
    [dagstaten]
  );

  // Fetch materiaal rows for those dagstaten
  const { data: materiaalRows = [], isLoading } = useQuery<DagstaatMateriaal[]>({
    queryKey: ["project_materiaal", projectId, dagstaatIds],
    queryFn: async () => {
      if (dagstaatIds.length === 0) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dagstaat_materiaal")
        .select("*, material:materials(id, name, code)")
        .in("dagstaat_id", dagstaatIds);
      if (error) throw error;
      return data as DagstaatMateriaal[];
    },
    enabled: dagstaatIds.length > 0,
  });

  // Group by material name, sum quantities
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { name: string; unit: string; total: number }
    >();

    for (const row of materiaalRows) {
      const name = row.material?.name ?? row.name_override ?? "Onbekend";
      const key = `${name}__${row.unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += row.quantity;
      } else {
        map.set(key, { name, unit: row.unit, total: row.quantity });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "nl")
    );
  }, [materiaalRows]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return grouped;
    const lower = search.toLowerCase();
    return grouped.filter((item) => item.name.toLowerCase().includes(lower));
  }, [grouped, search]);

  const totalQuantity = filtered.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      {/* Week selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Vorige week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-medium text-slate-700">
            Week {weekNumber} ({formatDisplayDate(currentWeek.start)} - {formatDisplayDate(currentWeek.end)})
          </span>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Volgende week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="ml-2 text-xs text-slate-500 hover:text-slate-700 underline"
            >
              Huidige week
            </button>
          )}
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Zoek materiaal..."
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Geen materiaalgebruik"
          description="Er zijn geen materialen geregistreerd in deze periode"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Materiaal
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Eenheid
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Totaal aantal
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr
                  key={`${item.name}-${item.unit}`}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    {item.total % 1 === 0 ? item.total : item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  Totaal
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {totalQuantity % 1 === 0
                    ? totalQuantity
                    : totalQuantity.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
