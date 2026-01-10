import type { CityHit } from "../types/city";
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
  types?: string[];
}> = [
  {
    siret: "11111111111111",
    name: "Bistrot du Canal",
    lat: 48.8876,
    lng: 2.3651,
    address: "12 Quai de Jemmapes",
    city: "Paris",
    sanitary_score: 3,
    types: ["bistro", "restaurant"],
  },
  {
    siret: "22222222222222",
    name: "La Table des Halles",
    lat: 45.764,
    lng: 4.8357,
    address: "5 Rue de la République",
    city: "Lyon",
    sanitary_score: 2,
    types: ["french_restaurant", "restaurant"],
  },
  {
    siret: "33333333333333",
    name: "Casa Napoli",
    lat: 43.2965,
    lng: 5.3698,
    address: "18 Rue Sainte",
    city: "Marseille",
    sanitary_score: 4,
    types: ["italian_restaurant", "restaurant"],
  },
  {
    siret: "44444444444444",
    name: "Brasserie du Port",
    lat: 43.6047,
    lng: 1.4442,
    address: "3 Allées Jean Jaurès",
    city: "Toulouse",
    sanitary_score: 2,
    types: ["brasserie", "restaurant"],
  },
  {
    siret: "55555555555555",
    name: "Sushi Sakura",
    lat: 47.2184,
    lng: -1.5536,
    address: "9 Rue Crébillon",
    city: "Nantes",
    sanitary_score: 3,
    types: ["sushi", "japanese_restaurant"],
  },
  {
    siret: "66666666666666",
    name: "Le Comptoir des Saveurs",
    lat: 50.6292,
    lng: 3.0573,
    address: "20 Rue de Béthune",
    city: "Lille",
    sanitary_score: 1,
    types: ["restaurant"],
  },
  {
    siret: "77777777777777",
    name: "Café des Docks",
    lat: 43.7102,
    lng: 7.262,
    address: "2 Avenue Jean Médecin",
    city: "Nice",
    sanitary_score: 2,
    types: ["cafe", "restaurant"],
  },
  {
    siret: "88888888888888",
    name: "Le Petit Jardin",
    lat: 43.6119,
    lng: 3.8772,
    address: "7 Rue de la Loge",
    city: "Montpellier",
    sanitary_score: 3,
    types: ["restaurant"],
  },
  {
    siret: "99999999999999",
    name: "Osteria Roma",
    lat: 48.5734,
    lng: 7.7521,
    address: "4 Rue des Grandes Arcades",
    city: "Strasbourg",
    sanitary_score: 4,
    types: ["italian_restaurant", "restaurant"],
  },
  {
    siret: "10101010101010",
    name: "Crêperie de la Cathédrale",
    lat: 48.1173,
    lng: -1.6778,
    address: "10 Place Sainte-Anne",
    city: "Rennes",
    sanitary_score: 2,
    types: ["creperie", "restaurant"],
  },
];

const majorCities: Array<{ city: string; lat: number; lng: number }> = [
  { city: "Paris", lat: 48.8566, lng: 2.3522 },
  { city: "Marseille", lat: 43.2965, lng: 5.3698 },
  { city: "Lyon", lat: 45.764, lng: 4.8357 },
  { city: "Toulouse", lat: 43.6047, lng: 1.4442 },
  { city: "Nice", lat: 43.7102, lng: 7.262 },
  { city: "Nantes", lat: 47.2184, lng: -1.5536 },
  { city: "Montpellier", lat: 43.6119, lng: 3.8772 },
  { city: "Strasbourg", lat: 48.5734, lng: 7.7521 },
  { city: "Bordeaux", lat: 44.8378, lng: -0.5792 },
  { city: "Lille", lat: 50.6292, lng: 3.0573 },
  { city: "Rennes", lat: 48.1173, lng: -1.6778 },
];

export const mockCities: CityHit[] = majorCities.map((c) => ({
  label: c.city,
  city: c.city,
  lat: c.lat,
  lng: c.lng,
}));

function makeSiret(cityIndex: number, idx: number): string {
  // Deterministic fake SIRET (14 digits) within JS safe integer range.
  const n = 70000000000000 + cityIndex * 100 + idx;
  return String(n).padStart(14, "0");
}

function generateRestaurantsForCity(
  cityIndex: number,
  city: string,
  center: { lat: number; lng: number },
  count: number
): Array<{
  siret: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  sanitary_score: number;
  types?: string[];
}> {
  const streetNames = [
    "Rue de la République",
    "Rue Victor Hugo",
    "Avenue de la Gare",
    "Rue Nationale",
    "Boulevard des Arts",
    "Rue des Lilas",
    "Avenue du Marché",
    "Rue du Port",
    "Rue des Écoles",
    "Place Centrale",
  ];

  const kinds = [
    "Bistrot",
    "Brasserie",
    "Café",
    "Cantine",
    "Table",
    "Cuisine",
    "Comptoir",
    "Atelier",
    "Maison",
    "Restaurant",
  ];

  const kindToType: Record<string, string> = {
    Bistrot: "bistro",
    Brasserie: "brasserie",
    Café: "cafe",
    Cantine: "canteen",
    Table: "restaurant",
    Cuisine: "restaurant",
    Comptoir: "restaurant",
    Atelier: "restaurant",
    Maison: "restaurant",
    Restaurant: "restaurant",
  };

  const items: Array<{
    siret: string;
    name: string;
    lat: number;
    lng: number;
    address: string;
    city: string;
    sanitary_score: number;
    types?: string[];
  }> = [];

  for (let i = 0; i < count; i++) {
    const latJitter = ((i % 5) - 2) * 0.004 + i * 0.00025;
    const lngJitter = ((Math.floor(i / 5) % 5) - 2) * 0.006 + i * 0.00018;
    const siret = makeSiret(cityIndex, i);
    const kind = kinds[i % kinds.length]!;
    const street = streetNames[i % streetNames.length]!;
    const num = 8 + i;
    const score = (i % 4) + 1;

    items.push({
      siret,
      name: `${kind} ${city} ${i + 1}`,
      lat: Number((center.lat + latJitter).toFixed(6)),
      lng: Number((center.lng + lngJitter).toFixed(6)),
      address: `${num} ${street}`,
      city,
      sanitary_score: score,
      types: [kindToType[kind] ?? "restaurant"],
    });
  }

  return items;
}

const generated = majorCities.flatMap((c, idx) =>
  generateRestaurantsForCity(idx, c.city, { lat: c.lat, lng: c.lng }, 10)
);

const allBase = [...base, ...generated];

export const mockRestaurants: MockRestaurant[] = allBase.map((r) => ({
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
