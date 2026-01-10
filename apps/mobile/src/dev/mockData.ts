import type { Restaurant, RestaurantDetails } from "../types/restaurant";

type MockRestaurant = Restaurant & { public_id: string };

function hashToPublicId(siret: string) {
  // Simple non-crypto hash to avoid exposing siret in URLs.
  let h = 2166136261;
  for (let i = 0; i < siret.length; i++) {
    h ^= siret.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = (h >>> 0).toString(36);
  return `p_${n}`;
}

const base: Array<{
  siret: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  sanitary_score: number;
}> = [
  {
    siret: "11111111111111",
    name: "Bistrot du Canal",
    lat: 48.8876,
    lng: 2.3651,
    address: "12 Quai de Jemmapes",
    city: "Paris",
    sanitary_score: 3,
  },
  {
    siret: "22222222222222",
    name: "La Table des Halles",
    lat: 45.764,
    lng: 4.8357,
    address: "5 Rue de la République",
    city: "Lyon",
    sanitary_score: 2,
  },
  {
    siret: "33333333333333",
    name: "Casa Napoli",
    lat: 43.2965,
    lng: 5.3698,
    address: "18 Rue Sainte",
    city: "Marseille",
    sanitary_score: 4,
  },
  {
    siret: "44444444444444",
    name: "Brasserie du Port",
    lat: 43.6047,
    lng: 1.4442,
    address: "3 Allées Jean Jaurès",
    city: "Toulouse",
    sanitary_score: 2,
  },
  {
    siret: "55555555555555",
    name: "Sushi Sakura",
    lat: 47.2184,
    lng: -1.5536,
    address: "9 Rue Crébillon",
    city: "Nantes",
    sanitary_score: 3,
  },
  {
    siret: "66666666666666",
    name: "Le Comptoir des Saveurs",
    lat: 50.6292,
    lng: 3.0573,
    address: "20 Rue de Béthune",
    city: "Lille",
    sanitary_score: 1,
  },
  {
    siret: "77777777777777",
    name: "Café des Docks",
    lat: 43.7102,
    lng: 7.262,
    address: "2 Avenue Jean Médecin",
    city: "Nice",
    sanitary_score: 2,
  },
  {
    siret: "88888888888888",
    name: "Le Petit Jardin",
    lat: 43.6119,
    lng: 3.8772,
    address: "7 Rue de la Loge",
    city: "Montpellier",
    sanitary_score: 3,
  },
  {
    siret: "99999999999999",
    name: "Osteria Roma",
    lat: 48.5734,
    lng: 7.7521,
    address: "4 Rue des Grandes Arcades",
    city: "Strasbourg",
    sanitary_score: 4,
  },
  {
    siret: "10101010101010",
    name: "Crêperie de la Cathédrale",
    lat: 48.1173,
    lng: -1.6778,
    address: "10 Place Sainte-Anne",
    city: "Rennes",
    sanitary_score: 2,
  },
];

export const mockRestaurants: MockRestaurant[] = base.map((r) => ({
  ...r,
  public_id: hashToPublicId(r.siret),
}));

export const mockDetailsBySiret: Record<string, RestaurantDetails> =
  Object.fromEntries(
    mockRestaurants.map((r) => {
      const details: RestaurantDetails = {
        ...r,
        inspection_date: "2025-12-12",
        sanitary_score_label:
          r.sanitary_score >= 4
            ? "À éviter"
            : r.sanitary_score >= 3
            ? "Moyen"
            : r.sanitary_score >= 2
            ? "OK"
            : "Très bien",
        opening_hours: {
          open_now: true,
          weekdayDescriptions: [
            "Lundi: 12:00–14:30, 19:00–22:30",
            "Mardi: 12:00–14:30, 19:00–22:30",
            "Mercredi: 12:00–14:30, 19:00–22:30",
            "Jeudi: 12:00–14:30, 19:00–23:00",
            "Vendredi: 12:00–14:30, 19:00–23:00",
            "Samedi: 12:00–15:00, 19:00–23:00",
            "Dimanche: Fermé",
          ],
        },
        photos: [
          {
            url: `https://picsum.photos/seed/${encodeURIComponent(
              r.siret
            )}a/800/600`,
          },
          {
            url: `https://picsum.photos/seed/${encodeURIComponent(
              r.siret
            )}b/800/600`,
          },
          {
            url: `https://picsum.photos/seed/${encodeURIComponent(
              r.siret
            )}c/800/600`,
          },
        ],
        reviews: [
          {
            author_name: "Camille",
            rating: 4,
            text: "Bon rapport qualité/prix. Service rapide.",
            relative_time_description: "il y a 2 semaines",
          },
          {
            author_name: "Mehdi",
            rating: 3,
            text: "Correct, mais un peu bruyant.",
            relative_time_description: "il y a 1 mois",
          },
        ],
      };
      return [r.siret, details] as const;
    })
  );

export const mockPublicIdToSiret: Record<string, string> = Object.fromEntries(
  mockRestaurants.map((r) => [r.public_id, r.siret] as const)
);
