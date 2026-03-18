"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField, FormInput } from "@/components/ui/form-field";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

function generatePassword(): string {
  const letters = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const special = "!@#$%&*?";
  const all = letters + numbers + special;

  let password = "";
  password += letters[Math.floor(Math.random() * letters.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 3; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function ChangePasswordModal({
  open,
  onClose,
  userId,
  userName,
}: ChangePasswordModalProps) {
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setGeneratedPassword(generatePassword());
      setCopied(false);
      setLoading(false);
      setError("");
      setSuccess(false);
    }
  }, [open]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: generatedPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Er is een fout opgetreden");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Er is een onverwachte fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Modal open={open} onClose={onClose} title="Wachtwoord gewijzigd">
        <div className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800">
              Wachtwoord van {userName} is succesvol gewijzigd.
            </p>
          </div>

          <FormField label="Nieuw wachtwoord">
            <div className="flex gap-2">
              <FormInput value={generatedPassword} readOnly className="font-mono" />
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-colors duration-150 hover:bg-slate-50"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-500" />
                )}
              </button>
            </div>
          </FormField>

          <p className="text-sm text-amber-600 font-medium">
            Wachtwoord gekopieerd? Dit wordt niet meer getoond.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-[#e43122] text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c42a1d]"
          >
            Sluiten
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Wachtwoord wijzigen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Nieuw wachtwoord genereren voor <strong>{userName}</strong>.
        </p>

        <FormField label="Nieuw wachtwoord">
          <div className="flex gap-2">
            <FormInput value={generatedPassword} readOnly className="font-mono" />
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 transition-colors duration-150 hover:bg-slate-50"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-slate-500" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600">Gekopieerd!</p>
          )}
        </FormField>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
          >
            Annuleren
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-10 flex-1 rounded-xl bg-[#e43122] text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c42a1d] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Opslaan"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
