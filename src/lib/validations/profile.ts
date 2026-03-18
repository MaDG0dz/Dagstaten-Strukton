import { z } from "zod";

const appRoles = ["beheerder", "sr_uitvoerder", "uitvoerder", "voorman"] as const;

export const profileUpdateSchema = z.object({
  role: z.enum(appRoles, { message: "Selecteer een rol" }),
  is_active: z.boolean(),
});

export type ProfileUpdateFormValues = z.input<typeof profileUpdateSchema>;
