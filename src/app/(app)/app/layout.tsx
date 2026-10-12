import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAccess } from "@/server/auth/guard";

export const metadata: Metadata = {
  title: { default: "Tableau de bord", template: "%s · Vault Facturation" },
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  // Le layout n'est pas rejoué à chaque navigation : chaque page appelle aussi requireAccess.
  const user = await requireAccess();
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AppSidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <SidebarInset className="min-w-0 md:border md:border-border">
        <AppHeader />
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
