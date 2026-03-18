"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-slate-900 tracking-tight">
          Welkom terug
        </h1>
        <p className="mt-1.5 text-slate-500 text-[15px]">
          Log in op je account
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-4 focus:ring-[#e43122]/20 transition-shadow"
            placeholder="naam@strukton.nl"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Wachtwoord
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#e43122] focus:outline-none focus:ring-4 focus:ring-[#e43122]/20 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
              aria-label={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-red-500">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center h-11 rounded-xl bg-[#e43122] text-white font-semibold text-sm hover:bg-[#c42a1d] active:scale-[0.98] transform disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus:ring-4 focus:ring-[#e43122]/20 transition-all"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Inloggen"
          )}
        </button>
      </form>
    </div>
  );
}
