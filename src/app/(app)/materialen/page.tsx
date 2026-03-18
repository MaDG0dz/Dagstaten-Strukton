"use client";

import { useState, useMemo } from "react";
import { Package, Plus, Pencil, Trash2, FolderTree, List } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { SlideOver } from "@/components/ui/slide-over";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryTree } from "@/components/ui/category-tree";
import { buildTree } from "@/lib/utils/build-tree";
import { useAuth } from "@/components/providers/auth-provider";
import { isManager } from "@/lib/constants/roles";
import { UNIT_LABELS } from "@/lib/constants/units";
import {
  useMaterialCategories,
  useMaterials,
  useCreateMaterialCategory,
  useUpdateMaterialCategory,
  useDeleteMaterialCategory,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
} from "@/lib/hooks/use-materials";
import type { MaterialCategory, Material } from "@/lib/types/database";
import type { MaterialCategoryFormValues, MaterialFormValues } from "@/lib/validations/material";
import { CategoryForm } from "./_components/category-form";
import { MaterialForm } from "./_components/material-form";

type FormState =
  | { type: "category"; mode: "add"; data?: Partial<MaterialCategoryFormValues> }
  | { type: "category"; mode: "edit"; data: MaterialCategory }
  | { type: "material"; mode: "add"; data?: Partial<MaterialFormValues> }
  | { type: "material"; mode: "edit"; data: Material }
  | null;

