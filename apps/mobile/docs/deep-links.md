# Deep links (Universal Links / App Links)

The app supports these link formats:

- Custom scheme: `eatsafe://r/<publicId>`
- HTTPS: `https://eatsafe.adabin.fr/r/<publicId>` (recommended for sharing)

The routing inside the app is handled by React Navigation linking config.

This document explains how to make the HTTPS links open the app directly at the OS level.

## iOS (Universal Links)

### 1) App config

In `app.json`, the app declares:

- `ios.associatedDomains`: `applinks:eatsafe.adabin.fr`

### 2) Host the AASA file

Your website must serve the **Apple App Site Association** file at:

- `https://eatsafe.adabin.fr/.well-known/apple-app-site-association`

Notes:
- The file has **no extension**.
- It must be served with `Content-Type: application/json`.

This repo includes a template at:

- `landing/.well-known/apple-app-site-association`

Replace:
- `REPLACE_WITH_APPLE_TEAM_ID` with your Apple Developer **Team ID**.

## Android (App Links)

### 1) App config

In `app.json`, the app declares an intent filter for:

- `https://eatsafe.adabin.fr/r/*`

### 2) Host the asset links file

Your website must serve the Android Digital Asset Links file at:

- `https://eatsafe.adabin.fr/.well-known/assetlinks.json`

This repo includes a template at:

- `landing/.well-known/assetlinks.json`

Replace:
- `REPLACE_WITH_YOUR_SHA256_FINGERPRINT` with the signing certificate SHA256 fingerprint.

For EAS builds, you can retrieve the fingerprint from your keystore / credentials, then paste it here.

## Quick verification

- iOS: once installed, opening `https://eatsafe.adabin.fr/r/<publicId>` should open the app.
- Android: after `autoVerify` succeeds, the same link should open the app without a chooser.

If verification fails, the app will still work via the landing page fallback (open app button / store redirect).
