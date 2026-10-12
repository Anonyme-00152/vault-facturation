import "next-auth";
import "next-auth/jwt";

// Le jeton de session ne contient qu'un identifiant opaque : aucune donnée personnelle.
declare module "next-auth" {
  interface Session {
    sid?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sid?: string;
  }
}
