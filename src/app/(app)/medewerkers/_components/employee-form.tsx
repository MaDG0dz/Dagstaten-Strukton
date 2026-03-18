"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validations/employee";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Toggle } from "@/components/ui/toggle";

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      function: "",
      employer: "Strukton",
      is_subcontractor: false,
      hourly_rate: null,
      is_active: true,
      ...defaultValues,
    },
  });

  const isSubcontractor = watch("is_subcontractor");
  const isActive = watch("is_active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="Naam" error={errors.name?.message}>
        <FormInput
          {...register("name")}
          placeholder="Volledige naam"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Functie" error={errors.function?.message}>
        <FormInput
          {...register("function")}
          placeholder="Bijv. timmerman, lasser"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Werkgever" error={errors.employer?.message}>
        <FormInput
          {...register("employer")}
          placeholder="Strukton"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Onderaannemer">
        <div className="flex items-center gap-3 pt-1">
          <Toggle
            checked={isSubcontractor}
            onChange={(checked) => setValue("is_subcontractor", checked)}
            disabled={isLoading}
          />
          <span className="text-sm text-slate-600">
            {isSubcontractor ? "Ja" : "Nee"}
          </span>
        </div>
      </FormField>

      <FormField label="Uurtarief" error={errors.hourly_rate?.message}>
        <FormInput
          {...register("hourly_rate")}
          type="number"
          step="0.01"
          placeholder="0.00"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Actief">
        <div className="flex items-center gap-3 pt-1">
          <Toggle
            checked={isActive}
            onChange={(checked) => setValue("is_active", checked)}
            disabled={isLoading}
          />
          <span className="text-sm text-slate-600">
            {isActive ? "Actief" : "Inactief"}
          </span>
        </div>
      </FormField>

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
        >
          {isLoading ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </form>
  );
}
