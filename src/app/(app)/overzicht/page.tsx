"use client";

import { useState } from "react";
import { FileBarChart, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DagstaatFilters } from "./_components/dagstaat-filters";
import { useDagstaten } from "@/lib/hooks/use-dagstaten";
import type { Dagstaat, DagstaatStatus } from "@/lib/types/database";
import { STATUS_CONFIG } from "@/lib/constants/status-colors";
import { formatDate } from "@/lib/utils/date";

export default function OverzichtPage() {
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: dagstaten, isLoading } = useDagstaten({
    project_id: projectId || undefined,
    status: (status as DagstaatStatus) || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const columns: Column<Dagstaat>[] = [
    {
      key: "date",
      header: "Datum",
      render: (d) => formatDate(new Date(d.date), "dd-MM-yyyy"),
    },
    {
      key: "project",
      header: "Project",
      render: (d) =>
        d.project ? `${d.project.code} — ${d.project.name}` : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (d) => (
        <Badge variant={d.status}>
          {STATUS_CONFIG[d.status]?.label ?? d.status}
        </Badge>
      ),
    },
    {
      key: "creator",
      header: "Indiener",
      render: (d) => d.creator?.full_name ?? "—",
      hideOnMobile: true,
    },
    {
      key: "submitted_at",
      header: "Ingediend op",
      render: (d) =>
        d.submitted_at
          ? formatDate(new Date(d.submitted_at), "dd-MM-yyyy HH:mm")
          : "—",
      hideOnMobile: true,
    },
    {
      key: "approved_by",
      header: "Goedgekeurd door",
      render: (d) => d.approver?.full_name ?? "—",
      hideOnMobile: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overzicht & Offertes"
        description="Bekijk en exporteer dagstaten"
        actions={
          <button
            disabled
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
            title="Komt binnenkort"
          >
            <Download className="h-4 w-4" />
            Exporteren
          </button>
        }
      />

      <div className="mb-4">
        <DagstaatFilters
          projectId={projectId}
          onProjectChange={setProjectId}
          status={status}
          onStatusChange={setStatus}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />
      </div>

      <DataTable
        columns={columns}
        data={dagstaten ?? []}
        isLoading={isLoading}
        rowKey={(d) => d.id}
        emptyState={
          <EmptyState
            icon={FileBarChart}
            title="Geen dagstaten gevonden"
            description="Pas de filters aan of maak een nieuwe dagstaat aan"
          />
        }
      />
    </div>
  );
}
