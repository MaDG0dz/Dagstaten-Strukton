import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl === "your-supabase-url-here") {
    throw new Error(
      "Supabase is niet geconfigureerd. Vul NEXT_PUBLIC_SUPABASE_URL in .env.local in."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey!);
}
