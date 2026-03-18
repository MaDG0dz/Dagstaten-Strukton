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
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const { profile, effectiveRole } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = getWeekDays(currentDate);

  // TODO: Replace with actual data from Supabase/IndexedDB
  const dagstaatStatuses: Record<string, DagstaatStatus> = {};

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welkom, {profile?.full_name ?? "Gebruiker"} —{" "}
          {ROLE_LABELS[effectiveRole]}
        </p>
      </div>

      {/* Week navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentDate(getPreviousWeek(currentDate))}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-700">
          Week van {formatDate(weekDays[0], "d MMM")} -{" "}
          {formatDate(weekDays[6], "d MMM yyyy")}
        </h2>
        <button
          onClick={() => setCurrentDate(getNextWeek(currentDate))}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
        >
          <ChevronRight className="h-5 w-5" />
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
              className={`flex flex-col items-center rounded-xl border p-3 transition-colors hover:bg-gray-50 cursor-pointer ${
                today
                  ? "border-primary bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <span className="text-xs font-medium uppercase text-gray-500">
                {formatDayShort(day)}
              </span>
              <span
                className={`mt-1 text-lg font-bold ${
                  today ? "text-primary" : "text-gray-900"
                }`}
              >
                {formatDayNumber(day)}
              </span>
              <div className="mt-2">
                <StatusDot status={status} size="md" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Placeholder for project list */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Projecten
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Selecteer een project om dagstaten te beheren.
        </p>
      </div>
    </div>
  );
}
