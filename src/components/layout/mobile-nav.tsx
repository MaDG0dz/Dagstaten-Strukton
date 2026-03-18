"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "@/lib/constants/nav-items";
import { useAuth } from "@/components/providers/auth-provider";

const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 4);

export function MobileNav() {
  const pathname = usePathname();
  const { effectiveRole } = useAuth();

  const visibleItems = MOBILE_NAV_ITEMS.filter(
    (item) => item.roles === "all" || item.roles.includes(effectiveRole)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.05)] md:hidden">
      <div
        className="flex items-center justify-around px-2 py-1"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors duration-150 ease-out",
                isActive
                  ? "text-[#e43122]"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span
                className="truncate font-medium"
                style={{ fontSize: "10px", lineHeight: "14px" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
