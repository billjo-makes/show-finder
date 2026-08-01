# Show Finder

A personal web app for finding movies and TV shows based on your preferences. Rate titles 1-5 stars and get a "For You" page that gets more personalized as you rate more.

## Stack

- **Client**: React + Vite + TypeScript, React Router, TanStack Query
- **Server**: Express + TypeScript, Prisma + SQLite
- **Data**: [TMDB](https://www.themoviedb.org/) API, proxied through the server so the API key never reaches the browser

## Setup

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

4. Create the database:

   ```sh
   pnpm prisma:migrate
   ```

5. Run both the server (port 4000) and client (port 5173) together:

   ```sh
   pnpm dev
   ```

6. Open http://localhost:5173, register an account, and start rating titles. Once you've rated 3+ titles, visit **For You** to see personalized recommendations.

## Project layout

- `shared/` — TypeScript types shared between client and server
- `server/` — Express API: auth, TMDB proxy, ratings, recommendations (see `src/services/recommendationService.ts` for the algorithm)
- `client/` — React app: Browse, title detail (rate here), For You, Profile
