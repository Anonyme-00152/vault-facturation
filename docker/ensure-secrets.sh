#!/bin/sh
# Génère les secrets au premier démarrage. Les fichiers existants ne sont jamais modifiés.
set -eu

dir=/secrets
gen() { head -c 32 /dev/urandom | base64 | tr -d '\n'; }

if [ ! -f "$dir/db_password" ]; then
  head -c 48 /dev/urandom | base64 | tr -d '\n/+=' > "$dir/db_password"
  # Lisible par l'utilisateur `postgres` du conteneur de base de données.
  chmod 444 "$dir/db_password"
fi

if [ ! -f "$dir/app.env" ]; then
  # Une variable déjà fournie par l'environnement garde la priorité.
  cat > "$dir/app.env" <<EOF
export AUTH_SECRET="\${AUTH_SECRET:-$(gen)}"
export ENCRYPTION_KEY="\${ENCRYPTION_KEY:-$(gen)}"
export ENCRYPTION_KEY_ID="\${ENCRYPTION_KEY_ID:-k1}"
export BLIND_INDEX_KEY="\${BLIND_INDEX_KEY:-$(gen)}"
EOF
  chown 1001:1001 "$dir/app.env"
  chmod 440 "$dir/app.env"
fi

echo "Secrets prêts."
