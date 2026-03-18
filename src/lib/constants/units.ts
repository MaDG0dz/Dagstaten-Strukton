import type { UnitType } from "@/lib/types/database";

export const UNIT_LABELS: Record<UnitType, string> = {
  uur: "Uur",
  dag: "Dag",
  halve_dag: "Halve dag",
  stuks: "Stuks",
  km: "Km",
  m3: "m³",
  ton: "Ton",
  liter: "Liter",
};

export const UNIT_OPTIONS = Object.entries(UNIT_LABELS).map(([value, label]) => ({
  value: value as UnitType,
  label,
}));
