"use client";

import { useState } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { SlideOver } from "@/components/ui/slide-over";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "@/lib/hooks/use-employees";
import type { Employee } from "@/lib/types/database";
import { isManager } from "@/lib/constants/roles";
import { EmployeeForm } from "./_components/employee-form";
import type { EmployeeFormValues } from "@/lib/validations/employee";

export default function MedewerkersPage() {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<Employee | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Employee | null>(null);

  const { data: employees = [], isLoading } = useEmployees(search);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const handleAdd = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    if (!canManage) return;
    setEditingItem(employee);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values: EmployeeFormValues) => {
    if (editingItem) {
      await updateEmployee.mutateAsync({ id: editingItem.id, ...values });
    } else {
      await createEmployee.mutateAsync(values);
    }
    handleClose();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteEmployee.mutateAsync(deletingItem.id);
    setDeletingItem(null);
  };

  const handleToggleActive = (employee: Employee) => {
    updateEmployee.mutate({ id: employee.id, is_active: !employee.is_active });
  };

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Naam",
      render: (emp) => <span className="font-medium">{emp.name}</span>,
    },
    {
      key: "function",
      header: "Functie",
      hideOnMobile: true,
      render: (emp) => emp.function || "\u2014",
    },
    {
      key: "employer",
      header: "Werkgever",
      hideOnMobile: true,
      render: (emp) => emp.employer,
    },
    {
      key: "type",
      header: "Type",
      render: (emp) =>
        emp.is_subcontractor ? (
          <Badge variant="submitted">Onderaannemer</Badge>
        ) : (
          <Badge variant="active">Eigen</Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (emp) => (
        <Toggle
          checked={emp.is_active}
          onChange={() => handleToggleActive(emp)}
          label={emp.is_active ? "Actief" : "Inactief"}
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
            render: (emp: Employee) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(emp);
                  }}
                  className="rounded-lg p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Bewerken"
                  aria-label="Bewerken"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingItem(emp);
                  }}
                  className="rounded-lg p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Verwijderen"
                  aria-label="Verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          } satisfies Column<Employee>,
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Medewerkers"
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
          placeholder="Zoek medewerker..."
        />
      </div>

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        rowKey={(emp) => emp.id}
        onRowClick={canManage ? handleEdit : undefined}
        emptyState={
          <EmptyState
            icon={Users}
            title="Geen medewerkers"
            description="Voeg een medewerker toe om te beginnen"
          />
        }
      />

      <SlideOver
        open={isFormOpen}
        onClose={handleClose}
        title={editingItem ? "Medewerker bewerken" : "Medewerker toevoegen"}
      >
        <EmployeeForm
          key={editingItem?.id ?? "new"}
          defaultValues={
            editingItem
              ? {
                  name: editingItem.name,
                  function: editingItem.function,
                  employer: editingItem.employer,
                  is_subcontractor: editingItem.is_subcontractor,
                  hourly_rate: editingItem.hourly_rate,
                  is_active: editingItem.is_active,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={createEmployee.isPending || updateEmployee.isPending}
        />
      </SlideOver>

      <ConfirmDialog
        open={!!deletingItem}
        onConfirm={handleDelete}
        onCancel={() => setDeletingItem(null)}
        title="Medewerker verwijderen"
        description={`Weet je zeker dat je "${deletingItem?.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={deleteEmployee.isPending}
      />
    </div>
  );
}
