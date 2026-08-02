import axios from "axios";
import type { MediaType, TitleDetail, TitleSummary, WatchProvider, WatchProviders } from "@show-finder/shared";
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
  original_language?: string;
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
    releaseDate: raw.release_date ?? raw.first_air_date ?? null,
  };
}

interface RawWatchProviderEntry {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

interface RawWatchProviderRegion {
  link?: string;
  flatrate?: RawWatchProviderEntry[];
  rent?: RawWatchProviderEntry[];
  buy?: RawWatchProviderEntry[];
}

export interface RawWatchProvidersResponse {
  results?: Record<string, RawWatchProviderRegion>;
}

function normalizeProviderList(entries: RawWatchProviderEntry[] | undefined): WatchProvider[] {
  return (entries ?? []).map((entry) => ({
    providerId: entry.provider_id,
    providerName: entry.provider_name,
    logoPath: entry.logo_path,
  }));
}

export function normalizeWatchProviders(
  raw: RawWatchProvidersResponse | undefined,
  countryCode: string,
): WatchProviders | null {
  const region = raw?.results?.[countryCode];
  if (!region) return null;

  return {
    link: region.link ?? null,
    flatrate: normalizeProviderList(region.flatrate),
    rent: normalizeProviderList(region.rent),
    buy: normalizeProviderList(region.buy),
  };
}

export function normalizeDetail(
  raw: RawTmdbResult & {
    credits?: { cast?: { id: number; name: string; character: string }[] };
    "watch/providers"?: RawWatchProvidersResponse;
  },
  mediaType: MediaType,
  countryCode: string,
): Omit<TitleDetail, "externalRatings"> {
  return {
    ...normalizeSummary(raw, mediaType),
    genres: raw.genres ?? [],
    runtime: raw.runtime ?? raw.episode_run_time?.[0] ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 12),
    watchProviders: normalizeWatchProviders(raw["watch/providers"], countryCode),
    originalLanguage: raw.original_language ?? null,
  };
}

export function resolveMediaTypeFromMulti(raw: RawTmdbResult): MediaType | null {
  if (raw.media_type === "movie" || raw.media_type === "tv") {
    return raw.media_type;
  }
  return null;
}
