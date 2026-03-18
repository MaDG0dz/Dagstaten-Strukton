"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { equipmentSchema, type EquipmentFormValues } from "@/lib/validations/equipment";
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/form-field";
import { Toggle } from "@/components/ui/toggle";
import { UNIT_OPTIONS } from "@/lib/constants/units";

interface EquipmentFormProps {
  defaultValues?: Partial<EquipmentFormValues>;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function EquipmentForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: EquipmentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      code: null,
      name: "",
      description: null,
      default_unit: "dag",
      day_rate: null,
      is_active: true,
      ...defaultValues,
    },
  });

  const isActive = watch("is_active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="Code" error={errors.code?.message}>
        <FormInput
          {...register("code")}
          placeholder="Bijv. MAT-001"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Naam" error={errors.name?.message}>
        <FormInput
          {...register("name")}
          placeholder="Naam van het materieel"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Omschrijving" error={errors.description?.message}>
        <FormTextarea
          {...register("description")}
          placeholder="Optionele omschrijving"
          rows={3}
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Standaard eenheid" error={errors.default_unit?.message}>
        <FormSelect
          {...register("default_unit")}
          disabled={isLoading}
        >
          {UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FormSelect>
      </FormField>

      <FormField label="Dagtarief" error={errors.day_rate?.message}>
        <FormInput
          {...register("day_rate", { valueAsNumber: true })}
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
