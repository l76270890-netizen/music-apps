# TuneIt frontend

This folder contains the Expo app. Local music playback works offline; account sync is optional and connects to the separate FastAPI service in `../backend`.

## Run locally

```powershell
npm install
npm run dev
```

For web preview, run `npm run web`. For a static production export, run `npm run build:web`; the output is written to `dist/`.

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` only when connecting to a backend. Restart Expo after changing the value. Use `http://127.0.0.1:8000` for a browser on the same computer, `http://10.0.2.2:8000` for the Android emulator, or the computer's LAN IP for a phone on the same Wi-Fi.

## Deploy to Render

The root `render.yaml` defines this app as a Render Static Site. In Render, create a Blueprint from this repository and set `EXPO_PUBLIC_API_URL` to your backend's public Render URL when prompted. If you create the static site manually, use root directory `frontend`, build command `npm ci && npm run build:web`, and publish directory `dist`.

Add the `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` response headers for `/*`, plus a rewrite from `/*` to `/index.html`. These allow Expo SQLite's web build and Expo Router routes to work.

## App icon and splash

`npm run icons` regenerates every icon from one source
(`scripts/generate-icons.js`, artwork in `assets/icon-source.svg`):

- Expo/native: `assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`
- PWA: `public/icons/tuneit-*.png` and `.svg`, `public/manifest.json`
- Android native: `android/app/src/main/res/mipmap-*/ic_launcher*.png` plus the
  adaptive layers in `mipmap-anydpi-v26/`, with the old `.webp` icons removed.

Run it after any icon change **before** building the app, then reinstall the app
(Android caches launcher icons per install). For iOS, run
`npx expo prebuild --clean --platform ios` so `Assets.xcassets` picks up
`assets/icon.png`. Bumping `versionCode` in `android/app/build.gradle` also forces
Android to refresh the launcher icon on update.
