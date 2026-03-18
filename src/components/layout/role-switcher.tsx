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
    <div className="border-t border-gray-700 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-yellow-400">
        <Shield className="h-3.5 w-3.5" />
        Testmodus
      </div>
      <select
        value={overrideRole ?? ""}
        onChange={(e) =>
          setOverrideRole(
            e.target.value ? (e.target.value as AppRole) : null
          )
        }
        className="w-full rounded bg-gray-800 px-2 py-1.5 text-sm text-gray-200 border border-gray-600 focus:border-yellow-400 focus:outline-none"
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
