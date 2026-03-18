"use client";

import { useState, useEffect, type FormEvent } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FormField, FormInput } from "@/components/ui/form-field";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";

type Status = { type: "success" | "error"; message: string } | null;

export default function ProfielPage() {
  const { profile } = useAuth();

  // --- Persoonlijke gegevens ---
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>(null);

  // --- Wachtwoord ---
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<Status>(null);

  // Load defaults from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileStatus(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", profile!.id);

      if (error) throw error;

      setProfileStatus({ type: "success", message: "Profiel bijgewerkt" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Er is iets misgegaan";
      setProfileStatus({ type: "error", message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordStatus(null);

    if (password !== passwordConfirm) {
      setPasswordStatus({
        type: "error",
        message: "Wachtwoorden komen niet overeen",
      });
      setPasswordSaving(false);
      return;
    }

    if (password.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "Wachtwoord moet minimaal 6 tekens bevatten",
      });
      setPasswordSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setPassword("");
      setPasswordConfirm("");
      setPasswordStatus({
        type: "success",
        message: "Wachtwoord is gewijzigd",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Er is iets misgegaan";
      setPasswordStatus({ type: "error", message });
    } finally {
      setPasswordSaving(false);
    }
  }

  function StatusMessage({ status }: { status: Status }) {
    if (!status) return null;

    if (status.type === "success") {
      return (
        <p className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          {status.message}
        </p>
      );
    }

    return (
      <p className="flex items-center gap-1.5 text-sm text-red-500">
        <AlertCircle className="h-4 w-4" />
        {status.message}
      </p>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Mijn profiel"
        description="Beheer je accountinstellingen"
      />

      <div className="space-y-6">
        {/* Persoonlijke gegevens */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
            Persoonlijke gegevens
          </h2>

          <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
            <FormField label="Naam">
              <FormInput
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Je volledige naam"
                disabled={profileSaving}
              />
            </FormField>

            <FormField label="Telefoonnummer">
              <FormInput
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Je telefoonnummer"
                disabled={profileSaving}
              />
            </FormField>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="h-10 rounded-xl bg-[#e43122] px-6 text-sm font-medium text-white transition-colors hover:bg-[#c42a1d] disabled:opacity-50"
              >
                {profileSaving ? "Opslaan..." : "Opslaan"}
              </button>
              <StatusMessage status={profileStatus} />
            </div>
          </form>
        </div>

        {/* Wachtwoord wijzigen */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-slate-900">
            Wachtwoord wijzigen
          </h2>

          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <FormField label="Nieuw wachtwoord">
              <FormInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nieuw wachtwoord"
                disabled={passwordSaving}
              />
            </FormField>

            <FormField label="Wachtwoord bevestigen">
              <FormInput
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="Herhaal wachtwoord"
                disabled={passwordSaving}
              />
            </FormField>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="h-10 rounded-xl bg-[#e43122] px-6 text-sm font-medium text-white transition-colors hover:bg-[#c42a1d] disabled:opacity-50"
              >
                {passwordSaving ? "Opslaan..." : "Opslaan"}
              </button>
              <StatusMessage status={passwordStatus} />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
