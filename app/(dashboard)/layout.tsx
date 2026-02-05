"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { QueryProvider } from "@/lib/query-client";
import { useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { QuickAddCompany } from "@/components/forms/quick-add-company";
import { QuickAddContact } from "@/components/forms/quick-add-contact";
import { QuickAddDeal } from "@/components/forms/quick-add-deal";
import { QuickAddActivity } from "@/components/forms/quick-add-activity";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onQuickAdd={(type) => setQuickAdd(type)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>

      <QuickAddCompany
        open={quickAdd === "company"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onSuccess={() => setQuickAdd(null)}
      />
      <QuickAddContact
        open={quickAdd === "contact"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onSuccess={() => setQuickAdd(null)}
      />
      <QuickAddDeal
        open={quickAdd === "deal"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onSuccess={() => setQuickAdd(null)}
      />
      <QuickAddActivity
        open={quickAdd === "activity"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onSuccess={() => setQuickAdd(null)}
      />

      <Toaster />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <DashboardShell>{children}</DashboardShell>
    </QueryProvider>
  );
}
