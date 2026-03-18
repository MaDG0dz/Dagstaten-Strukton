"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, type ProjectFormValues } from "@/lib/validations/project";
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field";
import { Toggle } from "@/components/ui/toggle";

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function ProjectForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      code: "",
      name: "",
      description: null,
      client: null,
      location: null,
      start_date: null,
      end_date: null,
      is_active: true,
      ...defaultValues,
    },
  });

  const isActive = watch("is_active");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="Projectcode" error={errors.code?.message}>
        <FormInput
          {...register("code")}
          placeholder="PRJ-2026-001"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Naam" error={errors.name?.message}>
        <FormInput
          {...register("name")}
          placeholder="Projectnaam"
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

      <FormField label="Opdrachtgever" error={errors.client?.message}>
        <FormInput
          {...register("client")}
          placeholder="Naam opdrachtgever"
          disabled={isLoading}
        />
      </FormField>

      <FormField label="Locatie" error={errors.location?.message}>
        <FormInput
          {...register("location")}
          placeholder="Projectlocatie"
          disabled={isLoading}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Startdatum" error={errors.start_date?.message}>
          <FormInput
            {...register("start_date")}
            type="date"
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Einddatum" error={errors.end_date?.message}>
          <FormInput
            {...register("end_date")}
            type="date"
            disabled={isLoading}
          />
        </FormField>
      </div>

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
