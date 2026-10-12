import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --conditions=react-server prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` n'a pas besoin de base (build Docker, CI) ;
    // les commandes de migration échouent clairement si la variable manque.
    url: process.env.DATABASE_URL ?? "",
  },
});
