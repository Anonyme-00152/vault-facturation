import "server-only";
import pino from "pino";

/**
 * Chemins masqués dans tous les logs. Une donnée sensible ne doit jamais
 * atteindre la sortie standard, même par accident (objet loggé en entier).
 */
export const REDACTED_PATHS = [
  "password",
  "*.password",
  "newPassword",
  "*.newPassword",
  "passwordHash",
  "*.passwordHash",
  "token",
  "*.token",
  "code",
  "*.code",
  "totp",
  "*.totp",
  "totpSecret",
  "*.totpSecret",
  "secret",
  "*.secret",
  "email",
  "*.email",
  "phone",
  "*.phone",
  "address",
  "*.address",
  "iban",
  "*.iban",
  "cookie",
  "*.cookie",
  "authorization",
  "*.authorization",
  "headers.cookie",
  "headers.authorization",
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { app: "vault-facturation" },
  redact: { paths: REDACTED_PATHS, censor: "[masqué]" },
  timestamp: pino.stdTimeFunctions.isoTime,
});
