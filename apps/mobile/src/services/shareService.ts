import { http } from "./http";

export type PublicIdResponse = {
  publicId?: string;
  public_id?: string;
};

export async function ensurePublicIdForSiret(siret: string): Promise<string> {
  // Backend to implement: POST /restaurants/public { siret }
  const res = await http.post<PublicIdResponse>("/restaurants/public", {
    siret,
  });
  const id = res.publicId ?? res.public_id;
  if (!id) throw new Error("publicId manquant");
  return id;
}

export function buildShareUrl(publicId: string) {
  return `https://eatsafe.adabin.fr/r/${encodeURIComponent(publicId)}`;
}
