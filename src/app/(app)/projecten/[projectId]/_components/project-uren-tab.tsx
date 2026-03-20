"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { useDagstaten } from "@/lib/hooks/use-dagstaten";
import type { DagstaatPersoneel } from "@/lib/hooks/use-dagstaat";

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

const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export function ProjectUrenTab({ projectId }: Props) {
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

  // Get all 7 dates of the week
  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeek.start);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }
    return dates;
  }, [currentWeek.start]);

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

  // Build a map of dagstaat_id -> date
  const dagstaatDateMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of dagstaten) {
      map.set(d.id, d.date);
    }
    return map;
  }, [dagstaten]);

  // Fetch personeel rows for those dagstaten
  const { data: personeelRows = [], isLoading } = useQuery<DagstaatPersoneel[]>({
    queryKey: ["project_personeel", projectId, dagstaatIds],
    queryFn: async () => {
      if (dagstaatIds.length === 0) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("dagstaat_personeel")
        .select("*, employee:employees(id, name, is_subcontractor, function)")
        .in("dagstaat_id", dagstaatIds);
      if (error) throw error;
      return data as DagstaatPersoneel[];
    },
    enabled: dagstaatIds.length > 0,
  });

  // Group by employee, sum total hours, and build per-day breakdown
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        total: number;
        perDay: Record<string, number>;
      }
    >();

    for (const row of personeelRows) {
      const name = row.employee?.name ?? "Onbekend";
      const date = dagstaatDateMap.get(row.dagstaat_id) ?? "";
      const existing = map.get(name);
      if (existing) {
        existing.total += row.quantity;
        existing.perDay[date] = (existing.perDay[date] ?? 0) + row.quantity;
      } else {
        map.set(name, {
          name,
          total: row.quantity,
          perDay: { [date]: row.quantity },
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "nl")
    );
  }, [personeelRows, dagstaatDateMap]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return grouped;
    const lower = search.toLowerCase();
    return grouped.filter((item) => item.name.toLowerCase().includes(lower));
  }, [grouped, search]);

  const totalHours = filtered.reduce((sum, item) => sum + item.total, 0);

  // Per-day totals
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const date of weekDates) {
      totals[date] = filtered.reduce(
        (sum, item) => sum + (item.perDay[date] ?? 0),
        0
      );
    }
    return totals;
  }, [filtered, weekDates]);

  const formatHours = (n: number) => (n % 1 === 0 ? n : n.toFixed(1));

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
          placeholder="Zoek medewerker..."
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
          icon={Clock}
          title="Geen uren geregistreerd"
          description="Er zijn geen uren geregistreerd in deze periode"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Medewerker
                </th>
                {weekDates.map((date, i) => (
                  <th
                    key={date}
                    className="px-3 py-3 text-center font-medium text-slate-600 whitespace-nowrap"
                  >
                    <div>{DAY_LABELS[i]}</div>
                    <div className="text-xs font-normal text-slate-400">
                      {new Date(date + "T12:00:00").toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "numeric",
                      })}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium text-slate-600">
                  Totaal
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr
                  key={item.name}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                >
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                    {item.name}
                  </td>
                  {weekDates.map((date) => {
                    const hours = item.perDay[date] ?? 0;
                    return (
                      <td
                        key={date}
                        className={`px-3 py-3 text-center ${
                          hours > 0 ? "text-slate-900" : "text-slate-300"
                        }`}
                      >
                        {hours > 0 ? formatHours(hours) : "-"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatHours(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">
                  Totaal
                </td>
                {weekDates.map((date) => (
                  <td
                    key={date}
                    className="px-3 py-3 text-center font-semibold text-slate-900"
                  >
                    {dayTotals[date] > 0 ? formatHours(dayTotals[date]) : "-"}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                  {formatHours(totalHours)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
