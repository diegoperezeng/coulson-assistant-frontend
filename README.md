# Coulson Assistant Frontend

Web UI for Coulson Assistant pre-configuration and operations:

- team management
- participant management (with voice samples)
- video upload per team
- listing and playback of persisted videos

Built with `SvelteKit 2`, `Svelte 5`, `TypeScript`, `Tailwind CSS v4`, and packaged with Docker.

## Access architecture

- Frontend published through Kong at `/coulson-app`
- Backend reached by the frontend through Kong at `/coulson` and `/coulson-api`
- UI access protected by an application password
- Video playback uses signed URLs from private Supabase Storage buckets

## Run locally

This repository is Docker-first:

```sh
docker compose --env-file ".env" up --build -d
```

That rebuilds the image when code changes and starts the `coulson-assistant-frontend` container.

## Environment variables

Create a `.env` file in the frontend root:

```env
PUBLIC_API_BASE_URL=https://yellowleafapps.cloud/coulson
PUBLIC_API_BEARER_TOKEN=<token_jwt>
PUBLIC_ACCESS_PASSWORD=<ui_password>
PUBLIC_COULSON_API_TOKEN=<x_app_token>
```

Notes:

- `PUBLIC_API_BASE_URL` is the REST client base URL
- `PUBLIC_ACCESS_PASSWORD` protects the UI login screen
- `PUBLIC_COULSON_API_TOKEN` is sent as the `X-App-Token` header
- `PUBLIC_API_BEARER_TOKEN` is sent as the `Authorization` header

## Main routes

- `/login`: UI authentication
- `/teams`: team and member CRUD
- `/participants`: participant CRUD and voice samples
- `/videos`: video catalog by team and player
- `/videos/upload`: upload for persistence and transcription

## Build and runtime

- Production build with `vite build`
- Runtime with `adapter-node`
- Container healthcheck at `http://localhost:3000/coulson-app`

## Project layout

- `src/lib/api.ts`: HTTP client and endpoint typings
- `src/lib/auth.ts`: local UI authentication
- `src/lib/components`: reusable components (sidebar, modal, toast, player)
- `src/routes`: pages and navigation flow
- `docker-compose.yml`: container runtime service
- `Dockerfile`: multi-stage build and lean runtime image

## License

This project is licensed under the [MIT License](LICENSE).
