"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { FormField, FormInput, FormSelect } from "@/components/ui/form-field";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/constants/roles";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function generatePassword(): string {
  const letters = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const special = "!@#$%&*?";
  const all = letters + numbers + special;

  // Ensure at least one of each type
  let password = "";
  password += letters[Math.floor(Math.random() * letters.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 3; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function CreateUserModal({ open, onClose, onSuccess }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("voorman");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setRole("voorman");
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
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: generatedPassword,
          full_name: name,
          role,
        }),
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

  const handleClose = () => {
    if (success) {
      onSuccess();
    }
    onClose();
  };

  if (success) {
    return (
      <Modal open={open} onClose={handleClose} title="Gebruiker aangemaakt">
        <div className="space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800">
              Gebruiker is succesvol aangemaakt.
            </p>
          </div>

          <FormField label="Wachtwoord">
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
            onClick={handleClose}
            className="h-10 w-full rounded-xl bg-[#e43122] text-sm font-medium text-white transition-colors duration-150 hover:bg-[#c42a1d]"
          >
            Sluiten
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Gebruiker toevoegen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Naam">
          <FormInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Volledige naam"
            required
          />
        </FormField>

        <FormField label="E-mailadres">
          <FormInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="naam@voorbeeld.nl"
            required
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

        <FormField label="Gegenereerd wachtwoord">
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
            onClick={handleClose}
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
              "Aanmaken"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
