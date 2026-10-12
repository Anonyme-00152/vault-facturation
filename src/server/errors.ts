/** Erreur métier dont le message peut être montré tel quel à l'utilisateur. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
