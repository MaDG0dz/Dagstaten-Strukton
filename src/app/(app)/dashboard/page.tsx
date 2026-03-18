"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_LABELS } from "@/lib/constants/roles";
import {
  getWeekDays,
  getNextWeek,
  getPreviousWeek,
  formatDate,
  formatDayShort,
  formatDayNumber,
  isToday,
  toDateString,
} from "@/lib/utils/date";
import { StatusDot } from "@/components/ui/status-dot";
import type { DagstaatStatus } from "@/lib/constants/status-colors";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  FileText,
  Send,
  CheckCircle2,
} from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

const kpiCards = [
  {
    label: "Totaal projecten",
    value: 12,
    icon: FolderOpen,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    label: "Openstaande dagstaten",
    value: 5,
    icon: FileText,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Ingediend deze week",
    value: 8,
    icon: Send,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    label: "Goedgekeurd deze week",
    value: 6,
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

export default function DashboardPage() {
  const { profile, effectiveRole } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = getWeekDays(currentDate);

  // TODO: Replace with actual data from Supabase/IndexedDB
  const dagstaatStatuses: Record<string, DagstaatStatus> = {};

  const firstName = profile?.full_name?.split(" ")[0] ?? "Gebruiker";

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
          {ROLE_LABELS[effectiveRole]}
        </span>
      </div>

      {/* Week navigation */}
      <div>
        <div className="mb-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentDate(getPreviousWeek(currentDate))}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-colors"
            aria-label="Vorige week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[200px] text-center text-sm font-medium text-slate-700">
            {formatDate(weekDays[0], "d MMM")} –{" "}
            {formatDate(weekDays[6], "d MMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate(getNextWeek(currentDate))}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-colors"
            aria-label="Volgende week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = toDateString(day);
            const status = dagstaatStatuses[dateStr] ?? "empty";
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                className={`group relative flex flex-col items-center rounded-xl border bg-white p-3.5 cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.02] ${
                  today
                    ? "border-slate-200 border-t-2 border-t-[#e43122] shadow-sm"
                    : "border-slate-200"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {formatDayShort(day)}
                </span>
                <span
                  className={`mt-1 text-xl font-bold ${
                    today ? "text-[#e43122]" : "text-slate-900"
                  }`}
                >
                  {formatDayNumber(day)}
                </span>
                <div className="mt-2.5">
                  <StatusDot status={status} size="md" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div
                className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${kpi.iconBg} mb-3`}
              >
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
              <div className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900">
                {kpi.value}
              </div>
              <div className="mt-0.5 text-sm text-slate-500">{kpi.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
