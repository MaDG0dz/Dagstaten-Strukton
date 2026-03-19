"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/constants/roles";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RoleSwitcher() {
  const { profile, overrideRole, setOverrideRole, effectiveRole } = useAuth();

  const showTestModus =
    process.env.NEXT_PUBLIC_TESTMODUS === "true" ||
    profile?.role === "beheerder";

  if (!showTestModus) return null;

  return (
    <div className="border-t border-white/10 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-yellow-400">
        <Shield className="h-3 w-3" />
        Testmodus
      </div>
      <div className="flex flex-wrap gap-1.5">
        {APP_ROLES.map((role) => {
          const isActive = effectiveRole === role;
          return (
            <button
              key={role}
              onClick={() =>
                setOverrideRole(role === profile?.role ? null : role)
              }
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-150",
                isActive
                  ? "bg-[#e43122] text-white shadow-sm"
                  : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
              )}
            >
              {ROLE_LABELS[role]}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[10px] text-white/40">
        Weergave als {ROLE_LABELS[effectiveRole]}
      </p>
    </div>
  );
}
