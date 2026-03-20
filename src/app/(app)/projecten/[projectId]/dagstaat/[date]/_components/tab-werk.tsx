"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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

/* ── Deelproject color palette ─────────────────────────────────── */

const DEELPROJECT_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  { bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
  { bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
  { bg: "bg-rose-50", border: "border-rose-200", dot: "bg-rose-500", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  { bg: "bg-cyan-50", border: "border-cyan-200", dot: "bg-cyan-500", text: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700" },
  { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-500", text: "text-orange-700", badge: "bg-orange-100 text-orange-700" },
  { bg: "bg-indigo-50", border: "border-indigo-200", dot: "bg-indigo-500", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
];

const HOOFD_COLOR = { bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-500", text: "text-slate-700", badge: "bg-slate-100 text-slate-700" };

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
      <span className={`h-2 w-2 rounded-full ${isAdded ? "bg-[#e43122]" : "bg-slate-300"}`} />
      {activity.name}
    </button>
  );
}

/* ── Compact Werk Row ──────────────────────────────────────────── */

function WerkRow({
  row,
  activities,
  isReadOnly,
  onUpdate,
  onDelete,
}: {
  row: DagstaatWerk;
  activities: { id: string; name: string; code: string | null; default_unit: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
}) {
  const [quantity, setQuantity] = useState(String(row.quantity));
  const [description, setDescription] = useState(row.description ?? "");
  const [showDesc, setShowDesc] = useState(!!row.description);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const saveField = useCallback(
    (field: string, value: unknown) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onUpdate(row.id, field, value), 500);
    },
    [onUpdate, row.id]
  );

  const activityName = activities.find((a) => a.id === row.activity_id)?.name ?? "Activiteit";

  return (
    <div className="flex items-start gap-2 rounded-lg bg-white px-3 py-2.5 border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex-1 min-w-0 space-y-2">
        {/* Activity name + quantity inline */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 truncate">{activityName}</span>
          {!showDesc && !isReadOnly && (
            <button
              onClick={() => setShowDesc(true)}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              + notitie
            </button>
          )}
        </div>

        {/* Quantity + Unit row */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.5"
            min="0"
            className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-sm text-center focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
            value={quantity}
            disabled={isReadOnly}
            onChange={(e) => setQuantity(e.target.value)}
            onBlur={() => {
              const val = parseFloat(quantity) || 0;
              setQuantity(String(val));
              saveField("quantity", val);
            }}
          />
          <select
            className="h-8 rounded-lg border border-slate-200 px-2 text-sm focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
            value={row.unit}
            disabled={isReadOnly}
            onChange={(e) => onUpdate(row.id, "unit", e.target.value)}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>

        {/* Description (optional, togglable) */}
        {showDesc && (
          <textarea
            rows={1}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20 disabled:bg-slate-50"
            placeholder="Toelichting..."
            value={description}
            disabled={isReadOnly}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => saveField("description", description || null)}
          />
        )}
      </div>

      {/* Delete */}
      {!isReadOnly && (
        <button
          onClick={() => onDelete(row.id)}
          className="mt-1 shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="Verwijderen"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/* ── Deelproject Section ───────────────────────────────────────── */

function DeelprojectSection({
  title,
  subprojectId,
  color,
  rows,
  activities,
  isReadOnly,
  onUpdate,
  onDelete,
  onAddActivity,
  insertPending,
}: {
  title: string;
  subprojectId: string | null;
  color: typeof HOOFD_COLOR;
  rows: DagstaatWerk[];
  activities: { id: string; name: string; code: string | null; default_unit: string }[];
  isReadOnly: boolean;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onDelete: (id: string) => void;
  onAddActivity: (subprojectId: string | null, activityId?: string) => void;
  insertPending: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`rounded-xl border ${color.border} ${color.bg} overflow-hidden`}>
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${color.dot}`} />
          <span className={`text-sm font-semibold ${color.text}`}>{title}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${color.badge}`}>
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddActivity(subprojectId); }}
              disabled={insertPending || activities.length === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white/60 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {rows.length === 0 ? (
            <div className="rounded-lg bg-white/60 px-3 py-4 text-center">
              <p className="text-xs text-slate-400">Geen activiteiten</p>
              {!isReadOnly && (
                <button
                  onClick={() => onAddActivity(subprojectId)}
                  disabled={insertPending || activities.length === 0}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Activiteit toevoegen
                </button>
              )}
            </div>
          ) : (
            rows.map((row) => (
              <WerkRow
                key={row.id}
                row={row}
                activities={activities}
                isReadOnly={isReadOnly}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline Deelproject Creator ──────────────────────────────────── */

function InlineDeelprojectCreator({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const createSubproject = useCreateSubproject();

  const handleCreate = async () => {
    if (!code.trim()) return;
    await createSubproject.mutateAsync({
      project_id: projectId,
      code: code.trim(),
      name: name.trim() || code.trim(),
      is_active: true,
    } as Parameters<typeof createSubproject.mutateAsync>[0]);
    setCode("");
    setName("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 hover:bg-white"
      >
        <FolderPlus className="h-4 w-4" />
        Deelproject aanmaken
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">Nieuw deelproject</p>
      <div className="flex gap-2">
        <input
          type="text"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
          placeholder="Code (bv. K198)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <input
          type="text"
          className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-2 focus:ring-[#e43122]/20"
          placeholder="Naam (optioneel)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!code.trim() || createSubproject.isPending}
          className="h-9 rounded-lg bg-[#e43122] px-4 text-xs font-medium text-white hover:bg-[#c42a1d] disabled:opacity-50 transition-colors"
        >
          {createSubproject.isPending ? "..." : "Aanmaken"}
        </button>
        <button
          onClick={() => { setOpen(false); setCode(""); setName(""); }}
          className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
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

  // Filter to project-linked or all active
  const linkedIds = new Set(projectActivities.map((pa: { activity_id: string }) => pa.activity_id));
  const activeActivities = projectActivities.length > 0
    ? activities.filter((a) => a.is_active && linkedIds.has(a.id))
    : activities.filter((a) => a.is_active);

  const addedActivityIds = new Set(werkRows.map((r) => r.activity_id));

  // Group werk rows by subproject
  const grouped = useMemo(() => {
    const hoofdRows = werkRows.filter((r) => !r.subproject_id);
    const deelGroups = subprojects
      .filter((sp) => sp.is_active)
      .map((sp, i) => ({
        subproject: sp,
        color: DEELPROJECT_COLORS[i % DEELPROJECT_COLORS.length],
        rows: werkRows.filter((r) => r.subproject_id === sp.id),
      }));
    return { hoofdRows, deelGroups };
  }, [werkRows, subprojects]);

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

  const handleAddToSection = (subprojectId: string | null, activityId?: string) => {
    const nextSort = werkRows.length > 0
      ? Math.max(...werkRows.map((r) => r.sort_order)) + 1
      : 0;
    const act = activityId
      ? activeActivities.find((a) => a.id === activityId)
      : activeActivities[0];

    insertWerk.mutate({
      dagstaat_id: dagstaatId,
      activity_id: act?.id ?? "",
      subproject_id: subprojectId,
      unit: act?.default_unit ?? "uur",
      quantity: 0,
      sort_order: nextSort,
    } as Parameters<typeof insertWerk.mutate>[0]);
  };

  const handlePillTap = (activityId: string) => {
    if (isReadOnly || addedActivityIds.has(activityId)) return;
    handleAddToSection(null, activityId); // Add to hoofdproject by default
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Activity pills — tap to quick-add to hoofdproject */}
      {activeActivities.length > 0 && !isReadOnly && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Tik om toe te voegen aan hoofdproject
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

      {/* Hoofdproject section */}
      <DeelprojectSection
        title="Hoofdproject"
        subprojectId={null}
        color={HOOFD_COLOR}
        rows={grouped.hoofdRows}
        activities={activeActivities}
        isReadOnly={isReadOnly}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onAddActivity={handleAddToSection}
        insertPending={insertWerk.isPending}
      />

      {/* Deelproject sections */}
      {grouped.deelGroups.map(({ subproject, color, rows }) => (
        <DeelprojectSection
          key={subproject.id}
          title={subproject.code + (subproject.name !== subproject.code ? ` — ${subproject.name}` : "")}
          subprojectId={subproject.id}
          color={color}
          rows={rows}
          activities={activeActivities}
          isReadOnly={isReadOnly}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAddActivity={handleAddToSection}
          insertPending={insertWerk.isPending}
        />
      ))}

      {/* Empty state when no sections have any rows */}
      {werkRows.length === 0 && subprojects.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 py-10">
          <HardHat className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">Nog geen werkzaamheden</p>
          <p className="mt-1 text-xs text-slate-400">
            Voeg activiteiten toe aan het hoofdproject of maak een deelproject aan
          </p>
        </div>
      )}

      {/* Inline deelproject creator */}
      {!isReadOnly && (
        <InlineDeelprojectCreator projectId={projectId} />
      )}
    </section>
  );
}
