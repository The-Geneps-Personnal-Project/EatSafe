import { http } from "./http";
import { mockEnsurePublicIdForSiret, shouldUseMockApi } from "../dev/mockApi";

export type PublicIdResponse = {
  publicId?: string;
  public_id?: string;
};

export async function ensurePublicIdForSiret(siret: string): Promise<string> {
  if (await shouldUseMockApi()) return await mockEnsurePublicIdForSiret(siret);
  // Backend to implement: POST /restaurants/public { siret }
  try {
    const res = await http.post<PublicIdResponse>("/restaurants/public", {
      siret,
    });
    const id = res.publicId ?? res.public_id;
    if (!id) throw new Error("publicId manquant");
    return id;
  } catch (e) {
    if (__DEV__) return await mockEnsurePublicIdForSiret(siret);
    throw e;
  }
}

export function buildShareUrl(publicId: string) {
  return `https://eatsafe.adabin.fr/r/${encodeURIComponent(publicId)}`;
}
