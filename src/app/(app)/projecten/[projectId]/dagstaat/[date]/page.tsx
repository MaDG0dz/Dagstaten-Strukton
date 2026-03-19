"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
import { TabFotos } from "./_components/tab-fotos";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Save,
  Send,
  CheckCircle,
  Unlock,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectTemplates } from "@/lib/hooks/use-templates";

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

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor((d.getTime() - oneJan.getTime()) / 86400000) + 1;
  // ISO week calculation
  const dayOfWeek = d.getDay() || 7; // Monday = 1, Sunday = 7
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dayOfWeek + 1);
  const yearStart = new Date(weekStart.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((weekStart.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNum;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DagstaatEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const date = params.date as string;
  const { user, effectiveRole } = useAuth();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [copyingPrevious, setCopyingPrevious] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const activeTab = TABS[activeTabIndex].id;

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

  const handleSaved = useCallback(() => {
    setSavedAt(new Date());
  }, []);

  const handleSubmit = async () => {
    if (!dagstaat) return;
    await updateDagstaat.mutateAsync({
      id: dagstaat.id,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitted_by: user?.id,
    } as Parameters<typeof updateDagstaat.mutateAsync>[0]);
    handleSaved();
  };

  const handleApprove = async () => {
    if (!dagstaat) return;
    await updateDagstaat.mutateAsync({
      id: dagstaat.id,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
    } as Parameters<typeof updateDagstaat.mutateAsync>[0]);
    handleSaved();
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
    handleSaved();
  };

  const handleDelete = async () => {
    if (!dagstaat) return;
    if (!confirm("Weet je zeker dat je deze dagstaat wilt verwijderen?")) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("dagstaten")
        .delete()
        .eq("id", dagstaat.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["dagstaten"] });
      router.push(`/projecten/${projectId}`);
    } catch (err) {
      console.error("Failed to delete dagstaat:", err);
      setDeleting(false);
    }
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
      handleSaved();
    } catch (err) {
      console.error("Failed to apply template:", err);
    } finally {
      setApplyingTemplate(false);
    }
  };

  const handleCopyPreviousDay = async () => {
    if (!dagstaat) return;
    setCopyingPrevious(true);

    try {
      const supabase = createClient();

      // Find the most recent previous dagstaat for this project
      const { data: prevDagstaat } = await supabase
        .from("dagstaten")
        .select("id")
        .eq("project_id", projectId)
        .lt("date", date)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!prevDagstaat) {
        alert("Geen eerdere dagstaat gevonden voor dit project.");
        return;
      }

      // Fetch previous personeel rows
      const { data: prevPersoneel } = await supabase
        .from("dagstaat_personeel")
        .select("employee_id, unit, quantity")
        .eq("dagstaat_id", prevDagstaat.id)
        .order("sort_order", { ascending: true });

      // Fetch previous materieel rows
      const { data: prevMaterieel } = await supabase
        .from("dagstaat_materieel")
        .select("equipment_id, unit, quantity")
        .eq("dagstaat_id", prevDagstaat.id)
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
      if (prevPersoneel && prevPersoneel.length > 0) {
        const rows = prevPersoneel.map((pp) => ({
          dagstaat_id: dagstaat.id,
          employee_id: pp.employee_id,
          unit: pp.unit,
          quantity: pp.quantity,
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
      if (prevMaterieel && prevMaterieel.length > 0) {
        const rows = prevMaterieel.map((pm) => ({
          dagstaat_id: dagstaat.id,
          equipment_id: pm.equipment_id,
          unit: pm.unit,
          quantity: pm.quantity,
          sort_order: nextMSort++,
        }));
        await supabase.from("dagstaat_materieel").insert(rows);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["dagstaat_personeel"] });
      queryClient.invalidateQueries({ queryKey: ["dagstaat_materieel"] });
      handleSaved();
    } catch (err) {
      console.error("Failed to copy previous day:", err);
    } finally {
      setCopyingPrevious(false);
    }
  };

  // Navigation helpers
  const prevTab = activeTabIndex > 0 ? TABS[activeTabIndex - 1] : null;
  const nextTab =
    activeTabIndex < TABS.length - 1 ? TABS[activeTabIndex + 1] : null;

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-slate-100" />
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
    <div className="pb-40">
      {/* Breadcrumbs */}
      <div className="mb-3">
        <Breadcrumbs
          items={[
            { label: "Projecten", href: "/projecten" },
            { label: project.name, href: `/projecten/${projectId}` },
            { label: "Dagstaat" },
          ]}
        />
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              href={`/projecten/${projectId}`}
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors duration-150 hover:bg-slate-50 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-slate-900">
                  {project.name}
                </h1>
                <Badge
                  variant={status as "draft" | "submitted" | "approved"}
                >
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatDateNL(date)} — Week {getWeekNumber(date)}
              </p>
              {savedAt && (
                <p className="mt-0.5 text-xs text-slate-400">
                  Opgeslagen om {formatTime(savedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabIndex(index)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition-colors duration-150 ${
                activeTabIndex === index
                  ? "border border-slate-200 bg-white font-semibold text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action pills */}
      {status === "draft" && !isReadOnly && (
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Template apply - only on personeel tab */}
          {activeTab === "personeel" && templates.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                disabled={applyingTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
              >
                {applyingTemplate ? "Bezig..." : "Standaarden toepassen"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showTemplateDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTemplateDropdown(false)}
                  />
                  <div className="absolute left-0 z-50 mt-1 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
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

          {/* Copy previous day */}
          <button
            onClick={handleCopyPreviousDay}
            disabled={copyingPrevious}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {copyingPrevious ? "Bezig..." : "Kopieer vorige dag"}
          </button>
        </div>
      )}

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
        {activeTab === "fotos" && dagstaat && (
          <TabFotos
            dagstaatId={dagstaat.id}
            projectId={projectId}
            date={date}
            isReadOnly={isReadOnly}
            userId={user?.id ?? ""}
          />
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

      {/* Prev/Next tab navigation (mobile) */}
      <div className="mt-6 flex items-center justify-between gap-3 md:hidden">
        {prevTab ? (
          <button
            onClick={() => setActiveTabIndex(activeTabIndex - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {prevTab.label}
          </button>
        ) : (
          <div />
        )}
        {nextTab ? (
          <button
            onClick={() => setActiveTabIndex(activeTabIndex + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            {nextTab.label}
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Bottom action bar */}
      {dagstaat && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-4 py-3 shadow-sm md:left-64">
          <div className="mx-auto flex max-w-5xl items-center justify-between pb-[env(safe-area-inset-bottom)]">
            {/* Left: Save */}
            <button
              onClick={handleSaved}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              <Save className="h-4 w-4" />
              Opslaan
            </button>

            {/* Center: Submit / Approve+Unlock */}
            <div className="flex gap-2">
              {/* Draft: show submit button */}
              {status === "draft" && (isVoorman || canManage) && (
                <button
                  onClick={handleSubmit}
                  disabled={updateDagstaat.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#e43122] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#c92a1d] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {updateDagstaat.isPending ? "Bezig..." : "Indienen"}
                </button>
              )}

              {/* Submitted + manager: Approve + Unlock */}
              {status === "submitted" && canManage && (
                <>
                  <button
                    onClick={handleUnlock}
                    disabled={updateDagstaat.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <Unlock className="h-4 w-4" />
                    Ontgrendelen
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={updateDagstaat.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {updateDagstaat.isPending ? "Bezig..." : "Goedkeuren"}
                  </button>
                </>
              )}

              {/* Approved + manager: Unlock */}
              {status === "approved" && canManage && (
                <button
                  onClick={handleUnlock}
                  disabled={updateDagstaat.isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Unlock className="h-4 w-4" />
                  Ontgrendelen
                </button>
              )}
            </div>

            {/* Right: Delete (draft only) */}
            {status === "draft" && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 p-2.5 text-[#e43122] transition-colors duration-150 hover:bg-red-50 disabled:opacity-50"
                title="Verwijderen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Placeholder for alignment when no delete button */}
            {status !== "draft" && <div className="w-10" />}
          </div>
        </div>
      )}
    </div>
  );
}
