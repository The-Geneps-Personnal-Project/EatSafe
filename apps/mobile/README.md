# EatSafe Mobile (Expo)

## Run
- `cd apps/mobile`
- `npm start`

## Environment
Copy `.env.example` to `.env` and adjust.

Notes:
- Android emulator base URL uses `http://10.0.2.2:8000` by default (see `src/config/env.ts`).
- Deep links: `https://eatsafe.adabin.fr/r/<publicId>` and `eatsafe://r/<publicId>`.

## App Links / Universal Links

To make `https://eatsafe.adabin.fr/r/<publicId>` open the app directly (instead of the browser), see:
- `docs/deep-links.md`

## Backend endpoints expected
- `GET /restaurants/search?q=...`
- `GET /restaurants?city=...`
- `GET /restaurants/detail?siret=...`
- `GET /restaurants/public/:publicId` (to be added)
- `GET /geo/cities?q=...` (to be added; proxy BAN)

More details: `docs/backend-api.md`
