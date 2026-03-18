import { z } from "zod";

const unitTypes = ["uur", "dag", "halve_dag", "stuks", "km", "m3", "ton", "liter"] as const;

export const equipmentSchema = z.object({
  code: z.string().nullable().optional(),
  name: z.string().min(2, "Naam is verplicht (min. 2 tekens)"),
  description: z.string().nullable().optional(),
  default_unit: z.enum(unitTypes, { message: "Selecteer een eenheid" }),
  day_rate: z.number().positive("Moet positief zijn").nullable().optional(),
  is_active: z.boolean(),
});

export type EquipmentFormValues = z.infer<typeof equipmentSchema>;
