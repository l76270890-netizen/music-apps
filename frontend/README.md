# TuneIt frontend

This folder contains the Expo app and its Vercel deployment configuration. Local music playback works offline; account sync is optional and connects to the separate FastAPI service in `../backend`.

## Run locally

```powershell
npm install
npm run dev
```

For web preview, run `npm run web`. For a static production export, run `npm run build:web`; the output is written to `dist/`.

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` only when connecting to a backend. Restart Expo after changing the value. Use `http://127.0.0.1:8000` for a browser on the same computer, `http://10.0.2.2:8000` for the Android emulator, or the computer's LAN IP for a phone on the same Wi-Fi.

## Vercel

Create a Vercel project from this repository and set **Root Directory** to `frontend`. The `vercel.json` in this folder configures the Expo web export and `dist` output. Set `EXPO_PUBLIC_API_URL` to the Render backend URL in the Vercel project environment variables.
