"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "@/lib/constants/nav-items";
import { useAuth } from "@/components/providers/auth-provider";

const MOBILE_NAV_ITEMS = NAV_ITEMS.slice(0, 4); // Show first 4 on mobile bottom bar

export function MobileNav() {
  const pathname = usePathname();
  const { effectiveRole } = useAuth();

  const visibleItems = MOBILE_NAV_ITEMS.filter(
    (item) => item.roles === "all" || item.roles.includes(effectiveRole)
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 text-xs",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
