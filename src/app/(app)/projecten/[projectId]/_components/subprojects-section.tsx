"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useSubprojects,
  useCreateSubproject,
  useUpdateSubproject,
  useDeleteSubproject,
} from "@/lib/hooks/use-projects";
import { subprojectSchema, type SubprojectFormValues } from "@/lib/validations/project";
import { isManager } from "@/lib/constants/roles";
import type { Subproject } from "@/lib/types/database";

interface SubprojectsSectionProps {
  projectId: string;
}

export function SubprojectsSection({ projectId }: SubprojectsSectionProps) {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const { data: subprojects = [], isLoading } = useSubprojects(projectId);
  const createSubproject = useCreateSubproject();
  const updateSubproject = useUpdateSubproject();
  const deleteSubproject = useDeleteSubproject();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Subproject | null>(null);
  const [deletingItem, setDeletingItem] = useState<Subproject | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubprojectFormValues>({
    resolver: zodResolver(subprojectSchema),
    defaultValues: {
      project_id: projectId,
      code: "",
      name: "",
      description: null,
      is_active: true,
    },
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    reset({
      project_id: projectId,
      code: "",
      name: "",
      description: null,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subproject: Subproject) => {
    setEditingItem(subproject);
    reset({
      project_id: projectId,
      code: subproject.code,
      name: subproject.name,
      description: subproject.description,
      is_active: subproject.is_active,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const onSubmit = async (values: SubprojectFormValues) => {
    if (editingItem) {
      await updateSubproject.mutateAsync({ id: editingItem.id, ...values });
    } else {
      await createSubproject.mutateAsync(values);
    }
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteSubproject.mutateAsync(deletingItem.id);
    setDeletingItem(null);
  };

  const isSaving = createSubproject.isPending || updateSubproject.isPending;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Deelprojecten</h2>
        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Deelproject toevoegen
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-gray-50"
            />
          ))}
        </div>
      ) : subprojects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Geen deelprojecten"
          description="Voeg deelprojecten toe aan dit project"
        />
      ) : (
        <div className="space-y-2">
          {subprojects.map((sp) => (
            <div
              key={sp.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">
                    {sp.code}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {sp.name}
                  </span>
                  <Badge variant={sp.is_active ? "active" : "inactive"}>
                    {sp.is_active ? "Actief" : "Inactief"}
                  </Badge>
                </div>
                {sp.description && (
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {sp.description}
                  </p>
                )}
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sp)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Bewerken"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingItem(sp)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Verwijderen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Deelproject bewerken" : "Deelproject toevoegen"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("project_id")} />

          <FormField label="Code" error={errors.code?.message}>
            <FormInput
              {...register("code")}
              placeholder="Bijv. SP-001"
              disabled={isSaving}
            />
          </FormField>

          <FormField label="Naam" error={errors.name?.message}>
            <FormInput
              {...register("name")}
              placeholder="Naam deelproject"
              disabled={isSaving}
            />
          </FormField>

          <FormField label="Omschrijving" error={errors.description?.message}>
            <FormTextarea
              {...register("description")}
              placeholder="Optionele omschrijving"
              rows={3}
              disabled={isSaving}
            />
          </FormField>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingItem}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        title="Deelproject verwijderen"
        description={`Weet je zeker dat je "${deletingItem?.name ?? ""}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteSubproject.isPending}
      />
    </section>
  );
}
