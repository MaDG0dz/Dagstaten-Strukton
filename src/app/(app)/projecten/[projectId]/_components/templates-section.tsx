"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, FormInput, FormSelect } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import { useEmployees } from "@/lib/hooks/use-employees";
import { useEquipment } from "@/lib/hooks/use-equipment";
import {
  useProjectTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  useTemplatePersoneel,
  useCreateTemplatePersoneel,
  useDeleteTemplatePersoneel,
  useTemplateMaterieel,
  useCreateTemplateMaterieel,
  useDeleteTemplateMaterieel,
  type TemplatePersoneel,
  type TemplateMaterieel,
} from "@/lib/hooks/use-templates";
import { UNIT_OPTIONS } from "@/lib/constants/units";
import { isManager } from "@/lib/constants/roles";
import type { ProjectTemplate } from "@/lib/types/database";

interface TemplatesSectionProps {
  projectId: string;
}

// ── Single template card with expand/collapse ──────────────────────
function TemplateCard({
  template,
  canManage,
  onDelete,
}: {
  template: ProjectTemplate;
  canManage: boolean;
  onDelete: (t: ProjectTemplate) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAddPersoneel, setShowAddPersoneel] = useState(false);
  const [showAddMaterieel, setShowAddMaterieel] = useState(false);

  const { data: personeel = [] } = useTemplatePersoneel(template.id);
  const { data: materieel = [] } = useTemplateMaterieel(template.id);
  const { data: employees = [] } = useEmployees();
  const { data: equipment = [] } = useEquipment();

  const createPersoneel = useCreateTemplatePersoneel();
  const deletePersoneel = useDeleteTemplatePersoneel();
  const createMaterieel = useCreateTemplateMaterieel();
  const deleteMaterieel = useDeleteTemplateMaterieel();

  const activeEmployees = employees.filter((e) => e.is_active);
  const activeEquipment = equipment.filter((e) => e.is_active);

  // Add personeel form state
  const [pEmployeeId, setPEmployeeId] = useState("");
  const [pUnit, setPUnit] = useState("uur");
  const [pQty, setPQty] = useState("8");

  // Add materieel form state
  const [mEquipmentId, setMEquipmentId] = useState("");
  const [mUnit, setMUnit] = useState("uur");
  const [mQty, setMQty] = useState("1");

  const handleAddPersoneel = async () => {
    if (!pEmployeeId) return;
    const nextSort = personeel.length > 0 ? Math.max(...personeel.map((p) => p.sort_order)) + 1 : 0;
    await createPersoneel.mutateAsync({
      template_id: template.id,
      employee_id: pEmployeeId,
      unit: pUnit,
      default_qty: parseFloat(pQty) || 0,
      sort_order: nextSort,
    } as Partial<TemplatePersoneel>);
    setShowAddPersoneel(false);
    setPEmployeeId("");
    setPUnit("uur");
    setPQty("8");
  };

  const handleAddMaterieel = async () => {
    if (!mEquipmentId) return;
    const nextSort = materieel.length > 0 ? Math.max(...materieel.map((m) => m.sort_order)) + 1 : 0;
    await createMaterieel.mutateAsync({
      template_id: template.id,
      equipment_id: mEquipmentId,
      unit: mUnit,
      default_qty: parseFloat(mQty) || 0,
      sort_order: nextSort,
    } as Partial<TemplateMaterieel>);
    setShowAddMaterieel(false);
    setMEquipmentId("");
    setMUnit("uur");
    setMQty("1");
  };

  return (
    <div className="rounded-xl bg-slate-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-slate-900"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
          {template.name}
          <span className="text-xs font-normal text-slate-400">
            ({personeel.length} personen, {materieel.length} materieel)
          </span>
        </button>
        {canManage && (
          <button
            onClick={() => onDelete(template)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Verwijderen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Personeel */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Personeel
              </h4>
              {canManage && (
                <button
                  onClick={() => setShowAddPersoneel(true)}
                  className="text-sm text-[#e43122] hover:underline"
                >
                  Medewerker toevoegen
                </button>
              )}
            </div>
            {personeel.length === 0 ? (
              <p className="text-xs text-slate-400">Geen personeel ingesteld.</p>
            ) : (
              <div className="space-y-1">
                {personeel.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="text-slate-900">
                      {p.employee?.name ?? "Onbekend"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {p.default_qty} {p.unit}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => deletePersoneel.mutate(p.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materieel */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Materieel
              </h4>
              {canManage && (
                <button
                  onClick={() => setShowAddMaterieel(true)}
                  className="text-sm text-[#e43122] hover:underline"
                >
                  Materieel toevoegen
                </button>
              )}
            </div>
            {materieel.length === 0 ? (
              <p className="text-xs text-slate-400">Geen materieel ingesteld.</p>
            ) : (
              <div className="space-y-1">
                {materieel.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="text-slate-900">
                      {m.equipment?.code ? `${m.equipment.code} - ` : ""}
                      {m.equipment?.name ?? "Onbekend"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {m.default_qty} {m.unit}
                      </span>
                      {canManage && (
                        <button
                          onClick={() => deleteMaterieel.mutate(m.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add personeel modal */}
      <Modal
        open={showAddPersoneel}
        onClose={() => setShowAddPersoneel(false)}
        title="Medewerker toevoegen"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Medewerker">
            <FormSelect
              value={pEmployeeId}
              onChange={(e) => setPEmployeeId(e.target.value)}
            >
              <option value="">-- Selecteer --</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Eenheid">
            <FormSelect value={pUnit} onChange={(e) => setPUnit(e.target.value)}>
              {UNIT_OPTIONS.filter((u) =>
                ["uur", "dag", "halve_dag"].includes(u.value)
              ).map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Standaard aantal">
            <FormInput
              type="number"
              step="0.5"
              min="0"
              value={pQty}
              onChange={(e) => setPQty(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAddPersoneel(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleAddPersoneel}
              disabled={!pEmployeeId || createPersoneel.isPending}
              className="rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {createPersoneel.isPending ? "Opslaan..." : "Toevoegen"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add materieel modal */}
      <Modal
        open={showAddMaterieel}
        onClose={() => setShowAddMaterieel(false)}
        title="Materieel toevoegen"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Materieel">
            <FormSelect
              value={mEquipmentId}
              onChange={(e) => setMEquipmentId(e.target.value)}
            >
              <option value="">-- Selecteer --</option>
              {activeEquipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.code ? `${eq.code} - ` : ""}
                  {eq.name}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Eenheid">
            <FormSelect value={mUnit} onChange={(e) => setMUnit(e.target.value)}>
              {UNIT_OPTIONS.filter((u) =>
                ["uur", "dag", "stuks"].includes(u.value)
              ).map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Standaard aantal">
            <FormInput
              type="number"
              step="0.5"
              min="0"
              value={mQty}
              onChange={(e) => setMQty(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAddMaterieel(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleAddMaterieel}
              disabled={!mEquipmentId || createMaterieel.isPending}
              className="rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {createMaterieel.isPending ? "Opslaan..." : "Toevoegen"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Main section component ─────────────────────────────────────────
export function TemplatesSection({ projectId }: TemplatesSectionProps) {
  const { user, effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const { data: templates = [], isLoading } = useProjectTemplates(projectId);
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const [showNewModal, setShowNewModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [deletingTemplate, setDeletingTemplate] = useState<ProjectTemplate | null>(null);

  const handleCreate = async () => {
    if (!templateName.trim()) return;
    await createTemplate.mutateAsync({
      project_id: projectId,
      name: templateName.trim(),
      created_by: user?.id ?? null,
    });
    setTemplateName("");
    setShowNewModal(false);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    await deleteTemplate.mutateAsync(deletingTemplate.id);
    setDeletingTemplate(null);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-slate-900">
          Standaardinstelling
        </h2>
        {canManage && (
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Nieuw template
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-50" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="Geen templates"
          description="Maak een template aan om standaard personeel en materieel in te stellen"
        />
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              canManage={canManage}
              onDelete={setDeletingTemplate}
            />
          ))}
        </div>
      )}

      {/* New template modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nieuw template"
        size="sm"
      >
        <div className="space-y-4">
          <FormField label="Naam">
            <FormInput
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Bijv. Standaard ploeg"
              disabled={createTemplate.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </FormField>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              disabled={createTemplate.isPending}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleCreate}
              disabled={!templateName.trim() || createTemplate.isPending}
              className="rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {createTemplate.isPending ? "Opslaan..." : "Aanmaken"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingTemplate}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTemplate(null)}
        title="Template verwijderen"
        description={`Weet je zeker dat je "${deletingTemplate?.name ?? ""}" wilt verwijderen? Alle personeel- en materieelregels worden ook verwijderd.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteTemplate.isPending}
      />
    </section>
  );
}
