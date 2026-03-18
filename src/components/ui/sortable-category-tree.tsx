"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TreeNode } from "@/lib/utils/build-tree";

interface SortableCategoryTreeProps<
  T extends { id: string; name: string; is_active: boolean; parent_id: string | null; sort_order: number }
> {
  nodes: TreeNode<T>[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: (parentId: string | null) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onReorder?: (updates: { id: string; sort_order: number }[]) => void;
}

function SortableTreeNodeItem<
  T extends { id: string; name: string; is_active: boolean; parent_id: string | null; sort_order: number }
>({
  node,
  level,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
  siblingNodes,
}: {
  node: TreeNode<T>;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: (parentId: string | null) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onReorder?: (updates: { id: string; sort_order: number }[]) => void;
  siblingNodes?: TreeNode<T>[];
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.item.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150",
          isSelected
            ? "bg-[#e43122]/10 text-[#e43122] font-medium"
            : "text-slate-700 hover:bg-slate-100",
          !node.item.is_active && "opacity-50",
          isDragging && "bg-white shadow-lg ring-1 ring-slate-200 rounded-lg"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Drag handle */}
        {onReorder && (
          <button
            className="shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Indentation line */}
        {level > 0 && (
          <span
            className="absolute left-0 top-0 h-full border-l border-slate-200"
            style={{ left: `${(level - 1) * 16 + 16}px` }}
          />
        )}

        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={cn("shrink-0 p-0.5", !hasChildren && "invisible")}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <button
          onClick={() => onSelect(node.item.id)}
          className="flex-1 truncate text-left"
        >
          {node.item.name}
          {hasChildren && (
            <span className="ml-1 text-xs text-slate-400">
              ({node.children.length})
            </span>
          )}
        </button>

        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
          {onAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(node.item.id);
              }}
              className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-600"
              title="Subcategorie toevoegen"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node.item);
              }}
              className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-600"
              title="Bewerken"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.item);
              }}
              className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
              title="Verwijderen"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <SortableGroup
          nodes={node.children}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      )}
    </div>
  );
}

function SortableGroup<
  T extends { id: string; name: string; is_active: boolean; parent_id: string | null; sort_order: number }
>({
  nodes,
  level,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  nodes: TreeNode<T>[];
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: (parentId: string | null) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onReorder?: (updates: { id: string; sort_order: number }[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const sortableIds = useMemo(
    () => nodes.map((n) => n.item.id),
    [nodes]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      const oldIndex = nodes.findIndex((n) => n.item.id === active.id);
      const newIndex = nodes.findIndex((n) => n.item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(nodes, oldIndex, newIndex);
      const updates = reordered.map((n, index) => ({
        id: n.item.id,
        sort_order: index,
      }));
      onReorder(updates);
    },
    [nodes, onReorder]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div>
          {nodes.map((node) => (
            <SortableTreeNodeItem
              key={node.item.id}
              node={node}
              level={level}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onReorder={onReorder}
              siblingNodes={nodes}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function SortableCategoryTree<
  T extends { id: string; name: string; is_active: boolean; parent_id: string | null; sort_order: number }
>({
  nodes,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: SortableCategoryTreeProps<T>) {
  return (
    <div className="space-y-0.5">
      {/* All items button */}
      <button
        onClick={() => onSelect("")}
        className={cn(
          "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors duration-150",
          !selectedId
            ? "bg-[#e43122]/10 text-[#e43122] font-medium"
            : "text-slate-700 hover:bg-slate-100"
        )}
      >
        Alle items
      </button>

      <SortableGroup
        nodes={nodes}
        level={0}
        selectedId={selectedId}
        onSelect={onSelect}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={onReorder}
      />

      {onAdd && (
        <button
          onClick={() => onAdd(null)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Categorie toevoegen
        </button>
      )}
    </div>
  );
}
