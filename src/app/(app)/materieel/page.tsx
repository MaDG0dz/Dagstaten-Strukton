"use client";

import { useState } from "react";
import { Truck, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Toggle } from "@/components/ui/toggle";
import { SlideOver } from "@/components/ui/slide-over";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useEquipment,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
} from "@/lib/hooks/use-equipment";
import type { Equipment } from "@/lib/types/database";
import { isManager } from "@/lib/constants/roles";
import { UNIT_LABELS } from "@/lib/constants/units";
import { EquipmentForm } from "./_components/equipment-form";
import type { EquipmentFormValues } from "@/lib/validations/equipment";

export default function MateriaalPage() {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Equipment | null>(null);

  const { data: equipment = [], isLoading } = useEquipment(search);
  const createEquipment = useCreateEquipment();
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: Equipment) => {
    if (!canManage) return;
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values: EquipmentFormValues) => {
    if (editingItem) {
      await updateEquipment.mutateAsync({ id: editingItem.id, ...values });
    } else {
      await createEquipment.mutateAsync(values);
    }
    handleClose();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteEquipment.mutateAsync(deletingItem.id);
    setDeletingItem(null);
  };

  const handleToggleActive = (item: Equipment) => {
    updateEquipment.mutate({ id: item.id, is_active: !item.is_active });
  };

  const columns: Column<Equipment>[] = [
    {
      key: "code",
      header: "Code",
      hideOnMobile: true,
      render: (item) => item.code || "\u2014",
    },
    {
      key: "name",
      header: "Naam",
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "default_unit",
      header: "Eenheid",
      hideOnMobile: true,
      render: (item) => UNIT_LABELS[item.default_unit],
    },
    {
      key: "day_rate",
      header: "Dagtarief",
      hideOnMobile: true,
      render: (item) =>
        item.day_rate != null
          ? `\u20AC ${item.day_rate.toFixed(2)}`
          : "\u2014",
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Toggle
          checked={item.is_active}
          onChange={() => handleToggleActive(item)}
          label={item.is_active ? "Actief" : "Inactief"}
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
            render: (item: Equipment) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(item);
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Bewerken"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingItem(item);
                  }}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          } satisfies Column<Equipment>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Materieel"
        actions={
          canManage ? (
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150"
            >
              <Plus className="h-4 w-4" />
              Toevoegen
            </button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Zoek materieel..."
        />
      </div>

      <DataTable
        columns={columns}
        data={equipment}
        isLoading={isLoading}
        rowKey={(item) => item.id}
        onRowClick={canManage ? handleEdit : undefined}
        emptyState={
          <EmptyState
            icon={Truck}
            title="Geen materieel"
            description="Voeg materieel toe om te beginnen"
          />
        }
      />

      <SlideOver
        open={isFormOpen}
        onClose={handleClose}
        title={editingItem ? "Materieel bewerken" : "Materieel toevoegen"}
      >
        <EquipmentForm
          key={editingItem?.id ?? "new"}
          defaultValues={
            editingItem
              ? {
                  code: editingItem.code,
                  name: editingItem.name,
                  description: editingItem.description,
                  default_unit: editingItem.default_unit,
                  day_rate: editingItem.day_rate,
                  is_active: editingItem.is_active,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={createEquipment.isPending || updateEquipment.isPending}
        />
      </SlideOver>

      <ConfirmDialog
        open={!!deletingItem}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        title="Materieel verwijderen"
        description={`Weet je zeker dat je "${deletingItem?.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteEquipment.isPending}
      />
    </div>
  );
}
