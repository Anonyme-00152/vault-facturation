import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Mona_Sans } from "next/font/google";
import { headers } from "next/headers";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const mona = Mona_Sans({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-mona",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Vault Facturation", template: "%s · Vault Facturation" },
  description:
    "Gestion des clients et de la facturation pour les petites entreprises : chiffrement, double authentification, journal d'audit et conformité RGPD.",
  applicationName: "Vault Facturation",
  authors: [{ name: "Ebubekir Arti" }],
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f0f1fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0b14" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Le proxy génère un nonce par requête ; Next.js l'applique à ses propres scripts.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="fr" suppressHydrationWarning className={`${mona.variable} ${plex.variable}`}>
      <body className="min-h-dvh antialiased">
        <ThemeProvider nonce={nonce}>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
