import {
  LayoutDashboard,
  FolderKanban,
  FileBarChart,
  Users,
  Truck,
  Package,
  ClipboardList,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "./roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: AppRole[] | "all";
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: "all",
  },
  {
    label: "Projecten",
    href: "/projecten",
    icon: FolderKanban,
    roles: "all",
  },
  {
    label: "Overzicht & Offertes",
    href: "/overzicht",
    icon: FileBarChart,
    roles: ["beheerder", "sr_uitvoerder", "uitvoerder"],
  },
  {
    label: "Medewerkers",
    href: "/medewerkers",
    icon: Users,
    roles: ["beheerder", "sr_uitvoerder", "uitvoerder"],
  },
  {
    label: "Materieel",
    href: "/materieel",
    icon: Truck,
    roles: ["beheerder", "sr_uitvoerder", "uitvoerder"],
  },
  {
    label: "Materialen",
    href: "/materialen",
    icon: Package,
    roles: ["beheerder", "sr_uitvoerder", "uitvoerder"],
  },
  {
    label: "Activiteiten",
    href: "/activiteiten",
    icon: ClipboardList,
    roles: ["beheerder", "sr_uitvoerder", "uitvoerder"],
  },
  {
    label: "Gebruikers",
    href: "/gebruikers",
    icon: UserCog,
    roles: ["beheerder"],
  },
];
