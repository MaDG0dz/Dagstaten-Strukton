"use client";

import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { OfflineProvider, useOffline } from "@/components/providers/offline-provider";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/components/providers/auth-provider";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { WifiOff } from "lucide-react";

function OfflineBanner() {
  const { isOnline, pendingSyncCount } = useOffline();

  if (isOnline) return null;

  return (
    <div className="bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-yellow-900">
      <WifiOff className="mr-1 inline h-4 w-4" />
      Offline — wijzigingen worden lokaal opgeslagen
      {pendingSyncCount > 0 && ` (${pendingSyncCount} wachtend)`}
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen">
        <PageSkeleton />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.replace("/login");
    return (
      <div className="min-h-screen">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:ml-64">
        <OfflineBanner />
        <div className="p-4 pb-20 md:p-6 md:pb-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <OfflineProvider>
          <AppShell>{children}</AppShell>
        </OfflineProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
