import { z } from "zod";

const unitTypes = ["uur", "dag", "halve_dag", "stuks", "km", "m3", "ton", "liter"] as const;

export const materialCategorySchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  parent_id: z.string().uuid("Ongeldige categorie").nullable().optional(),
  sort_order: z.number().int("Moet een geheel getal zijn"),
  is_active: z.boolean(),
});

export const materialSchema = z.object({
  category_id: z.string().uuid("Selecteer een categorie"),
  code: z.string().nullable().optional(),
  name: z.string().min(1, "Naam is verplicht"),
  default_unit: z.enum(unitTypes, { message: "Selecteer een eenheid" }),
  unit_price: z.number().positive("Moet positief zijn").nullable().optional(),
  is_active: z.boolean(),
});

export type MaterialCategoryFormValues = z.input<typeof materialCategorySchema>;
export type MaterialFormValues = z.input<typeof materialSchema>;
