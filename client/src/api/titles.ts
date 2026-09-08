import type { Genre, Language, MediaType, TitleDetail, TitleSummary, WatchProvider } from "@show-finder/shared";
import { apiFetch } from "./client";

interface SearchResponse {
  results: TitleSummary[];
  page: number;
  totalPages: number;
}

export function searchTitles(query: string, page = 1) {
  return apiFetch<SearchResponse>(
    `/api/tmdb/search?query=${encodeURIComponent(query)}&mediaType=multi&page=${page}`,
  );
}

export function discoverTitles(
  mediaType: MediaType,
  genreIds: number[],
  options: {
    page?: number;
    keywordIds?: number[];
    watchProviderIds?: number[];
    watchMonetizationTypes?: string[];
    originalLanguage?: string;
    minRating?: number;
    sortBy?: string;
  } = {},
) {
  const {
    page = 1,
    keywordIds = [],
    watchProviderIds = [],
    watchMonetizationTypes = [],
    originalLanguage,
    minRating,
    sortBy,
  } = options;
  const params = new URLSearchParams({ mediaType, page: String(page) });
  if (genreIds.length > 0) params.set("genreIds", genreIds.join(","));
  if (keywordIds.length > 0) params.set("keywordIds", keywordIds.join(","));
  if (watchProviderIds.length > 0) params.set("watchProviderIds", watchProviderIds.join(","));
  if (watchMonetizationTypes.length > 0) params.set("watchMonetizationTypes", watchMonetizationTypes.join(","));
  if (originalLanguage) params.set("originalLanguage", originalLanguage);
  if (minRating !== undefined) params.set("minRating", String(minRating));
  if (sortBy) params.set("sortBy", sortBy);
  return apiFetch<SearchResponse>(`/api/tmdb/discover?${params.toString()}`);
}

export function fetchTrending(mediaType: MediaType | "all" = "all") {
  return apiFetch<{ results: TitleSummary[] }>(`/api/tmdb/trending?mediaType=${mediaType}`);
}

export function fetchGenres(mediaType: MediaType) {
  return apiFetch<{ genres: Genre[] }>(`/api/tmdb/genres?mediaType=${mediaType}`);
}

export function fetchWatchProviders(mediaType: MediaType) {
  return apiFetch<{ providers: WatchProvider[] }>(`/api/tmdb/watch-providers?mediaType=${mediaType}`);
}

export function fetchLanguages() {
  return apiFetch<{ languages: Language[] }>("/api/tmdb/languages");
}

export function fetchTitleDetail(mediaType: MediaType, id: number) {
  return apiFetch<TitleDetail>(`/api/tmdb/title/${mediaType}/${id}`);
}

export function fetchSimilarTitles(mediaType: MediaType, id: number) {
  return apiFetch<{ results: TitleSummary[] }>(`/api/tmdb/title/${mediaType}/${id}/similar`);
}
