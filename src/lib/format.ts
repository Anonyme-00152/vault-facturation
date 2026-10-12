const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const percent = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
const dateShort = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

/** Espace fine insécable → espace insécable : plus lisible avec les chiffres larges de Mona Sans. */
const widenSpaces = (value: string) => value.replace(/ /g, " ");

/** Montant en centimes → « 1 234,56 € ». */
export const formatEUR = (cents: number) => widenSpaces(euro.format(cents / 100));
/** Montant en centimes, sans décimales → « 1 235 € ». */
export const formatEURCompact = (cents: number) => widenSpaces(euroCompact.format(cents / 100));
/** Ratio (0.124) → « +12,4 % ». */
export const formatPercent = (ratio: number) => percent.format(ratio);
export const formatDate = (date: Date) => dateShort.format(date);
export const formatDateTime = (date: Date) => dateTime.format(date);
export const formatMonth = (date: Date) => monthName.format(date);

/** Temps relatif court : « il y a 5 min ». */
export function formatRelative(date: Date, now = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto", style: "short" });
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

/** Initiales pour les avatars : « Camille Rousseau » → « CR ». */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
