"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getISOWeek, format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { useDagstaten } from "@/lib/hooks/use-dagstaten";
import {
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  toDateString,
  isToday,
} from "@/lib/utils/date";
import { STATUS_CONFIG } from "@/lib/constants/status-colors";
import type { DagstaatStatus } from "@/lib/constants/status-colors";

const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

interface ProjectDagstatenTabProps {
  projectId: string;
}

export function ProjectDagstatenTab({ projectId }: ProjectDagstatenTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDays = getWeekDays(currentDate);
  const weekNumber = getISOWeek(currentDate);
  const weekStart = toDateString(weekDays[0]);
  const weekEnd = toDateString(weekDays[6]);

  const { data: dagstaten = [], isLoading } = useDagstaten({
    project_id: projectId,
    date_from: weekStart,
    date_to: weekEnd,
  });

  // Build lookup: date -> dagstaat info
  const dagstaatLookup = useMemo(() => {
    const map: Record<string, { status: DagstaatStatus; id: string }> = {};
    for (const d of dagstaten) {
      map[d.date] = { status: d.status, id: d.id };
    }
    return map;
  }, [dagstaten]);

  // Recent dagstaten (last 10, all dates)
  const { data: recentDagstaten = [] } = useDagstaten({
    project_id: projectId,
  });

  const recentList = useMemo(
    () => recentDagstaten.slice(0, 10),
    [recentDagstaten]
  );

  return (
    <div className="space-y-6">
      {/* Week Calendar Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" />
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
              Week {weekNumber}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(getPreviousWeek(currentDate))}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              aria-label="Vorige week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(getNextWeek(currentDate))}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
              aria-label="Volgende week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-slate-50" />
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, i) => {
              const dateStr = toDateString(day);
              const entry = dagstaatLookup[dateStr];
              const today = isToday(day);

              return (
                <Link
                  key={dateStr}
                  href={`/projecten/${projectId}/dagstaat/${dateStr}`}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all hover:shadow-sm ${
                    today
                      ? "border-[#e43122]/30 bg-red-50/30"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {DAY_LABELS[i]}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      today ? "text-[#e43122]" : "text-slate-900"
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {entry ? (
                    <StatusDot status={entry.status} size="md" />
                  ) : (
                    <span className="flex items-center justify-center h-3 w-3 rounded-full border border-dashed border-slate-300 text-slate-300 group-hover:border-[#e43122] group-hover:text-[#e43122] transition-colors">
                      <Plus className="h-2 w-2" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3">
          {(["draft", "submitted", "approved"] as const).map((status) => (
            <StatusDot key={status} status={status} size="sm" showLabel />
          ))}
        </div>
      </div>

      {/* Recent Dagstaten List */}
      <div>
        <h3 className="mb-3 font-[family-name:var(--font-heading)] text-base font-semibold text-slate-900">
          Recente dagstaten
        </h3>
        {recentList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-400">
              Nog geen dagstaten voor dit project
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentList.map((d) => (
              <Link
                key={d.id}
                href={`/projecten/${projectId}/dagstaat/${d.date}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={d.status} size="md" />
                  <span className="text-sm font-medium text-slate-900">
                    {format(new Date(d.date + "T00:00:00"), "EEEE d MMMM yyyy", {
                      locale: nl,
                    })}
                  </span>
                  {d.creator?.full_name && (
                    <span className="text-xs text-slate-400">
                      door {d.creator.full_name}
                    </span>
                  )}
                </div>
                <Badge variant={d.status as "draft" | "submitted" | "approved"}>
                  {STATUS_CONFIG[d.status]?.label ?? d.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
