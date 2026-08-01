# Show Finder

A personal web app for finding movies and TV shows based on your preferences. Rate titles 1-5 stars and get a "For You" page that gets more personalized as you rate more.

Repo: https://github.com/BillJohk/show-finder

## Features

- **Accounts** — register/log in with email + password; sessions via an httpOnly cookie. Each account also has a **region** (Account page) used to localize streaming availability.
- **Profiles** — Netflix-style: one account can have multiple named profiles (e.g. "Bill", "Kids"). Each profile has its own ratings, watch list, "For You" recommendations, and default streaming services. New accounts get a profile automatically; if an account has more than one, you pick one at login via the "Who's watching?" screen. Switch profiles anytime from the nav bar, and add/rename/delete them from "Manage Profiles" — there's no limit on how many a single account can have, and no separate PIN per profile.
- **Browse** — search movies/TV, or discover with filters: genre (including an "LGBTQ+" chip, filtered by TMDB keyword since TMDB has no dedicated genre for it), where to watch (streaming service, OR'd together), original language, and minimum rating (TMDB score, with a vote-count floor so low-sample titles can't game it). Trending results show by default with no filters applied.
- **Title detail** — overview, cast, genres, where to watch (stream/rent/buy, via TMDB/JustWatch), external ratings (IMDb/Rotten Tomatoes/Metacritic, via OMDb — optional, see setup below), "More like this" (TMDB similar titles), a 1-5 star rating control, and a watch list toggle.
- **Watch List** — save titles you want to watch later, per profile. Rating a title removes it from the watch list (it's been watched).
- **For You** — personalized recommendations once the active profile has 3+ ratings and/or watch-list entries, with a banner explaining which genres drove the picks (e.g. "Because you rated Action, Science Fiction, Adventure highly"). Before that threshold, it falls back to what's trending.
- **Account** — region selector, default streaming services for the active profile (pre-selects the Browse "where to watch" filter), and the active profile's ratings (with remove).

### How recommendations work

Implemented in `server/src/services/recommendationService.ts`, scoped to the currently active profile (not the account as a whole — each profile builds its own taste graph):

1. Each rating contributes `(stars - 3)` to that title's genres — so 5★ pushes a genre's score up, 1★ pushes it down. Watch-list entries (no rating yet) count as a weaker, tentative positive signal (equivalent to a 5★ rating weighted down); an explicit rating for the same title always takes precedence over its watch-list signal.
2. The top 3 positive-scoring genres feed a TMDB "discover" query.
3. Results are blended with TMDB's "similar titles" for the profile's 2 highest-weighted titles (catches franchise/cast similarity that genre-matching misses).
4. Anything the profile has already rated or watch-listed is excluded.

## Stack

- **Client** (`client/`): React + Vite + TypeScript, React Router, TanStack Query
- **Server** (`server/`): Express + TypeScript, Prisma + SQLite
- **Shared** (`shared/`): TypeScript DTOs used by both client and server
- **Data**: [TMDB](https://www.themoviedb.org/) API (titles, genres, watch providers, languages), proxied through the server so the API key never reaches the browser; optionally [OMDb](https://www.omdbapi.com/) for external ratings

## Starting it up

1. **Get a TMDB API key** (required before the server will boot): sign up for a free account at https://www.themoviedb.org/, then go to Settings → API and generate a v3 API key.

2. **Get an OMDb API key** (optional — only needed for the IMDb/Rotten Tomatoes/Metacritic ratings row on title detail): sign up at https://www.omdbapi.com/apikey.aspx. OMDb emails you the key but it isn't active until you click the activation link in that email — without it (or without an `OMDB_API_KEY` at all), the ratings row is just omitted; nothing breaks.

3. Install dependencies:

   ```sh
   pnpm install
   ```

4. Configure the server environment:

   ```sh
   cp .env.example server/.env
   ```

   Edit `server/.env` and fill in your `TMDB_API_KEY` (and optionally `OMDB_API_KEY` and a stronger `JWT_SECRET`).

5. Create the database (first time only):

   ```sh
   pnpm prisma:migrate
   ```

6. Run both the server (port 4000) and client (port 5173) together:

   ```sh
   pnpm dev
   ```

   Or run them separately with `pnpm dev:server` / `pnpm dev:client`.

## Accessing it

- **App**: http://localhost:5173 — register an account (this creates your first profile automatically), then rate titles or add them to your watch list from any title detail page. Once the active profile has 3+ ratings/watch-list entries, visit **For You**. Add more profiles from the nav bar's profile switcher → "Manage Profiles". Set your region and default streaming services from **Account**.
- **API** (used by the client, not meant for direct browsing): http://localhost:4000/api/... — see the route files under `server/src/routes/` for the full list (`auth`, `profiles`, `tmdb`, `ratings`, `watchlist`, `recommendations`).
- There's no hosted/deployed version — this runs locally on your machine only. Data lives in `server/prisma/dev.db` (SQLite), so it persists across restarts but isn't shared between machines.

## Project layout

- `shared/` — TypeScript types shared between client and server
- `server/` — Express API: auth, profiles, TMDB proxy (+ OMDb ratings lookup), ratings, watch list, recommendations (see `src/services/recommendationService.ts` for the algorithm)
- `client/` — React app: Browse, title detail (rate/watch-list here), Watch List, For You, Account, and profile picker/management screens
