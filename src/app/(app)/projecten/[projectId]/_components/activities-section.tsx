"use client";

import { useState } from "react";
import { Plus, X, ListChecks } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, FormSelect } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import { useActivities } from "@/lib/hooks/use-activities";
import {
  useProjectActivities,
  useAddProjectActivity,
  useRemoveProjectActivity,
} from "@/lib/hooks/use-templates";
import { isManager } from "@/lib/constants/roles";

interface ActivitiesSectionProps {
  projectId: string;
}

export function ActivitiesSection({ projectId }: ActivitiesSectionProps) {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const { data: linked = [], isLoading } = useProjectActivities(projectId);
  const { data: allActivities = [] } = useActivities();
  const addActivity = useAddProjectActivity();
  const removeActivity = useRemoveProjectActivity();

  const [showModal, setShowModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState("");

  // Filter out already-linked activities
  const linkedIds = new Set(linked.map((l) => l.activity_id));
  const availableActivities = allActivities.filter(
    (a) => a.is_active && !linkedIds.has(a.id)
  );

  const handleAdd = async () => {
    if (!selectedActivityId) return;
    await addActivity.mutateAsync({
      project_id: projectId,
      activity_id: selectedActivityId,
    } as Parameters<typeof addActivity.mutateAsync>[0]);
    setSelectedActivityId("");
    setShowModal(false);
  };

  const handleRemove = (id: string) => {
    removeActivity.mutate(id);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-slate-900">
          Gekoppelde activiteiten
        </h2>
        {canManage && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Activiteit koppelen
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-50" />
          ))}
        </div>
      ) : linked.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Geen activiteiten gekoppeld"
          description="Koppel activiteiten om ze beschikbaar te maken in de dagstaat"
        />
      ) : (
        <div className="space-y-1">
          {linked.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5"
            >
              <span className="text-sm text-slate-900">
                {item.activity?.code ? `${item.activity.code} - ` : ""}
                {item.activity?.name ?? "Onbekend"}
              </span>
              {canManage && (
                <button
                  onClick={() => handleRemove(item.id)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Ontkoppelen"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add activity modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Activiteit koppelen"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Activiteit">
            <FormSelect
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
            >
              <option value="">-- Selecteer een activiteit --</option>
              {availableActivities.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.code ? `${act.code} - ` : ""}
                  {act.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedActivityId || addActivity.isPending}
              className="rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {addActivity.isPending ? "Opslaan..." : "Koppelen"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
