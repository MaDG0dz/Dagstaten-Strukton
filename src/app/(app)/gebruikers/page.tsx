"use client";

import { useState } from "react";
import { UserCog, UserPlus, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Toggle } from "@/components/ui/toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfiles, useUpdateProfile } from "@/lib/hooks/use-profiles";
import type { Profile } from "@/lib/types/database";
import { ROLE_LABELS, APP_ROLES, type AppRole } from "@/lib/constants/roles";
import { CreateUserModal } from "./_components/create-user-modal";
import { ChangePasswordModal } from "./_components/change-password-modal";

export default function GebruikersPage() {
  const { effectiveRole } = useAuth();
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });

  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading } = useProfiles(search);
  const updateProfile = useUpdateProfile();

  if (effectiveRole !== "beheerder") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Geen toegang
          </h2>
          <p className="mt-1 text-sm text-slate-500">
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

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
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
          className="rounded-xl border border-slate-200 px-2 py-1 text-sm transition-colors duration-150 focus:border-[#e43122] focus:outline-none focus:ring-4 focus:ring-[#e43122]/20"
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
    {
      key: "actions",
      header: "",
      render: (profile) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPasswordModal({
              open: true,
              userId: profile.id,
              userName: profile.full_name,
            });
          }}
          title="Wachtwoord wijzigen"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
        >
          <KeyRound className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Gebruikers"
        description="Beheer gebruikersrollen en toegang"
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#e43122] px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c42a1d]"
          >
            <UserPlus className="h-4 w-4" />
            Gebruiker toevoegen
          </button>
        }
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

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ChangePasswordModal
        open={passwordModal.open}
        onClose={() =>
          setPasswordModal({ open: false, userId: "", userName: "" })
        }
        userId={passwordModal.userId}
        userName={passwordModal.userName}
      />
    </div>
  );
}
