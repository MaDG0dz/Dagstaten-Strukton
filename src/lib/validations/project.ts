import { z } from "zod";

const appRoles = ["beheerder", "sr_uitvoerder", "uitvoerder", "voorman"] as const;

export const projectSchema = z.object({
  code: z.string().min(1, "Projectcode is verplicht"),
  name: z.string().min(2, "Projectnaam is verplicht (min. 2 tekens)"),
  description: z.string().nullable().optional(),
  client: z.string().nullable().optional(),
  contact_client: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_active: z.boolean(),
});

export const subprojectSchema = z.object({
  project_id: z.string().uuid("Ongeldig project"),
  code: z.string().min(1, "Code is verplicht"),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
});

export const projectMemberSchema = z.object({
  project_id: z.string().uuid("Ongeldig project"),
  profile_id: z.string().uuid("Selecteer een gebruiker"),
  role: z.enum(appRoles, { message: "Selecteer een rol" }),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type SubprojectFormValues = z.infer<typeof subprojectSchema>;
export type ProjectMemberFormValues = z.infer<typeof projectMemberSchema>;
