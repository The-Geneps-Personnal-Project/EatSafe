# Backend API contract (mobile)

This document describes the HTTP endpoints the **mobile app** calls.

- Base URL is configured via `EXPO_PUBLIC_API_URL`.
- All endpoints are called with `Content-Type: application/json`.

## Existing backend (reference)

A reference backend is included in this repo under `eatsafebackend-main/`.
It currently exposes (at least):

- `GET /restaurants`
- `GET /restaurants/search`
- `GET /restaurants/detail`

See `eatsafebackend-main/routers/restaurant_router.py`.

## Endpoints used by the mobile app

### Search restaurants

- **Route**: `GET /restaurants/search?q=<string>`
- **Used by**: `src/services/restaurantService.ts` → `searchRestaurants()`
- **Status**: ✅ exists in reference backend

### Restaurants by city

- **Route**: `GET /restaurants?city=<string>`
- **Used by**: `src/services/restaurantService.ts` → `fetchRestaurantsByCity()`
- **Status**: ✅ exists in reference backend

### Restaurant details (by SIRET)

- **Route**: `GET /restaurants/detail?siret=<string>`
- **Used by**: `src/services/restaurantService.ts` → `fetchRestaurantDetailBySiret()`
- **Status**: ✅ exists in reference backend

### City search (France)

- **Route**: `GET /geo/cities?q=<string>`
- **Used by**: `src/services/geoService.ts` → `searchCities()`
- **Expected response**: `CityHit[]` where `CityHit` contains at least:
  - `city: string`
  - `lat: number`
  - `lng: number`
- **Status**: ❌ not in reference backend (planned)
- **Notes**: We previously discussed using BAN (Base Adresse Nationale) as a free provider.

### Public share link (no SIRET in URL)

To share a restaurant without exposing SIRET in the URL, the mobile app uses a `publicId`.

- **Create or retrieve mapping**
  - **Route**: `POST /restaurants/public`
  - **Body**: `{ "siret": "<string>" }`
  - **Response**: `{ "publicId": "<string>" }` (also accepts `{ "public_id": "<string>" }` for backward compatibility)
  - **Used by**: `src/services/shareService.ts` → `ensurePublicIdForSiret()`
  - **Status**: ❌ not in reference backend (planned)

- **Resolve publicId to restaurant details**
  - **Route**: `GET /restaurants/public/<publicId>`
  - **Response**: same shape as `/restaurants/detail?siret=...`
  - **Used by**: `src/services/restaurantService.ts` → `fetchRestaurantDetailByPublicId()`
  - **Status**: ❌ not in reference backend (planned)

### Push notifications token registration

- **Route**: `POST /notifications/register`
- **Body**: `{ "token": "ExponentPushToken[...]" }`
- **Used by**: `src/services/notificationsService.ts` → `sendPushTokenToBackend()`
- **Status**: ❌ not in reference backend (planned)

## Deep links

- Shared links use: `https://eatsafe.adabin.fr/r/<publicId>`
- Landing pages (static) live in `landing/`.
- App linking is configured to handle `eatsafe://r/<publicId>` and `https://eatsafe.adabin.fr/r/<publicId>`.
