"use client";

import { useMemo } from "react";
import { Users, Wrench, HardHat, Package, FileText, Send } from "lucide-react";
import {
  useDagstaatPersoneel,
  useDagstaatMaterieel,
  useDagstaatWerk,
  useDagstaatMateriaal,
  useDagstaatNotes,
} from "@/lib/hooks/use-dagstaat";
import { useEmployees } from "@/lib/hooks/use-employees";
import { useEquipment } from "@/lib/hooks/use-equipment";
import { useActivities } from "@/lib/hooks/use-activities";
import { UNIT_OPTIONS } from "@/lib/constants/units";

interface SubmitSummaryProps {
  dagstaatId: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

function unitLabel(unit: string) {
  return UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit;
}

export function SubmitSummary({
  dagstaatId,
  open,
  onClose,
  onConfirm,
  isPending,
}: SubmitSummaryProps) {
  const { data: personeel = [] } = useDagstaatPersoneel(dagstaatId);
  const { data: materieel = [] } = useDagstaatMaterieel(dagstaatId);
  const { data: werk = [] } = useDagstaatWerk(dagstaatId);
  const { data: materiaal = [] } = useDagstaatMateriaal(dagstaatId);
  const { data: notes = [] } = useDagstaatNotes(dagstaatId);
  const { data: employees = [] } = useEmployees();
  const { data: equipment = [] } = useEquipment();
  const { data: activities = [] } = useActivities();

  const summary = useMemo(() => {
    const personnelItems = personeel.map((p) => ({
      name: employees.find((e) => e.id === p.employee_id)?.name ?? "Onbekend",
      detail: `${p.quantity} ${unitLabel(p.unit)}`,
    }));

    const equipmentItems = materieel.map((m) => ({
      name: equipment.find((e) => e.id === m.equipment_id)?.name ?? "Onbekend",
      detail: `${m.quantity} ${unitLabel(m.unit)}`,
    }));

    const workItems = werk.map((w) => ({
      name: activities.find((a) => a.id === w.activity_id)?.name ?? "Onbekend",
      detail: `${w.quantity} ${unitLabel(w.unit)}`,
    }));

    const materialItems = materiaal.map((m) => ({
      name: m.name_override ?? "Materiaal",
      detail: `${m.quantity} ${unitLabel(m.unit)}`,
    }));

    const hasPublicNotes = notes.some((n) => !n.is_private && n.content);
    const hasPrivateNotes = notes.some((n) => n.is_private && n.content);

    return { personnelItems, equipmentItems, workItems, materialItems, hasPublicNotes, hasPrivateNotes };
  }, [personeel, materieel, werk, materiaal, notes, employees, equipment, activities]);

  const totalItems =
    summary.personnelItems.length +
    summary.equipmentItems.length +
    summary.workItems.length +
    summary.materialItems.length;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-x-4 bottom-4 top-auto z-50 max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-slide-in-up md:inset-x-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2">
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-100 bg-white px-5 py-4 rounded-t-2xl">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
            Samenvatting dagstaat
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Controleer de gegevens voordat je indient
          </p>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {totalItems === 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Let op: deze dagstaat is leeg
              </p>
              <p className="mt-0.5 text-xs text-amber-600">
                Er zijn nog geen personeel, werkzaamheden of materialen toegevoegd.
              </p>
            </div>
          )}

          {/* Personeel */}
          {summary.personnelItems.length > 0 && (
            <SummarySection
              icon={Users}
              title="Personeel"
              count={summary.personnelItems.length}
              items={summary.personnelItems}
              color="text-blue-600 bg-blue-50"
            />
          )}

          {/* Materieel */}
          {summary.equipmentItems.length > 0 && (
            <SummarySection
              icon={Wrench}
              title="Materieel"
              count={summary.equipmentItems.length}
              items={summary.equipmentItems}
              color="text-violet-600 bg-violet-50"
            />
          )}

          {/* Werkzaamheden */}
          {summary.workItems.length > 0 && (
            <SummarySection
              icon={HardHat}
              title="Werkzaamheden"
              count={summary.workItems.length}
              items={summary.workItems}
              color="text-amber-600 bg-amber-50"
            />
          )}

          {/* Materialen */}
          {summary.materialItems.length > 0 && (
            <SummarySection
              icon={Package}
              title="Materialen"
              count={summary.materialItems.length}
              items={summary.materialItems}
              color="text-emerald-600 bg-emerald-50"
            />
          )}

          {/* Notities */}
          {(summary.hasPublicNotes || summary.hasPrivateNotes) && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-700">
                {summary.hasPublicNotes && "Openbare notities"}
                {summary.hasPublicNotes && summary.hasPrivateNotes && " + "}
                {summary.hasPrivateNotes && "Interne notities"}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-5 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Terug
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-[#e43122] text-sm font-semibold text-white transition-all hover:bg-[#c42a1d] active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isPending ? "Bezig..." : "Indienen"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Summary Section ─────────────────────────────────────────── */

function SummarySection({
  icon: Icon,
  title,
  count,
  items,
  color,
}: {
  icon: typeof Users;
  title: string;
  count: number;
  items: { name: string; detail: string }[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50/50">
        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {count}
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-slate-700">{item.name}</span>
            <span className="text-sm font-medium text-slate-900">{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
