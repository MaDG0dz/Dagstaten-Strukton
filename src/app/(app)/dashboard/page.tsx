"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getISOWeek, format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { useProjects } from "@/lib/hooks/use-projects";
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
import { isManager, ROLE_LABELS } from "@/lib/constants/roles";

const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function DashboardPage() {
  const { profile, effectiveRole } = useAuth();
  const { data: projects = [] } = useProjects();

  const now = new Date();
  const [currentDate, setCurrentDate] = useState(now);

  const weekDays = getWeekDays(currentDate);
  const weekNumber = getISOWeek(currentDate);
  const weekStart = toDateString(weekDays[0]);
  const weekEnd = toDateString(weekDays[6]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "Gebruiker";
  const todayFormatted = format(now, "EEEE d MMMM yyyy", { locale: nl });
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  // Fetch dagstaten for current week (for the matrix)
  const { data: weekDagstaten = [] } = useDagstaten({
    date_from: weekStart,
    date_to: weekEnd,
  });

  // Also fetch last 30 days for KPIs + review/approved lists
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: allDagstaten = [] } = useDagstaten({
    date_from: toDateString(thirtyDaysAgo),
    date_to: toDateString(now),
  });

  // KPI counts (last 30 days)
  const kpiCounts = useMemo(() => {
    const draft = allDagstaten.filter((d) => d.status === "draft").length;
    const submitted = allDagstaten.filter((d) => d.status === "submitted").length;
    const approved = allDagstaten.filter((d) => d.status === "approved").length;
    return { draft, submitted, approved };
  }, [allDagstaten]);

  // Build week matrix: per project, per day → dagstaat status
  const weekMatrix = useMemo(() => {
    const activeProjects = projects.filter((p) => p.is_active);

    // Build lookup: projectId_date → status
    const lookup: Record<string, DagstaatStatus> = {};
    for (const d of weekDagstaten) {
      lookup[`${d.project_id}_${d.date}`] = d.status as DagstaatStatus;
    }

    // Only show projects that have at least 1 dagstaat this week OR all active projects
    return activeProjects.map((project) => ({
      project,
      days: weekDays.map((day) => {
        const dateStr = toDateString(day);
        const status = lookup[`${project.id}_${dateStr}`];
        return { date: dateStr, status: status ?? null, isToday: isToday(day) };
      }),
    }));
  }, [projects, weekDagstaten, weekDays]);

  // Te reviewen: submitted dagstaten
  const toReview = useMemo(
    () => allDagstaten.filter((d) => d.status === "submitted"),
    [allDagstaten]
  );

  // Recent goedgekeurd: last 5 approved
  const recentApproved = useMemo(
    () => allDagstaten.filter((d) => d.status === "approved").slice(0, 5),
    [allDagstaten]
  );

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 capitalize">
            {todayFormatted} — Week {getISOWeek(now)}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          {ROLE_LABELS[effectiveRole]}
        </span>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { count: kpiCounts.draft, label: "Concept", dotClass: "bg-sky-500" },
          { count: kpiCounts.submitted, label: "Te reviewen", dotClass: "bg-amber-500" },
          { count: kpiCounts.approved, label: "Goedgekeurd", dotClass: "bg-emerald-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${kpi.dotClass}`} />
              <span className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900">
                {kpi.count}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* 3. Week Overview per Project */}
      <div className="rounded-xl border border-slate-200 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-400" />
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
              Week {weekNumber}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(getPreviousWeek(currentDate))}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              aria-label="Vorige week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(getNextWeek(currentDate))}
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
              aria-label="Volgende week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Matrix table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-[200px]">
                  Project
                </th>
                {weekDays.map((day, i) => (
                  <th
                    key={i}
                    className={`px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider ${
                      isToday(day) ? "text-[#e43122]" : "text-slate-400"
                    }`}
                  >
                    {DAY_LABELS[i]}
                    <div className={`text-xs font-bold mt-0.5 ${isToday(day) ? "text-[#e43122]" : "text-slate-600"}`}>
                      {format(day, "d")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {weekMatrix.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    Geen actieve projecten
                  </td>
                </tr>
              ) : (
                weekMatrix.map(({ project, days }) => (
                  <tr key={project.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/projecten/${project.id}`}
                        className="hover:text-[#e43122] transition-colors"
                      >
                        <div className="font-medium text-slate-900 truncate max-w-[180px]">
                          {project.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {project.code}
                        </div>
                      </Link>
                    </td>
                    {days.map((day) => (
                      <td key={day.date} className="px-2 py-3 text-center">
                        <Link
                          href={`/projecten/${project.id}/dagstaat/${day.date}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-slate-100"
                        >
                          {day.status ? (
                            <StatusDot status={day.status} size="md" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-slate-200" />
                          )}
                        </Link>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 border-t border-slate-100 px-5 py-3">
          {(["draft", "submitted", "approved"] as const).map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <StatusDot status={status} size="sm" />
              <span className="text-xs text-slate-600">{STATUS_CONFIG[status].label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-200" />
            <span className="text-xs text-slate-600">Leeg</span>
          </div>
        </div>
      </div>

      {/* 4. Te reviewen (managers only) */}
      {isManager(effectiveRole) && toReview.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-slate-400" />
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
              Te reviewen
            </h2>
          </div>
          <div className="space-y-2">
            {toReview.map((d) => (
              <Link
                key={d.id}
                href={`/projecten/${d.project_id}/dagstaat/${d.date}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {d.project?.name ?? "Project"}
                  </span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-sm text-slate-500">
                    {format(new Date(d.date + "T00:00:00"), "d MMMM yyyy", { locale: nl })}
                  </span>
                  {d.creator?.full_name && (
                    <>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-sm text-slate-400">
                        {d.creator.full_name}
                      </span>
                    </>
                  )}
                </div>
                <Badge variant="submitted">Ingediend</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent goedgekeurd */}
      {recentApproved.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-slate-400" />
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
              Recent goedgekeurd
            </h2>
          </div>
          <div className="space-y-2">
            {recentApproved.map((d) => (
              <Link
                key={d.id}
                href={`/projecten/${d.project_id}/dagstaat/${d.date}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:shadow-sm transition-shadow"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {d.project?.name ?? "Project"}
                  </span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-sm text-slate-500">
                    {format(new Date(d.date + "T00:00:00"), "d MMMM yyyy", { locale: nl })}
                  </span>
                </div>
                <Badge variant="approved">Geaccepteerd</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
