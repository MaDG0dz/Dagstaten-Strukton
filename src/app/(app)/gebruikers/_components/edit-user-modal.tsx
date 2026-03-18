"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { FormField, FormInput, FormSelect } from "@/components/ui/form-field";
import { Toggle } from "@/components/ui/toggle";
import { useUpdateProfile } from "@/lib/hooks/use-profiles";
import type { Profile } from "@/lib/types/database";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/constants/roles";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSuccess: () => void;
}

export function EditUserModal({ open, onClose, profile, onSuccess }: EditUserModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AppRole>("voorman");
  const [isActive, setIsActive] = useState(true);

  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profile && open) {
      setFullName(profile.full_name);
      setPhone(profile.phone ?? "");
      setRole(profile.role);
      setIsActive(profile.is_active);
    }
  }, [profile, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    updateProfile.mutate(
      {
        id: profile.id,
        full_name: fullName,
        phone: phone || null,
        role,
        is_active: isActive,
      },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <SlideOver open={open} onClose={onClose} title="Gebruiker bewerken">
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Naam">
          <FormInput
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Volledige naam"
            required
          />
        </FormField>

        <FormField label="E-mail">
          <FormInput
            type="email"
            value={profile?.email ?? ""}
            disabled
            readOnly
          />
        </FormField>

        <FormField label="Telefoon">
          <FormInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefoonnummer"
          />
        </FormField>

        <FormField label="Rol">
          <FormSelect value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
            {APP_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </FormSelect>
        </FormField>

        <FormField label="Actief">
          <div className="flex items-center gap-3 pt-1">
            <Toggle
              checked={isActive}
              onChange={setIsActive}
              label={isActive ? "Actief" : "Inactief"}
            />
            <span className="text-sm text-slate-600">
              {isActive ? "Actief" : "Inactief"}
            </span>
          </div>
        </FormField>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="h-10 flex-1 rounded-xl bg-[#e43122] text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c42a1d] disabled:opacity-50"
          >
            {updateProfile.isPending ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Opslaan"
            )}
          </button>
        </div>
      </form>
    </SlideOver>
  );
}
