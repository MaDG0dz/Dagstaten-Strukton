"use client";

import { useState, useCallback, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
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

  return (
    <div className="group rounded-lg border border-slate-100 bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 gap-2 sm:grid-cols-5">
          {/* Activity */}
          <select
            className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:col-span-2"
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
              onUpdate(
                row.id,
                "subproject_id",
                e.target.value || null
              );
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

        {/* Delete */}
        {!isReadOnly && (
          <button
            onClick={() => onDelete(row.id)}
            className="mt-1 shrink-0 text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
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

export function TabWerk({ dagstaatId, projectId, isReadOnly }: TabWerkProps) {
  const { data: werkRows = [], isLoading } = useDagstaatWerk(dagstaatId);
  const { data: activities = [] } = useActivities();
  const { data: subprojects = [] } = useSubprojects(projectId);
  const { data: projectActivities = [] } = useProjectActivities(projectId);

  const insertWerk = useInsertWerk();
  const updateWerk = useUpdateWerk();
  const deleteWerk = useDeleteWerk();

  // If project has linked activities, only show those; otherwise show all active
  const linkedActivityIds = new Set(projectActivities.map((pa) => pa.activity_id));
  const activeActivities =
    projectActivities.length > 0
      ? activities.filter((a) => a.is_active && linkedActivityIds.has(a.id))
      : activities.filter((a) => a.is_active);

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

  const handleAdd = () => {
    const nextSort =
      werkRows.length > 0
        ? Math.max(...werkRows.map((r) => r.sort_order)) + 1
        : 0;

    insertWerk.mutate({
      dagstaat_id: dagstaatId,
      activity_id: activeActivities[0]?.id ?? "",
      unit: "uur",
      quantity: 0,
      sort_order: nextSort,
    } as Parameters<typeof insertWerk.mutate>[0]);
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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Werkzaamheden</h2>
        {!isReadOnly && (
          <button
            onClick={handleAdd}
            disabled={insertWerk.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Activiteit toevoegen
          </button>
        )}
      </div>

      {werkRows.length === 0 ? (
        <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
          Nog geen werkzaamheden toegevoegd.
        </p>
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
