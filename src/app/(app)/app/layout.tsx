import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: { default: "Tableau de bord", template: "%s · Vault Facturation" },
  robots: { index: false, follow: false },
};

// Maquette : l'utilisateur viendra de la session à l'étape « Authentification ».
const DEMO_USER = { name: "Camille Rousseau", email: "camille@atelier-nebule.test", role: "COMPTABLE" as const };

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar user={DEMO_USER} />
      <SidebarInset className="min-w-0 md:border md:border-border">
        <AppHeader />
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
