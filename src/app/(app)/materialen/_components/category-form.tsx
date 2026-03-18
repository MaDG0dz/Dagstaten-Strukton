"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { materialCategorySchema, type MaterialCategoryFormValues } from "@/lib/validations/material";
import { FormField, FormInput } from "@/components/ui/form-field";
import { Toggle } from "@/components/ui/toggle";

interface CategoryFormProps {
  defaultValues?: Partial<MaterialCategoryFormValues>;
  onSubmit: (values: MaterialCategoryFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MaterialCategoryFormValues>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: {
      name: "",
      parent_id: null,
      sort_order: 0,
      is_active: true,
      ...defaultValues,
    },
  });

  const isActive = watch("is_active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <input type="hidden" {...register("parent_id")} />

      <FormField label="Naam" error={errors.name?.message}>
        <FormInput
          {...register("name")}
          placeholder="Categorienaam"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Sorteervolgorde" error={errors.sort_order?.message}>
        <FormInput
          {...register("sort_order")}
          type="number"
          placeholder="0"
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
