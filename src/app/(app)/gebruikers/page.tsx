"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Toggle } from "@/components/ui/toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfiles, useUpdateProfile } from "@/lib/hooks/use-profiles";
import type { Profile } from "@/lib/types/database";
import { ROLE_LABELS, APP_ROLES, type AppRole } from "@/lib/constants/roles";

export default function GebruikersPage() {
  const { effectiveRole } = useAuth();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useProfiles(search);
  const updateProfile = useUpdateProfile();

  if (effectiveRole !== "beheerder") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Geen toegang
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Je hebt geen rechten om deze pagina te bekijken.
          </p>
        </div>
      </div>
    );
  }

  const handleRoleChange = (profile: Profile, newRole: AppRole) => {
    updateProfile.mutate({ id: profile.id, role: newRole });
  };

  const handleToggleActive = (profile: Profile) => {
    updateProfile.mutate({ id: profile.id, is_active: !profile.is_active });
  };

  const columns: Column<Profile>[] = [
    {
      key: "full_name",
      header: "Naam",
      render: (profile) => (
        <span className="font-medium">{profile.full_name}</span>
      ),
    },
    {
      key: "email",
      header: "E-mail",
      hideOnMobile: true,
      render: (profile) => profile.email,
    },
    {
      key: "role",
      header: "Rol",
      render: (profile) => (
        <select
          value={profile.role}
          onChange={(e) => handleRoleChange(profile, e.target.value as AppRole)}
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {APP_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (profile) => (
        <Toggle
          checked={profile.is_active}
          onChange={() => handleToggleActive(profile)}
          label={profile.is_active ? "Actief" : "Inactief"}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Gebruikers"
        description="Beheer gebruikersrollen en toegang"
      />

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Zoek gebruiker..."
        />
      </div>

      <DataTable
        columns={columns}
        data={profiles}
        isLoading={isLoading}
        rowKey={(profile) => profile.id}
        emptyState={
          <EmptyState
            icon={UserCog}
            title="Geen gebruikers"
            description="Er zijn nog geen gebruikers"
          />
        }
      />
    </div>
  );
}
