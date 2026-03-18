"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { TreeNode } from "@/lib/utils/build-tree";

interface CategoryTreeProps<T extends { id: string; name: string; is_active: boolean }> {
  nodes: TreeNode<T>[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: (parentId: string | null) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

function TreeNodeItem<T extends { id: string; name: string; is_active: boolean }>({
  node,
  level,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: {
  node: TreeNode<T>;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd?: (parentId: string | null) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.item.id;

  return (
    <div>
      <div
        className={cn(
          "group relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors duration-150",
          isSelected ? "bg-[#e43122]/10 text-[#e43122] font-medium" : "text-slate-700 hover:bg-slate-100",
          !node.item.is_active && "opacity-50"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
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
            <span className="ml-1 text-xs text-slate-400">({node.children.length})</span>
          )}
        </button>

        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100">
          {onAdd && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(node.item.id); }}
              className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-600"
              title="Subcategorie toevoegen"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(node.item); }}
              className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-200 hover:text-slate-600"
              title="Bewerken"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(node.item); }}
              className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-red-100 hover:text-red-600"
              title="Verwijderen"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.item.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryTree<T extends { id: string; name: string; is_active: boolean }>({
  nodes,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: CategoryTreeProps<T>) {
  return (
    <div className="space-y-0.5">
      {/* All items button */}
      <button
        onClick={() => onSelect("")}
        className={cn(
          "w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors duration-150",
          !selectedId ? "bg-[#e43122]/10 text-[#e43122] font-medium" : "text-slate-700 hover:bg-slate-100"
        )}
      >
        Alle items
      </button>

      {nodes.map((node) => (
        <TreeNodeItem
          key={node.item.id}
          node={node}
          level={0}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

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
