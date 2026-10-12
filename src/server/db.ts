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
const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];
