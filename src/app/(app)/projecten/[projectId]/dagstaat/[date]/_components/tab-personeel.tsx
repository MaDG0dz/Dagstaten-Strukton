"use client";

import { useState, useCallback, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import { useEmployees } from "@/lib/hooks/use-employees";
import { useEquipment } from "@/lib/hooks/use-equipment";
import {
  useDagstaatPersoneel,
  useInsertPersoneel,
  useUpdatePersoneel,
  useDeletePersoneel,
  useDagstaatMaterieel,
  useInsertMaterieel,
  useUpdateMaterieel,
  useDeleteMaterieel,
  type DagstaatPersoneel,
  type DagstaatMaterieel,
} from "@/lib/hooks/use-dagstaat";
import { UNIT_OPTIONS } from "@/lib/constants/units";

interface TabPersoneelProps {
  dagstaatId: string;
  projectId: string;
  isReadOnly: boolean;
}

// ── Inline row for personeel ────────────────────────────────────────
function PersoneelRow({
  row,
  employees,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatPersoneel;
  employees: { id: string; name: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const [employeeId, setEmployeeId] = useState(row.employee_id);
  const [unit, setUnit] = useState(row.unit);
  const [quantity, setQuantity] = useState(String(row.quantity));
  const [startTime, setStartTime] = useState(row.start_time ?? "");
  const [endTime, setEndTime] = useState(row.end_time ?? "");
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
    <div className="group flex items-start gap-2 rounded-lg border border-slate-100 bg-white p-3">
      <div className="grid flex-1 gap-2 sm:grid-cols-6">
        {/* Employee */}
        <select
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:col-span-2"
          value={employeeId}
          disabled={isReadOnly}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            onUpdate(row.id, "employee_id", e.target.value);
          }}
        >
          <option value="">-- Selecteer --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
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
          {UNIT_OPTIONS.filter((u) =>
            ["uur", "dag", "halve_dag"].includes(u.value)
          ).map((u) => (
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

        {/* Start time */}
        <input
          type="time"
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          value={startTime}
          disabled={isReadOnly}
          onChange={(e) => setStartTime(e.target.value)}
          onBlur={() =>
            saveField("start_time", startTime || null)
          }
        />

        {/* End time */}
        <input
          type="time"
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500"
          value={endTime}
          disabled={isReadOnly}
          onChange={(e) => setEndTime(e.target.value)}
          onBlur={() => saveField("end_time", endTime || null)}
        />
      </div>

      {/* Remarks (full width below) */}
      {(remarks || !isReadOnly) && (
        <input
          type="text"
          className="hidden h-9 flex-1 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:block"
          placeholder="Opmerkingen"
          value={remarks}
          disabled={isReadOnly}
          onChange={(e) => setRemarks(e.target.value)}
          onBlur={() => saveField("remarks", remarks || null)}
        />
      )}

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
  );
}

// ── Inline row for materieel ────────────────────────────────────────
function MaterieelRow({
  row,
  equipmentList,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatMaterieel;
  equipmentList: { id: string; name: string; code: string | null }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const [equipmentId, setEquipmentId] = useState(row.equipment_id);
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
    <div className="group flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3">
      <div className="grid flex-1 gap-2 sm:grid-cols-4">
        {/* Equipment */}
        <select
          className="h-9 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:col-span-2"
          value={equipmentId}
          disabled={isReadOnly}
          onChange={(e) => {
            setEquipmentId(e.target.value);
            onUpdate(row.id, "equipment_id", e.target.value);
          }}
        >
          <option value="">-- Selecteer --</option>
          {equipmentList.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.code ? `${eq.code} - ` : ""}
              {eq.name}
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
          {UNIT_OPTIONS.filter((u) =>
            ["uur", "dag", "stuks"].includes(u.value)
          ).map((u) => (
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

      {/* Remarks */}
      <input
        type="text"
        className="hidden h-9 w-40 rounded-lg border border-slate-200 px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50 disabled:text-slate-500 sm:block"
        placeholder="Opmerkingen"
        value={remarks}
        disabled={isReadOnly}
        onChange={(e) => setRemarks(e.target.value)}
        onBlur={() => saveField("remarks", remarks || null)}
      />

      {/* Delete */}
      {!isReadOnly && (
        <button
          onClick={() => onDelete(row.id)}
          className="shrink-0 text-slate-400 transition-colors hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Main tab component ──────────────────────────────────────────────
export function TabPersoneel({
  dagstaatId,
  projectId,
  isReadOnly,
}: TabPersoneelProps) {
  const { data: allPersoneel = [], isLoading: loadingPersoneel } =
    useDagstaatPersoneel(dagstaatId);
  const { data: allMaterieel = [], isLoading: loadingMaterieel } =
    useDagstaatMaterieel(dagstaatId);
  const { data: employees = [] } = useEmployees();
  const { data: equipment = [] } = useEquipment();

  const insertPersoneel = useInsertPersoneel();
  const updatePersoneel = useUpdatePersoneel();
  const deletePersoneel = useDeletePersoneel();

  const insertMaterieel = useInsertMaterieel();
  const updateMaterieel = useUpdateMaterieel();
  const deleteMaterieel = useDeleteMaterieel();

  // Split personeel into eigen / onderaannemers
  const eigenPersoneel = allPersoneel.filter(
    (p) => !p.employee?.is_subcontractor
  );
  const onderaannemers = allPersoneel.filter(
    (p) => p.employee?.is_subcontractor
  );

  const eigenEmployees = employees.filter((e) => !e.is_subcontractor && e.is_active);
  const subEmployees = employees.filter((e) => e.is_subcontractor && e.is_active);
  const activeEquipment = equipment.filter((e) => e.is_active);

  const handleUpdatePersoneel = useCallback(
    (id: string, field: string, value: unknown) => {
      updatePersoneel.mutate({ id, [field]: value } as Parameters<
        typeof updatePersoneel.mutate
      >[0]);
    },
    [updatePersoneel]
  );

  const handleDeletePersoneel = useCallback(
    (id: string) => {
      deletePersoneel.mutate(id);
    },
    [deletePersoneel]
  );

  const handleAddPersoneel = (isSubcontractor: boolean) => {
    const nextSort =
      allPersoneel.length > 0
        ? Math.max(...allPersoneel.map((p) => p.sort_order)) + 1
        : 0;

    // Pick first available employee of matching type
    const pool = isSubcontractor ? subEmployees : eigenEmployees;
    const firstId = pool[0]?.id ?? "";

    insertPersoneel.mutate({
      dagstaat_id: dagstaatId,
      employee_id: firstId,
      unit: "uur",
      quantity: isSubcontractor ? 1 : 8,
      sort_order: nextSort,
    } as Parameters<typeof insertPersoneel.mutate>[0]);
  };

  const handleUpdateMaterieel = useCallback(
    (id: string, field: string, value: unknown) => {
      updateMaterieel.mutate({ id, [field]: value } as Parameters<
        typeof updateMaterieel.mutate
      >[0]);
    },
    [updateMaterieel]
  );

  const handleDeleteMaterieel = useCallback(
    (id: string) => {
      deleteMaterieel.mutate(id);
    },
    [deleteMaterieel]
  );

  const handleAddMaterieel = () => {
    const nextSort =
      allMaterieel.length > 0
        ? Math.max(...allMaterieel.map((m) => m.sort_order)) + 1
        : 0;

    insertMaterieel.mutate({
      dagstaat_id: dagstaatId,
      equipment_id: activeEquipment[0]?.id ?? "",
      unit: "uur",
      quantity: 1,
      sort_order: nextSort,
    } as Parameters<typeof insertMaterieel.mutate>[0]);
  };

  if (loadingPersoneel || loadingMaterieel) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Eigen personeel ─────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Eigen personeel
          </h2>
          {!isReadOnly && (
            <button
              onClick={() => handleAddPersoneel(false)}
              disabled={insertPersoneel.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Medewerker toevoegen
            </button>
          )}
        </div>

        {eigenPersoneel.length === 0 ? (
          <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
            Nog geen eigen personeel toegevoegd.
          </p>
        ) : (
          <div className="space-y-2">
            {eigenPersoneel.map((row) => (
              <PersoneelRow
                key={row.id}
                row={row}
                employees={eigenEmployees}
                isReadOnly={isReadOnly}
                onUpdate={handleUpdatePersoneel}
                onDelete={handleDeletePersoneel}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Onderaannemers ──────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Onderaannemers
          </h2>
          {!isReadOnly && (
            <button
              onClick={() => handleAddPersoneel(true)}
              disabled={insertPersoneel.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Onderaannemer toevoegen
            </button>
          )}
        </div>

        {onderaannemers.length === 0 ? (
          <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
            Nog geen onderaannemers toegevoegd.
          </p>
        ) : (
          <div className="space-y-2">
            {onderaannemers.map((row) => (
              <PersoneelRow
                key={row.id}
                row={row}
                employees={subEmployees}
                isReadOnly={isReadOnly}
                onUpdate={handleUpdatePersoneel}
                onDelete={handleDeletePersoneel}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Materieel ───────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Materieel</h2>
          {!isReadOnly && (
            <button
              onClick={handleAddMaterieel}
              disabled={insertMaterieel.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Materieel toevoegen
            </button>
          )}
        </div>

        {allMaterieel.length === 0 ? (
          <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-400">
            Nog geen materieel toegevoegd.
          </p>
        ) : (
          <div className="space-y-2">
            {allMaterieel.map((row) => (
              <MaterieelRow
                key={row.id}
                row={row}
                equipmentList={activeEquipment}
                isReadOnly={isReadOnly}
                onUpdate={handleUpdateMaterieel}
                onDelete={handleDeleteMaterieel}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
