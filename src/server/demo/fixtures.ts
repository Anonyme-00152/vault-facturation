/**
 * Générateurs de données fictives. Les identifiants sont choisis pour ne jamais
 * correspondre à de vraies personnes ou entreprises :
 * - SIREN commençant par 000 (plage non attribuée par l'INSEE) ;
 * - numéros de téléphone dans les plages réservées à la fiction par l'ARCEP ;
 * - adresses e-mail sur le domaine réservé `.test` (RFC 2606) ;
 * - IBAN avec un code banque 00000, inexistant.
 */
import { luhnValid } from "@/lib/validation";

/** Générateur pseudo-aléatoire déterministe (mulberry32) : mêmes données à chaque seed. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)]!,
    chance: (probability: number) => next() < probability,
    digits: (count: number) => Array.from({ length: count }, () => Math.floor(next() * 10)).join(""),
  };
}

export type Random = ReturnType<typeof createRandom>;

function withLuhnDigit(body: string): string {
  for (let digit = 0; digit <= 9; digit++) {
    if (luhnValid(`${body}${digit}`)) return `${body}${digit}`;
  }
  throw new Error("Impossible de calculer la clé de Luhn");
}

export function fakeSiren(random: Random): string {
  return withLuhnDigit(`000${random.digits(5)}`);
}

export function fakeSiret(random: Random, siren = fakeSiren(random)): string {
  return withLuhnDigit(`${siren}000${random.int(1, 9)}`);
}

export function fakeLandline(random: Random): string {
  return `01 99 00 ${random.digits(2)} ${random.digits(2)}`;
}

export function fakeMobile(random: Random): string {
  return `06 39 98 ${random.digits(2)} ${random.digits(2)}`;
}

/** IBAN français avec clé de contrôle valide (ISO 13616) et code banque fictif. */
export function fakeIban(random: Random): string {
  const bban = `00000${random.digits(5)}${random.digits(11)}${random.digits(2)}`;
  const rearranged = `${bban}FR00`.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  const remainder = [...rearranged].reduce((acc, digit) => (acc * 10 + Number(digit)) % 97, 0);
  const check = String(98 - remainder).padStart(2, "0");
  return `FR${check}${bban}`.replace(/(.{4})/g, "$1 ").trim();
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const CITIES = [
  { city: "Lyon", postalCode: "69002" },
  { city: "Paris", postalCode: "75011" },
  { city: "Marseille", postalCode: "13006" },
  { city: "Nantes", postalCode: "44000" },
  { city: "Bordeaux", postalCode: "33000" },
  { city: "Lille", postalCode: "59000" },
  { city: "Toulouse", postalCode: "31000" },
  { city: "Grenoble", postalCode: "38000" },
  { city: "Rennes", postalCode: "35000" },
  { city: "Strasbourg", postalCode: "67000" },
  { city: "Annecy", postalCode: "74000" },
  { city: "Dijon", postalCode: "21000" },
] as const;

const STREET_TYPES = ["rue", "avenue", "boulevard", "place", "quai", "impasse", "allée"] as const;
const STREET_NAMES = [
  "des Tanneurs",
  "du Moulin Vert",
  "de la Verrerie",
  "des Glycines",
  "du Pré Haut",
  "des Ateliers",
  "de la Fonderie",
  "des Tilleuls",
  "du Lavoir",
  "de l'Horloge",
  "des Cordiers",
  "du Vieux Port",
] as const;

export function fakeStreet(random: Random): string {
  return `${random.int(1, 148)} ${random.pick(STREET_TYPES)} ${random.pick(STREET_NAMES)}`;
}

/** Raisons sociales inventées (mot évocateur + activité + forme juridique). */
const COMPANY_WORDS = [
  "Nébule",
  "Orbe",
  "Valcourt",
  "Lysandre",
  "Brume",
  "Quai Sud",
  "Glycines",
  "Archipel",
  "Cobalt",
  "Mistral",
  "Ardoise",
  "Saule",
  "Hélice",
  "Sablier",
  "Carmin",
  "Boréal",
  "Prisme",
  "Galet",
] as const;
const COMPANY_KINDS = [
  "Atelier",
  "Studio",
  "Brasserie",
  "Cabinet",
  "Menuiserie",
  "Pépinière",
  "Éditions",
  "Imprimerie",
  "Agence",
  "Maison",
] as const;
const LEGAL_FORMS = ["SAS", "SARL", "SASU", "EURL"] as const;

export function fakeCompanyName(random: Random, used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${random.pick(COMPANY_KINDS)} ${random.pick(COMPANY_WORDS)} ${random.pick(LEGAL_FORMS)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  throw new Error("Plus de raisons sociales disponibles");
}

const FIRST_NAMES = ["Inès", "Mathis", "Chloé", "Yanis", "Manon", "Noé", "Léna", "Sacha", "Jade", "Malo"] as const;
const LAST_NAMES = ["Fontaine", "Marchal", "Leclerc", "Perrin", "Garnier", "Benard", "Royer", "Colin"] as const;

export function fakePersonName(random: Random, used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  throw new Error("Plus de noms disponibles");
}

/** Catalogue de prestations d'un studio web (prix HT en centimes). */
export const CATALOG = [
  { designation: "Atelier de cadrage (demi-journée)", unit: 45_000, vat: 2000, qty: [1, 2] },
  { designation: "Conception des maquettes (jour)", unit: 65_000, vat: 2000, qty: [2, 8] },
  { designation: "Développement front-end (jour)", unit: 60_000, vat: 2000, qty: [3, 12] },
  { designation: "Développement back-end (jour)", unit: 62_000, vat: 2000, qty: [2, 10] },
  { designation: "Audit d'accessibilité RGAA (forfait)", unit: 180_000, vat: 2000, qty: [1, 1] },
  { designation: "Maintenance applicative (mois)", unit: 29_000, vat: 2000, qty: [1, 3] },
  { designation: "Hébergement et supervision (mois)", unit: 9_500, vat: 2000, qty: [1, 6] },
  { designation: "Formation de l'équipe (jour)", unit: 120_000, vat: 2000, qty: [1, 2] },
  { designation: "Rédaction de contenus (page)", unit: 12_000, vat: 2000, qty: [3, 10] },
  { designation: "Restauration lors de l'atelier client", unit: 2_450, vat: 1000, qty: [6, 14] },
  { designation: "Frais de déplacement (forfait)", unit: 8_500, vat: 2000, qty: [1, 2] },
] as const;
