import { HttpError } from "../services/http";

export function toErrorMessage(err: unknown): string {
  if (err instanceof HttpError) {
    if (err.status === 0) {
      return "Impossible de contacter le serveur. Vérifie ta connexion.";
    }

    if (err.status === 400) return "Requête invalide.";
    if (err.status === 401) return "Session expirée. Reconnecte-toi.";
    if (err.status === 403) return "Accès refusé.";
    if (err.status === 404) return "Ressource introuvable.";
    if (err.status === 408) return "Temps d’attente dépassé. Réessaie.";
    if (err.status === 429) return "Trop de requêtes. Réessaie plus tard.";
    if (err.status >= 500)
      return "Le serveur rencontre un problème. Réessaie plus tard.";

    return "Une erreur est survenue.";
  }

  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as any).message === "string"
  ) {
    return (err as any).message;
  }
  return "Une erreur est survenue";
}
