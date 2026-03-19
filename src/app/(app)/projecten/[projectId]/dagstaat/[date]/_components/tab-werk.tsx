"use client";

import { useState, useCallback, useRef } from "react";
import { Trash2, Plus, HardHat } from "lucide-react";
import { useActivities } from "@/lib/hooks/use-activities";
import { useSubprojects } from "@/lib/hooks/use-projects";
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
}: {
  activity: { id: string; name: string; code: string | null };
  isAdded: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 ${
        isAdded
          ? "border-[#e43122]/30 bg-[#e43122]/10 text-[#e43122]"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAdded ? "bg-[#e43122]" : "bg-slate-300"
        }`}
      />
      {activity.code ? `${activity.code} — ` : ""}
      {activity.name}
    </button>
  );
}

/* ── Werk Row ──────────────────────────────────────────────────── */

function WerkRow({
  row,
  activities,
  subprojects,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatWerk;
  activities: { id: string; name: string; code: string | null }[];
  subprojects: { id: string; name: string; code: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const [activityId, setActivityId] = useState(row.activity_id);
  const [subprojectId, setSubprojectId] = useState(row.subproject_id ?? "");
  const [unit, setUnit] = useState(row.unit);
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
    activities.find((a) => a.id === activityId)?.name ?? "Activiteit";
  const subprojectName =
    subprojects.find((s) => s.id === subprojectId)?.name ?? null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Header row: activity name + delete */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {activityName}
          </span>
          {subprojectName && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {subprojectName}
            </span>
          )}
          {quantity !== "0" && (
            <span className="text-xs text-slate-400">
              {quantity}{" "}
              {UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit}
            </span>
          )}
        </div>
        {!isReadOnly && (
          <button
            onClick={() => onDelete(row.id)}
            className="shrink-0 text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Inline fields */}
      <div className="grid gap-2 sm:grid-cols-4">
        {/* Activity */}
        <select
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:col-span-1"
          value={activityId}
          disabled={isReadOnly}
          onChange={(e) => {
            setActivityId(e.target.value);
            onUpdate(row.id, "activity_id", e.target.value);
          }}
        >
          <option value="">-- Activiteit --</option>
          {activities.map((act) => (
            <option key={act.id} value={act.id}>
              {act.code ? `${act.code} - ` : ""}
              {act.name}
            </option>
          ))}
        </select>

        {/* Subproject */}
        <select
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          value={subprojectId}
          disabled={isReadOnly}
          onChange={(e) => {
            setSubprojectId(e.target.value);
            onUpdate(row.id, "subproject_id", e.target.value || null);
          }}
        >
          <option value="">-- Deelproject --</option>
          {subprojects.map((sp) => (
            <option key={sp.id} value={sp.id}>
              {sp.code} - {sp.name}
            </option>
          ))}
        </select>

        {/* Unit */}
        <select
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          value={unit}
          disabled={isReadOnly}
          onChange={(e) => {
            setUnit(e.target.value);
            onUpdate(row.id, "unit", e.target.value);
          }}
        >
          {UNIT_OPTIONS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>

        {/* Quantity */}
        <input
          type="number"
          step="0.5"
          min="0"
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="Aantal"
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

      {/* Description */}
      <div className="mt-2">
        <textarea
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="Omschrijving werkzaamheden..."
          value={description}
          disabled={isReadOnly}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => saveField("description", description || null)}
        />
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
  const linkedActivityIds = new Set(
    projectActivities.map((pa) => pa.activity_id)
  );
  const activeActivities =
    projectActivities.length > 0
      ? activities.filter((a) => a.is_active && linkedActivityIds.has(a.id))
      : activities.filter((a) => a.is_active);

  // Track which activities are already added
  const addedActivityIds = new Set(werkRows.map((r) => r.activity_id));

  const handleUpdate = useCallback(
    (id: string, field: string, value: unknown) => {
      updateWerk.mutate({ id, [field]: value } as Parameters<
        typeof updateWerk.mutate
      >[0]);
    },
    [updateWerk]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteWerk.mutate(id);
    },
    [deleteWerk]
  );

  const handleAdd = (activityId?: string) => {
    const nextSort =
      werkRows.length > 0
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
    if (isReadOnly) return;
    // If already added, do nothing (or could scroll to it)
    if (addedActivityIds.has(activityId)) return;
    handleAdd(activityId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Activity pills row */}
      {activeActivities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Gekoppelde activiteiten
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {activeActivities.map((act) => (
              <ActivityPill
                key={act.id}
                activity={act}
                isAdded={addedActivityIds.has(act.id)}
                onTap={() => handlePillTap(act.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Werkzaamheden</h2>
        {!isReadOnly && (
          <button
            onClick={() => handleAdd()}
            disabled={insertWerk.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Activiteit toevoegen
          </button>
        )}
      </div>

      {/* Work items list */}
      {werkRows.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10">
          <HardHat className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Nog geen werkzaamheden toegevoegd.
          </p>
          {!isReadOnly && activeActivities.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Tik op een activiteit hierboven om te beginnen.
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
    </section>
  );
}
