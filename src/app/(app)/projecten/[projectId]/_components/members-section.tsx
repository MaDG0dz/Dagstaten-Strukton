"use client";

import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, FormSelect } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
} from "@/lib/hooks/use-projects";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { isManager, APP_ROLES, ROLE_LABELS } from "@/lib/constants/roles";
import type { AppRole } from "@/lib/constants/roles";
import type { ProjectMember } from "@/lib/types/database";

interface MembersSectionProps {
  projectId: string;
}

export function MembersSection({ projectId }: MembersSectionProps) {
  const { effectiveRole } = useAuth();
  const canManage = isManager(effectiveRole);

  const { data: members = [], isLoading } = useProjectMembers(projectId);
  const { data: profiles = [] } = useProfiles();
  const addMember = useAddProjectMember();
  const removeMember = useRemoveProjectMember();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("uitvoerder");

  const existingProfileIds = new Set(members.map((m) => m.profile_id));
  const availableProfiles = profiles.filter((p) => !existingProfileIds.has(p.id));

  const handleAddMember = async () => {
    if (!selectedProfileId || !selectedRole) return;
    await addMember.mutateAsync({
      project_id: projectId,
      profile_id: selectedProfileId,
      role: selectedRole,
    });
    setIsModalOpen(false);
    setSelectedProfileId("");
    setSelectedRole("uitvoerder");
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    await removeMember.mutateAsync(removingMember.id);
    setRemovingMember(null);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Teamleden</h2>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Lid toevoegen
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-slate-50"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Geen teamleden"
          description="Voeg teamleden toe aan dit project"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">
                  Naam
                </th>
                <th className="hidden px-4 py-2.5 text-left font-medium text-slate-600 sm:table-cell">
                  E-mail
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">
                  Rol
                </th>
                {canManage && (
                  <th className="w-16 px-4 py-2.5 text-right font-medium text-slate-600">
                    {/* Verwijderen */}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-900">
                    {member.profile?.full_name ?? "\u2014"}
                  </td>
                  <td className="hidden px-4 py-2.5 text-slate-500 sm:table-cell">
                    {member.profile?.email ?? "\u2014"}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="active">
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                  </td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setRemovingMember(member)}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lid toevoegen"
      >
        <div className="space-y-4">
          <FormField label="Gebruiker">
            <FormSelect
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
            >
              <option value="">Selecteer een gebruiker...</option>
              {availableProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name} ({profile.email})
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label="Rol">
            <FormSelect
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as AppRole)}
            >
              {APP_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </FormSelect>
          </FormField>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedProfileId || addMember.isPending}
              className="rounded-xl bg-[#e43122] px-4 py-2 text-sm font-medium text-white hover:bg-[#c42a1d] active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {addMember.isPending ? "Toevoegen..." : "Toevoegen"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removingMember}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemovingMember(null)}
        title="Lid verwijderen"
        description={`Weet je zeker dat je "${removingMember?.profile?.full_name ?? ""}" wilt verwijderen uit dit project?`}
        confirmLabel="Verwijderen"
        variant="danger"
        loading={removeMember.isPending}
      />
    </section>
  );
}
