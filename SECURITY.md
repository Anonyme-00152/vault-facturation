# Sécurité de Vault Facturation

Ce document décrit les mesures de sécurité en place, les compromis assumés, et ce qu'il
resterait à faire avant d'héberger de vraies données clients. Vault Facturation est un
projet de portfolio : **toutes les données de démonstration sont fictives**.

## Signaler une vulnérabilité

Ouvrez une [demande privée de signalement](https://docs.github.com/fr/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
sur le dépôt GitHub, plutôt qu'une issue publique. Merci de ne tester que la démonstration
publique, et uniquement avec les comptes de démonstration.

## Modèle de menace (résumé)

| Menace | Réponse principale |
|---|---|
| Vol ou devinette de mot de passe | Argon2id, 12 caractères minimum, 2FA TOTP obligatoire, verrouillage temporaire |
| Session volée ou oubliée ouverte | Cookie `__Host-` httpOnly, Secure, SameSite=Strict ; session en base révocable ; 15 min d'inactivité ; 12 h maximum |
| Collaborateur qui exfiltre des données | Rôles minimaux, charte acceptée et tracée, consultation des fiches journalisée, PDF filigranés au nom de l'exportateur |
| Fuite de la base de données | Email, téléphone, adresse et secret TOTP chiffrés en AES-256-GCM ; clés hors base ; mots de passe et codes hachés |
| Falsification des traces | Journal en ajout seul imposé par PostgreSQL, chaîné par empreintes SHA-256, vérifiable |
| Fraude comptable | Numérotation continue sous verrou, facture émise inaltérable même en SQL direct |
| XSS, clickjacking, CSRF | CSP stricte par nonce, `frame-ancestors 'none'`, actions serveur protégées par l'origine, SameSite=Strict |

## Mesures en place

### Authentification
- **Comptes personnels** uniquement, créés par un administrateur avec un mot de passe provisoire à changer à la première connexion.
- **Mots de passe** hachés en Argon2id (19 Mio, 2 itérations, paramètres OWASP). Politique : 12 caractères minimum, refus des mots de passe courants, de l'email et du nom ; jauge de robustesse.
- **Double authentification TOTP obligatoire** (RFC 6238, compatible Google Authenticator) : activation par QR code, secret chiffré, tolérance de ±30 s, **protection contre le rejeu** (un code déjà utilisé est refusé), 10 codes de secours à usage unique stockés hachés.
- **Limitation et verrouillage** (compteurs atomiques en PostgreSQL, fonctionnent avec plusieurs instances) :
  - 30 tentatives par IP et par quart d'heure ;
  - 5 échecs pour un compte depuis une IP → verrouillage 15 min ;
  - 20 échecs pour un compte toutes IP confondues → verrouillage 15 min (attaque distribuée) ;
  - 5 codes 2FA erronés → session révoquée.
- **Pas d'énumération de comptes** : même message d'erreur et même temps de réponse (hash factice) que l'email existe ou non.

### Sessions
- Auth.js gère un cookie chiffré (JWE) qui ne contient **qu'un identifiant opaque** ; l'état réel est en base, sous forme d'empreinte.
- Cookie `__Host-vault.session` : httpOnly, Secure, SameSite=Strict, sans domaine.
- Expiration absolue de 12 h ; **déconnexion après 15 minutes d'inactivité vérifiée côté serveur** ; minuteur visible et avertissement avant fermeture.
- Révocation : déconnexion, changement de mot de passe (autres sessions), désactivation du compte, réinitialisation de la 2FA.

### Contrôle d'accès
- **Parcours imposé côté serveur** : mot de passe → 2FA → (changement de mot de passe) → **charte acceptée** → données. Le proxy Next.js bloque toutes les pages `/app` et routes `/api` tant qu'une étape manque ; désactiver JavaScript n'ouvre rien.
- **Défense en profondeur** : chaque page, action serveur et route d'API rappelle `requireAccess(permission)` ; le proxy n'est jamais le seul rempart.
- **RBAC** : matrice dans `src/lib/permissions.ts`, testée unitairement et de bout en bout. Tout refus est journalisé et renvoie une vraie page 403.
- **Charte versionnée** : acceptation enregistrée avec utilisateur, date, IP, navigateur et version ; toute nouvelle version bloque l'accès jusqu'à réacceptation.

### Données
- **Chiffrement par champ** AES-256-GCM (email, téléphone, adresse, copie client figée sur les factures, secret TOTP) : IV aléatoire de 96 bits, tag de 128 bits, **contexte authentifié** (champ + identifiant de l'enregistrement) pour empêcher de déplacer un chiffré.
- **Rotation de clés** : chaque valeur porte l'identifiant de sa clé ; les anciennes clés restent utilisables en lecture (`ENCRYPTION_KEYS_PREVIOUS`).
- **Index aveugle** HMAC-SHA256 pour retrouver un client par email sans rien déchiffrer. Sous-clés dérivées par HKDF : un secret ne sert jamais à deux usages.
- **Minimisation** : seuls les champs utiles à la facturation sont collectés.

### Intégrité (imposée par PostgreSQL)
- **Journal d'audit en ajout seul** : triggers refusant `UPDATE`, `DELETE` et `TRUNCATE`. Chaque entrée est chaînée à la précédente par SHA-256, calculé par la base sous verrou consultatif. Une vérification recalcule toute la chaîne et désigne la première entrée altérée (testé en simulant un administrateur de base malveillant).
- **Factures émises inaltérables** : un trigger refuse toute modification des montants, dates, lignes et identités figées, et toute suppression avant 10 ans.
- **Numérotation sans trou** : compteur incrémenté dans la transaction d'émission (`INSERT … ON CONFLICT … RETURNING`) ; un échec annule l'incrément. Testé avec 20 émissions simultanées.
- **Contraintes CHECK** : TTC = HT + TVA, format des numéros, taux de TVA autorisés, SIRET, délai de paiement ≤ 60 jours.

### Application web
- **CSP stricte** avec nonce par requête et `strict-dynamic`, aucun domaine tiers (polices auto-hébergées, scène 3D générée par le code sans fichier externe).
- En-têtes : HSTS (2 ans, preload), `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, pas d'en-tête `X-Powered-By`.
- **CSRF** : actions serveur Next.js vérifiant l'origine, cookie SameSite=Strict, `form-action 'self'`.
- **Validation Zod** de toutes les entrées côté serveur ; identifiants contrôlés avant requête.
- **Export CSV** protégé contre l'injection de formules (cellules commençant par `= + - @`).
- **Journaux techniques** (pino) avec masquage automatique des champs sensibles ; les métadonnées d'audit refusent toute clé évoquant une donnée personnelle de client.
- **Secrets** uniquement en variables d'environnement, validées au démarrage (l'application refuse de démarrer si une clé manque) ; `docker compose` génère ses propres secrets au premier lancement, rien n'est versionné.
- Routes de tâches planifiées protégées par secret partagé (comparaison à temps constant).

## Compromis assumés

- **`style-src 'unsafe-inline'`** : nécessaire pour les attributs `style` rendus côté serveur (Radix, animations). Les scripts, eux, restent strictement contrôlés par nonce ; le risque résiduel (injection CSS) est faible.
- **Auth.js v5 est en version bêta**, et le projet est désormais maintenu par l'équipe Better Auth. Il est utilisé ici pour le cookie chiffré ; toute la logique sensible (sessions, 2FA, verrouillage) est propre à l'application et testée.
- **Mode démonstration** (`DEMO_MODE=true`) : boutons de remplissage des comptes de démo et affichage du code TOTP courant **pour ces seuls comptes**, données réinitialisées chaque nuit. À ne jamais activer avec de vraies données.
- **Chaîne d'audit non ancrée** : un administrateur disposant de tous les droits sur la base pourrait recalculer toute la chaîne. Voir « à faire ».
- **Un seul rôle de base de données** : les triggers protègent l'intégrité, mais l'application possède techniquement le droit de les désactiver.
- L'adresse IP vient de `X-Forwarded-For`, fiable derrière Vercel ou le proxy Docker, pas exposé directement.

## À faire avant une vraie mise en production

1. **Hébergement** : contrat de sous-traitance (article 28 du RGPD) avec l'hébergeur et la base de données, hébergement dans l'UE vérifié (idéalement chez un acteur européen), analyse des transferts.
2. **Sauvegardes** chiffrées, externalisées, avec **tests de restauration** réguliers ; plan de reprise d'activité.
3. **Test d'intrusion** par un prestataire indépendant, puis campagne de correction ; revue de code sécurité.
4. **Rôles de base séparés** : rôle applicatif sans droit `ALTER`/`TRUNCATE`, `INSERT`/`SELECT` seulement sur `audit_log` ; migrations avec un rôle distinct.
5. **Gestion des clés** dans un KMS ou HSM, procédure de rotation documentée et testée, séparation des clés par environnement.
6. **Ancrage du journal d'audit** : export périodique de la dernière empreinte vers un stockage WORM ou horodatage qualifié (RFC 3161).
7. **Supervision** : alertes sur les verrouillages, refus d'accès et échecs 2FA, centralisation des journaux (SIEM), WAF et protection anti-robots.
8. **Analyse d'impact (AIPD)** et registre des traitements complet, désignation d'un DPO, procédure de violation de données (72 h).
9. **Facturation électronique** : la réforme impose la réception (2026) puis l'émission (2027 pour les PME) via une plateforme agréée, au format Factur-X, UBL ou CII.
10. **Renforcements** : clés d'accès (passkeys / WebAuthn), vérification des mots de passe compromis (Have I Been Pwned, k-anonymat), rapports de violation CSP, analyse des dépendances (Dependabot activé) et des secrets dans la CI.
