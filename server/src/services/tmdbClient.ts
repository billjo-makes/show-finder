import axios from "axios";
import type { MediaType, TitleDetail, TitleSummary } from "@show-finder/shared";
import { env } from "../env";

export const tmdbClient = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: { api_key: env.TMDB_API_KEY },
});

interface RawTmdbResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  popularity: number;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  media_type?: string;
}

export function normalizeSummary(raw: RawTmdbResult, mediaType: MediaType): TitleSummary {
  return {
    tmdbId: raw.id,
    mediaType,
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview,
    posterPath: raw.poster_path,
    genreIds: raw.genre_ids ?? raw.genres?.map((g) => g.id) ?? [],
    popularity: raw.popularity,
    voteAverage: raw.vote_average,
  };
}

export function normalizeDetail(
  raw: RawTmdbResult & { credits?: { cast?: { id: number; name: string; character: string }[] } },
  mediaType: MediaType,
): TitleDetail {
  return {
    ...normalizeSummary(raw, mediaType),
    genres: raw.genres ?? [],
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 12),
  };
}

export function resolveMediaTypeFromMulti(raw: RawTmdbResult): MediaType | null {
  if (raw.media_type === "movie" || raw.media_type === "tv") {
    return raw.media_type;
  }
  return null;
}
