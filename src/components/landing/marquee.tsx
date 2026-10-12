import { VaultMark } from "@/components/brand/logo";

const ITEMS = [
  "Chiffrement AES-256-GCM",
  "Double authentification TOTP",
  "Journal d'audit inaltérable",
  "Charte de confidentialité versionnée",
  "Numérotation sans trou",
  "Conforme RGPD",
  "Déconnexion après 15 min",
];

/** Bandeau citron défilant, façon Lando Norris. */
export function Marquee() {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-6 pr-6">
          <span className="font-display text-xl tracking-[-0.02em] whitespace-nowrap md:text-2xl">{item}</span>
          <VaultMark className="size-6 text-brand-foreground" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative mt-16 overflow-hidden bg-brand py-5 text-brand-foreground md:mt-24">
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
