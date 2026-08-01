# Show Finder

A personal web app for finding movies and TV shows based on your preferences. Rate titles 1-5 stars and get a "For You" page that gets more personalized as you rate more.

Repo: https://github.com/BillJohk/show-finder

## Features

- **Accounts** — register/log in with email + password; sessions via an httpOnly cookie.
- **Profiles** — Netflix-style: one account can have multiple named profiles (e.g. "Bill", "Kids"). Each profile has its own ratings and its own "For You" recommendations. New accounts get a profile automatically; if an account has more than one, you pick one at login via the "Who's watching?" screen. Switch profiles anytime from the nav bar, and add/rename/delete them from "Manage Profiles" — there's no limit on how many a single account can have, and no separate PIN per profile.
- **Browse** — search movies/TV, or discover by genre with trending results as the default.
- **Title detail** — overview, cast, genres, "More like this" (TMDB similar titles), and a 1-5 star rating control.
- **For You** — personalized recommendations once the active profile has rated 3+ titles, with a banner explaining which genres drove the picks (e.g. "Because you rated Action, Science Fiction, Adventure highly"). Before that threshold, it falls back to what's trending.
- **Account** — see and remove the active profile's ratings.

### How recommendations work

Implemented in `server/src/services/recommendationService.ts`, scoped to the currently active profile (not the account as a whole — each profile builds its own taste graph):

1. Each of the profile's ratings contributes `(stars - 3)` to that title's genres — so 5★ pushes a genre's score up, 1★ pushes it down.
2. The top 3 positive-scoring genres feed a TMDB "discover" query.
3. Results are blended with TMDB's "similar titles" for the profile's 2 highest-rated titles (catches franchise/cast similarity that genre-matching misses).
4. Anything the profile has already rated is excluded.

## Stack

- **Client** (`client/`): React + Vite + TypeScript, React Router, TanStack Query
- **Server** (`server/`): Express + TypeScript, Prisma + SQLite
- **Shared** (`shared/`): TypeScript DTOs used by both client and server
- **Data**: [TMDB](https://www.themoviedb.org/) API, proxied through the server so the API key never reaches the browser

## Starting it up

1. **Get a TMDB API key** (required before the server will boot): sign up for a free account at https://www.themoviedb.org/, then go to Settings → API and generate a v3 API key.

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Configure the server environment:

   ```sh
   cp .env.example server/.env
   ```

   Edit `server/.env` and fill in your `TMDB_API_KEY` (and optionally a stronger `JWT_SECRET`).

4. Create the database (first time only):

   ```sh
   pnpm prisma:migrate
   ```

5. Run both the server (port 4000) and client (port 5173) together:

   ```sh
   pnpm dev
   ```

   Or run them separately with `pnpm dev:server` / `pnpm dev:client`.

## Accessing it

- **App**: http://localhost:5173 — register an account (this creates your first profile automatically), then rate titles from any title detail page. Once the active profile has rated 3+ titles, visit **For You**. Add more profiles from the nav bar's profile switcher → "Manage Profiles".
- **API** (used by the client, not meant for direct browsing): http://localhost:4000/api/... — see the route files under `server/src/routes/` for the full list (`auth`, `profiles`, `tmdb`, `ratings`, `recommendations`).
- There's no hosted/deployed version — this runs locally on your machine only. Data lives in `server/prisma/dev.db` (SQLite), so it persists across restarts but isn't shared between machines.

## Project layout

- `shared/` — TypeScript types shared between client and server
- `server/` — Express API: auth, profiles, TMDB proxy, ratings, recommendations (see `src/services/recommendationService.ts` for the algorithm)
- `client/` — React app: Browse, title detail (rate here), For You, Account, and profile picker/management screens
