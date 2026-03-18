"use client";

import { useState, useMemo } from "react";
import { Activity as ActivityIcon, Plus, Pencil, Trash2, FolderTree, List } from "lucide-react";
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
  useActivityCategories,
  useActivities,
  useCreateActivityCategory,
  useUpdateActivityCategory,
  useDeleteActivityCategory,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from "@/lib/hooks/use-activities";
import type { ActivityCategory, Activity } from "@/lib/types/database";
import type { ActivityCategoryFormValues, ActivityFormValues } from "@/lib/validations/activity";
import { CategoryForm } from "./_components/category-form";
import { ActivityForm } from "./_components/activity-form";

type FormState =
  | { type: "category"; mode: "add"; data?: Partial<ActivityCategoryFormValues> }
  | { type: "category"; mode: "edit"; data: ActivityCategory }
  | { type: "activity"; mode: "add"; data?: Partial<ActivityFormValues> }
  | { type: "activity"; mode: "edit"; data: Activity }
  | null;

export default function ActiviteitenPage() {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<FormState>(null);
  const [deletingCategory, setDeletingCategory] = useState<ActivityCategory | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [showCategories, setShowCategories] = useState(true);

  const { data: categories = [], isLoading: categoriesLoading } = useActivityCategories();
  const { data: activities = [], isLoading: activitiesLoading } = useActivities(
    selectedCategoryId || undefined
  );

  const createCategory = useCreateActivityCategory();
  const updateCategory = useUpdateActivityCategory();
  const deleteCategory = useDeleteActivityCategory();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();
  const deleteActivity = useDeleteActivity();

  const tree = useMemo(() => buildTree(categories), [categories]);

  const filteredActivities = useMemo(() => {
    if (!search) return activities;
    const q = search.toLowerCase();
    return activities.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q))
    );
  }, [activities, search]);

  // Category handlers
  const handleAddCategory = (parentId: string | null) => {
    setFormState({
      type: "category",
      mode: "add",
      data: { parent_id: parentId },
    });
  };

  const handleEditCategory = (category: ActivityCategory) => {
    setFormState({ type: "category", mode: "edit", data: category });
  };

  const handleCategorySubmit = async (values: ActivityCategoryFormValues) => {
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

  // Activity handlers
  const handleAddActivity = () => {
    if (!selectedCategoryId) return;
    setFormState({
      type: "activity",
      mode: "add",
      data: { category_id: selectedCategoryId },
    });
  };

  const handleEditActivity = (activity: Activity) => {
    if (!canManage) return;
    setFormState({ type: "activity", mode: "edit", data: activity });
  };

  const handleActivitySubmit = async (values: ActivityFormValues) => {
    if (formState?.type === "activity" && formState.mode === "edit") {
      await updateActivity.mutateAsync({ id: formState.data.id, ...values });
    } else {
      await createActivity.mutateAsync(values);
    }
    setFormState(null);
  };

  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;
    await deleteActivity.mutateAsync(deletingActivity.id);
    setDeletingActivity(null);
  };

  const handleToggleActive = (activity: Activity) => {
    updateActivity.mutate({ id: activity.id, is_active: !activity.is_active });
  };

  const handleClose = () => setFormState(null);

  const columns: Column<Activity>[] = [
    {
      key: "code",
      header: "Code",
      hideOnMobile: true,
      render: (a) => a.code || "\u2014",
    },
    {
      key: "name",
      header: "Naam",
      render: (a) => <span className="font-medium">{a.name}</span>,
    },
    {
      key: "description",
      header: "Omschrijving",
      hideOnMobile: true,
      render: (a) => (
        <span className="max-w-xs truncate">{a.description || "\u2014"}</span>
      ),
    },
    {
      key: "default_unit",
      header: "Eenheid",
      hideOnMobile: true,
      render: (a) => UNIT_LABELS[a.default_unit] || a.default_unit,
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <Toggle
          checked={a.is_active}
          onChange={() => handleToggleActive(a)}
          label={a.is_active ? "Actief" : "Inactief"}
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
            render: (a: Activity) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditActivity(a);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Bewerken"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingActivity(a);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          } satisfies Column<Activity>,
        ]
      : []),
  ];

  const slideOverTitle = formState
    ? formState.type === "category"
      ? formState.mode === "edit"
        ? "Categorie bewerken"
        : "Categorie toevoegen"
      : formState.mode === "edit"
        ? "Activiteit bewerken"
        : "Activiteit toevoegen"
    : "";

  return (
    <div>
      <PageHeader
        title="Activiteiten"
        actions={
          canManage && selectedCategoryId ? (
            <button
              onClick={handleAddActivity}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Activiteit toevoegen
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
          Activiteiten
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

        {/* Right panel: Activities list */}
        <div
          className={`min-w-0 flex-1 ${!showCategories ? "block" : "hidden md:block"}`}
        >
          <div className="mb-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Zoek activiteit..."
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredActivities}
            isLoading={categoriesLoading || activitiesLoading}
            rowKey={(a) => a.id}
            onRowClick={canManage ? handleEditActivity : undefined}
            emptyState={
              <EmptyState
                icon={ActivityIcon}
                title="Geen activiteiten"
                description={
                  selectedCategoryId
                    ? "Voeg een activiteit toe aan deze categorie"
                    : "Selecteer een categorie om activiteiten te bekijken"
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
        {formState?.type === "activity" && (
          <ActivityForm
            key={
              formState.mode === "edit" ? formState.data.id : "new-activity"
            }
            defaultValues={
              formState.mode === "edit"
                ? {
                    category_id: formState.data.category_id,
                    code: formState.data.code,
                    name: formState.data.name,
                    description: formState.data.description,
                    default_unit: formState.data.default_unit,
                    is_active: formState.data.is_active,
                  }
                : formState.data
            }
            onSubmit={handleActivitySubmit}
            onCancel={handleClose}
            isLoading={
              createActivity.isPending || updateActivity.isPending
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

      {/* Delete activity confirmation */}
      <ConfirmDialog
        open={!!deletingActivity}
        onConfirm={handleDeleteActivity}
        onCancel={() => setDeletingActivity(null)}
        title="Activiteit verwijderen"
        description={`Weet je zeker dat je "${deletingActivity?.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteActivity.isPending}
      />
    </div>
  );
}
