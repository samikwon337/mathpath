"use client";

import { AuthProvider } from "@/hooks/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorToast } from "@/components/layout/ErrorToast";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ErrorToast />
      </TooltipProvider>
    </AuthProvider>
  );
}
