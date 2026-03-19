"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  Package,
} from "lucide-react";
import { useMaterials, useMaterialCategories } from "@/lib/hooks/use-materials";
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

/* ── Material Row (inline editable) ─────────────────────────── */

function MateriaalRow({
  row,
  materials,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatMateriaal;
  materials: { id: string; name: string; code: string | null; default_unit: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
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

  const materialName =
    row.material?.name ?? row.name_override ?? "Onbekend materiaal";
  const unitLabel =
    UNIT_OPTIONS.find((u) => u.value === row.unit)?.label ?? row.unit;

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">
          {materialName}
        </p>
        {remarks && (
          <p className="truncate text-xs text-slate-400">{remarks}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <input
          type="number"
          step="0.5"
          min="0"
          className="h-8 w-16 rounded-lg border border-slate-200 px-2 text-center text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          value={quantity}
          disabled={isReadOnly}
          onChange={(e) => setQuantity(e.target.value)}
          onBlur={() => {
            const val = parseFloat(quantity) || 0;
            setQuantity(String(val));
            saveField("quantity", val);
          }}
        />
        <span className="w-10 text-xs text-slate-500">{unitLabel}</span>

        {!isReadOnly && (
          <button
            onClick={() => onDelete(row.id)}
            className="shrink-0 text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Section Card ────────────────────────────────────────────── */

function SectionCard({
  title,
  rows,
  materials,
  isReadOnly,
  onUpdate,
  onDelete,
  onAddClick,
}: {
  title: string;
  rows: DagstaatMateriaal[];
  materials: { id: string; name: string; code: string | null; default_unit: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
            {rows.length}
          </span>
        </div>
        {!isReadOnly && (
          <button
            onClick={onAddClick}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="py-3 text-center text-xs text-slate-400">
          Geen materialen.
        </p>
      ) : (
        <div>
          {rows.map((row) => (
            <MateriaalRow
              key={row.id}
              row={row}
              materials={materials}
              isReadOnly={isReadOnly}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Material Selection Modal ────────────────────────────────── */

function MaterialModal({
  title,
  onClose,
  onSelect,
  onManualAdd,
}: {
  title: string;
  onClose: () => void;
  onSelect: (materialId: string, unit: string) => void;
  onManualAdd: (name: string, quantity: number, unit: string) => void;
}) {
  const { data: categories = [] } = useMaterialCategories();
  const { data: allMaterials = [] } = useMaterials();
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [selectedMaterials, setSelectedMaterials] = useState<
    Map<string, number>
  >(new Map());

  // Manual add state
  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState("1");
  const [manualUnit, setManualUnit] = useState("stuks");

  const activeMaterials = allMaterials.filter((m) => m.is_active);
  const activeCategories = categories.filter((c) => c.is_active);

  // Group materials by category
  const materialsByCategory = useMemo(() => {
    const map = new Map<string, typeof activeMaterials>();
    for (const mat of activeMaterials) {
      const list = map.get(mat.category_id) ?? [];
      list.push(mat);
      map.set(mat.category_id, list);
    }
    return map;
  }, [activeMaterials]);

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return activeCategories;
    const term = search.toLowerCase();
    return activeCategories.filter((cat) => {
      const mats = materialsByCategory.get(cat.id) ?? [];
      return (
        cat.name.toLowerCase().includes(term) ||
        mats.some((m) => m.name.toLowerCase().includes(term))
      );
    });
  }, [activeCategories, materialsByCategory, search]);

  const getFilteredMaterials = useCallback(
    (categoryId: string) => {
      const mats = materialsByCategory.get(categoryId) ?? [];
      if (!search.trim()) return mats;
      const term = search.toLowerCase();
      return mats.filter((m) => m.name.toLowerCase().includes(term));
    },
    [materialsByCategory, search]
  );

  const toggleCategory = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const toggleMaterial = (matId: string) => {
    setSelectedMaterials((prev) => {
      const next = new Map(prev);
      if (next.has(matId)) {
        next.delete(matId);
      } else {
        next.set(matId, 1);
      }
      return next;
    });
  };

  const setMaterialQty = (matId: string, qty: number) => {
    setSelectedMaterials((prev) => {
      const next = new Map(prev);
      next.set(matId, qty);
      return next;
    });
  };

  const handleConfirm = () => {
    selectedMaterials.forEach((qty, matId) => {
      const mat = activeMaterials.find((m) => m.id === matId);
      if (mat) {
        onSelect(mat.id, mat.default_unit);
      }
    });
    onClose();
  };

  const handleManualAdd = () => {
    if (!manualName.trim()) return;
    onManualAdd(manualName.trim(), parseFloat(manualQty) || 1, manualUnit);
    setManualName("");
    setManualQty("1");
    setManualUnit("stuks");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-t-2xl bg-white sm:rounded-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-900">
            Materialen — {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              placeholder="Zoek materiaal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Category accordions */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {filteredCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Geen categorieën gevonden.
            </p>
          ) : (
            filteredCategories.map((cat) => {
              const mats = getFilteredMaterials(cat.id);
              const isExpanded = expandedCats.has(cat.id);

              return (
                <div key={cat.id} className="border-b border-slate-100">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="flex w-full items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {cat.name}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {mats.length}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-1 pb-3">
                      {mats.map((mat) => {
                        const isSelected = selectedMaterials.has(mat.id);
                        const qty = selectedMaterials.get(mat.id) ?? 1;

                        return (
                          <div
                            key={mat.id}
                            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                          >
                            <button
                              onClick={() => toggleMaterial(mat.id)}
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                isSelected
                                  ? "border-[#e43122] bg-[#e43122] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>

                            <span className="flex-1 text-sm text-slate-700">
                              {mat.code ? `${mat.code} — ` : ""}
                              {mat.name}
                            </span>

                            {isSelected && (
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                className="h-7 w-14 rounded border border-slate-200 px-1.5 text-center text-xs text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-1 focus:ring-[#e43122]/20"
                                value={qty}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  setMaterialQty(
                                    mat.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Manual add section */}
          <div className="border-t border-slate-200 pt-4 mt-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Handmatig toevoegen
            </p>
            <div className="space-y-2">
              <input
                type="text"
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
                placeholder="Naam materiaal"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
                  placeholder="Aantal"
                  value={manualQty}
                  onChange={(e) => setManualQty(e.target.value)}
                />
                <select
                  className="h-9 flex-1 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
                  value={manualUnit}
                  onChange={(e) => setManualUnit(e.target.value)}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleManualAdd}
                  disabled={!manualName.trim()}
                  className="h-9 shrink-0 rounded-lg bg-[#e43122] px-4 text-sm font-medium text-white transition-colors hover:bg-[#c92a1d] disabled:opacity-40"
                >
                  Toevoegen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {selectedMaterials.size > 0 && (
          <div className="shrink-0 border-t border-slate-100 px-4 py-3">
            <button
              onClick={handleConfirm}
              className="w-full rounded-xl bg-[#e43122] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c92a1d]"
            >
              {selectedMaterials.size} materialen toevoegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── TabMateriaal ────────────────────────────────────────────── */

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

  // Modal state: null = closed, "" = hoofdproject, or subproject id
  const [modalTarget, setModalTarget] = useState<string | null>(null);

  const activeMaterials = materials.filter((m) => m.is_active);

  // Group rows by subproject
  const hoofdprojectRows = materiaalRows.filter((r) => !r.subproject_id);
  const rowsBySubproject = useMemo(() => {
    const map = new Map<string, DagstaatMateriaal[]>();
    for (const sp of subprojects) {
      map.set(
        sp.id,
        materiaalRows.filter((r) => r.subproject_id === sp.id)
      );
    }
    return map;
  }, [materiaalRows, subprojects]);

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

  const getNextSort = () =>
    materiaalRows.length > 0
      ? Math.max(...materiaalRows.map((r) => r.sort_order)) + 1
      : 0;

  const handleSelectMaterial = (materialId: string, unit: string) => {
    const subprojectId = modalTarget === "" ? null : modalTarget;
    insertMateriaal.mutate({
      dagstaat_id: dagstaatId,
      material_id: materialId,
      subproject_id: subprojectId,
      unit,
      quantity: 0,
      sort_order: getNextSort(),
    } as Parameters<typeof insertMateriaal.mutate>[0]);
  };

  const handleManualAdd = (name: string, quantity: number, unit: string) => {
    const subprojectId = modalTarget === "" ? null : modalTarget;
    insertMateriaal.mutate({
      dagstaat_id: dagstaatId,
      material_id: null,
      name_override: name,
      subproject_id: subprojectId,
      unit,
      quantity,
      sort_order: getNextSort(),
    } as Parameters<typeof insertMateriaal.mutate>[0]);
  };

  const modalTitle =
    modalTarget === ""
      ? "Hoofdproject"
      : subprojects.find((s) => s.id === modalTarget)?.name ?? "";

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
      <h2 className="text-sm font-semibold text-slate-900">Materialen</h2>

      {/* Hoofdproject section */}
      <SectionCard
        title="Hoofdproject"
        rows={hoofdprojectRows}
        materials={activeMaterials}
        isReadOnly={isReadOnly}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onAddClick={() => setModalTarget("")}
      />

      {/* Deelproject sections */}
      {subprojects.map((sp) => {
        const spRows = rowsBySubproject.get(sp.id) ?? [];
        return (
          <SectionCard
            key={sp.id}
            title={`${sp.code} — ${sp.name}`}
            rows={spRows}
            materials={activeMaterials}
            isReadOnly={isReadOnly}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddClick={() => setModalTarget(sp.id)}
          />
        );
      })}

      {/* Empty state when no subprojects and no materials at all */}
      {subprojects.length === 0 && materiaalRows.length === 0 && (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10">
          <Package className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            Nog geen materialen toegevoegd.
          </p>
        </div>
      )}

      {/* Material selection modal */}
      {modalTarget !== null && (
        <MaterialModal
          title={modalTitle}
          onClose={() => setModalTarget(null)}
          onSelect={handleSelectMaterial}
          onManualAdd={handleManualAdd}
        />
      )}
    </section>
  );
}
