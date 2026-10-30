# Production deployment

This repository deploys the React/Vite frontend to GitHub Pages and the Express API to Render. Supabase remains the database, authentication and storage provider. No database or authentication policy changes are required.

## GitHub Pages

The GitHub repository is `Adwoa-cell/Westbourne-University`. Its Pages URL is:

`https://adwoa-cell.github.io/Westbourne-University/`

1. In the repository's **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
2. In **Settings → Secrets and variables → Actions → Variables**, add:
   - `VITE_API_BASE_URL`: the Render API origin, e.g. `https://<your-render-service>.onrender.com` (no trailing slash).
   - `VITE_SUPABASE_URL`: the Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: the Supabase publishable key (or legacy anon key).
3. Push changes to `phase2-integration` to run `.github/workflows/deploy-pages.yml`. The workflow also supports manual dispatch. It builds with the repository base path and copies the app entry point to `404.html` so direct visits and refreshes on nested routes load the React Router route.

These `VITE_` values are intentionally public and become part of the frontend bundle. Do not put a Supabase service-role/secret key or any other private credential in frontend variables. The workflow requires no GitHub Actions secrets.

For local development, copy `frontend/.env.example` to `frontend/.env`, fill in the Supabase URL and publishable/anon key, and leave `VITE_API_BASE_URL` empty. Vite serves at `/` locally and proxies `/api` to `http://localhost:4000`.

## Render backend

Create a **Web Service** from this repository with:

- **Root directory:** `backend`
- **Runtime:** Node
- **Build command:** `npm ci`
- **Start command:** `npm start`
- **Node version:** 22 or newer (the backend declares `"node": ">=22"`).
- **Health check path:** `/health`

Render supplies `PORT` to the process. The server listens on that port; do not hard-code a production port. Add these environment variables in the Render service settings:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://adwoa-cell.github.io` (origin only; no repository path) |
| `TRUST_PROXY` | `1` |
| `DATA_SOURCE` | `supabase` |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role/secret key; backend only |

`PORT` is assigned by Render. `CONTACT_STORE_PATH` is only for local contact-message storage and is not required when using the configured Supabase data source. Keep the service-role key only in Render's private environment settings; never add it to GitHub variables, the frontend, or this repository.

The API permits only origins listed in `CORS_ORIGINS`; configure the Pages origin exactly as shown. Do not use `*`.

## Supabase authentication redirects

In Supabase **Authentication → URL Configuration**:

- Set **Site URL** to `https://adwoa-cell.github.io/Westbourne-University/`.
- Add these **Redirect URLs**:
  - `https://adwoa-cell.github.io/Westbourne-University/auth/callback`
  - `https://adwoa-cell.github.io/Westbourne-University/reset-password`
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/reset-password`

The frontend builds verification and password-reset redirect URLs using Vite's configured base path, so production callbacks include `/Westbourne-University/` while local callbacks remain at the local root. Keep email verification and the existing RLS policies enabled.

## Release checklist

1. Confirm all three GitHub Actions variables and the Render environment values above are set.
2. Confirm GitHub Pages is configured to use GitHub Actions and Supabase has both production redirect URLs.
3. Push to `phase2-integration` only when ready to trigger the Pages workflow; deploy the Render service through its configured deployment process.
4. Verify `/health`, public API reads, sign-in, email verification, password reset, and protected administrator routes on the deployed site. Confirm the administrator role and database policies using the existing Supabase setup/security checks.
