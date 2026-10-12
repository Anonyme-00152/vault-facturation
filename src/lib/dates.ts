/**
 * Dates « calendaires » (sans heure), toujours représentées à minuit UTC :
 * c'est ce que stocke une colonne PostgreSQL `date`. Le jour courant est
 * celui de Paris, quelle que soit la région du serveur.
 */

const parisDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** « 2026-10-12 » : la date du jour à Paris. */
export function parisTodayIso(now = new Date()): string {
  return parisDay.format(now);
}

export function dateFromIso(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function parisToday(now = new Date()): Date {
  return dateFromIso(parisTodayIso(now));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
