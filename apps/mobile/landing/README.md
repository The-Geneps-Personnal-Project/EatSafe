# EatSafe landing (deep links)

This folder is a tiny static website used for shared links.

## Routes

- `/` generic landing
- `/r/:publicId` restaurant deep link (does **not** expose SIRET)

## Configure

Edit `config.js`:

- `APP_SCHEME`: default `eatsafe://`
- `ANDROID_STORE_URL`: Play Store URL
- `IOS_STORE_URL`: App Store URL

## Deploy

Host this folder as a static website.

Typical mapping:
- `https://eatsafe.adabin.fr/` -> `landing/index.html`
- `https://eatsafe.adabin.fr/r/<publicId>` -> `landing/r/index.html` (or a rewrite rule)
