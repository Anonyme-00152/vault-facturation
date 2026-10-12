#!/bin/sh
# Charge les secrets générés au premier démarrage, puis lance la commande.
set -eu

if [ -f /secrets/app.env ]; then
  . /secrets/app.env
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f /secrets/db_password ]; then
  DATABASE_URL="postgresql://vault:$(cat /secrets/db_password)@${DB_HOST:-db}:5432/vault"
  export DATABASE_URL
fi

exec "$@"
