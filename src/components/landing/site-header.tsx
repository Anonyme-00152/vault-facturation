"use client";

import { ArrowUpRight, Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#securite", label: "Sécurité" },
  { href: "/#parcours", label: "Parcours d'accès" },
  { href: "/#produit", label: "Produit" },
  { href: "/#rgpd", label: "RGPD" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500",
        scrolled
          ? "border-b border-border/60 bg-background/75 backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-6 px-5 md:px-10">
        <Link href="/" aria-label="Vault Facturation, accueil" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button asChild variant="ink" size="pill" className="hidden sm:inline-flex">
            <Link href="/connexion">Se connecter</Link>
          </Button>
          <Button asChild variant="brand" size="pill" className="hidden md:inline-flex">
            <Link href="/connexion">
              Tester la démo
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-lg" className="rounded-full lg:hidden" aria-label="Ouvrir le menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm bg-background p-6">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Logo />
              <nav aria-label="Navigation mobile" className="mt-10 flex flex-col">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="font-display border-b border-border py-4 text-3xl"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <ThemeToggle className="self-start" />
                <Button asChild variant="brand" size="xl">
                  <Link href="/connexion">Tester la démo</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
