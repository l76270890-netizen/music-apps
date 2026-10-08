# TuneIt

TuneIt is organized as a small monorepo with independent frontend and backend services:

- `frontend/` — Expo music player. Deploy this directory to Vercel.
- `backend/` — FastAPI account and metadata sync API. Deploy this directory to Render.

The app's local music playback works offline. The backend is optional and stores account details and music metadata; it never uploads audio files or local file paths.

## Run locally

Install and start the frontend:

```powershell
Set-Location frontend
npm install
npm run dev
```

To run the backend, follow [backend/README.md](backend/README.md). For local sync, copy `frontend/.env.example` to `frontend/.env` and set `EXPO_PUBLIC_API_URL` to the backend address reachable by your device. Restart Expo after changing it.

## Deploy

Deploy the two services from this repository using these independent root directories:

| Host | Root directory | Build / start |
| --- | --- | --- |
| Vercel | `frontend` | `npx expo export --platform web`; output `dist` |
| Render Web Service | `backend` | `pip install -r requirements.txt`; start with `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Set `EXPO_PUBLIC_API_URL` in Vercel to the Render service URL. Set `CORS_ORIGINS` in Render to the deployed Vercel origin. See [backend/README.md](backend/README.md) for the backend's required database and security variables.
