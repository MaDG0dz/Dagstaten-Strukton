"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useSupabaseItem } from "@/lib/hooks/use-supabase-query";
import { useDagstaat, useUpdateDagstaat } from "@/lib/hooks/use-dagstaat";
import { isManager } from "@/lib/constants/roles";
import { STATUS_CONFIG } from "@/lib/constants/status-colors";
import type { Project, DagstaatStatus } from "@/lib/types/database";
import { TabPersoneel } from "./_components/tab-personeel";
import { TabWerk } from "./_components/tab-werk";
import { TabMateriaal } from "./_components/tab-materiaal";
import { TabNotes } from "./_components/tab-notes";
import { Camera, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProjectTemplates,
} from "@/lib/hooks/use-templates";

type TabId = "personeel" | "werk" | "materiaal" | "fotos" | "notities";

const TABS: { id: TabId; label: string }[] = [
  { id: "personeel", label: "Personeel" },
  { id: "werk", label: "Werk" },
  { id: "materiaal", label: "Materiaal" },
  { id: "fotos", label: "Foto's" },
  { id: "notities", label: "Notities" },
];

function formatDateNL(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DagstaatEditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const date = params.date as string;
  const { user, effectiveRole } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>("personeel");
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } =
    useSupabaseItem<Project>("projects", projectId);
  const { data: dagstaat, isLoading: dagstaatLoading } = useDagstaat(
    projectId,
    date,
    user?.id
  );
  const updateDagstaat = useUpdateDagstaat();
  const { data: templates = [] } = useProjectTemplates(projectId);

  const isLoading = projectLoading || dagstaatLoading;
  const canManage = isManager(effectiveRole);
  const isVoorman = effectiveRole === "voorman";
  const status = (dagstaat?.status ?? "draft") as DagstaatStatus;
  const statusConfig = STATUS_CONFIG[status];

  // Read-only logic
  const isReadOnly =
    status === "approved" || (status === "submitted" && isVoorman);

  const handleSubmit = async () => {
    if (!dagstaat) return;
    await updateDagstaat.mutateAsync({
      id: dagstaat.id,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitted_by: user?.id,
    } as Parameters<typeof updateDagstaat.mutateAsync>[0]);
  };

  const handleApprove = async () => {
    if (!dagstaat) return;
    await updateDagstaat.mutateAsync({
      id: dagstaat.id,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
    } as Parameters<typeof updateDagstaat.mutateAsync>[0]);
  };

  const handleUnlock = async () => {
    if (!dagstaat) return;
    await updateDagstaat.mutateAsync({
      id: dagstaat.id,
      status: "draft",
      submitted_at: null,
      submitted_by: null,
      approved_at: null,
      approved_by: null,
    } as Parameters<typeof updateDagstaat.mutateAsync>[0]);
  };

  const handleApplyTemplate = async (templateId: string) => {
    if (!dagstaat) return;
    setApplyingTemplate(true);
    setShowTemplateDropdown(false);

    try {
      const supabase = createClient();

      // Fetch template personeel
      const { data: tPersoneel } = await supabase
        .from("template_personeel")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });

      // Fetch template materieel
      const { data: tMaterieel } = await supabase
        .from("template_materieel")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order", { ascending: true });

      // Get current max sort_order for personeel
      const { data: existingP } = await supabase
        .from("dagstaat_personeel")
        .select("sort_order")
        .eq("dagstaat_id", dagstaat.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      let nextPSort = (existingP?.[0]?.sort_order ?? -1) + 1;

      // Insert personeel rows
      if (tPersoneel && tPersoneel.length > 0) {
        const rows = tPersoneel.map((tp) => ({
          dagstaat_id: dagstaat.id,
          employee_id: tp.employee_id,
          unit: tp.unit,
          quantity: tp.default_qty,
          sort_order: nextPSort++,
        }));
        await supabase.from("dagstaat_personeel").insert(rows);
      }

      // Get current max sort_order for materieel
      const { data: existingM } = await supabase
        .from("dagstaat_materieel")
        .select("sort_order")
        .eq("dagstaat_id", dagstaat.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      let nextMSort = (existingM?.[0]?.sort_order ?? -1) + 1;

      // Insert materieel rows
      if (tMaterieel && tMaterieel.length > 0) {
        const rows = tMaterieel.map((tm) => ({
          dagstaat_id: dagstaat.id,
          equipment_id: tm.equipment_id,
          unit: tm.unit,
          quantity: tm.default_qty,
          sort_order: nextMSort++,
        }));
        await supabase.from("dagstaat_materieel").insert(rows);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["dagstaat_personeel"] });
      queryClient.invalidateQueries({ queryKey: ["dagstaat_materieel"] });
    } catch (err) {
      console.error("Failed to apply template:", err);
    } finally {
      setApplyingTemplate(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="h-12 w-full animate-pulse rounded-xl bg-slate-100" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-50" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Project niet gevonden.</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <PageHeader
        title={`${project.name}`}
        description={formatDateNL(date)}
        backHref={`/projecten/${projectId}`}
        actions={
          <div className="flex items-center gap-2">
            {status === "draft" && templates.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  disabled={applyingTemplate}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e43122] px-3 py-1.5 text-sm font-medium text-[#e43122] transition-colors duration-150 hover:bg-[#e43122]/5 disabled:opacity-50"
                >
                  {applyingTemplate ? "Bezig..." : "Standaard toepassen"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showTemplateDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowTemplateDropdown(false)}
                    />
                    <div className="absolute right-0 z-50 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      {templates.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleApplyTemplate(t.id)}
                          className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <Badge variant={status as "draft" | "submitted" | "approved"}>
              {statusConfig.label}
            </Badge>
          </div>
        }
      />

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              activeTab === tab.id
                ? "bg-[#e43122] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "personeel" && dagstaat && (
          <TabPersoneel
            dagstaatId={dagstaat.id}
            projectId={projectId}
            isReadOnly={isReadOnly}
          />
        )}
        {activeTab === "werk" && dagstaat && (
          <TabWerk
            dagstaatId={dagstaat.id}
            projectId={projectId}
            isReadOnly={isReadOnly}
          />
        )}
        {activeTab === "materiaal" && dagstaat && (
          <TabMateriaal
            dagstaatId={dagstaat.id}
            projectId={projectId}
            isReadOnly={isReadOnly}
          />
        )}
        {activeTab === "fotos" && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16">
            <Camera className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              Foto&apos;s worden binnenkort toegevoegd
            </p>
          </div>
        )}
        {activeTab === "notities" && dagstaat && (
          <TabNotes
            dagstaatId={dagstaat.id}
            isReadOnly={isReadOnly}
            isManager={canManage}
            userId={user?.id ?? ""}
          />
        )}
      </div>

      {/* Bottom action bar */}
      {dagstaat && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-6 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="text-sm text-slate-500">
              Status:{" "}
              <span
                className={`font-medium ${statusConfig.textColor}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <div className="flex gap-2">
              {/* Voorman: submit draft */}
              {status === "draft" && isVoorman && (
                <button
                  onClick={handleSubmit}
                  disabled={updateDagstaat.isPending}
                  className="rounded-xl bg-[#e43122] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#c92a1d] disabled:opacity-50"
                >
                  {updateDagstaat.isPending ? "Bezig..." : "Indienen"}
                </button>
              )}
              {/* Manager: approve submitted */}
              {status === "submitted" && canManage && (
                <>
                  <button
                    onClick={handleUnlock}
                    disabled={updateDagstaat.isPending}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Ontgrendelen
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={updateDagstaat.isPending}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {updateDagstaat.isPending ? "Bezig..." : "Goedkeuren"}
                  </button>
                </>
              )}
              {/* Manager: unlock approved */}
              {status === "approved" && canManage && (
                <button
                  onClick={handleUnlock}
                  disabled={updateDagstaat.isPending}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
                >
                  Ontgrendelen
                </button>
              )}
              {/* Manager: submit draft */}
              {status === "draft" && canManage && (
                <button
                  onClick={handleSubmit}
                  disabled={updateDagstaat.isPending}
                  className="rounded-xl bg-[#e43122] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#c92a1d] disabled:opacity-50"
                >
                  {updateDagstaat.isPending ? "Bezig..." : "Indienen"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
