"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS } from "@/lib/constants/nav-items";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { RoleSwitcher } from "./role-switcher";

function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { profile, effectiveRole, signOut } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.roles === "all" || item.roles.includes(effectiveRole)
  );

  const displayName = profile?.full_name ?? profile?.email ?? "";
  const initials = getInitials(profile?.full_name ?? profile?.email);
  const roleLabel = ROLE_LABELS[effectiveRole] ?? effectiveRole;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-[#5b00b4] p-2 text-white shadow-lg md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay with backdrop blur */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#5b00b4] text-[#ede9fe] transition-transform duration-200 ease-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header — Logo + brand */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Strukton logo"
              width={36}
              height={36}
              className="h-9 w-auto"
            />
            <span
              className="text-lg font-bold tracking-tight text-white"
              style={{ fontFamily: "Lexend, sans-serif" }}
            >
              Dagstaten
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-slate-400 transition-colors duration-150 ease-out hover:bg-[#7316d1] hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {visibleItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out",
                      isActive
                        ? "border-l-[3px] border-[#e43122] bg-[rgba(228,49,34,0.12)] pl-[9px] text-white"
                        : "border-l-[3px] border-transparent pl-[9px] text-slate-400 hover:bg-[#7316d1] hover:text-white"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* TESTMODUS Role Switcher */}
        <RoleSwitcher />

        {/* Separator */}
        <div className="border-t border-white/10" />

        {/* User section */}
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center gap-3">
            {/* Avatar circle */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e43122] text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">
                {displayName}
              </div>
              <span className="inline-block rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors duration-150 ease-out hover:bg-[#7316d1] hover:text-slate-300"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
        </div>
      </aside>
    </>
  );
}
