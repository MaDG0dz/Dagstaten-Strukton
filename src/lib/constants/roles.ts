export const APP_ROLES = ["beheerder", "sr_uitvoerder", "uitvoerder", "voorman"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  beheerder: "Beheerder",
  sr_uitvoerder: "Manager",
  uitvoerder: "Uitvoerder",
  voorman: "Voorman",
};

export const MANAGER_ROLES: AppRole[] = ["beheerder", "sr_uitvoerder", "uitvoerder"];
export const ADMIN_ROLES: AppRole[] = ["beheerder", "sr_uitvoerder"];

export function isManager(role: AppRole): boolean {
  return MANAGER_ROLES.includes(role);
}

export function isAdmin(role: AppRole): boolean {
  return ADMIN_ROLES.includes(role);
}
