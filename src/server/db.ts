import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "@/env";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  // Sessions en UTC : horodatages identiques quel que soit le fuseau du serveur PostgreSQL.
  const adapter = new PrismaPg({ connectionString: env().DATABASE_URL, options: "-c TimeZone=UTC" });
  return new PrismaClient({ adapter, log: ["warn", "error"] });
}

// Une seule instance par processus (le rechargement à chaud en recréerait sinon à chaque édition).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

/**
 * Client créé au premier usage, jamais au chargement du module : `next build` peut
 * analyser les routes sans aucune variable d'environnement (image Docker sans secrets).
 */
export const db = new Proxy({} as PrismaClient, {
  get(_, property) {
    const instance = client();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Db = PrismaClient;
export type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];