export default function MaterialenPage() {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<FormState>(null);
  const [deletingCategory, setDeletingCategory] = useState<MaterialCategory | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<Material | null>(null);
  const [showCategories, setShowCategories] = useState(true);

  const { data: categories = [], isLoading: categoriesLoading } = useMaterialCategories();
  const { data: materials = [], isLoading: materialsLoading } = useMaterials(
    selectedCategoryId || undefined
  );

  const createCategory = useCreateMaterialCategory();
  const updateCategory = useUpdateMaterialCategory();
  const deleteCategory = useDeleteMaterialCategory();
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const tree = useMemo(() => buildTree(categories), [categories]);

  const filteredMaterials = useMemo(() => {
    if (!search) return materials;
    const q = search.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.code && m.code.toLowerCase().includes(q))
    );
  }, [materials, search]);

  // Category handlers
  const handleAddCategory = (parentId: string | null) => {
    setFormState({
      type: "category",
      mode: "add",
      data: { parent_id: parentId },
    });
  };

  const handleEditCategory = (category: MaterialCategory) => {
    setFormState({ type: "category", mode: "edit", data: category });
  };

  const handleCategorySubmit = async (values: MaterialCategoryFormValues) => {
    if (formState?.type === "category" && formState.mode === "edit") {
      await updateCategory.mutateAsync({ id: formState.data.id, ...values });
    } else {
      await createCategory.mutateAsync(values);
    }
    setFormState(null);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    await deleteCategory.mutateAsync(deletingCategory.id);
    setDeletingCategory(null);
    if (selectedCategoryId === deletingCategory.id) {
      setSelectedCategoryId(null);
    }
  };

  // Material handlers
  const handleAddMaterial = () => {
    if (!selectedCategoryId) return;
    setFormState({
      type: "material",
      mode: "add",
      data: { category_id: selectedCategoryId },
    });
  };

  const handleEditMaterial = (material: Material) => {
    if (!canManage) return;
    setFormState({ type: "material", mode: "edit", data: material });
  };

  const handleMaterialSubmit = async (values: MaterialFormValues) => {
    if (formState?.type === "material" && formState.mode === "edit") {
      await updateMaterial.mutateAsync({ id: formState.data.id, ...values });
    } else {
      await createMaterial.mutateAsync(values);
    }
    setFormState(null);
  };

  const handleDeleteMaterial = async () => {
    if (!deletingMaterial) return;
    await deleteMaterial.mutateAsync(deletingMaterial.id);
    setDeletingMaterial(null);
  };

  const handleToggleActive = (material: Material) => {
    updateMaterial.mutate({ id: material.id, is_active: !material.is_active });
  };

  const handleClose = () => setFormState(null);

  const columns: Column<Material>[] = [
    {
      key: "code",
      header: "Code",
      hideOnMobile: true,
      render: (m) => m.code || "\u2014",
    },
    {
      key: "name",
      header: "Naam",
      render: (m) => <span className="font-medium">{m.name}</span>,
    },
    {
      key: "default_unit",
      header: "Eenheid",
      hideOnMobile: true,
      render: (m) => UNIT_LABELS[m.default_unit] || m.default_unit,
    },
    {
      key: "unit_price",
      header: "Prijs",
      hideOnMobile: true,
      render: (m) =>
        m.unit_price != null ? `\u20AC ${m.unit_price.toFixed(2)}` : "\u2014",
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <Toggle
          checked={m.is_active}
          onChange={() => handleToggleActive(m)}
          label={m.is_active ? "Actief" : "Inactief"}
          disabled={!canManage}
        />
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            className: "w-20",
            render: (m: Material) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditMaterial(m);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Bewerken"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingMaterial(m);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          } satisfies Column<Material>,
        ]
      : []),
  ];

  const slideOverTitle = formState
    ? formState.type === "category"
      ? formState.mode === "edit"
        ? "Categorie bewerken"
        : "Categorie toevoegen"
      : formState.mode === "edit"
        ? "Materiaal bewerken"
        : "Materiaal toevoegen"
    : "";

  return (
    <div>
      <PageHeader
        title="Materialen"
        actions={
          canManage && selectedCategoryId ? (
            <button
              onClick={handleAddMaterial}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Materiaal toevoegen
            </button>
          ) : undefined
        }
      />

      {/* Mobile toggle */}
      <div className="mb-4 flex gap-2 md:hidden">
        <button
          onClick={() => setShowCategories(true)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            showCategories
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Categorieën
        </button>
        <button
          onClick={() => setShowCategories(false)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
            !showCategories
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          <List className="h-4 w-4" />
          Materialen
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left panel: Category tree */}
        <div
          className={`w-full shrink-0 md:block md:w-72 ${
            showCategories ? "block" : "hidden"
          }`}
        >
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <CategoryTree
              nodes={tree}
              selectedId={selectedCategoryId}
              onSelect={(id) => {
                setSelectedCategoryId(id || null);
                setShowCategories(false);
              }}
              onAdd={canManage ? handleAddCategory : undefined}
              onEdit={canManage ? handleEditCategory : undefined}
              onDelete={canManage ? (cat) => setDeletingCategory(cat) : undefined}
            />
          </div>
        </div>

        {/* Right panel: Materials list */}
        <div
          className={`min-w-0 flex-1 ${!showCategories ? "block" : "hidden md:block"}`}
        >
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Zoek materiaal..."
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredMaterials}
            isLoading={categoriesLoading || materialsLoading}
            rowKey={(m) => m.id}
            onRowClick={canManage ? handleEditMaterial : undefined}
            emptyState={
              <EmptyState
                icon={Package}
                title="Geen materialen"
                description={
                  selectedCategoryId
                    ? "Voeg een materiaal toe aan deze categorie"
                    : "Selecteer een categorie om materialen te bekijken"
                }
              />
            }
          />
        </div>
      </div>

      {/* SlideOver for forms */}
      <SlideOver
        open={!!formState}
        onClose={handleClose}
        title={slideOverTitle}
      >
        {formState?.type === "category" && (
          <CategoryForm
            key={
              formState.mode === "edit" ? formState.data.id : "new-category"
            }
            defaultValues={
              formState.mode === "edit"
                ? {
                    name: formState.data.name,
                    parent_id: formState.data.parent_id,
                    sort_order: formState.data.sort_order,
                    is_active: formState.data.is_active,
                  }
                : formState.data
            }
            onSubmit={handleCategorySubmit}
            onCancel={handleClose}
            isLoading={
              createCategory.isPending || updateCategory.isPending
            }
          />
        )}
        {formState?.type === "material" && (
          <MaterialForm
            key={
              formState.mode === "edit" ? formState.data.id : "new-material"
            }
            defaultValues={
              formState.mode === "edit"
                ? {
                    category_id: formState.data.category_id,
                    code: formState.data.code,
                    name: formState.data.name,
                    default_unit: formState.data.default_unit,
                    unit_price: formState.data.unit_price,
                    is_active: formState.data.is_active,
                  }
                : formState.data
            }
            onSubmit={handleMaterialSubmit}
            onCancel={handleClose}
            isLoading={
              createMaterial.isPending || updateMaterial.isPending
            }
          />
        )}
      </SlideOver>

      {/* Delete category confirmation */}
      <ConfirmDialog
        open={!!deletingCategory}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
        title="Categorie verwijderen"
        description={`Weet je zeker dat je "${deletingCategory?.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteCategory.isPending}
      />

      {/* Delete material confirmation */}
      <ConfirmDialog
        open={!!deletingMaterial}
        onConfirm={handleDeleteMaterial}
        onCancel={() => setDeletingMaterial(null)}
        title="Materiaal verwijderen"
        description={`Weet je zeker dat je "${deletingMaterial?.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteMaterial.isPending}
      />
    </div>
  );
}
