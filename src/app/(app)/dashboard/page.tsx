"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getISOWeek, format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  ClipboardCheck,
  Eye,
  ArrowRight,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { useProjects } from "@/lib/hooks/use-projects";
import { useDagstaten } from "@/lib/hooks/use-dagstaten";
import { toDateString } from "@/lib/utils/date";
import type { DagstaatStatus } from "@/lib/constants/status-colors";
import { isManager } from "@/lib/constants/roles";

export default function DashboardPage() {
  const { profile, effectiveRole } = useAuth();
  const { data: projects = [] } = useProjects();

  const now = new Date();
  const weekNumber = getISOWeek(now);
  const todayStr = toDateString(now);

  // Fetch dagstaten for last 30 days for KPIs
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: dagstaten = [] } = useDagstaten({
    date_from: toDateString(thirtyDaysAgo),
    date_to: todayStr,
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "Gebruiker";
  const todayFormatted = format(now, "EEEE d MMMM yyyy", { locale: nl });

  // Time-of-day greeting
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

  // KPI counts
  const kpiCounts = useMemo(() => {
    const draft = dagstaten.filter((d) => d.status === "draft").length;
    const submitted = dagstaten.filter((d) => d.status === "submitted").length;
    const approved = dagstaten.filter((d) => d.status === "approved").length;
    return { draft, submitted, approved };
  }, [dagstaten]);

  // Recent projects (max 6)
  const recentProjects = useMemo(() => {
    const projectMap = new Map<string, { status: DagstaatStatus }>();
    for (const d of dagstaten) {
      if (!projectMap.has(d.project_id)) {
        projectMap.set(d.project_id, { status: d.status as DagstaatStatus });
      }
    }
    return projects
      .filter((p) => p.is_active)
      .slice(0, 6)
      .map((p) => ({
        ...p,
        lastStatus: projectMap.get(p.id)?.status ?? null,
      }));
  }, [dagstaten, projects]);

  // Te reviewen: submitted dagstaten
  const toReview = useMemo(
    () => dagstaten.filter((d) => d.status === "submitted"),
    [dagstaten]
  );

  // Recent goedgekeurd: last 5 approved
  const recentApproved = useMemo(
    () =>
      dagstaten
        .filter((d) => d.status === "approved")
        .slice(0, 5),
    [dagstaten]
  );

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header */}
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-slate-900 tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 capitalize">
          {todayFormatted} — Week {weekNumber}
        </p>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-sky-500" />
            <span className="text-3xl font-bold text-slate-900">{kpiCounts.draft}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Concept</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-3xl font-bold text-slate-900">{kpiCounts.submitted}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Te reviewen</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-3xl font-bold text-slate-900">{kpiCounts.approved}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">Goedgekeurd</p>
        </div>
      </div>

      {/* 3. Recente projecten */}
      {recentProjects.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-slate-500" />
              <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
                Recente projecten
              </h2>
            </div>
            <Link
              href="/projecten"
              className="text-sm text-slate-500 hover:text-[#e43122] transition-colors"
            >
              Alle projecten
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projecten/${project.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
              >
                <p className="text-xs text-slate-400">{project.code}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900 truncate">
                    {project.name}
                  </p>
                  {project.lastStatus && (
                    <StatusDot status={project.lastStatus} size="sm" />
                  )}
                </div>
                <p className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-[#e43122] transition-colors">
                  Bekijk project
                  <ArrowRight className="h-3 w-3" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

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

      {/* 5. Recent goedgekeurd */}
      {recentApproved.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-5 w-5 text-slate-500" />
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
