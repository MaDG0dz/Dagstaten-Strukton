"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { materialSchema, type MaterialFormValues } from "@/lib/validations/material";
import { FormField, FormInput, FormSelect } from "@/components/ui/form-field";
import { Toggle } from "@/components/ui/toggle";
import { UNIT_OPTIONS } from "@/lib/constants/units";

interface MaterialFormProps {
  defaultValues?: Partial<MaterialFormValues>;
  onSubmit: (values: MaterialFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function MaterialForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: MaterialFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      category_id: "",
      code: null,
      name: "",
      default_unit: "stuks",
      unit_price: null,
      is_active: true,
      ...defaultValues,
    },
  });

  const isActive = watch("is_active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("category_id")} />

      <FormField label="Code" error={errors.code?.message}>
        <FormInput
          {...register("code")}
          placeholder="Optionele code"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Naam" error={errors.name?.message}>
        <FormInput
          {...register("name")}
          placeholder="Materiaalnaam"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Eenheid" error={errors.default_unit?.message}>
        <FormSelect {...register("default_unit")} disabled={isLoading}>
          <option value="">Selecteer eenheid</option>
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FormSelect>
      </FormField>

      <FormField label="Prijs per eenheid" error={errors.unit_price?.message}>
        <FormInput
          {...register("unit_price")}
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
          <span className="text-sm text-gray-600">
            {isActive ? "Actief" : "Inactief"}
          </span>
        </div>
      </FormField>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? "Opslaan..." : "Opslaan"}
        </button>
      </div>
    </form>
  );
}
