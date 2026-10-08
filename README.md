# TuneIt

TuneIt is organized as a small monorepo with independent frontend and backend services:

- `frontend/` — Expo music player. Deploy this directory to Render as a Static Site.
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
| Render Static Site | `frontend` | `npm ci && npm run build:web`; publish `dist` |
| Render Web Service | `backend` | `pip install -r requirements.txt`; start with `uvicorn main:app --host 0.0.0.0 --port $PORT` |

The root `render.yaml` configures the frontend as a Render Static Site. Set `EXPO_PUBLIC_API_URL` to the backend's Render URL when prompted. Set `CORS_ORIGINS` on the backend to the frontend's Render origin. See [backend/README.md](backend/README.md) for the backend's required database and security variables.
