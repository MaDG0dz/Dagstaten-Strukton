"use client";

import { useState, useCallback, useRef } from "react";
import { Trash2, Plus, HardHat, FolderPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useActivities } from "@/lib/hooks/use-activities";
import { useSubprojects, useCreateSubproject } from "@/lib/hooks/use-projects";
import { useProjectActivities } from "@/lib/hooks/use-templates";
import {
  useDagstaatWerk,
  useInsertWerk,
  useUpdateWerk,
  useDeleteWerk,
  type DagstaatWerk,
} from "@/lib/hooks/use-dagstaat";
import { UNIT_OPTIONS } from "@/lib/constants/units";

interface TabWerkProps {
  dagstaatId: string;
  projectId: string;
  isReadOnly: boolean;
}

/* ── Activity Pill ─────────────────────────────────────────────── */

function ActivityPill({
  activity,
  isAdded,
  onTap,
  disabled,
}: {
  activity: { id: string; name: string; code: string | null };
  isAdded: boolean;
  onTap: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onTap}
      disabled={disabled || isAdded}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all duration-150 ${
        isAdded
          ? "border-[#e43122]/30 bg-[#e43122]/10 text-[#e43122] cursor-default"
          : disabled
          ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isAdded ? "bg-[#e43122]" : "bg-slate-300"
        }`}
      />
      {activity.name}
    </button>
  );
}

/* ── Werk Row (simplified) ──────────────────────────────────────── */

function WerkRow({
  row,
  activities,
  subprojects,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatWerk;
  activities: { id: string; name: string; code: string | null; default_unit: string }[];
  subprojects: { id: string; name: string; code: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [quantity, setQuantity] = useState(String(row.quantity));
  const [description, setDescription] = useState(row.description ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const saveField = useCallback(
    (field: string, value: unknown) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(row.id, field, value);
      }, 500);
    },
    [onUpdate, row.id]
  );

  const activityName =
    activities.find((a) => a.id === row.activity_id)?.name ?? "Activiteit";
  const subprojectName =
    subprojects.find((s) => s.id === row.subproject_id)?.name ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-[#e43122] shrink-0" />
          <span className="text-sm font-medium text-slate-900 truncate">
            {activityName}
          </span>
          {subprojectName && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              {subprojectName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {quantity !== "0" && (
            <span className="text-sm font-semibold text-slate-700">
              {quantity} {UNIT_OPTIONS.find((u) => u.value === row.unit)?.label ?? row.unit}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Row 1: quantity + unit + subproject */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Aantal</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
                placeholder="0"
                value={quantity}
                disabled={isReadOnly}
                onChange={(e) => setQuantity(e.target.value)}
                onBlur={() => {
                  const val = parseFloat(quantity) || 0;
                  setQuantity(String(val));
                  saveField("quantity", val);
                }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Eenheid</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
                value={row.unit}
                disabled={isReadOnly}
                onChange={(e) => onUpdate(row.id, "unit", e.target.value)}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Deelproject</label>
              <select
                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
                value={row.subproject_id ?? ""}
                disabled={isReadOnly}
                onChange={(e) => onUpdate(row.id, "subproject_id", e.target.value || null)}
              >
                <option value="">Hoofdproject</option>
                {subprojects.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.code} — {sp.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: description */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Omschrijving</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
              placeholder="Toelichting werkzaamheden..."
              value={description}
              disabled={isReadOnly}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => saveField("description", description || null)}
            />
          </div>

          {/* Delete */}
          {!isReadOnly && (
            <div className="flex justify-end">
              <button
                onClick={() => onDelete(row.id)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                aria-label="Verwijderen"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Verwijderen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline Deelproject Creator ──────────────────────────────────── */

function InlineDeelprojectCreator({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const createSubproject = useCreateSubproject();

  const handleCreate = async () => {
    if (!code.trim()) return;
    try {
      await createSubproject.mutateAsync({
        project_id: projectId,
        code: code.trim(),
        name: name.trim() || code.trim(),
        is_active: true,
      } as Parameters<typeof createSubproject.mutateAsync>[0]);
      setCode("");
      setName("");
      setOpen(false);
      onCreated();
    } catch (err) {
      console.error("Deelproject aanmaken mislukt:", err);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50"
      >
        <FolderPlus className="h-3.5 w-3.5" />
        Deelproject aanmaken
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">Nieuw deelproject</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
          placeholder="Code (bv. K198)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <input
          type="text"
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
          placeholder="Naam (optioneel)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleCreate}
          disabled={!code.trim() || createSubproject.isPending}
          className="rounded-lg bg-[#e43122] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#c42a1d] disabled:opacity-50 transition-colors"
        >
          {createSubproject.isPending ? "Aanmaken..." : "Aanmaken"}
        </button>
        <button
          onClick={() => { setOpen(false); setCode(""); setName(""); }}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

/* ── TabWerk ───────────────────────────────────────────────────── */

export function TabWerk({ dagstaatId, projectId, isReadOnly }: TabWerkProps) {
  const { data: werkRows = [], isLoading } = useDagstaatWerk(dagstaatId);
  const { data: activities = [] } = useActivities();
  const { data: subprojects = [] } = useSubprojects(projectId);
  const { data: projectActivities = [] } = useProjectActivities(projectId);

  const insertWerk = useInsertWerk();
  const updateWerk = useUpdateWerk();
  const deleteWerk = useDeleteWerk();

  // If project has linked activities, only show those; otherwise show all active
  const linkedActivityIds = new Set(projectActivities.map((pa: { activity_id: string }) => pa.activity_id));
  const activeActivities =
    projectActivities.length > 0
      ? activities.filter((a) => a.is_active && linkedActivityIds.has(a.id))
      : activities.filter((a) => a.is_active);

  const addedActivityIds = new Set(werkRows.map((r) => r.activity_id));

  const handleUpdate = useCallback(
    (id: string, field: string, value: unknown) => {
      updateWerk.mutate({ id, [field]: value } as Parameters<typeof updateWerk.mutate>[0]);
    },
    [updateWerk]
  );

  const handleDelete = useCallback(
    (id: string) => { deleteWerk.mutate(id); },
    [deleteWerk]
  );

  const handleAdd = (activityId?: string) => {
    const nextSort = werkRows.length > 0
      ? Math.max(...werkRows.map((r) => r.sort_order)) + 1
      : 0;

    const act = activityId
      ? activeActivities.find((a) => a.id === activityId)
      : activeActivities[0];

    insertWerk.mutate({
      dagstaat_id: dagstaatId,
      activity_id: act?.id ?? "",
      unit: act?.default_unit ?? "uur",
      quantity: 0,
      sort_order: nextSort,
    } as Parameters<typeof insertWerk.mutate>[0]);
  };

  const handlePillTap = (activityId: string) => {
    if (isReadOnly || addedActivityIds.has(activityId)) return;
    handleAdd(activityId);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Activity pills — tap to quick-add */}
      {activeActivities.length > 0 && !isReadOnly && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tik om toe te voegen
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">
            {activeActivities.map((act) => (
              <ActivityPill
                key={act.id}
                activity={act}
                isAdded={addedActivityIds.has(act.id)}
                onTap={() => handlePillTap(act.id)}
                disabled={isReadOnly}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-slate-900">
          Werkzaamheden
          {werkRows.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({werkRows.length})</span>
          )}
        </h2>
        {!isReadOnly && (
          <button
            onClick={() => handleAdd()}
            disabled={insertWerk.isPending || activeActivities.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Activiteit toevoegen
          </button>
        )}
      </div>

      {/* Work items */}
      {werkRows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-12">
          <HardHat className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Nog geen werkzaamheden toegevoegd
          </p>
          {!isReadOnly && activeActivities.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Tik op een activiteit hierboven om snel toe te voegen
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {werkRows.map((row) => (
            <WerkRow
              key={row.id}
              row={row}
              activities={activeActivities}
              subprojects={subprojects}
              isReadOnly={isReadOnly}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Inline deelproject creator */}
      {!isReadOnly && (
        <div className="pt-2 border-t border-slate-100">
          <InlineDeelprojectCreator
            projectId={projectId}
            onCreated={() => {/* subprojects query auto-refreshes */}}
          />
        </div>
      )}
    </section>
  );
}
