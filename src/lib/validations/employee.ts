import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(2, "Naam is verplicht (min. 2 tekens)"),
  function: z.string().nullable().optional(),
  employer: z.string(),
  is_subcontractor: z.boolean(),
  hourly_rate: z.number().positive("Moet positief zijn").nullable().optional(),
  is_active: z.boolean(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
