#!/bin/sh
# Applique les migrations, puis charge les données de démonstration si la base est vide.
set -eu

npx prisma migrate deploy
npm run db:seed -- --if-empty
