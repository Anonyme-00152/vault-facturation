"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Mode clair « Papier » et mode sombre « Nuit ». Le script anti-flash porte le nonce CSP. */
export function ThemeProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
