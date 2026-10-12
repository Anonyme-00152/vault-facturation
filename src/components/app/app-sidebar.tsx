"use client";

import {
  FileText,
  Gauge,
  LogOut,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { initials } from "@/lib/format";
import { ROLE_LABELS, type Role } from "@/lib/roles";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; items: NavItem[]; roles?: Role[] };

const NAVIGATION: NavGroup[] = [
  {
    label: "Pilotage",
    items: [{ href: "/app", label: "Tableau de bord", icon: Gauge, exact: true }],
  },
  {
    label: "Données",
    items: [
      { href: "/app/clients", label: "Clients", icon: Users },
      { href: "/app/factures", label: "Factures", icon: FileText },
    ],
  },
  {
    label: "Administration",
    roles: ["ADMIN"],
    items: [
      { href: "/app/admin/utilisateurs", label: "Utilisateurs", icon: UserCog },
      { href: "/app/admin/charte", label: "Charte", icon: ShieldCheck },
      { href: "/app/admin/audit", label: "Journal d'audit", icon: ScrollText },
      { href: "/app/admin/rgpd", label: "RGPD", icon: SlidersHorizontal },
    ],
  },
];

export type ShellUser = { name: string; email: string; role: Role };

export function AppSidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="px-3 pt-4 pb-2">
        <Link href="/app" aria-label="Tableau de bord" className="flex h-9 items-center px-1">
          <Logo className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {NAVIGATION.filter((group) => !group.roles || group.roles.includes(user.role)).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="label-mono text-[0.6rem] text-muted-foreground">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="h-9 rounded-xl data-[active=true]:bg-foreground data-[active=true]:font-medium data-[active=true]:text-background"
                      >
                        <Link href={item.href} aria-current={active ? "page" : undefined}>
                          <item.icon />
                          <span>{item.label}</span>
                          {active && (
                            <span className="ml-auto size-1.5 rounded-full bg-brand group-data-[collapsible=icon]:hidden" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border bg-card p-2.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <Link
            href="/app/compte"
            className="flex min-w-0 flex-1 items-center gap-3"
            aria-label="Mon compte et sécurité"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
              {initials(user.name)}
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="label-mono block text-[0.58rem] text-muted-foreground">
                {ROLE_LABELS[user.role]}
              </span>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Se déconnecter"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
