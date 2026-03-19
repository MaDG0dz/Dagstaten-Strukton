"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/constants/roles";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  phone: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  overrideRole: AppRole | null;
  setOverrideRole: (role: AppRole | null) => void;
  effectiveRole: AppRole;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [overrideRole, setOverrideRole] = useState<AppRole | null>(null);

  const effectiveRole = overrideRole ?? profile?.role ?? "voorman";

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      setLoading(false);
      return;
    }

    // Safety timeout: never show loading skeleton for more than 8 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          setProfile(data as Profile | null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(data as Profile | null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOverrideRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        overrideRole,
        setOverrideRole,
        effectiveRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
