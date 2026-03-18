"use client";

import { useState } from "react";
import { UserCog, UserPlus, KeyRound, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfiles } from "@/lib/hooks/use-profiles";
import type { Profile } from "@/lib/types/database";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { CreateUserModal } from "./_components/create-user-modal";
import { ChangePasswordModal } from "./_components/change-password-modal";
import { EditUserModal } from "./_components/edit-user-modal";

export default function GebruikersPage() {
  const { effectiveRole } = useAuth();
  const [search, setSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });

  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading } = useProfiles(search);

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

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  };

  const handleEditSuccess = () => {
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
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {ROLE_LABELS[profile.role]}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (profile) => (
        <span
          className={
            profile.is_active
              ? "inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
              : "inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
          }
        >
          {profile.is_active ? "Actief" : "Inactief"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (profile) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingProfile(profile);
            }}
            title="Gebruiker bewerken"
            className="flex h-8 w-8 items-center justify-center rounded-xl p-2 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
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
            className="flex h-8 w-8 items-center justify-center rounded-xl p-2 text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-600"
          >
            <KeyRound className="h-4 w-4" />
          </button>
        </div>
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

      <EditUserModal
        open={editingProfile !== null}
        onClose={() => setEditingProfile(null)}
        profile={editingProfile}
        onSuccess={handleEditSuccess}
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
