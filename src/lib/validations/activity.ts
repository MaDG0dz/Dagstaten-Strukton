import { z } from "zod";

const unitTypes = ["uur", "dag", "halve_dag", "stuks", "km", "m3", "ton", "liter"] as const;

export const activityCategorySchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  parent_id: z.string().uuid("Ongeldige categorie").nullable().optional(),
  sort_order: z.number().int("Moet een geheel getal zijn"),
  is_active: z.boolean(),
});

export const activitySchema = z.object({
  category_id: z.string().uuid("Selecteer een categorie"),
  code: z.string().nullable().optional(),
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().nullable().optional(),
  default_unit: z.enum(unitTypes, { message: "Selecteer een eenheid" }),
  is_active: z.boolean(),
});

export type ActivityCategoryFormValues = z.input<typeof activityCategorySchema>;
export type ActivityFormValues = z.input<typeof activitySchema>;
