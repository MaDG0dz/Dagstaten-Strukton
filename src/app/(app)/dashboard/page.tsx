"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getISOWeek, format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
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
} from "@/lib/utils/date";
import { STATUS_CONFIG } from "@/lib/constants/status-colors";
import type { DagstaatStatus } from "@/lib/constants/status-colors";
import { isManager } from "@/lib/constants/roles";

const DAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

export default function DashboardPage() {
  const router = useRouter();
  const { profile, effectiveRole } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const weekDays = getWeekDays(currentDate);
  const weekNumber = getISOWeek(currentDate);
  const weekStart = toDateString(weekDays[0]);
  const weekEnd = toDateString(weekDays[6]);

  const { data: projects = [] } = useProjects();
  const { data: dagstaten = [] } = useDagstaten({
    date_from: weekStart,
    date_to: weekEnd,
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "Gebruiker";
  const todayFormatted = format(new Date(), "EEEE d MMMM yyyy", { locale: nl });

  // KPI counts
  const kpiCounts = useMemo(() => {
    const draft = dagstaten.filter((d) => d.status === "draft").length;
    const submitted = dagstaten.filter((d) => d.status === "submitted").length;
    const approved = dagstaten.filter((d) => d.status === "approved").length;
    return { draft, submitted, approved };
  }, [dagstaten]);

  // Build lookup: projectId -> date -> status
  const dagstaatLookup = useMemo(() => {
    const map: Record<string, Record<string, { status: DagstaatStatus; id: string }>> = {};
    for (const d of dagstaten) {
      if (!map[d.project_id]) map[d.project_id] = {};
      map[d.project_id][d.date] = { status: d.status, id: d.id };
    }
    return map;
  }, [dagstaten]);

  // Projects that have dagstaten this week (for the matrix)
  const matrixProjects = useMemo(() => {
    const projectIds = new Set(dagstaten.map((d) => d.project_id));
    return projects.filter((p) => projectIds.has(p.id));
  }, [dagstaten, projects]);

  // Te reviewen: submitted dagstaten
  const toReview = useMemo(
    () => dagstaten.filter((d) => d.status === "submitted"),
    [dagstaten]
  );

  // Recent geaccepteerd: last 5 approved
  const recentApproved = useMemo(
    () =>
      dagstaten
        .filter((d) => d.status === "approved")
        .slice(0, 5),
    [dagstaten]
  );

  function handleNewDagstaat() {
    if (selectedProjectId) {
      const today = toDateString(new Date());
      router.push(`/projecten/${selectedProjectId}/dagstaat/${today}`);
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-slate-900 tracking-tight">
          Welkom, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 capitalize">
          {todayFormatted} — Week {weekNumber}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="project-select" className="text-sm font-medium text-slate-600">
              Ga naar project
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 focus:border-[#e43122]"
            >
              <option value="">Selecteer project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleNewDagstaat}
            disabled={!selectedProjectId}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e43122] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#c92a1d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Nieuwe dagstaat
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Concept */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-500" />
            <span className="text-3xl font-bold text-slate-900">{kpiCounts.draft}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Concept</p>
        </div>

        {/* Te reviewen */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-3xl font-bold text-slate-900">{kpiCounts.submitted}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Te reviewen</p>
        </div>

        {/* Geaccepteerd */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-3xl font-bold text-slate-900">{kpiCounts.approved}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Geaccepteerd</p>
        </div>
      </div>

      {/* 3. Week Calendar Matrix */}
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Project
                </th>
                {weekDays.map((day, i) => (
                  <th
                    key={toDateString(day)}
                    className="py-2 px-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider"
                  >
                    {DAY_LABELS[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-sm text-slate-400"
                  >
                    Geen dagstaten deze week
                  </td>
                </tr>
              ) : (
                matrixProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-slate-900 whitespace-nowrap">
                        {project.name}
                      </div>
                      <div className="text-xs text-slate-400">{project.code}</div>
                    </td>
                    {weekDays.map((day) => {
                      const dateStr = toDateString(day);
                      const entry = dagstaatLookup[project.id]?.[dateStr];
                      return (
                        <td key={dateStr} className="py-2.5 px-3 text-center">
                          {entry ? (
                            <Link
                              href={`/projecten/${project.id}/dagstaat/${dateStr}`}
                              className="inline-flex justify-center"
                            >
                              <StatusDot status={entry.status} size="md" />
                            </Link>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-5 border-t border-slate-100 pt-3">
          {(["draft", "submitted", "approved"] as const).map((status) => (
            <StatusDot key={status} status={status} size="sm" showLabel />
          ))}
        </div>
      </div>

      {/* 4. Te reviewen (managers only) */}
      {isManager(effectiveRole) && toReview.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-slate-500" />
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

      {/* 5. Recent geaccepteerd */}
      {recentApproved.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-slate-500" />
            <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
              Recent geaccepteerd
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
