"use client";

import { useState, useCallback, useRef } from "react";
import { Trash2, Plus, PenLine } from "lucide-react";
import { useMaterials } from "@/lib/hooks/use-materials";
import { useSubprojects } from "@/lib/hooks/use-projects";
import {
  useDagstaatMateriaal,
  useInsertMateriaal,
  useUpdateMateriaal,
  useDeleteMateriaal,
  type DagstaatMateriaal,
} from "@/lib/hooks/use-dagstaat";
import { UNIT_OPTIONS } from "@/lib/constants/units";

interface TabMateriaalProps {
  dagstaatId: string;
  projectId: string;
  isReadOnly: boolean;
}

function MateriaalRow({
  row,
  materials,
  subprojects,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatMateriaal;
  materials: { id: string; name: string; code: string | null; default_unit: string }[];
  subprojects: { id: string; name: string; code: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const isManual = !row.material_id;
  const [materialId, setMaterialId] = useState(row.material_id ?? "");
  const [nameOverride, setNameOverride] = useState(row.name_override ?? "");
  const [subprojectId, setSubprojectId] = useState(row.subproject_id ?? "");
  const [unit, setUnit] = useState(row.unit);
  const [quantity, setQuantity] = useState(String(row.quantity));
  const [remarks, setRemarks] = useState(row.remarks ?? "");

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
          {/* Material or manual name */}
          {isManual ? (
            <input
              type="text"
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:col-span-2"
              placeholder="Naam materiaal (handmatig)"
              value={nameOverride}
              disabled={isReadOnly}
              onChange={(e) => setNameOverride(e.target.value)}
              onBlur={() =>
                saveField("name_override", nameOverride || null)
              }
            />
          ) : (
            <select
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:col-span-2"
              value={materialId}
              disabled={isReadOnly}
              onChange={(e) => {
                setMaterialId(e.target.value);
                onUpdate(row.id, "material_id", e.target.value || null);
                // Set default unit when selecting material
                const mat = materials.find((m) => m.id === e.target.value);
                if (mat) {
                  setUnit(mat.default_unit);
                  onUpdate(row.id, "unit", mat.default_unit);
                }
              }}
            >
              <option value="">-- Materiaal --</option>
              {materials.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.code ? `${mat.code} - ` : ""}
                  {mat.name}
                </option>
              ))}
            </select>
          )}

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

      {/* Remarks */}
      <div className="mt-2">
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="Opmerkingen..."
          value={remarks}
          disabled={isReadOnly}
          onChange={(e) => setRemarks(e.target.value)}
          onBlur={() => saveField("remarks", remarks || null)}
        />
      </div>
    </div>
  );
}

export function TabMateriaal({
  dagstaatId,
  projectId,
  isReadOnly,
}: TabMateriaalProps) {
  const { data: materiaalRows = [], isLoading } =
    useDagstaatMateriaal(dagstaatId);
  const { data: materials = [] } = useMaterials();
  const { data: subprojects = [] } = useSubprojects(projectId);

  const insertMateriaal = useInsertMateriaal();
  const updateMateriaal = useUpdateMateriaal();
  const deleteMateriaal = useDeleteMateriaal();

  const activeMaterials = materials.filter((m) => m.is_active);

  const handleUpdate = useCallback(
    (id: string, field: string, value: unknown) => {
      updateMateriaal.mutate({ id, [field]: value } as Parameters<
        typeof updateMateriaal.mutate
      >[0]);
    },
    [updateMateriaal]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMateriaal.mutate(id);
    },
    [deleteMateriaal]
  );

  const handleAddFromList = () => {
    const nextSort =
      materiaalRows.length > 0
        ? Math.max(...materiaalRows.map((r) => r.sort_order)) + 1
        : 0;

    insertMateriaal.mutate({
      dagstaat_id: dagstaatId,
      material_id: activeMaterials[0]?.id ?? null,
      unit: activeMaterials[0]?.default_unit ?? "stuks",
      quantity: 0,
      sort_order: nextSort,
    } as Parameters<typeof insertMateriaal.mutate>[0]);
  };

  const handleAddManual = () => {
    const nextSort =
      materiaalRows.length > 0
        ? Math.max(...materiaalRows.map((r) => r.sort_order)) + 1
        : 0;

    insertMateriaal.mutate({
      dagstaat_id: dagstaatId,
      material_id: null,
      name_override: "",
      unit: "stuks",
      quantity: 0,
      sort_order: nextSort,
    } as Parameters<typeof insertMateriaal.mutate>[0]);
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
        <h2 className="text-sm font-semibold text-slate-900">Materialen</h2>
        {!isReadOnly && (
          <div className="flex gap-2">
            <button
              onClick={handleAddFromList}
              disabled={insertMateriaal.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Materiaal toevoegen
            </button>
            <button
              onClick={handleAddManual}
              disabled={insertMateriaal.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <PenLine className="h-3.5 w-3.5" />
              Handmatig toevoegen
            </button>
          </div>
        )}
      </div>

      {materiaalRows.length === 0 ? (
        <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
          Nog geen materialen toegevoegd.
        </p>
      ) : (
        <div className="space-y-2">
          {materiaalRows.map((row) => (
            <MateriaalRow
              key={row.id}
              row={row}
              materials={activeMaterials}
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
