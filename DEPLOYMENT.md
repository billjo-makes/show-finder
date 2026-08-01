# Deploying Show Finder to the Open Web (Free Tier)

This app currently runs locally/on your LAN: SQLite on disk, a CORS rule that trusts any origin on port 5173, and an auth cookie (`sameSite: "lax"`) that assumes client and server share a host closely enough (same host, different port) for the cookie to ride along. None of that holds once client and server live on two different public domains, so a few real code changes are needed before "free hosting" becomes a working app. This document lists them for reference — **nothing here has been implemented yet.**

## Recommended host split

| Piece | Host | Why |
|---|---|---|
| Client (static Vite build) | **Vercel** or **Netlify** | Free static hosting, GitHub-integrated, trivial build config |
| Server (Express API) | **Render** (free web service) or **Fly.io** (free allowance) | Free tier runs Node; both support env vars and GitHub deploys |
| Database | **Neon** or **Supabase** (free Postgres) | Free web-service tiers have *ephemeral disks* — the current SQLite file would be wiped on every redeploy/restart, so SQLite must be replaced with a hosted DB |

## Required code changes (in order)

1. **Swap SQLite → Postgres**
   - `server/prisma/schema.prisma`: change `provider = "sqlite"` to `provider = "postgresql"`.
   - Create a free Neon or Supabase Postgres instance, grab its connection string.
   - Run `prisma migrate deploy` against it once to create tables (existing migrations in `server/prisma/migrations/` should apply cleanly since nothing in the schema is SQLite-specific besides the provider).

2. **Fix cross-site auth cookie**
   - `server/src/services/authService.ts` — `authCookieOptions` currently sets `sameSite: "lax"`. Once client (e.g. `*.vercel.app`) and server (e.g. `*.onrender.com`) are on different domains, that's genuinely cross-site, not just cross-port like LAN — `sameSite: "lax"` cookies are **not** sent on cross-site `fetch`/XHR requests, which would silently break login.
   - Needs `sameSite: "none"` + `secure: true` when running in production (secure is already conditioned on `NODE_ENV === "production"`; sameSite needs the same treatment).

3. **Tighten CORS**
   - `server/src/app.ts` — the current origin check (added for LAN access) allows *any* origin as long as the port matches `CLIENT_URL`'s port. On the public web both sides will likely be on port 443, which would make that check effectively allow-all.
   - Replace with an exact-origin allowlist (e.g. `CLIENT_URL` plus optionally `http://localhost:5173` for continued local dev).

4. **Point the client at the deployed API explicitly**
   - `client/src/api/client.ts` currently falls back to `window.location.hostname` (built for the LAN case, where client and server share a host). In production they won't share a host, so `VITE_API_URL` must be set explicitly at build time to the deployed server URL (e.g. `https://show-finder-api.onrender.com`).

5. **Env vars to set on each host**
   - **Server** (Render/Fly.io): `TMDB_API_KEY`, `JWT_SECRET` (generate a fresh strong value — don't reuse the local dev one), `DATABASE_URL` (from Neon/Supabase), `CLIENT_URL` (the deployed frontend URL), `NODE_ENV=production`. `PORT` is usually injected automatically by the host.
   - **Client** (Vercel/Netlify): `VITE_API_URL` (the deployed server URL).

## Deploy steps

1. Push current `master` to GitHub (already done — repo is at github.com/BillJohk/show-finder).
2. Provision Neon/Supabase Postgres, apply migrations, note the connection string.
3. Create the Render (or Fly.io) web service from the GitHub repo:
   - Build command: `pnpm install && pnpm --filter shared build && pnpm --filter server build`
   - Start command: `pnpm --filter server start` (runs `node dist/index.js`)
   - Root/working directory: repo root (pnpm workspace needs the root `pnpm-workspace.yaml`)
   - Set the server env vars from above.
4. Create the Vercel (or Netlify) static site from the same repo:
   - Build command: `pnpm install && pnpm --filter shared build && pnpm --filter client build`
   - Output directory: `client/dist`
   - Set `VITE_API_URL` to the Render/Fly server's public URL.
5. Once both are live, update the server's `CLIENT_URL` env var to the final Vercel/Netlify URL (needed for the CORS allowlist in step 3 above) and redeploy the server.

## Known free-tier caveats

- Render's free web service **sleeps after inactivity** — first request after idle can take 30-60s to wake up. Fly.io's free allowance behaves similarly for scaled-to-zero apps.
- Neon/Supabase free Postgres tiers have storage/compute caps that are generous for a personal app but not unlimited.
- TMDB's API has its own rate limits — fine for personal use, but something to be aware of if this ever gets real traffic.

## Verification (once implemented)

1. Confirm `prisma migrate deploy` succeeded against the hosted Postgres (check tables exist).
2. Register an account on the deployed URL; confirm the auth cookie is set and `/api/auth/me` succeeds cross-origin (no CORS or cookie errors in the browser console).
3. Rate a few titles, confirm `/for-you` reflects them — same flow already verified locally, just against the hosted stack.
4. Confirm a browser on a different network (e.g. phone on cellular data) can reach the app, proving it's truly public and not just reachable on the LAN.
