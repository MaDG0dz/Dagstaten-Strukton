"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/constants/roles";
import { Shield } from "lucide-react";

export function RoleSwitcher() {
  const { profile, overrideRole, setOverrideRole, effectiveRole } = useAuth();

  const showTestModus =
    process.env.NEXT_PUBLIC_TESTMODUS === "true" ||
    profile?.role === "beheerder";

  if (!showTestModus) return null;

  return (
    <div className="border-t border-white/10 px-4 py-2.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
        <Shield className="h-3 w-3" />
        Testmodus
      </div>
      <select
        value={overrideRole ?? ""}
        onChange={(e) =>
          setOverrideRole(
            e.target.value ? (e.target.value as AppRole) : null
          )
        }
        className="w-full rounded-md bg-white/10 px-2 py-1.5 text-xs text-purple-100 border border-white/15 transition-colors duration-150 ease-out focus:border-yellow-400 focus:outline-none"
      >
        <option value="">
          Origineel ({ROLE_LABELS[profile?.role ?? "voorman"]})
        </option>
        {APP_ROLES.map((role) => (
          <option key={role} value={role}>
            {ROLE_LABELS[role]}
            {role === effectiveRole && !overrideRole ? " (huidig)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
